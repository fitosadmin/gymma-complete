// src/modules/reviews/reviews.service.ts
import { AppError } from '../../shared/errors/AppError';
import { buildMeta } from '../../shared/utils/pagination';
import type { PaginationMeta } from '../../shared/response/envelope';
import * as repo from './reviews.repository';

export interface ReviewDto {
  id: string;
  authorLabel: string;
  rating: number;
  body: string;
  helpfulCount: number;
  source: string;
  createdAt: string;
}

interface Args {
  slug: string;
  page: number;
  limit: number;
  sort: 'recent' | 'helpful';
}

export async function listForGym({
  slug,
  page,
  limit,
  sort,
}: Args): Promise<{ data: ReviewDto[]; meta: PaginationMeta }> {
  const gymId = await repo.gymIdBySlug(slug);
  if (!gymId) throw AppError.notFound('Gym not found');

  const { rows, total } = await repo.findByGym({ gymId, page, limit, sort });

  const data: ReviewDto[] = rows.map((r) => ({
    id: r.id,
    authorLabel: r.author_label,
    rating: Number(r.rating),
    body: r.body,
    helpfulCount: r.helpful_count,
    source: r.source,
    createdAt: r.created_at,
  }));

  return { data, meta: buildMeta(page, limit, total) };
}
