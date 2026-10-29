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
    .nullable()
    .optional(),
  notificationPreferences: z.object({
    tripUpdates: z.boolean(),
    checkpointArrivals: z.boolean(),
    safetyAlerts: z.boolean(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});
