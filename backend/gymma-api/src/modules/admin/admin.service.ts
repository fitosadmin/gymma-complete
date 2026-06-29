// src/modules/admin/admin.service.ts
import { AppError } from '../../shared/errors/AppError';
import { buildMeta } from '../../shared/utils/pagination';
import { slugify } from '../../shared/utils/slugify';
import * as repo from './admin.repository';
import type {
  CreateGymBody,
  UpdateGymBody,
  ListQuery,
  UpdateDemoRequestBody,
  LinkOwnerBody,
} from './admin.schema';

const toRupees = (paise: number) => paise / 100;

export async function listGyms(q: ListQuery) {
  const { rows, total } = await repo.listGyms(q);
  const data = rows.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    area: g.area,
    city: g.city,
    pricePerMonth: toRupees(g.price_per_month),
    isActive: g.is_active,
    isPremium: g.is_premium,
    womenFriendly: g.women_friendly,
    hasParking: g.has_parking,
    profileScore: g.profile_score,
    createdAt: g.created_at,
  }));
  return { data, meta: buildMeta(q.page, q.limit, total) };
}

export async function createGym(body: CreateGymBody) {
  let slug = body.slug ? slugify(body.slug) : slugify(body.name);
  if (await repo.slugExists(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  return repo.createGym(body, slug);
}

export async function updateGym(id: string, body: UpdateGymBody) {
  if (body.slug) body.slug = slugify(body.slug);
  const ok = await repo.updateGym(id, body);
  if (!ok) throw AppError.notFound('Gym not found');
}

export async function deleteGym(id: string) {
  const ok = await repo.softDeleteGym(id);
  if (!ok) throw AppError.notFound('Gym not found');
}

export async function listInquiries(q: ListQuery) {
  const { rows, total } = await repo.listAllInquiries(q);
  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    message: r.message,
    status: r.status,
    gymName: r.gym_name,
    gymSlug: r.gym_slug,
    createdAt: r.created_at,
  }));
  return { data, meta: buildMeta(q.page, q.limit, total) };
}

export async function listDemoRequests(q: ListQuery) {
  const { rows, total } = await repo.listDemoRequests(q);
  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    gymName: r.gym_name,
    city: r.city,
    area: r.area,
    memberCount: r.member_count,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  }));
  return { data, meta: buildMeta(q.page, q.limit, total) };
}

export async function updateDemoRequest(id: string, body: UpdateDemoRequestBody) {
  const ok = await repo.updateDemoRequest(id, body.status, body.notes);
  if (!ok) throw AppError.notFound('Demo request not found');
}

export async function linkOwner(gymId: string, body: LinkOwnerBody) {
  await repo.linkOwner(gymId, body.userId, body.isPrimary);
}

export async function onboardDemoRequest(id: string) {
  const req = await repo.getDemoRequestById(id);
  if (!req) throw AppError.notFound('Demo request not found');
  if (req.status === 'onboarded') throw AppError.conflict('Already onboarded');
  
  // Create a unique slug from gym_name
  const baseSlug = req.gym_name ? req.gym_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'gym';
  let slug = baseSlug;
  let counter = 1;
  while (await repo.slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return repo.onboardGymTransaction(id, req, slug);
}
