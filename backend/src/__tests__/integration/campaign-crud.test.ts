import '../helpers/setup';
import request from 'supertest';
import app from '../../app';
import { User, Campaign, Recipient } from '../../models';
import { hashPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';

describe('Campaign CRUD API', () => {
  let token: string;
  let userId: string;
  let recipientId: string;

  beforeAll(async () => {
    const user = await User.create({
      email: `test${Date.now()}@test.com`,
      name: 'Test User',
      password_hash: await hashPassword('password123'),
    });
    const recipient = await Recipient.create({
      email: `recipient${Date.now()}@test.com`,
      name: 'Test Recipient',
    });
    userId = user.id;
    recipientId = recipient.id;
    token = generateToken({ userId: user.id, email: user.email });
  });

  describe('POST /campaigns', () => {
    it('should create campaign in scheduled status — 201', async () => {
      const res = await request(app)
        .post('/campaigns')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Campaign', subject: 'Subject', body: 'Body content', recipientIds: [recipientId] });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('scheduled');
      expect(res.body.data.name).toBe('Test Campaign');
    });

    it('should reject without auth — 401', async () => {
      const res = await request(app)
        .post('/campaigns')
        .send({ name: 'Test', subject: 'Subject', body: 'Body', recipientIds: [recipientId] });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /campaigns', () => {
    it('should list campaigns — 200 + pagination', async () => {
      const res = await request(app)
        .get('/campaigns')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /campaigns/:id', () => {
    let campaign: any;

    beforeAll(async () => {
      campaign = await Campaign.create({
        name: 'Test Campaign',
        subject: 'Subject',
        body: 'Body',
        status: 'draft',
        created_by: userId,
      });
    });

    it('should return campaign detail — 200', async () => {
      const res = await request(app)
        .get(`/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Campaign');
      expect(res.body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent', async () => {
      const res = await request(app)
        .get('/campaigns/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /campaigns/:id', () => {
    let campaign: any;

    beforeEach(async () => {
      campaign = await Campaign.create({
        name: 'Test Campaign',
        subject: 'Subject',
        body: 'Body',
        status: 'draft',
        created_by: userId,
      });
    });

    it('should update draft campaign — 200', async () => {
      const res = await request(app)
        .patch(`/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should reject update for non-draft — 400', async () => {
      await campaign.update({ status: 'sent' });

      const res = await request(app)
        .patch(`/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /campaigns/:id', () => {
    it('should delete draft campaign — 204', async () => {
      const campaign = await Campaign.create({
        name: 'To Delete',
        subject: 'Subject',
        body: 'Body',
        status: 'draft',
        created_by: userId,
      });

      const res = await request(app)
        .delete(`/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should reject delete for non-draft — 400', async () => {
      const campaign = await Campaign.create({
        name: 'Sent Campaign',
        subject: 'Subject',
        body: 'Body',
        status: 'sent',
        created_by: userId,
      });

      const res = await request(app)
        .delete(`/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
