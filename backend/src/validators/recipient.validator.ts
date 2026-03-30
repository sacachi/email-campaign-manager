import { z } from 'zod';

export const createRecipientSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(1, 'Name is required').max(255),
  }),
});

export const bulkCreateRecipientSchema = z.object({
  body: z.object({
    recipients: z.array(
      z.object({
        email: z.string().email('Invalid email format'),
        name: z.string().min(1, 'Name is required').max(255),
      })
    ).min(1, 'At least one recipient is required').max(500, 'Maximum 500 recipients at a time'),
  }),
});

export const bulkDeleteRecipientSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid('Invalid ID')).min(1, 'At least one ID is required'),
  }),
});

export const exportRecipientSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid('Invalid ID')).optional().default([]),
  }),
});

export const recipientIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recipient ID'),
  }),
});

export const updateRecipientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recipient ID'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(1, 'Name is required').max(255).optional(),
  }).refine((data) => data.email !== undefined || data.name !== undefined, {
    message: 'At least one field (email or name) must be provided',
  }),
});
