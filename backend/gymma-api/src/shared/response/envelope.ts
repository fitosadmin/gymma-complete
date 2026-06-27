// src/shared/response/envelope.ts

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string };
}

export function success<T>(data: T, meta?: PaginationMeta): SuccessEnvelope<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function failure(code: string, message: string): ErrorEnvelope {
  return { success: false, error: { code, message } };
}
