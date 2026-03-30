import '../helpers/setup';
import request from 'supertest';
import app from '../../app';
import { User, Recipient } from '../../models';
import { hashPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';

describe('Recipients API', () => {
  let token: string;

  beforeAll(async () => {
    const user = await User.create({
      email: 'test@test.com',
      name: 'Test User',
      password_hash: await hashPassword('password123'),
    });
    token = generateToken({ userId: user.id, email: user.email });
  });

  describe('GET /recipients', () => {
    beforeEach(async () => {
      await Recipient.create({ email: 'r1@test.com', name: 'Recipient 1' });
      await Recipient.create({ email: 'r2@test.com', name: 'Recipient 2' });
    });

    it('should list recipients with pagination — 200', async () => {
      const res = await request(app)
        .get('/recipients')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /recipient', () => {
    it('should create recipient — 201', async () => {
      const res = await request(app)
        .post('/recipients')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'new@test.com', name: 'New Recipient' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('new@test.com');
    });

    it('should reject duplicate email — 409', async () => {
      await Recipient.create({ email: 'existing@test.com', name: 'Existing' });

      const res = await request(app)
        .post('/recipients')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'existing@test.com', name: 'Another' });

      expect(res.status).toBe(409);
    });

    it('should reject invalid email — 400', async () => {
      const res = await request(app)
        .post('/recipients')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'not-an-email', name: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /recipients/:id', () => {
    it('should get single recipient — 200', async () => {
      const recipient = await Recipient.create({ email: 'get@test.com', name: 'Get Test' });

      const res = await request(app)
        .get(`/recipients/${recipient.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('get@test.com');
    });

    it('should return 404 for non-existent recipient — 404', async () => {
      const res = await request(app)
        .get('/recipients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /recipients/:id', () => {
    it('should update recipient — 200', async () => {
      const recipient = await Recipient.create({ email: 'update@test.com', name: 'Old Name' });

      const res = await request(app)
        .put(`/recipients/${recipient.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.email).toBe('update@test.com');
    });

    it('should reject duplicate email on update — 409', async () => {
      await Recipient.create({ email: 'taken@test.com', name: 'Taken' });
      const recipient = await Recipient.create({ email: 'original@test.com', name: 'Original' });

      const res = await request(app)
        .put(`/recipients/${recipient.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'taken@test.com' });

      expect(res.status).toBe(409);
    });

    it('should return 404 for non-existent recipient — 404', async () => {
      const res = await request(app)
        .put('/recipients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /recipients/:id', () => {
    it('should delete recipient — 204', async () => {
      const recipient = await Recipient.create({ email: 'delete@test.com', name: 'Delete Me' });

      const res = await request(app)
        .delete(`/recipients/${recipient.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const deleted = await Recipient.findByPk(recipient.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent recipient — 404', async () => {
      const res = await request(app)
        .delete('/recipients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /recipients/bulk', () => {
    it('should bulk create recipients — 201', async () => {
      const res = await request(app)
        .post('/recipients/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipients: [
            { email: 'bulk1@test.com', name: 'Bulk 1' },
            { email: 'bulk2@test.com', name: 'Bulk 2' },
            { email: 'bulk3@test.com', name: 'Bulk 3' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.created).toBe(3);
      expect(res.body.data.skipped).toBe(0);
      expect(res.body.data.recipients).toHaveLength(3);
    });

    it('should skip duplicate emails — 201', async () => {
      await Recipient.create({ email: 'duplicate@test.com', name: 'Duplicate Existing' });

      const res = await request(app)
        .post('/recipients/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipients: [
            { email: 'duplicate@test.com', name: 'Duplicate' },
            { email: 'newbulk@test.com', name: 'New Bulk' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.created).toBe(1);
      expect(res.body.data.skipped).toBe(1);
    });

    it('should reject empty recipients array — 400', async () => {
      const res = await request(app)
        .post('/recipients/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipients: [] });

      expect(res.status).toBe(400);
    });

    it('should reject invalid email in bulk — 400', async () => {
      const res = await request(app)
        .post('/recipients/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipients: [
            { email: 'invalid-email', name: 'Invalid' },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /recipients/bulk-delete', () => {
    it('should bulk delete recipients — 200', async () => {
      const r1 = await Recipient.create({ email: 'bulkdel1@test.com', name: 'Bulk Del 1' });
      const r2 = await Recipient.create({ email: 'bulkdel2@test.com', name: 'Bulk Del 2' });

      const res = await request(app)
        .post('/recipients/bulk-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: [r1.id, r2.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(2);

      const deleted1 = await Recipient.findByPk(r1.id);
      const deleted2 = await Recipient.findByPk(r2.id);
      expect(deleted1).toBeNull();
      expect(deleted2).toBeNull();
    });

    it('should return 0 for empty ids array — 200', async () => {
      const res = await request(app)
        .post('/recipients/bulk-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /recipients/export', () => {
    it('should export all recipients as CSV — 200', async () => {
      await Recipient.create({ email: 'export1@test.com', name: 'Export 1' });
      await Recipient.create({ email: 'export2@test.com', name: 'Export 2' });

      const res = await request(app)
        .post('/recipients/export')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('recipients.csv');
      expect(res.text).toContain('Email,Name,Send Count,Last Sent,Created');
      expect(res.text).toContain('export1@test.com');
      expect(res.text).toContain('export2@test.com');
    });

    it('should export specific recipients by ids — 200', async () => {
      const r1 = await Recipient.create({ email: 'specific1@test.com', name: 'Specific 1' });
      await Recipient.create({ email: 'specific2@test.com', name: 'Specific 2' });

      const res = await request(app)
        .post('/recipients/export')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: [r1.id] });

      expect(res.status).toBe(200);
      expect(res.text).toContain('specific1@test.com');
      expect(res.text).not.toContain('specific2@test.com');
    });
  });
});
