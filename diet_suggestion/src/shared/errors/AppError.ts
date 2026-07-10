// src/shared/errors/AppError.ts

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string)  { return new AppError(400, 'BAD_REQUEST', message); }
  static unauthorized(message: string){ return new AppError(401, 'UNAUTHORIZED', message); }
  static forbidden(message: string)   { return new AppError(403, 'FORBIDDEN', message); }
  static notFound(message: string)    { return new AppError(404, 'NOT_FOUND', message); }
  static conflict(message: string)    { return new AppError(409, 'CONFLICT', message); }
  static internal(message: string)    { return new AppError(500, 'INTERNAL_ERROR', message); }
}
