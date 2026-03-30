import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    subject: z.string().min(1, 'Subject is required').max(500),
    body: z.string().min(1, 'Body is required'),
    recipientIds: z.array(z.string().uuid()).min(1, 'At least one recipient is required'),
    scheduled_at: z.string().datetime().refine(
      (date) => !date || new Date(date) > new Date(),
      { message: 'scheduled_at must be a future timestamp' }
    ).optional(),
  }),
});

export const updateCampaignSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    subject: z.string().min(1).max(500).optional(),
    body: z.string().min(1).optional(),
    scheduled_at: z.string().datetime().nullable().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const scheduleCampaignSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID'),
  }),
  body: z.object({
    scheduled_at: z.string().datetime().refine(
      (date) => new Date(date) > new Date(),
      { message: 'scheduled_at must be a future timestamp' }
    ),
  }),
});

export const campaignIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID'),
  }),
});
