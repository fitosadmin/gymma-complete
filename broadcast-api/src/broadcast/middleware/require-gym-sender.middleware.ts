// src/broadcast/middleware/require-gym-sender.middleware.ts
// Authorizes broadcast *creation*. In this platform there's no generic
// "admin" role that can message any gym — the sender must be the specific
// gym's owner (owner_gym_links), a platform admin/super_admin, or hold an
// explicit 'broadcast' permission override.
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../config/logger';
import { isGymOwner } from '../services/broadcast.service';

export async function requireGymSender(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  if (!user) {
    next(AppError.unauthorized());
    return;
  }

  if (user.role === 'admin' || user.role === 'super_admin' || user.permissions.includes('broadcast')) {
    next();
    return;
  }

  if (user.role !== 'owner') {
    logger.warn(
      { userId: user.id, role: user.role, path: req.originalUrl, method: req.method },
      'unauthorized broadcast send attempt',
    );
    next(AppError.forbidden('Only the gym owner can send broadcasts'));
    return;
  }

  const gymId = req.body?.gym_id;
  if (typeof gymId !== 'string' || !gymId) {
    next(AppError.validation('gym_id is required'));
    return;
  }

  try {
    const owns = await isGymOwner(user.id, gymId);
    if (!owns) {
      logger.warn({ userId: user.id, gymId, path: req.originalUrl }, 'owner attempted broadcast for a gym they do not own');
      next(AppError.forbidden('You do not own this gym'));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
