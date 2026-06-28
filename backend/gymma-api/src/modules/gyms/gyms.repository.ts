// src/modules/gyms/gyms.repository.ts
import { query, queryOne } from '../../shared/db/query';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import type { GymListFilters, GymSummaryRow } from './gyms.types';

/** Current time in Asia/Kolkata as HH:MM:SS, for is_open_now comparisons. */
function istNowTime(): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
  });
}

interface ListResult {
  rows: GymSummaryRow[];
  total: number;
}

export async function findGyms(f: GymListFilters): Promise<ListResult> {
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  const nowTime = istNowTime();
  const hasGeo = f.lat != null && f.lng != null;

  // SELECT pieces -----------------------------------------------------------
  const distanceSelect = hasGeo
    ? `ROUND((ST_Distance(g.location, ST_MakePoint(${p(f.lng)}, ${p(f.lat)})::geography) / 1000)::numeric, 1)`
    : `NULL`;

  // WHERE pieces ------------------------------------------------------------
  const where: string[] = [
    'g.deleted_at IS NULL',
    'g.is_active = TRUE',
    `g.city = ${p(f.city)}`,
  ];

  if (f.q) {
    where.push(
      `to_tsvector('english', g.name || ' ' || g.area || ' ' || g.city) @@ plainto_tsquery('english', ${p(f.q)})`,
    );
  }
  if (f.area) where.push(`g.area = ${p(f.area)}`);
  if (f.womenFriendly != null) where.push(`g.women_friendly = ${p(f.womenFriendly)}`);
  if (f.hasParking != null) where.push(`g.has_parking = ${p(f.hasParking)}`);
  if (f.priceMin != null) where.push(`g.price_per_month >= ${p(f.priceMin * 100)}`);
  if (f.priceMax != null) where.push(`g.price_per_month <= ${p(f.priceMax * 100)}`);

  if (f.isOpenNow) {
    where.push(
      `g.opens_at IS NOT NULL AND g.closes_at IS NOT NULL AND ${p(nowTime)}::time BETWEEN g.opens_at AND g.closes_at`,
    );
  }

  if (hasGeo && f.distanceKm != null) {
    where.push(
      `ST_DWithin(g.location, ST_MakePoint(${p(f.lng)}, ${p(f.lat)})::geography, ${p(f.distanceKm * 1000)})`,
    );
  }

  // require ALL requested amenities (clean, avoids array_agg NULL issues)
  if (f.amenities && f.amenities.length > 0) {
    where.push(
      `(SELECT COUNT(DISTINCT a2.amenity) FROM gym_amenities a2
         WHERE a2.gym_id = g.id AND a2.amenity::text = ANY(${p(f.amenities)})) = ${p(f.amenities.length)}`,
    );
  }

  // is_open_now as a returned field (independent of the filter)
  const isOpenNowSelect = `(g.opens_at IS NOT NULL AND g.closes_at IS NOT NULL
      AND ${p(nowTime)}::time BETWEEN g.opens_at AND g.closes_at)`;

  // ORDER BY ----------------------------------------------------------------
  let orderBy: string;
  switch (f.sort) {
    case 'rating':
      orderBy = 'COALESCE(r.rating, 0) DESC, g.name ASC';
      break;
    case 'price_asc':
      orderBy = 'g.price_per_month ASC, g.name ASC';
      break;
    case 'distance':
      orderBy = hasGeo ? 'distance_km ASC NULLS LAST, g.name ASC' : 'g.name ASC';
      break;
    case 'relevance':
    default:
      orderBy = f.q
        ? `ts_rank(to_tsvector('english', g.name || ' ' || g.area), plainto_tsquery('english', ${p(f.q)})) DESC, g.is_premium DESC, g.name ASC`
        : 'g.is_premium DESC, COALESCE(r.rating, 0) DESC, g.name ASC';
      break;
  }

  const limit = p(f.limit);
  const offset = p((f.page - 1) * f.limit);

  const sql = `
    SELECT
      g.id, g.slug, g.name, g.cover_image_url,
      g.area, g.city, g.price_per_month,
      g.is_premium, g.women_friendly, g.has_parking,
      g.lat, g.lng,
      g.opens_at, g.closes_at,
      ${isOpenNowSelect} AS is_open_now,
      ${distanceSelect}  AS distance_km,
      COALESCE(r.rating, 0)::text       AS rating,
      COALESCE(r.review_count, 0)::text AS review_count,
      COALESCE(
        ARRAY_AGG(DISTINCT am.amenity::text) FILTER (WHERE am.amenity IS NOT NULL),
        '{}'
      ) AS amenities,
      COUNT(*) OVER()::text AS total_count
    FROM gyms g
    LEFT JOIN gym_rating_summary r ON r.gym_id = g.id
    LEFT JOIN gym_amenities am      ON am.gym_id = g.id
    WHERE ${where.join('\n      AND ')}
    GROUP BY g.id, r.rating, r.review_count
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset};
  `;

  const rows = await query<GymSummaryRow>(sql, params);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

// ---------------------------------------------------------------------------
// Detail — single round-trip via JSON aggregation
// ---------------------------------------------------------------------------
export interface GymDetailRow {
  gym: any;
  rating: any | null;
  trainers: any[];
  plans: any[];
  classes: any[];
  faqs: any[];
  gallery: any[];
  amenities: string[];
  certifications: string[];
}

export async function findGymBySlug(slug: string): Promise<GymDetailRow | null> {
  const nowTime = istNowTime();
  const sql = `
    SELECT
      to_jsonb(g) AS gym,
      to_jsonb(r) AS rating,
      ($2::time BETWEEN g.opens_at AND g.closes_at) AS is_open_now,
      COALESCE((
        SELECT jsonb_agg(t ORDER BY t.sort_order, t.name)
        FROM trainers t WHERE t.gym_id = g.id AND t.deleted_at IS NULL
      ), '[]') AS trainers,
      COALESCE((
        SELECT jsonb_agg(mp ORDER BY mp.sort_order, mp.duration_months)
        FROM membership_plans mp WHERE mp.gym_id = g.id AND mp.deleted_at IS NULL
      ), '[]') AS plans,
      COALESCE((
        SELECT jsonb_agg(c ORDER BY c.sort_order, c.name)
        FROM gym_classes c WHERE c.gym_id = g.id AND c.deleted_at IS NULL
      ), '[]') AS classes,
      COALESCE((
        SELECT jsonb_agg(f ORDER BY f.sort_order)
        FROM gym_faqs f WHERE f.gym_id = g.id
      ), '[]') AS faqs,
      COALESCE((
        SELECT jsonb_agg(gal ORDER BY gal.sort_order)
        FROM gym_gallery gal WHERE gal.gym_id = g.id
      ), '[]') AS gallery,
      COALESCE((
        SELECT array_agg(am.amenity::text) FROM gym_amenities am WHERE am.gym_id = g.id
      ), '{}') AS amenities,
      COALESCE((
        SELECT array_agg(gc.label) FROM gym_certifications gc WHERE gc.gym_id = g.id
      ), '{}') AS certifications
    FROM gyms g
    LEFT JOIN gym_rating_summary r ON r.gym_id = g.id
    WHERE g.slug = $1 AND g.deleted_at IS NULL AND g.is_active = TRUE
    LIMIT 1;
  `;
  const row = await queryOne<any>(sql, [slug, nowTime]);
  if (!row) return null;
  // fold is_open_now into the gym object for the mapper
  row.gym.is_open_now = row.is_open_now;
  return row as GymDetailRow;
}

/** Fire-and-forget page view. Never blocks or throws into the request. */
export function recordPageView(gymId: string, path: string, referrer?: string): void {
  pool
    .query('INSERT INTO page_views (gym_id, path, referrer) VALUES ($1, $2, $3)', [
      gymId,
      path,
      referrer ?? null,
    ])
    .catch((err) => logger.warn({ err }, 'page_view insert failed'));
}
