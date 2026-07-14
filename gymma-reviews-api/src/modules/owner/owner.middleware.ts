// src/modules/owner/owner.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { queryOne } from '../../shared/db/query';
import { AppError } from '../../shared/errors/AppError';
import { asyncHandler } from '../../shared/utils/asyncHandler';

/** Ensures the authenticated owner is linked to :gymId. Runs after requireAuth. */
export const verifyGymOwnership = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const gymId = req.params.gymId;

    const link = await queryOne<{ ok: number }>(
      'SELECT 1 AS ok FROM owner_gym_links WHERE user_id = $1 AND gym_id = $2',
      [userId, gymId],
    );
    if (!link) throw AppError.forbidden('You do not manage this gym');
    next();
  },
);
