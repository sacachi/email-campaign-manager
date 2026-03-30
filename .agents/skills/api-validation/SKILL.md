# Skill: API Input Validation (Zod)

## Mục tiêu
Implement input validation layer cho tất cả API endpoints sử dụng Zod.

## Validation Middleware Pattern

```typescript
// backend/src/middleware/validate.ts
import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
```

## Validation Schemas

### Auth Schemas
```typescript
// backend/src/validators/auth.validator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});
```

### Campaign Schemas
```typescript
// backend/src/validators/campaign.validator.ts
import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    subject: z.string().min(1, 'Subject is required').max(500),
    body: z.string().min(1, 'Body is required'),
    recipientIds: z.array(z.string().uuid()).optional(),
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
  }).refine(data => Object.keys(data).length > 0, {
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
```

### Recipient Schemas
```typescript
// backend/src/validators/recipient.validator.ts
import { z } from 'zod';

export const createRecipientSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(1, 'Name is required').max(255),
  }),
});
```

### Pagination Schema
```typescript
// backend/src/validators/common.validator.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['draft', 'sending', 'scheduled', 'sent']).optional(),
  }),
});
```

## Route Usage Pattern

```typescript
// backend/src/routes/campaigns.ts
router.post('/', authMiddleware, validate(createCampaignSchema), campaignController.create);
router.patch('/:id', authMiddleware, validate(updateCampaignSchema), campaignController.update);
router.post('/:id/schedule', authMiddleware, validate(scheduleCampaignSchema), campaignController.schedule);
```

## Error Response Format

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "body.email", "message": "Invalid email format" },
    { "field": "body.name", "message": "Name must be at least 2 characters" }
  ]
}
```

## Unit Test Cases

### Register Validation
```
✅ Valid input → passes
✅ Invalid email → fails with "Invalid email format"
✅ Short name (< 2 chars) → fails
✅ Short password (< 8 chars) → fails
✅ Missing required fields → fails
✅ Extra fields → stripped (strict mode)
```

### Campaign Validation
```
✅ Valid create input → passes
✅ Missing name → fails
✅ Missing subject → fails
✅ Missing body → fails
✅ Valid update input (partial) → passes
✅ Empty update body → fails
✅ Invalid UUID param → fails
```

### Schedule Validation
```
✅ Future datetime → passes
✅ Past datetime → fails with "must be a future timestamp"
✅ Invalid datetime format → fails
✅ Missing scheduled_at → fails
```

## Rules Applied
- Validate tại route level, trước controller
- Error response phải consistent format
- Strip unknown fields (prevent mass assignment)
- Coerce query params (string to number for pagination)
- UUID validation cho tất cả entity IDs
- DateTime validation cho timestamps
