// src/shared/utils/pagination.ts
import type { PaginationMeta } from '../response/envelope';

export interface PageParams {
  page: number;
  limit: number;
}

export function resolvePage(page?: number, limit?: number, maxLimit = 50): PageParams {
  const p = Math.max(1, Math.floor(page ?? 1));
  const l = Math.min(maxLimit, Math.max(1, Math.floor(limit ?? 20)));
  return { page: p, limit: l };
}

export function offset({ page, limit }: PageParams): number {
  return (page - 1) * limit;
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
