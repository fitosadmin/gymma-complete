// src/modules/owner/owner.service.ts
import { AppError } from '../../shared/errors/AppError';
import { buildMeta } from '../../shared/utils/pagination';
import type { PaginationMeta } from '../../shared/response/envelope';
import { uploadImage } from '../../shared/storage/s3';
import * as repo from './owner.repository';
import type { ListInquiriesQuery, UpdateGymBody, OnboardGymBody } from './owner.schema';

function pctDelta(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

export async function listGyms(userId: string) {
  const rows = await repo.listOwnerGyms(userId);
  return rows.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    area: g.area,
    coverImageUrl: g.cover_image_url,
    isActive: g.is_active,
    profileScore: g.profile_score,
  }));
}

export async function getStats(gymId: string) {
  const s = await repo.getStats(gymId);
  if (!s) throw AppError.notFound('Gym not found');

  const views = Number(s.profile_views);
  const viewsPrev = Number(s.profile_views_prev);
  const inquiries = Number(s.inquiries);
  const inquiriesPrev = Number(s.inquiries_prev);

  return {
    profileViews: views,
    profileViewsDelta: pctDelta(views, viewsPrev),
    inquiries,
    inquiriesDelta: pctDelta(inquiries, inquiriesPrev),
    avgRating: s.avg_rating ? Number(s.avg_rating) : 0,
    reviewCount: s.review_count ? Number(s.review_count) : 0,
    profileScore: s.profile_score,
  };
}

export async function listInquiries(
  gymId: string,
  q: ListInquiriesQuery,
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  const { rows, total } = await repo.listInquiries(gymId, q);
  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    message: r.message,
    planInterest: r.plan_interest,
    status: r.status,
    sourcePage: r.source_page,
    notes: r.notes,
    createdAt: r.created_at,
  }));
  return { data, meta: buildMeta(q.page, q.limit, total) };
}

export async function updateInquiry(
  inquiryId: string,
  userId: string,
  status: string,
  notes?: string,
): Promise<void> {
  const ok = await repo.updateInquiryOwned(inquiryId, userId, status, notes);
  if (!ok) throw AppError.forbidden('Inquiry not found or not yours');
}

export async function updateGymProfile(gymId: string, body: UpdateGymBody): Promise<void> {
  await repo.updateGymProfile(gymId, body);
}

export async function addGalleryImages(
  gymId: string,
  files: { buffer: Buffer }[],
): Promise<{ id: string; url: string }[]> {
  if (files.length === 0) throw AppError.validation('No images provided');
  if (files.length > 10) throw AppError.validation('Max 10 images per upload');

  const urls: string[] = [];
  for (const f of files) {
    urls.push(await uploadImage(f.buffer, `gyms/${gymId}/gallery`));
  }
  return repo.insertGalleryImages(gymId, urls);
}

export async function onboardGym(gymId: string, data: OnboardGymBody): Promise<void> {
  await repo.onboardGymTransaction(gymId, data);
}

import bcrypt from 'bcryptjs';

export async function listMembers(gymId: string) {
  return repo.listMembers(gymId);
}

export async function addMember(gymId: string, data: { phone: string; fullName: string; email?: string; planId?: string }) {
  const defaultPassword = 'Gymma@1234';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  return repo.addMemberToGym(gymId, {
    ...data,
    passwordHash
  });
}
