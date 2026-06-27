// src/modules/admin/admin.repository.ts
import { query, queryOne, withTransaction } from '../../shared/db/query';
import type { CreateGymBody, UpdateGymBody, ListQuery } from './admin.schema';

const RUPEE = 100;

export async function listGyms(q: ListQuery) {
  const rows = await query<any>(
    `SELECT id, slug, name, area, city, price_per_month, is_active, is_premium,
            women_friendly, has_parking, profile_score, created_at,
            COUNT(*) OVER()::text AS total_count
       FROM gyms
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
    [q.limit, (q.page - 1) * q.limit],
  );
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function createGym(body: CreateGymBody, slug: string): Promise<{ id: string }> {
  return withTransaction(async (client) => {
    const res = await client.query<{ id: string }>(
      `INSERT INTO gyms
         (slug, name, description, area, city, phone, whatsapp, address_line, website,
          lat, lng, price_per_month, is_premium, women_friendly, has_parking,
          opens_at, closes_at, years_operating, cover_image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        slug, body.name, body.description ?? null, body.area, body.city,
        body.phone ?? null, body.whatsapp ?? null, body.addressLine ?? null, body.website ?? null,
        body.lat, body.lng, body.pricePerMonth * RUPEE,
        body.isPremium, body.womenFriendly, body.hasParking,
        body.opensAt ?? null, body.closesAt ?? null, body.yearsOperating ?? null,
        body.coverImageUrl ?? null,
      ],
    );
    const gymId = res.rows[0].id;
    for (const a of body.amenities ?? []) {
      await client.query(
        `INSERT INTO gym_amenities (gym_id, amenity) VALUES ($1, $2::amenity_type)
         ON CONFLICT DO NOTHING`,
        [gymId, a],
      );
    }
    return { id: gymId };
  });
}

const COL_MAP: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  area: 'area',
  city: 'city',
  phone: 'phone',
  whatsapp: 'whatsapp',
  addressLine: 'address_line',
  website: 'website',
  lat: 'lat',
  lng: 'lng',
  isPremium: 'is_premium',
  womenFriendly: 'women_friendly',
  hasParking: 'has_parking',
  opensAt: 'opens_at',
  closesAt: 'closes_at',
  yearsOperating: 'years_operating',
  coverImageUrl: 'cover_image_url',
};

export async function updateGym(id: string, body: UpdateGymBody): Promise<boolean> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [key, col] of Object.entries(COL_MAP)) {
    const val = (body as any)[key];
    if (val !== undefined) {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (body.pricePerMonth !== undefined) {
    params.push(body.pricePerMonth * RUPEE);
    sets.push(`price_per_month = $${params.length}`);
  }
  if (sets.length === 0) return true;

  const rows = await query<{ id: string }>(
    `UPDATE gyms SET ${sets.join(', ')} WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    params,
  );
  return rows.length > 0;
}

export async function softDeleteGym(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE gyms SET deleted_at = NOW(), is_active = FALSE
      WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id],
  );
  return rows.length > 0;
}

export async function listAllInquiries(q: ListQuery) {
  const rows = await query<any>(
    `SELECT i.id, i.name, i.phone, i.message, i.status, i.created_at,
            g.name AS gym_name, g.slug AS gym_slug,
            COUNT(*) OVER()::text AS total_count
       FROM inquiries i JOIN gyms g ON g.id = i.gym_id
      ORDER BY i.created_at DESC
      LIMIT $1 OFFSET $2`,
    [q.limit, (q.page - 1) * q.limit],
  );
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function listDemoRequests(q: ListQuery) {
  const rows = await query<any>(
    `SELECT id, name, phone, email, gym_name, city, area, member_count, status, notes, created_at,
            COUNT(*) OVER()::text AS total_count
       FROM demo_requests
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
    [q.limit, (q.page - 1) * q.limit],
  );
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function updateDemoRequest(
  id: string,
  status: string,
  notes?: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE demo_requests SET status = $2, notes = COALESCE($3, notes)
      WHERE id = $1 RETURNING id`,
    [id, status, notes ?? null],
  );
  return rows.length > 0;
}

export async function linkOwner(
  gymId: string,
  userId: string,
  isPrimary: boolean,
): Promise<void> {
  await query(
    `INSERT INTO owner_gym_links (user_id, gym_id, is_primary)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, gym_id) DO UPDATE SET is_primary = EXCLUDED.is_primary`,
    [userId, gymId, isPrimary],
  );
}

export async function slugExists(slug: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>('SELECT id FROM gyms WHERE slug = $1', [slug]);
  return row != null;
}
