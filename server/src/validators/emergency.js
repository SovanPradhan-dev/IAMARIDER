import { z } from 'zod';

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const createEmergencySchema = z.object({
  eventType: z.enum(['sos', 'breakdown', 'medical', 'other'], {
    required_error: 'Emergency type is required',
  }),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
});

export const resolveEmergencySchema = z.object({
  status: z.enum(['resolved', 'cancelled']),
  resolutionNotes: z.string().trim().max(500).optional(),
});
