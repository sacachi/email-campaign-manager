import { z } from 'zod';
import { registerSchema, loginSchema } from '../../validators/auth.validator';
import { createCampaignSchema, updateCampaignSchema, scheduleCampaignSchema } from '../../validators/campaign.validator';

describe('Input Validators', () => {
  describe('registerSchema', () => {
    it('should pass with valid input', () => {
      const valid = {
        body: { email: 'test@example.com', name: 'Test User', password: 'password123' },
      };
      expect(() => registerSchema.parse(valid)).not.toThrow();
    });

    it('should fail with invalid email', () => {
      const invalid = {
        body: { email: 'not-an-email', name: 'Test', password: 'password123' },
      };
      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it('should fail with short password', () => {
      const invalid = {
        body: { email: 'test@example.com', name: 'Test', password: 'short' },
      };
      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it('should fail with missing name', () => {
      const invalid = {
        body: { email: 'test@example.com', password: 'password123' },
      };
      expect(() => registerSchema.parse(invalid)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should pass with valid credentials', () => {
      const valid = {
        body: { email: 'test@example.com', password: 'password123' },
      };
      expect(() => loginSchema.parse(valid)).not.toThrow();
    });

    it('should fail with invalid email', () => {
      const invalid = {
        body: { email: 'invalid', password: 'password123' },
      };
      expect(() => loginSchema.parse(invalid)).toThrow();
    });
  });

  describe('createCampaignSchema', () => {
    it('should pass with valid input', () => {
      const valid = {
        body: {
          name: 'Campaign',
          subject: 'Subject',
          body: 'Body content',
          recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        },
      };
      expect(() => createCampaignSchema.parse(valid)).not.toThrow();
    });

    it('should fail without name', () => {
      const invalid = {
        body: { subject: 'Subject', body: 'Body', recipientIds: ['550e8400-e29b-41d4-a716-446655440000'] },
      };
      expect(() => createCampaignSchema.parse(invalid)).toThrow();
    });

    it('should fail without subject', () => {
      const invalid = {
        body: { name: 'Campaign', body: 'Body', recipientIds: ['550e8400-e29b-41d4-a716-446655440000'] },
      };
      expect(() => createCampaignSchema.parse(invalid)).toThrow();
    });

    it('should fail without body', () => {
      const invalid = {
        body: { name: 'Campaign', subject: 'Subject', recipientIds: ['550e8400-e29b-41d4-a716-446655440000'] },
      };
      expect(() => createCampaignSchema.parse(invalid)).toThrow();
    });

    it('should fail without recipientIds', () => {
      const invalid = {
        body: { name: 'Campaign', subject: 'Subject', body: 'Body' },
      };
      expect(() => createCampaignSchema.parse(invalid)).toThrow();
    });

    it('should fail with empty recipientIds array', () => {
      const invalid = {
        body: { name: 'Campaign', subject: 'Subject', body: 'Body', recipientIds: [] },
      };
      expect(() => createCampaignSchema.parse(invalid)).toThrow();
    });
  });

  describe('updateCampaignSchema', () => {
    it('should pass with partial fields', () => {
      const valid = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: { name: 'Updated Name' },
      };
      expect(() => updateCampaignSchema.parse(valid)).not.toThrow();
    });

    it('should fail with empty body', () => {
      const invalid = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: {},
      };
      expect(() => updateCampaignSchema.parse(invalid)).toThrow();
    });

    it('should fail with invalid UUID', () => {
      const invalid = {
        params: { id: 'not-a-uuid' },
        body: { name: 'Updated' },
      };
      expect(() => updateCampaignSchema.parse(invalid)).toThrow();
    });
  });

  describe('scheduleCampaignSchema', () => {
    it('should pass with future datetime', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const valid = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: { scheduled_at: futureDate },
      };
      expect(() => scheduleCampaignSchema.parse(valid)).not.toThrow();
    });

    it('should fail with past datetime', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const invalid = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: { scheduled_at: pastDate },
      };
      expect(() => scheduleCampaignSchema.parse(invalid)).toThrow();
    });
  });
});
