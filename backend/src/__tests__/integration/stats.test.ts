import '../helpers/setup';
import request from 'supertest';
import app from '../../app';
import { User, Campaign, Recipient } from '../../models';
import { hashPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';

describe('Stats API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const user = await User.create({
      email: 'stats@test.com',
      name: 'Stats User',
      password_hash: await hashPassword('password123'),
    });
    userId = user.id;
    token = generateToken({ userId: user.id, email: user.email });
  });

  describe('GET /stats', () => {
    beforeEach(async () => {
      await Campaign.create({
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'draft',
        created_by: userId,
      });
    });

    it('should return dashboard stats — 200', async () => {
      const res = await request(app)
        .get('/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('campaigns');
      expect(res.body.data).toHaveProperty('recipients');
      expect(res.body.data).toHaveProperty('emails');
      expect(res.body.data.campaigns).toHaveProperty('total');
      expect(res.body.data.campaigns).toHaveProperty('draft');
      expect(res.body.data.campaigns).toHaveProperty('scheduled');
      expect(res.body.data.campaigns).toHaveProperty('sending');
      expect(res.body.data.campaigns).toHaveProperty('sent');
      expect(res.body.data.recipients).toHaveProperty('total');
      expect(res.body.data.emails).toHaveProperty('total');
      expect(res.body.data.emails).toHaveProperty('sent');
      expect(res.body.data.emails).toHaveProperty('failed');
      expect(res.body.data.emails).toHaveProperty('opened');
      expect(res.body.data.emails).toHaveProperty('open_rate');
      expect(res.body.data.emails).toHaveProperty('send_rate');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/stats');
      expect(res.status).toBe(401);
    });

    it('should count campaigns by status', async () => {
      await Campaign.create({
        name: 'Scheduled Campaign',
        subject: 'Subject',
        body: 'Body',
        status: 'scheduled',
        scheduled_at: new Date(),
        created_by: userId,
      });

      const res = await request(app)
        .get('/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.campaigns.draft).toBeGreaterThanOrEqual(1);
      expect(res.body.data.campaigns.scheduled).toBeGreaterThanOrEqual(1);
      expect(res.body.data.campaigns.total).toBeGreaterThanOrEqual(2);
    });
  });
});
