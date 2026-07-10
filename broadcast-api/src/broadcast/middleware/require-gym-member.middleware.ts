// src/broadcast/middleware/require-gym-member.middleware.ts
// Authorizes read access to a gym's broadcasts: active gym_members, the
// gym's owner (owner_gym_links — owners aren't rows in gym_members), or a
// platform admin/super_admin.
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { queryOne } from '../../shared/db/query';
import { logger } from '../../config/logger';
import { isActiveGymMember, isGymOwner } from '../services/broadcast.service';

function resolveGymId(req: Request): string | null {
  const fromParams = req.params.gymId ?? req.params.gym_id;
  if (fromParams) return fromParams;

  const fromBody = req.body?.gym_id;
  if (typeof fromBody === 'string' && fromBody) return fromBody;

  const fromQuery = req.query?.gym_id;
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;

  return null;
}

/**
 * Routes like GET/PATCH /broadcasts/:id don't carry a gym id of their own —
 * it has to be looked up from the broadcast row.
 */
async function resolveGymIdViaBroadcast(req: Request): Promise<string | null> {
  const broadcastId = req.params.id;
  if (!broadcastId) return null;

  const row = await queryOne<{ gym_id: string }>(
    `SELECT gym_id FROM broadcasts WHERE id = $1 AND status != 'deleted'`,
    [broadcastId],
  );
  return row?.gym_id ?? null;
}

export async function requireGymMember(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  if (!user) {
    next(AppError.unauthorized());
    return;
  }

  let gymId = resolveGymId(req);
  if (!gymId && req.params.id) {
    gymId = await resolveGymIdViaBroadcast(req).catch(() => null);
    if (!gymId) {
      next(AppError.notFound('Broadcast not found'));
      return;
    }
  }
  if (!gymId) {
    next(AppError.validation('gym_id is required'));
    return;
  }

  req.gymId = gymId;

  if (user.role === 'admin' || user.role === 'super_admin') {
    next();
    return;
  }

  try {
    const [isMember, isOwner] = await Promise.all([
      isActiveGymMember(user.id, gymId),
      isGymOwner(user.id, gymId),
    ]);

    if (!isMember && !isOwner) {
      logger.warn({ userId: user.id, gymId, path: req.originalUrl }, 'gym access check failed');
      next(AppError.forbidden('You do not have access to this gym'));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      gymId?: string;
    }
  }
}
