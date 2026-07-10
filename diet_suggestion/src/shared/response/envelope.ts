// src/shared/response/envelope.ts

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function success<T>(data: T, meta?: PaginationMeta) {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function failure(code: string, message: string) {
  return { success: false, error: { code, message } };
}
