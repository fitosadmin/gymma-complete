// src/modules/inquiries/inquiries.repository.ts
import { queryOne } from '../../shared/db/query';
import type { CreateInquiryBody } from './inquiries.schema';

export async function gymExists(gymId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM gyms WHERE id = $1 AND deleted_at IS NULL',
    [gymId],
  );
  return row != null;
}

export async function insertInquiry(input: CreateInquiryBody): Promise<{ id: string }> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO inquiries (gym_id, name, phone, message, plan_interest, source_page, utm_source)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [
      input.gymId,
      input.name,
      input.phone,
      input.message ?? null,
      input.planInterest ?? null,
      input.sourcePage ?? null,
      input.utmSource ?? null,
    ],
  );
  return row!;
}
