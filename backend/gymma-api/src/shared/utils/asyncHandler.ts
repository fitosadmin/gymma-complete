// src/shared/utils/asyncHandler.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wrap an async handler so thrown/rejected errors hit the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
