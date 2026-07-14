// src/config/firebase.ts
import admin from 'firebase-admin';
import { env } from './env';
import { logger } from './logger';

let app: admin.app.App | null = null;

/** Lazily initializes the Firebase Admin SDK. Returns null if not configured
 *  (e.g. local dev without FCM credentials) so push sending can no-op safely. */
export function getFirebaseApp(): admin.app.App | null {
  if (app) return app;

  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    logger.warn('FCM credentials not configured; push notifications are disabled');
    return null;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FCM_PROJECT_ID,
      clientEmail: env.FCM_CLIENT_EMAIL,
      // .env stores literal \n escapes; convert back to real newlines
      privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  return app;
}
