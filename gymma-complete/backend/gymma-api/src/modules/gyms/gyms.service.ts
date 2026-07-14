// src/modules/gyms/gyms.service.ts
import { AppError } from '../../shared/errors/AppError';
import { buildMeta } from '../../shared/utils/pagination';
import type { PaginationMeta } from '../../shared/response/envelope';
import * as repo from './gyms.repository';
import type {
  GymListFilters,
  GymSummary,
  GymSummaryRow,
  GymDetail,
} from './gyms.types';

const toRupees = (paise: number) => Math.round(paise) / 100;

function mapSummary(row: GymSummaryRow): GymSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    coverImageUrl: row.cover_image_url,
    area: row.area,
    city: row.city,
    pricePerMonth: toRupees(row.price_per_month),
    isPremium: row.is_premium,
    womenFriendly: row.women_friendly,
    hasParking: row.has_parking,
    lat: Number(row.lat),
    lng: Number(row.lng),
    isOpenNow: row.is_open_now,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    distanceKm: row.distance_km == null ? null : Number(row.distance_km),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    amenities: row.amenities ?? [],
  };
}

export async function listGyms(
  filters: GymListFilters,
): Promise<{ data: GymSummary[]; meta: PaginationMeta }> {
  const { rows, total } = await repo.findGyms(filters);
  return {
    data: rows.map(mapSummary),
    meta: buildMeta(filters.page, filters.limit, total),
  };
}

export async function getGymBySlug(slug: string): Promise<GymDetail> {
  const row = await repo.findGymBySlug(slug);
  if (!row) throw AppError.notFound('Gym not found');

  const g = row.gym;
  const r = row.rating;

  const detail: GymDetail = {
    id: g.id,
    slug: g.slug,
    name: g.name,
    coverImageUrl: g.cover_image_url,
    area: g.area,
    city: g.city,
    pricePerMonth: toRupees(g.price_per_month),
    isPremium: g.is_premium,
    womenFriendly: g.women_friendly,
    hasParking: g.has_parking,
    lat: Number(g.lat),
    lng: Number(g.lng),
    isOpenNow: g.is_open_now ?? null,
    distanceKm: null,
    rating: r ? Number(r.rating) : 0,
    reviewCount: r ? Number(r.review_count) : 0,
    amenities: row.amenities ?? [],

    description: g.description,
    phone: g.phone,
    whatsapp: g.whatsapp,
    addressLine: g.address_line,
    website: g.website,
    opensAt: g.opens_at,
    closesAt: g.closes_at,
    yearsOperating: g.years_operating,
    profileScore: g.profile_score,
    scores: r
      ? {
          cleanliness: Number(r.score_cleanliness),
          equipment: Number(r.score_equipment),
          trainers: Number(r.score_trainers),
          value: Number(r.score_value),
          crowd: Number(r.score_crowd),
        }
      : null,
    trainers: (row.trainers ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      photoUrl: t.photo_url,
      yearsExperience: t.years_experience,
      specialization: t.specialization,
      pricePerSession: toRupees(t.price_per_session),
      languages: t.languages ?? [],
    })),
    membershipPlans: (row.plans ?? []).map((mp: any) => ({
      id: mp.id,
      name: mp.name,
      durationMonths: mp.duration_months,
      price: toRupees(mp.price),
      benefits: mp.benefits ?? [],
      isRecommended: mp.is_recommended,
    })),
    classes: (row.classes ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      durationMin: c.duration_min,
      trainerName: c.trainer_name,
    })),
    faqs: (row.faqs ?? []).map((f: any) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    })),
    gallery: (row.gallery ?? []).map((gal: any) => ({
      id: gal.id,
      url: gal.url,
      caption: gal.caption,
    })),
    certifications: row.certifications ?? [],
  };

  // fire-and-forget analytics
  repo.recordPageView(g.id, `/gym/${slug}`);

  return detail;
}
