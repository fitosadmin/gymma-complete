// src/modules/owner/owner.repository.ts
import { query, queryOne, withTransaction } from '../../shared/db/query';
import type { ListInquiriesQuery, UpdateGymBody, OnboardGymBody } from './owner.schema';

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

export async function onboardGymTransaction(gymId: string, data: OnboardGymBody): Promise<void> {
  return withTransaction(async (client) => {
    // 1. Update basic gym details and activate
    await client.query(
      `UPDATE gyms 
       SET description = COALESCE($2, description),
           opens_at = COALESCE($3, opens_at),
           closes_at = COALESCE($4, closes_at),
           is_active = true
       WHERE id = $1`,
      [gymId, data.description || null, data.opensAt || null, data.closesAt || null]
    );

    // 2. Clear old gallery and add new
    if (data.photos && data.photos.length > 0) {
      await client.query(`DELETE FROM gym_gallery WHERE gym_id = $1`, [gymId]);
      for (let i = 0; i < data.photos.length; i++) {
        await client.query(
          `INSERT INTO gym_gallery (gym_id, url, caption, sort_order) VALUES ($1, $2, $3, $4)`,
          [gymId, data.photos[i].url, data.photos[i].caption || null, i]
        );
      }
    }

    // 3. Clear old amenities and add new
    if (data.amenities && data.amenities.length > 0) {
      await client.query(`DELETE FROM gym_amenities WHERE gym_id = $1`, [gymId]);
      for (const amenity of data.amenities) {
        await client.query(
          `INSERT INTO gym_amenities (gym_id, amenity) VALUES ($1, $2)`,
          [gymId, amenity]
        );
      }
    }

    // 4. Clear old memberships and add new
    if (data.membershipPlans && data.membershipPlans.length > 0) {
      await client.query(`DELETE FROM membership_plans WHERE gym_id = $1`, [gymId]);
      for (let i = 0; i < data.membershipPlans.length; i++) {
        const p = data.membershipPlans[i];
        await client.query(
          `INSERT INTO membership_plans (gym_id, name, duration_months, price, sort_order) 
           VALUES ($1, $2, $3, $4, $5)`,
          [gymId, p.name, p.durationMonths, p.price, i]
        );
      }
    }

    // 5. Clear old trainers and add new
    if (data.trainers && data.trainers.length > 0) {
      await client.query(`DELETE FROM trainers WHERE gym_id = $1`, [gymId]);
      for (let i = 0; i < data.trainers.length; i++) {
        const t = data.trainers[i];
        await client.query(
          `INSERT INTO trainers (gym_id, name, specialization, sort_order, price_per_session) 
           VALUES ($1, $2, $3, $4, 0)`,
          [gymId, t.name, t.specialization || null, i]
        );
      }
    }
  });
}

export async function addMemberToGym(
  gymId: string,
  data: { phone: string; fullName: string; email?: string; passwordHash: string; planId?: string }
): Promise<{ id: string }> {
  return withTransaction(async (client) => {
    // Check if user exists by phone
    let userRes = await client.query(`SELECT id FROM users WHERE phone = $1`, [data.phone]);
    let userId: string;

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      const fallbackEmail = data.email || `${data.phone}@member.gymma.local`;
      userRes = await client.query(
        `INSERT INTO users (phone, full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'member') RETURNING id`,
        [data.phone, data.fullName, fallbackEmail, data.passwordHash]
      );
      userId = userRes.rows[0].id;
    }

    // Link user to gym
    await client.query(
      `INSERT INTO gym_members (gym_id, user_id, membership_plan_id, start_date)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (gym_id, user_id) DO NOTHING`,
      [gymId, userId, data.planId || null]
    );

    return { id: userId };
  });
}

export async function listMembers(gymId: string) {
  const rows = await query<any>(
    `SELECT m.id as membership_id, m.status, m.start_date, m.end_date,
            u.id as user_id, u.full_name, u.phone, u.email,
            p.name as plan_name
       FROM gym_members m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN membership_plans p ON m.membership_plan_id = p.id
      WHERE m.gym_id = $1 AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC`,
    [gymId]
  );
  return rows;
}
