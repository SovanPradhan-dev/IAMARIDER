import { z } from 'zod';

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
});

export const messagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
