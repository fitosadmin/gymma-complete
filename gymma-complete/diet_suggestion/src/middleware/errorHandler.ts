// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { failure } from '../shared/response/envelope';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(failure(err.code, err.message));
    return;
  }

  // Unknown errors — hide details in production
  console.error('[Unhandled error]', err);
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : String(err instanceof Error ? err.message : err);

  res.status(500).json(failure('INTERNAL_ERROR', message));
}
