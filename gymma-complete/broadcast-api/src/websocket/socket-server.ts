// src/websocket/socket-server.ts
import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '../shared/auth/tokens';
import { query } from '../shared/db/query';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { setIoInstance, gymRoom, getActiveConnectionCount } from '../broadcast/services/websocket.service';
import { setGauge } from '../shared/utils/metrics';

const WS_NAMESPACE = '/ws/broadcasts';

// Per-user connection tracking so we can enforce MAX_WS_CONNECTIONS_PER_USER
// and disconnect the oldest socket when a new one exceeds the cap. In-memory
// is sufficient for a single instance; a multi-instance deployment behind
// the Redis adapter would move this into Redis (e.g. a sorted set per user).
const userSockets = new Map<string, string[]>();

/** Gyms this user should receive real-time broadcasts for: active memberships + gyms they own. */
async function getGymIdsForUser(userId: string): Promise<string[]> {
  const rows = await query<{ gym_id: string }>(
    `SELECT gym_id FROM gym_members WHERE user_id = $1 AND status = 'active' AND deleted_at IS NULL
     UNION
     SELECT gym_id FROM owner_gym_links WHERE user_id = $1`,
    [userId],
  );
  return rows.map((r) => r.gym_id);
}

function trackConnection(nsp: ReturnType<Server['of']>, userId: string, socketId: string): void {
  const existing = userSockets.get(userId) ?? [];
  existing.push(socketId);

  while (existing.length > env.MAX_WS_CONNECTIONS_PER_USER) {
    const oldestId = existing.shift();
    if (!oldestId) break;
    const oldestSocket = nsp.sockets.get(oldestId);
    if (oldestSocket) {
      logger.info({ userId, socketId: oldestId }, 'disconnecting oldest socket over connection limit');
      oldestSocket.disconnect(true);
    }
  }

  userSockets.set(userId, existing);
}

function untrackConnection(userId: string, socketId: string): void {
  const existing = userSockets.get(userId);
  if (!existing) return;
  const next = existing.filter((id) => id !== socketId);
  if (next.length > 0) {
    userSockets.set(userId, next);
  } else {
    userSockets.delete(userId);
  }
}

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    pingInterval: 25_000,
    pingTimeout: 60_000,
    cors: {
      origin: (_origin, cb) => cb(null, true),
      credentials: true,
    },
  });

  // Multi-instance scaling: fan events out via Redis pub/sub so a broadcast
  // emitted on one instance reaches clients connected to any other instance.
  // Falls back to direct in-process delivery if adapter setup fails (fine
  // for a single-instance deployment).
  try {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('socket.io redis adapter attached');
  } catch (err) {
    logger.warn({ err }, 'failed to attach socket.io redis adapter, running single-instance');
  }

  const nsp = io.of(WS_NAMESPACE);

  nsp.use(async (socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.query?.token as string | undefined);

      if (!token) {
        next(new Error('unauthorized'));
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  nsp.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    void (async () => {
      try {
        trackConnection(nsp, userId, socket.id);

        const gymIds = await getGymIdsForUser(userId);
        for (const gymId of gymIds) {
          await socket.join(gymRoom(gymId));
        }

        await setGauge('websocket_connections_active', getActiveConnectionCount());
        logger.info({ userId, socketId: socket.id, gyms: gymIds.length }, 'ws client connected');
      } catch (err) {
        logger.error({ err, userId, socketId: socket.id }, 'failed to initialize ws connection');
      }
    })();

    socket.on('disconnect', (reason) => {
      untrackConnection(userId, socket.id);
      void setGauge('websocket_connections_active', getActiveConnectionCount());
      logger.info({ userId, socketId: socket.id, reason }, 'ws client disconnected');
    });
  });

  setIoInstance(nsp);

  return io;
}
