// src/shared/response/envelope.ts

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function success<T>(data: T, meta?: PaginationMeta): SuccessEnvelope<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function failure(code: string, message: string, details?: unknown): ErrorEnvelope {
  return details !== undefined
    ? { success: false, error: { code, message, details } }
    : { success: false, error: { code, message } };
}
