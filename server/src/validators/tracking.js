import { z } from 'zod';

const coordinate = z.number();

export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  accuracyMeters: z.number().min(0).max(10000).optional(),
  speedMps: z.number().min(0).max(500).optional(),
  headingDegrees: z.number().min(0).max(360).optional(),
  recordedAt: z.string().datetime({ message: 'Invalid recordedAt timestamp' }).optional(),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});
