// src/routes.ts
import { Router } from 'express';
import { broadcastRouter, usersRouter } from './broadcast/routes/broadcast.routes';
import { getActiveConnectionCount } from './broadcast/services/websocket.service';
import { getCounter } from './shared/utils/metrics';
import { success } from './shared/response/envelope';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json(success({ status: 'ok', ts: new Date().toISOString() }));
});

apiRouter.get('/metrics', async (_req, res) => {
  const [broadcastsSentTotal, pushSuccessTotal, pushFailureTotal] = await Promise.all([
    getCounter('broadcasts_sent_total'),
    getCounter('push_notification_success_total'),
    getCounter('push_notification_failure_total'),
  ]);

  const pushAttempted = pushSuccessTotal + pushFailureTotal;

  res.json(
    success({
      broadcasts_sent_total: broadcastsSentTotal,
      push_notification_success_total: pushSuccessTotal,
      push_notification_failure_total: pushFailureTotal,
      push_notification_success_rate: pushAttempted > 0 ? pushSuccessTotal / pushAttempted : null,
      websocket_connections_active: getActiveConnectionCount(),
    }),
  );
});

apiRouter.use('/broadcasts', broadcastRouter);
apiRouter.use('/users', usersRouter);
