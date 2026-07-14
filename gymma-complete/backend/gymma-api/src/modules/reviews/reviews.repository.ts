// src/modules/reviews/reviews.repository.ts
import { query, queryOne } from '../../shared/db/query';

export interface ReviewRow {
  id: string;
  author_label: string;
  rating: string;
  body: string;
  helpful_count: number;
  source: string;
  created_at: string;
  total_count: string;
}

export async function gymIdBySlug(slug: string): Promise<string | null> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM gyms WHERE slug = $1 AND deleted_at IS NULL AND is_active = TRUE',
    [slug],
  );
  return row?.id ?? null;
}

interface FindArgs {
  gymId: string;
  page: number;
  limit: number;
  sort: 'recent' | 'helpful';
}

export async function findByGym({
  gymId,
  page,
  limit,
  sort,
}: FindArgs): Promise<{ rows: ReviewRow[]; total: number }> {
  const orderBy =
    sort === 'helpful' ? 'helpful_count DESC, created_at DESC' : 'created_at DESC';

  const rows = await query<ReviewRow>(
    `SELECT id, author_label, rating::text, body, helpful_count, source, created_at,
            COUNT(*) OVER()::text AS total_count
       FROM reviews
      WHERE gym_id = $1 AND deleted_at IS NULL
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3`,
    [gymId, limit, (page - 1) * limit],
  );

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}
