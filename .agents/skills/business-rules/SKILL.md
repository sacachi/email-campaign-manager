# Skill: Business Rules Enforcement

## Mục tiêu
Implement và enforce tất cả business rules server-side cho Campaign Manager.

## Campaign Status State Machine

```
                  schedule()        send()
  ┌─────┐ ─────────────── ┌───────────┐ ──────── ┌─────────┐ ──────── ┌──────┐
  │draft│                  │ scheduled │          │ sending │          │ sent │
  └─────┘ ◄─── create()   └───────────┘          └─────────┘          └──────┘
     │                          │                      │
     │         send()           │                      │
     └──────────────────────────┘──────────────────────┘
                                         ▲
                                    (irreversible)
```

### Valid Transitions
| From | To | Trigger | Conditions |
|------|----|---------|------------|
| (new) | draft | POST /campaigns | Always |
| draft | scheduled | POST /campaigns/:id/schedule | scheduled_at must be future |
| draft | sending | POST /campaigns/:id/send | Has recipients |
| scheduled | sending | POST /campaigns/:id/send | - |
| sending | sent | (automatic) | All recipients processed |

### Invalid Transitions (Must Reject)
- `scheduled` → `draft` (cannot revert)
- `sent` → any (final state)
- `sending` → any except `sent` (in progress)

## Business Rules Implementation

### Rule 1: Draft-Only Editing
```typescript
// backend/src/services/campaign.service.ts
function assertDraftStatus(campaign: Campaign): void {
  if (campaign.status !== 'draft') {
    throw new AppError(
      'Campaign can only be modified when status is draft',
      400
    );
  }
}

// Used in:
// - PATCH /campaigns/:id (update)
// - DELETE /campaigns/:id (delete)
```

### Rule 2: Future Timestamp for Schedule
```typescript
function assertFutureTimestamp(scheduledAt: string | Date): void {
  const date = new Date(scheduledAt);
  if (date <= new Date()) {
    throw new AppError(
      'scheduled_at must be a future timestamp',
      400
    );
  }
}
```

### Rule 3: Irreversible Send
```typescript
function assertCanSend(campaign: Campaign): void {
  if (campaign.status === 'sent') {
    throw new AppError('Campaign has already been sent', 400);
  }
  if (campaign.status === 'sending') {
    throw new AppError('Campaign is currently being sent', 400);
  }
  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    throw new AppError('Campaign cannot be sent in current status', 400);
  }
}
```

### Rule 4: Send Simulation (Async Random)
```typescript
async function simulateSend(campaignId: string): Promise<void> {
  // 1. Set campaign status → 'sending'
  await Campaign.update({ status: 'sending' }, { where: { id: campaignId } });

  // 2. Get all campaign recipients
  const recipients = await CampaignRecipient.findAll({
    where: { campaign_id: campaignId, status: 'pending' },
  });

  // 3. Simulate async sending — random sent/failed
  for (const recipient of recipients) {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const success = Math.random() > 0.15; // ~85% success rate
    await recipient.update({
      status: success ? 'sent' : 'failed',
      sent_at: success ? new Date() : null,
    });
  }

  // 4. Set campaign status → 'sent'
  await Campaign.update({ status: 'sent' }, { where: { id: campaignId } });
}
```

### Rule 5: Stats Calculation
```typescript
interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  send_rate: number;
}

async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const recipients = await CampaignRecipient.findAll({
    where: { campaign_id: campaignId },
  });

  const total = recipients.length;
  const sent = recipients.filter(r => r.status === 'sent').length;
  const failed = recipients.filter(r => r.status === 'failed').length;
  const opened = recipients.filter(r => r.opened_at !== null).length;

  return {
    total,
    sent,
    failed,
    opened,
    open_rate: total > 0 ? Number(((opened / total) * 100).toFixed(2)) : 0,
    send_rate: total > 0 ? Number(((sent / total) * 100).toFixed(2)) : 0,
  };
}
```

## AppError Class

```typescript
// backend/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

## Error Handler Middleware

```typescript
// backend/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Unit Test Cases — Business Rules

### Status Transition Tests
```
✅ assertDraftStatus: draft → passes
✅ assertDraftStatus: scheduled → throws 400
✅ assertDraftStatus: sending → throws 400
✅ assertDraftStatus: sent → throws 400

✅ assertCanSend: draft → passes
✅ assertCanSend: scheduled → passes
✅ assertCanSend: sending → throws 400
✅ assertCanSend: sent → throws 400

✅ assertFutureTimestamp: future date → passes
✅ assertFutureTimestamp: past date → throws 400
✅ assertFutureTimestamp: current time → throws 400
```

### Stats Calculation Tests
```
✅ Empty recipients → { total: 0, sent: 0, ..., open_rate: 0, send_rate: 0 }
✅ All sent → send_rate: 100
✅ All failed → send_rate: 0
✅ Mixed sent/failed → correct percentages
✅ With opened → correct open_rate
✅ Division by zero handled → rates = 0
```

### Send Simulation Tests
```
✅ Campaign status transitions: draft → sending → sent
✅ Recipients get marked sent or failed
✅ sent_at is set for sent recipients
✅ sent_at is null for failed recipients
```

## Rules Applied
- Business logic trong Service layer, không trong Controller
- Tất cả state transitions qua explicit assertion functions
- Error messages rõ ràng cho client
- Division by zero protection trong stats
- Idempotency: send đã sent campaign trả error, không send lại
