import '../helpers/setup';
import request from 'supertest';
import app from '../../app';
import { User } from '../../models';
import { hashPassword } from '../../utils/password';

describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register new user — 201', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: `new${Date.now()}@test.com`, name: 'New User', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('should reject invalid email — 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'not-an-email', name: 'Test', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject short password — 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', name: 'Test', password: 'short' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await User.create({
        email: `login${Date.now()}@test.com`,
        name: 'Test User',
        password_hash: await hashPassword('password123'),
      });
    });

    it('should login with valid credentials — 200 + token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject wrong password — 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email — 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });
});
