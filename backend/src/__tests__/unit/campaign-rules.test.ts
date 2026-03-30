import { AppError } from '../../utils/errors';

type CampaignStatus = 'draft' | 'sending' | 'scheduled' | 'sent';

interface MockCampaign {
  status: CampaignStatus;
}

function assertDraftStatus(campaign: MockCampaign): void {
  if (campaign.status !== 'draft') {
    throw new AppError('Campaign can only be modified when status is draft', 400);
  }
}

function assertCanSend(campaign: MockCampaign): void {
  if (campaign.status === 'sent') {
    throw new AppError('Campaign has already been sent', 400);
  }
  if (campaign.status === 'sending') {
    throw new AppError('Campaign is currently being sent', 400);
  }
}

function assertFutureTimestamp(scheduledAt: string | Date): void {
  const date = new Date(scheduledAt);
  if (date <= new Date()) {
    throw new AppError('scheduled_at must be a future timestamp', 400);
  }
}

describe('Campaign Business Rules', () => {
  describe('assertDraftStatus', () => {
    it('should pass for draft status', () => {
      const campaign = { status: 'draft' } as MockCampaign;
      expect(() => assertDraftStatus(campaign)).not.toThrow();
    });

    it('should throw for scheduled status', () => {
      const campaign = { status: 'scheduled' } as MockCampaign;
      expect(() => assertDraftStatus(campaign)).toThrow(AppError);
    });

    it('should throw for sending status', () => {
      const campaign = { status: 'sending' } as MockCampaign;
      expect(() => assertDraftStatus(campaign)).toThrow(AppError);
    });

    it('should throw for sent status', () => {
      const campaign = { status: 'sent' } as MockCampaign;
      expect(() => assertDraftStatus(campaign)).toThrow(AppError);
    });
  });

  describe('assertCanSend', () => {
    it('should pass for draft campaign', () => {
      const campaign = { status: 'draft' } as MockCampaign;
      expect(() => assertCanSend(campaign)).not.toThrow();
    });

    it('should pass for scheduled campaign', () => {
      const campaign = { status: 'scheduled' } as MockCampaign;
      expect(() => assertCanSend(campaign)).not.toThrow();
    });

    it('should throw for sending campaign', () => {
      const campaign = { status: 'sending' } as MockCampaign;
      expect(() => assertCanSend(campaign)).toThrow(AppError);
    });

    it('should throw for sent campaign', () => {
      const campaign = { status: 'sent' } as MockCampaign;
      expect(() => assertCanSend(campaign)).toThrow(AppError);
    });
  });

  describe('assertFutureTimestamp', () => {
    it('should pass for future date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(() => assertFutureTimestamp(futureDate)).not.toThrow();
    });

    it('should throw for past date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(() => assertFutureTimestamp(pastDate)).toThrow(AppError);
    });

    it('should throw for current time', () => {
      expect(() => assertFutureTimestamp(new Date())).toThrow(AppError);
    });
  });
});
