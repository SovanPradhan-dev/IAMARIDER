import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  avatarUrl: z.string().trim().url('Invalid avatar URL').optional().or(z.literal('')),
  emergencyContact: z
    .object({
      name: z.string().trim().min(1).max(100),
      phone: z.string().trim().max(30),
      relationship: z.string().trim().max(50).optional(),
    })
    .optional(),
});
