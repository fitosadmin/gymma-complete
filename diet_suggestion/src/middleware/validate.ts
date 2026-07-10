// src/middleware/validate.ts
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { failure } from '../shared/response/envelope';

interface ValidateSchemas {
  body?:   ZodSchema;
  params?: ZodSchema;
  query?:  ZodSchema;
}

export function validate(schemas: ValidateSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body)   req.body   = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      if (schemas.query)  req.query  = schemas.query.parse(req.query)   as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        res.status(422).json(failure('VALIDATION_ERROR', message));
        return;
      }
      next(err);
    }
  };
}
