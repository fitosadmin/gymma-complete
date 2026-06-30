import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  gymId: z.string().uuid().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
