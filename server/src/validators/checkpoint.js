import { z } from 'zod';

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const createCheckpointSchema = z.object({
  name: z.string().trim().min(1, 'Checkpoint name is required').max(120),
  description: z.string().trim().max(500).optional(),
  latitude: latitude,
  longitude: longitude,
  sequence: z.coerce.number().int().min(1),
  plannedArrivalAt: z.string().datetime({ message: 'Invalid planned arrival time' }).optional(),
});

export const updateCheckpointSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  sequence: z.coerce.number().int().min(1).optional(),
  plannedArrivalAt: z.string().datetime({ message: 'Invalid planned arrival time' }).optional(),
});

export const arrivalSchema = z.object({});

export const checkpointParamsSchema = z.object({
  tripId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid trip ID'),
  checkpointId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid checkpoint ID'),
});
