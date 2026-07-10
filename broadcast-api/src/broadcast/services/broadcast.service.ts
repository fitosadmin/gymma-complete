// src/broadcast/services/broadcast.service.ts
import { query, queryOne, withTransaction } from '../../shared/db/query';
import { AppError } from '../../shared/errors/AppError';
import { buildMeta } from '../../shared/utils/pagination';
import type { PaginationMeta } from '../../shared/response/envelope';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { enqueueBroadcastCreated } from '../jobs/queues';
import { emitToGym } from './websocket.service';
import { incrCounter } from '../../shared/utils/metrics';
import type {
  BroadcastRow,
  BroadcastWithSenderRow,
  BroadcastListItem,
  BroadcastDetail,
  CreateBroadcastInput,
  CreateBroadcastResult,
  BroadcastStatus,
  BroadcastEventPayload,
} from '../types/broadcast.types';

// Active membership in gym_members means the actual gym-goer, active plan;
// removeMemberFromGym() in gymma-api sets BOTH status='cancelled' AND
// deleted_at on removal, but we check both explicitly rather than relying
// on one implying the other.
const ACTIVE_MEMBER_FILTER = `status = 'active' AND deleted_at IS NULL`;

function toListItem(row: BroadcastWithSenderRow): BroadcastListItem {
  return {
    id: row.id,
    gym_id: row.gym_id,
    sender_id: row.sender_id,
    sender_name: row.sender_name,
    title: row.title,
    message: row.message,
    type: row.type,
    priority: row.priority,
    status: row.status,
    is_read: row.is_read === true,
    sent_at: row.sent_at,
    created_at: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

export async function createBroadcast(input: CreateBroadcastInput): Promise<CreateBroadcastResult> {
  const broadcast = await queryOne<BroadcastRow>(
    `INSERT INTO broadcasts (gym_id, sender_id, title, message, type, priority)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.gymId, input.senderId, input.title, input.message, input.type, input.priority],
  );
  if (!broadcast) throw new Error('failed to insert broadcast');

  const memberCount = await getActiveGymMemberCount(input.gymId);

  const payload: BroadcastEventPayload = {
    broadcast_id: broadcast.id,
    gym_id: broadcast.gym_id,
    title: broadcast.title,
    message: broadcast.message,
    type: broadcast.type,
    priority: broadcast.priority,
    sender_id: broadcast.sender_id,
    sent_at: broadcast.sent_at,
  };

  // Real-time delivery to already-connected clients is cheap — do it inline.
  emitToGym(broadcast.gym_id, 'broadcast', payload);

  // Receipt fan-out (up to 50k rows) and push delivery are the expensive
  // parts — hand them to the background worker so this handler stays well
  // under the 500ms budget regardless of gym size.
  await enqueueBroadcastCreated({ broadcastId: broadcast.id, gymId: broadcast.gym_id });
  await incrCounter('broadcasts_sent_total');

  logger.info(
    { broadcastId: broadcast.id, gymId: broadcast.gym_id, senderId: broadcast.sender_id, memberCount },
    'broadcast created',
  );

  return {
    broadcast_id: broadcast.id,
    status: broadcast.status,
    estimated_reach: memberCount,
    sent_at: broadcast.sent_at,
  };
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

interface ListArgs {
  gymId: string;
  userId: string;
  page: number;
  limit: number;
  unreadOnly: boolean;
}

export async function listBroadcasts(
  args: ListArgs,
): Promise<{ data: BroadcastListItem[]; meta: PaginationMeta; unreadTotal: number }> {
  const { gymId, userId, page, limit, unreadOnly } = args;
  const offsetVal = (page - 1) * limit;

  const unreadFilter = unreadOnly ? 'AND (r.is_read IS NULL OR r.is_read = FALSE)' : '';

  const [rows, unreadRow] = await Promise.all([
    query<BroadcastWithSenderRow>(
      `SELECT b.*, u.full_name AS sender_name, r.is_read, COUNT(*) OVER()::text AS total_count
         FROM broadcasts b
         LEFT JOIN users u ON u.id = b.sender_id
         LEFT JOIN broadcast_receipts r ON r.broadcast_id = b.id AND r.user_id = $1
        WHERE b.gym_id = $2 AND b.status != 'deleted'
        ${unreadFilter}
        ORDER BY b.sent_at DESC
        LIMIT $3 OFFSET $4`,
      [userId, gymId, limit, offsetVal],
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM broadcasts b
         LEFT JOIN broadcast_receipts r ON r.broadcast_id = b.id AND r.user_id = $1
        WHERE b.gym_id = $2 AND b.status != 'deleted'
          AND (r.is_read IS NULL OR r.is_read = FALSE)`,
      [userId, gymId],
    ),
  ]);

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    data: rows.map(toListItem),
    meta: buildMeta(page, limit, total),
    unreadTotal: Number(unreadRow?.count ?? 0),
  };
}

// ---------------------------------------------------------------------------
// get one
// ---------------------------------------------------------------------------

export async function getBroadcastById(
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<BroadcastDetail | null> {
  const row = await queryOne<BroadcastWithSenderRow>(
    `SELECT b.*, u.full_name AS sender_name, r.is_read, '0'::text AS total_count
       FROM broadcasts b
       LEFT JOIN users u ON u.id = b.sender_id
       LEFT JOIN broadcast_receipts r ON r.broadcast_id = b.id AND r.user_id = $1
      WHERE b.id = $2 AND b.status != 'deleted'`,
    [userId, id],
  );
  if (!row) return null;

  const detail: BroadcastDetail = toListItem(row);

  if (isAdmin) {
    const stats = await queryOne<{ total_receipts: string; read_count: string }>(
      `SELECT COUNT(*)::text AS total_receipts,
              COUNT(*) FILTER (WHERE is_read)::text AS read_count
         FROM broadcast_receipts
        WHERE broadcast_id = $1`,
      [id],
    );
    detail.receipt_stats = {
      total_receipts: Number(stats?.total_receipts ?? 0),
      read_count: Number(stats?.read_count ?? 0),
    };
  }

  return detail;
}

// ---------------------------------------------------------------------------
// mark read
// ---------------------------------------------------------------------------

export async function markBroadcastRead(
  broadcastId: string,
  userId: string,
  gymId: string,
): Promise<void> {
  await query(
    `INSERT INTO broadcast_receipts (broadcast_id, user_id, gym_id, is_read, read_at, delivered_at)
     VALUES ($1, $2, $3, TRUE, NOW(), NOW())
     ON CONFLICT (broadcast_id, user_id)
     DO UPDATE SET is_read = TRUE, read_at = NOW()`,
    [broadcastId, userId, gymId],
  );
}

// ---------------------------------------------------------------------------
// soft delete
// ---------------------------------------------------------------------------

export async function softDeleteBroadcast(
  broadcastId: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  const broadcast = await queryOne<BroadcastRow>('SELECT * FROM broadcasts WHERE id = $1', [broadcastId]);
  if (!broadcast || broadcast.status === 'deleted') {
    throw AppError.notFound('Broadcast not found');
  }

  const isOwner = broadcast.sender_id === requesterId;
  const isSuperAdmin = requesterRole === 'super_admin';
  if (!isOwner && !isSuperAdmin) {
    throw AppError.forbidden('Only the sender or a super admin can delete this broadcast');
  }

  await query(`UPDATE broadcasts SET status = 'deleted' WHERE id = $1`, [broadcastId]);
  logger.info({ broadcastId, requesterId }, 'broadcast soft-deleted');
}

// ---------------------------------------------------------------------------
// FCM token registration
// ---------------------------------------------------------------------------

export async function upsertFcmToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android',
  deviceId?: string,
): Promise<void> {
  await withTransaction(async (client) => {
    if (deviceId) {
      await client.query(
        `UPDATE user_devices SET is_active = FALSE WHERE user_id = $1 AND device_id = $2`,
        [userId, deviceId],
      );
    }

    await client.query(
      `INSERT INTO user_devices (user_id, fcm_token, platform, device_id, is_active, last_used_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       ON CONFLICT (user_id, fcm_token)
       DO UPDATE SET is_active = TRUE, last_used_at = NOW(), platform = EXCLUDED.platform,
                      device_id = COALESCE(EXCLUDED.device_id, user_devices.device_id)`,
      [userId, token, platform, deviceId ?? null],
    );
  });
}

// ---------------------------------------------------------------------------
// gym membership / fan-out helpers (used by controller, middleware + worker)
// ---------------------------------------------------------------------------

/** True if the user owns this specific gym (owner_gym_links), regardless of membership status. */
export async function isGymOwner(userId: string, gymId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM owner_gym_links WHERE user_id = $1 AND gym_id = $2) AS exists`,
    [userId, gymId],
  );
  return row?.exists === true;
}

/** True if the user is an active, non-deleted member of this gym. */
export async function isActiveGymMember(userId: string, gymId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM gym_members WHERE gym_id = $1 AND user_id = $2 AND ${ACTIVE_MEMBER_FILTER}
     ) AS exists`,
    [gymId, userId],
  );
  return row?.exists === true;
}

export async function getActiveGymMemberCount(gymId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM gym_members WHERE gym_id = $1 AND ${ACTIVE_MEMBER_FILTER}`,
    [gymId],
  );
  return Number(row?.count ?? 0);
}

export async function getActiveGymMemberIds(gymId: string): Promise<string[]> {
  const rows = await query<{ user_id: string }>(
    `SELECT user_id FROM gym_members WHERE gym_id = $1 AND ${ACTIVE_MEMBER_FILTER}`,
    [gymId],
  );
  return rows.map((r) => r.user_id);
}

/** Batch-inserts receipts in chunks of MAX_BROADCAST_BATCH_SIZE via UNNEST. Returns rows inserted. */
export async function batchInsertReceipts(
  broadcastId: string,
  gymId: string,
  userIds: string[],
): Promise<number> {
  const batchSize = env.MAX_BROADCAST_BATCH_SIZE;
  let inserted = 0;

  for (let i = 0; i < userIds.length; i += batchSize) {
    const chunk = userIds.slice(i, i + batchSize);
    const result = await query<{ id: string }>(
      `INSERT INTO broadcast_receipts (broadcast_id, user_id, gym_id)
       SELECT $1, uid, $2 FROM UNNEST($3::uuid[]) AS uid
       ON CONFLICT (broadcast_id, user_id) DO NOTHING
       RETURNING id`,
      [broadcastId, gymId, chunk],
    );
    inserted += result.length;
  }

  return inserted;
}

export async function setBroadcastStatus(broadcastId: string, status: BroadcastStatus): Promise<void> {
  await query('UPDATE broadcasts SET status = $2 WHERE id = $1', [broadcastId, status]);
}

export async function getBroadcastRow(broadcastId: string): Promise<BroadcastRow | null> {
  return queryOne<BroadcastRow>('SELECT * FROM broadcasts WHERE id = $1', [broadcastId]);
}
