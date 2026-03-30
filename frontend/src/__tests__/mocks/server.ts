import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };
    if (body.email === 'test@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@test.com', name: 'Test User' },
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email?: string; name?: string; password?: string };
    if (body.email && body.name && body.password && body.password.length >= 8) {
      return HttpResponse.json({
        data: { id: '2', email: body.email, name: body.name },
      }, { status: 201 });
    }
    return HttpResponse.json({ error: 'Validation failed' }, { status: 400 });
  }),

  http.get('/api/campaigns', () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Campaign 1', status: 'draft', subject: 'Test', body: 'Body' },
        { id: '2', name: 'Campaign 2', status: 'sent', subject: 'Test 2', body: 'Body 2' },
      ],
      pagination: { page: 1, limit: 20, total: 2 },
    });
  }),

  http.get('/api/campaigns/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      data: {
        id,
        name: 'Campaign Detail',
        status: 'draft',
        subject: 'Subject',
        body: 'Body',
        stats: { total: 10, sent: 5, failed: 0, opened: 2, send_rate: 50, open_rate: 20 },
      },
    });
  }),

  http.post('/api/campaigns', async ({ request }) => {
    const body = await request.json() as { name?: string; subject?: string; body?: string };
    if (body.name && body.subject && body.body) {
      return HttpResponse.json({
        data: { id: '3', ...body, status: 'draft' },
      }, { status: 201 });
    }
    return HttpResponse.json({ error: 'Validation failed' }, { status: 400 });
  }),

  http.patch('/api/campaigns/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      data: { id: params.id, ...body },
    });
  }),

  http.delete('/api/campaigns/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/campaigns/:id/schedule', async ({ params, request }) => {
    const body = await request.json() as { scheduled_at?: string };
    return HttpResponse.json({
      data: { id: params.id, status: 'scheduled', scheduled_at: body.scheduled_at },
    });
  }),

  http.post('/api/campaigns/:id/send', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        status: 'sent',
        stats: { total: 10, sent: 10, failed: 0, opened: 5, send_rate: 100, open_rate: 50 },
      },
    });
  }),

  http.get('/api/recipients', () => {
    return HttpResponse.json({
      data: [
        { id: '1', email: 'recipient1@test.com', name: 'Recipient 1' },
        { id: '2', email: 'recipient2@test.com', name: 'Recipient 2' },
      ],
      pagination: { page: 1, limit: 20, total: 2 },
    });
  }),

  http.post('/api/recipients', async ({ request }) => {
    const body = await request.json() as { email?: string; name?: string };
    if (body.email && body.name) {
      return HttpResponse.json({
        data: { id: '3', ...body },
      }, { status: 201 });
    }
    return HttpResponse.json({ error: 'Validation failed' }, { status: 400 });
  }),

  http.get('/api/stats', () => {
    return HttpResponse.json({
      data: {
        campaigns: { total: 5, draft: 2, scheduled: 1, sending: 0, sent: 2 },
        recipients: { total: 100 },
        emails: { total: 100, sent: 80, failed: 5, opened: 40, open_rate: 50, send_rate: 80 },
      },
    });
  }),
];

export const server = setupServer(...handlers);
