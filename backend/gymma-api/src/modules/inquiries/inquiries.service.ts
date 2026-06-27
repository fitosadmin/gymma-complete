// src/modules/inquiries/inquiries.service.ts
import { AppError } from '../../shared/errors/AppError';
import * as repo from './inquiries.repository';
import type { CreateInquiryBody } from './inquiries.schema';

export async function createInquiry(input: CreateInquiryBody): Promise<{ id: string }> {
  if (!(await repo.gymExists(input.gymId))) {
    throw AppError.notFound('Gym not found');
  }
  return repo.insertInquiry(input);
}
