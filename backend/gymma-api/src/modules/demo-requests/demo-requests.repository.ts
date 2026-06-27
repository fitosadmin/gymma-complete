// src/modules/demo-requests/demo-requests.repository.ts
import { queryOne } from '../../shared/db/query';
import type { CreateDemoRequestBody } from './demo-requests.schema';

export async function insertDemoRequest(
  input: CreateDemoRequestBody,
): Promise<{ id: string }> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO demo_requests (name, phone, email, gym_name, city, area, member_count, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id`,
    [
      input.name,
      input.phone,
      input.email,
      input.gymName,
      input.city ?? null,
      input.area ?? null,
      input.memberCount ?? null,
      input.notes ?? null,
    ],
  );
  return row!;
}
