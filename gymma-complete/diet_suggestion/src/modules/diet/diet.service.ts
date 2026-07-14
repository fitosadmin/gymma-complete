// src/modules/diet/diet.service.ts
import { AppError } from '../../shared/errors/AppError';
import { calculateDiet } from './diet.calculator';
import * as repo from './diet.repository';
import type { CalculateBody, UpdateNoteBody } from './diet.schema';
import type { PaginationMeta } from '../../shared/response/envelope';

export async function calculate(userId: string, body: CalculateBody) {
  const { label, ...inputFields } = body;
  const result = calculateDiet(inputFields);
  return repo.insertDietPlan(userId, inputFields, result, label);
}

export async function listPlans(userId: string, page: number, limit: number) {
  const { plans, total } = await repo.findPlansByUser(userId, page, limit);
  const meta: PaginationMeta = { page, limit, total, totalPages: Math.ceil(total / limit) };
  return { plans, meta };
}

export async function getPlan(id: string, userId: string) {
  const plan = await repo.findPlanById(id, userId);
  if (!plan) throw AppError.notFound('Diet plan not found');
  return plan;
}

export async function getActivePlan(userId: string) {
  return repo.findActivePlan(userId);
}

export async function updateNote(id: string, userId: string, body: UpdateNoteBody) {
  const plan = await repo.updatePlanNote(id, userId, body.userNote, body.label);
  if (!plan) throw AppError.notFound('Diet plan not found');
  return plan;
}

export async function deletePlan(id: string, userId: string) {
  const deleted = await repo.softDeletePlan(id, userId);
  if (!deleted) throw AppError.notFound('Diet plan not found');
}
