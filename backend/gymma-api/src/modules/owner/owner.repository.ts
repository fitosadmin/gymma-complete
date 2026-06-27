// src/modules/owner/owner.repository.ts
import { query, queryOne } from '../../shared/db/query';
import type { ListInquiriesQuery, UpdateGymBody } from './owner.schema';

export interface OwnerGymRow {
  id: string;
  slug: string;
  name: string;
  area: string;
  cover_image_url: string | null;
  is_active: boolean;
  profile_score: number;
}

export async function listOwnerGyms(userId: string): Promise<OwnerGymRow[]> {
  return query<OwnerGymRow>(
    `SELECT g.id, g.slug, g.name, g.area, g.cover_image_url, g.is_active, g.profile_score
       FROM gyms g
       JOIN owner_gym_links l ON l.gym_id = g.id
      WHERE l.user_id = $1 AND g.deleted_at IS NULL
      ORDER BY l.is_primary DESC, g.name ASC`,
    [userId],
  );
}

export interface StatsRow {
  profile_views: string;
  profile_views_prev: string;
  inquiries: string;
  inquiries_prev: string;
  avg_rating: string | null;
  review_count: string | null;
  profile_score: number;
}

/** Stat cards: last 30 days vs the 30 days before, for deltas. */
export async function getStats(gymId: string): Promise<StatsRow | null> {
  return queryOne<StatsRow>(
    `SELECT
       (SELECT COUNT(*) FROM page_views
         WHERE gym_id = $1 AND ts >= NOW() - INTERVAL '30 days')::text AS profile_views,
       (SELECT COUNT(*) FROM page_views
         WHERE gym_id = $1 AND ts >= NOW() - INTERVAL '60 days'
                          AND ts <  NOW() - INTERVAL '30 days')::text AS profile_views_prev,
       (SELECT COUNT(*) FROM inquiries
         WHERE gym_id = $1 AND created_at >= NOW() - INTERVAL '30 days')::text AS inquiries,
       (SELECT COUNT(*) FROM inquiries
         WHERE gym_id = $1 AND created_at >= NOW() - INTERVAL '60 days'
                          AND created_at <  NOW() - INTERVAL '30 days')::text AS inquiries_prev,
       r.rating::text       AS avg_rating,
       r.review_count::text AS review_count,
       g.profile_score      AS profile_score
     FROM gyms g
     LEFT JOIN gym_rating_summary r ON r.gym_id = g.id
     WHERE g.id = $1`,
    [gymId],
  );
}

export interface InquiryRow {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  plan_interest: string | null;
  status: string;
  source_page: string | null;
  notes: string | null;
  created_at: string;
  total_count: string;
}

export async function listInquiries(
  gymId: string,
  q: ListInquiriesQuery,
): Promise<{ rows: InquiryRow[]; total: number }> {
  const params: unknown[] = [gymId];
  let statusClause = '';
  if (q.status) {
    params.push(q.status);
    statusClause = `AND status = $${params.length}`;
  }
  params.push(q.limit, (q.page - 1) * q.limit);

  const rows = await query<InquiryRow>(
    `SELECT id, name, phone, message, plan_interest, status, source_page, notes, created_at,
            COUNT(*) OVER()::text AS total_count
       FROM inquiries
      WHERE gym_id = $1 ${statusClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

/** Updates an inquiry only if it belongs to a gym the owner manages. */
export async function updateInquiryOwned(
  inquiryId: string,
  userId: string,
  status: string,
  notes?: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE inquiries i
        SET status = $3, notes = COALESCE($4, i.notes)
       FROM owner_gym_links l
      WHERE i.id = $1 AND l.gym_id = i.gym_id AND l.user_id = $2
      RETURNING i.id`,
    [inquiryId, userId, status, notes ?? null],
  );
  return rows.length > 0;
}

const FIELD_MAP: Record<keyof UpdateGymBody, string> = {
  description: 'description',
  phone: 'phone',
  whatsapp: 'whatsapp',
  addressLine: 'address_line',
  opensAt: 'opens_at',
  closesAt: 'closes_at',
};

export async function updateGymProfile(gymId: string, body: UpdateGymBody): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [gymId];
  for (const [key, col] of Object.entries(FIELD_MAP)) {
    const val = body[key as keyof UpdateGymBody];
    if (val !== undefined) {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return;
  await query(`UPDATE gyms SET ${sets.join(', ')} WHERE id = $1`, params);
}

export async function insertGalleryImages(
  gymId: string,
  urls: string[],
): Promise<{ id: string; url: string }[]> {
  const out: { id: string; url: string }[] = [];
  for (const url of urls) {
    const row = await queryOne<{ id: string; url: string }>(
      `INSERT INTO gym_gallery (gym_id, url) VALUES ($1, $2) RETURNING id, url`,
      [gymId, url],
    );
    if (row) out.push(row);
  }
  return out;
}
