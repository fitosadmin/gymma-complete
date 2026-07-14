// src/middleware/errorHandler.ts
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError';
import { failure } from '../shared/response/envelope';
import { logger } from '../config/logger';
import { isProd } from '../config/env';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(failure('NOT_FOUND', 'Route not found'));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err }, err.message);
    res.status(err.statusCode).json(failure(err.code, err.message));
    return;
  }

  if (err instanceof ZodError) {
    const first = err.errors[0];
    const msg = first ? `${first.path.join('.')}: ${first.message}` : 'Validation failed';
    res.status(422).json(failure('VALIDATION_ERROR', msg));
    return;
  }

  // unexpected
  logger.error({ err }, 'unhandled error');
  res
    .status(500)
    .json(failure('INTERNAL_ERROR', isProd ? 'Something went wrong' : String(err?.message ?? err)));
};
