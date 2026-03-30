import { z } from 'zod';

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(1000).default(20),
    status: z.enum(['draft', 'sending', 'scheduled', 'sent']).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});
