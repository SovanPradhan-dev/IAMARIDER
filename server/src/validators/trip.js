import { z } from 'zod';

const coordinate = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

const longitude = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

export const createTripSchema = z.object({
  name: z.string().trim().min(2, 'Trip name must be at least 2 characters').max(120),
  description: z.string().trim().max(1000).optional(),
  startLatitude: coordinate,
  startLongitude: longitude,
  destLatitude: coordinate,
  destLongitude: longitude,
  plannedDepartureAt: z
    .string()
    .datetime({ message: 'Invalid departure date' })
    .optional(),
  maxMembers: z.coerce.number().int().min(2).max(100).default(10),
  privacy: z.enum(['public', 'private']).default('private'),
});

export const joinTripSchema = z.object({
  tripCode: z.string().trim().min(1, 'Trip code is required').toUpperCase(),
});

export const updateTripSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  plannedDepartureAt: z.string().datetime({ message: 'Invalid departure date' }).optional(),
  maxMembers: z.coerce.number().int().min(2).max(100).optional(),
  privacy: z.enum(['public', 'private']).optional(),
});

export const tripIdParamSchema = z.object({
  tripId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid trip ID'),
});

export const memberUserIdParamSchema = z.object({
  tripId: tripIdParamSchema.shape.tripId,
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
});
