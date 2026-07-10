// src/broadcast/services/push-notification.service.ts
import type { MulticastMessage } from 'firebase-admin/messaging';
import { getFirebaseApp } from '../../config/firebase';
import { query } from '../../shared/db/query';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { recordPushResult } from '../../shared/utils/metrics';
import type { BroadcastRow } from '../types/broadcast.types';

interface DeviceRow {
  fcm_token: string;
  platform: 'ios' | 'android';
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getActiveDevicesForGym(gymId: string): Promise<DeviceRow[]> {
  return query<DeviceRow>(
    `SELECT DISTINCT ud.fcm_token, ud.platform
       FROM user_devices ud
       JOIN gym_members gm ON gm.user_id = ud.user_id
      WHERE gm.gym_id = $1 AND gm.status = 'active' AND gm.deleted_at IS NULL AND ud.is_active = TRUE`,
    [gymId],
  );
}

async function deactivateDevice(fcmToken: string): Promise<void> {
  await query('UPDATE user_devices SET is_active = FALSE WHERE fcm_token = $1', [fcmToken]);
}

async function deleteDevice(fcmToken: string): Promise<void> {
  await query('DELETE FROM user_devices WHERE fcm_token = $1', [fcmToken]);
}

async function recordTokenFailure(fcmToken: string): Promise<void> {
  await query(
    `INSERT INTO device_push_failures (fcm_token, consecutive_failures, last_failed_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (fcm_token)
     DO UPDATE SET consecutive_failures = device_push_failures.consecutive_failures + 1,
                    last_failed_at = NOW()`,
    [fcmToken],
  );
}

async function resetTokenFailures(fcmToken: string): Promise<void> {
  await query('DELETE FROM device_push_failures WHERE fcm_token = $1', [fcmToken]);
}

function buildMessage(tokens: string[], broadcast: BroadcastRow): MulticastMessage {
  return {
    tokens,
    notification: {
      title: 'New announcement',
      body: broadcast.title,
    },
    data: {
      type: 'broadcast',
      broadcast_id: broadcast.id,
      gym_id: broadcast.gym_id,
      click_action: 'OPEN_BROADCAST',
    },
    android: {
      priority: 'high',
      notification: { channelId: 'broadcasts' },
    },
    apns: {
      payload: {
        aps: { badge: 1, sound: 'default' },
      },
    },
  };
}

export class PushNotificationService {
  /** Fetches active devices for a gym's members and sends the broadcast payload in chunks of MAX_PUSH_BATCH_SIZE. */
  async sendToGym(gymId: string, broadcast: BroadcastRow): Promise<{ success: number; failure: number }> {
    const app = getFirebaseApp();
    if (!app) {
      logger.warn({ gymId, broadcastId: broadcast.id }, 'firebase not configured, skipping push send');
      return { success: 0, failure: 0 };
    }

    const devices = await getActiveDevicesForGym(gymId);
    if (devices.length === 0) {
      return { success: 0, failure: 0 };
    }

    const messaging = app.messaging();
    const tokens = devices.map((d) => d.fcm_token);
    const batches = chunk(tokens, env.MAX_PUSH_BATCH_SIZE);

    let totalSuccess = 0;
    let totalFailure = 0;
    let quotaErrors = 0;

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx += 1) {
      const batch = batches[batchIdx];
      const message = buildMessage(batch, broadcast);
      const result = await messaging.sendEachForMulticast(message);

      totalSuccess += result.successCount;
      totalFailure += result.failureCount;

      await Promise.all(
        result.responses.map(async (resp, idx) => {
          const token = batch[idx];
          if (resp.success) {
            await resetTokenFailures(token);
            return;
          }

          const errorCode = resp.error?.code ?? 'unknown';
          logger.warn({ token, errorCode, gymId, broadcastId: broadcast.id }, 'push delivery failed');

          if (errorCode === 'messaging/registration-token-not-registered') {
            await deleteDevice(token);
          } else if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/invalid-argument'
          ) {
            await deactivateDevice(token);
          } else if (errorCode === 'messaging/quota-exceeded' || errorCode === 'messaging/internal-error') {
            quotaErrors += 1;
            await recordTokenFailure(token);
          } else {
            await recordTokenFailure(token);
          }
        }),
      );

      // Each batch is at most MAX_PUSH_BATCH_SIZE (500) tokens. Pacing one
      // batch per second keeps aggregate throughput at/under the 500/sec cap.
      if (batchIdx < batches.length - 1) {
        await sleep(1000);
      }
    }

    await recordPushResult(totalSuccess, totalFailure);

    logger.info(
      { gymId, broadcastId: broadcast.id, totalSuccess, totalFailure, deviceCount: tokens.length },
      'push notification batch complete',
    );

    // Surface quota exhaustion as a thrown error so the BullMQ job retries
    // with exponential backoff, per the spec's "quota exceeded -> exponential
    // backoff retry" requirement. Permanently-bad tokens have already been
    // cleaned up above and won't be resent to on retry.
    if (quotaErrors > 0 && quotaErrors === totalFailure) {
      throw new Error(`FCM quota exceeded for ${quotaErrors} token(s), will retry`);
    }

    return { success: totalSuccess, failure: totalFailure };
  }
}

export const pushNotificationService = new PushNotificationService();
