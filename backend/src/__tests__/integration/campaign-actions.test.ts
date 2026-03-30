import '../helpers/setup';
import request from 'supertest';
import app from '../../app';
import { User, Campaign, CampaignRecipient, Recipient } from '../../models';
import { hashPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';

describe('Campaign Actions API', () => {
  let token: string;
  let userId: string;
  let campaign: any;
  let recipient: any;

  beforeAll(async () => {
    const user = await User.create({
      email: `action${Date.now()}@test.com`,
      name: 'Test User',
      password_hash: await hashPassword('password123'),
    });
    userId = user.id;
    token = generateToken({ userId: user.id, email: user.email });

    campaign = await Campaign.create({
      name: 'Test Campaign',
      subject: 'Subject',
      body: 'Body',
      status: 'draft',
      created_by: userId,
    });

    recipient = await Recipient.create({
      email: `recipient${Date.now()}@test.com`,
      name: 'Recipient',
    });

    await CampaignRecipient.create({
      campaign_id: campaign.id,
      recipient_id: recipient.id,
      status: 'pending',
    });
  });

  describe('POST /campaigns/:id/schedule', () => {
    it('should schedule draft campaign — 200', async () => {
      const newCampaign = await Campaign.create({
        name: 'To Schedule',
        subject: 'Subject',
        body: 'Body',
        status: 'draft',
        created_by: userId,
      });
      
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/campaigns/${newCampaign.id}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled_at: futureDate });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('scheduled');
    });

    it('should reject past timestamp — 400', async () => {
      const newCampaign = await Campaign.create({
        name: 'To Schedule Past',
        subject: 'Subject',
        body: 'Body',
        status: 'draft',
        created_by: userId,
      });
      
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/campaigns/${newCampaign.id}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled_at: pastDate });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /campaigns/:id/send', () => {
    it('should send draft campaign — 200 (queued)', async () => {
      const newCampaign = await Campaign.create({
        name: 'To Send',
        subject: 'Subject',
        body: 'Body',
        status: 'draft',
        created_by: userId,
      });

      const newRecipient = await Recipient.create({
        email: `send${Date.now()}@test.com`,
        name: 'Recipient',
      });

      await CampaignRecipient.create({
        campaign_id: newCampaign.id,
        recipient_id: newRecipient.id,
        status: 'pending',
      });

      const res = await request(app)
        .post(`/campaigns/${newCampaign.id}/send`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.queued).toBe(true);
    });

    it('should reject already sent campaign — 400', async () => {
      const sentCampaign = await Campaign.create({
        name: 'Already Sent',
        subject: 'Subject',
        body: 'Body',
        status: 'sent',
        created_by: userId,
      });

      const res = await request(app)
        .post(`/campaigns/${sentCampaign.id}/send`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
