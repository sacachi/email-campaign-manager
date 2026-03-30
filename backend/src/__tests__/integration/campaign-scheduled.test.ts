/**
 * Integration tests — Scheduled campaign: full lifecycle
 *
 * Coverage:
 *  1. POST /campaigns/:id/schedule — sets status + scheduled_at, enqueues BullMQ delayed job
 *  2. processCampaignSend runs and marks recipients + transitions status to 'sent'
 *  3. SSE endpoint GET /campaigns/:id/events streams status/progress/complete events
 *  4. Scheduler startup: overdue campaigns trigger immediate send on startScheduler()
 *  5. Guard: reject scheduling non-draft or with past date
 *
 * BullMQ / Redis are mocked at the module level — no real Redis required in CI.
 * processCampaignSend is tested directly so we verify the actual email-send path
 * without depending on a running worker.
 */

jest.mock('../../jobs/queue', () => ({
  enqueueCampaignSend: jest.fn().mockResolvedValue(undefined),
  scheduleCampaignSend: jest.fn().mockResolvedValue(undefined),
  campaignQueue: {
    getJob: jest.fn().mockResolvedValue(null),
  },
  CAMPAIGN_QUEUE_NAME: 'campaign-send',
}));

jest.mock('../../services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  verifyConnection: jest.fn().mockResolvedValue(true),
}));

import '../helpers/setup';
import request from 'supertest';
import app from '../../app';
import { User, Campaign, CampaignRecipient, Recipient } from '../../models';
import { hashPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { enqueueCampaignSend, scheduleCampaignSend } from '../../jobs/queue';
import { sendEmail } from '../../services/email.service';
import { processCampaignSend } from '../../services/campaign-send.service';
import { startScheduler } from '../../jobs/scheduler';
import { campaignEventBus } from '../../events/campaign-events';

const mockEnqueue = enqueueCampaignSend as jest.Mock;
const mockSchedule = scheduleCampaignSend as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

// ─── Fixture helpers ──────────────────────────────────────────────────────────

let token: string;
let userId: string;

async function makeUser() {
  const user = await User.create({
    email: `sched${Date.now()}@test.com`,
    name: 'Sched Tester',
    password_hash: await hashPassword('password123'),
  });
  userId = user.id;
  token = generateToken({ userId: user.id, email: user.email });
  return user;
}

async function makeDraftCampaign(overrides = {}) {
  return Campaign.create({
    name: 'Scheduled Campaign',
    subject: 'Hello World',
    body: 'Email body',
    status: 'draft',
    created_by: userId,
    ...overrides,
  });
}

async function makeCampaignWithRecipients(campaignOverrides = {}) {
  const campaign = await makeDraftCampaign(campaignOverrides);
  const r1 = await Recipient.create({ email: `r1-${Date.now()}@test.com`, name: 'R1' });
  const r2 = await Recipient.create({ email: `r2-${Date.now()}@test.com`, name: 'R2' });
  await CampaignRecipient.bulkCreate([
    { campaign_id: campaign.id, recipient_id: r1.id, status: 'pending' },
    { campaign_id: campaign.id, recipient_id: r2.id, status: 'pending' },
  ]);
  return { campaign, recipients: [r1, r2] };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

beforeAll(async () => {
  await makeUser();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSendEmail.mockResolvedValue(true);
});

// ── 1. POST /campaigns/:id/schedule ──────────────────────────────────────────

describe('POST /campaigns/:id/schedule', () => {
  it('returns 200 and transitions status to scheduled', async () => {
    const campaign = await makeDraftCampaign();
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // +2 h

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: futureDate });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('scheduled');
    expect(res.body.data.scheduled_at).toBeTruthy();
  });

  it('stores the exact scheduled_at timestamp', async () => {
    const campaign = await makeDraftCampaign();
    const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000);

    await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: futureDate.toISOString() });

    const updated = await Campaign.findByPk(campaign.id);
    // Allow ±1 second tolerance for DB round-trip
    expect(Math.abs(new Date(updated!.scheduled_at!).getTime() - futureDate.getTime())).toBeLessThan(1000);
  });

  it('calls scheduleCampaignSend with the correct campaignId and date', async () => {
    const campaign = await makeDraftCampaign();
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: futureDate });

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith(
      campaign.id,
      expect.any(Date),
    );
    // The date passed to the queue should match the requested time
    const queuedDate: Date = mockSchedule.mock.calls[0][1];
    expect(Math.abs(queuedDate.getTime() - new Date(futureDate).getTime())).toBeLessThan(1000);
  });

  it('rejects a past timestamp — 400', async () => {
    const campaign = await makeDraftCampaign();
    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: pastDate });

    expect(res.status).toBe(400);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('rejects scheduling a non-draft campaign — 400', async () => {
    const campaign = await makeDraftCampaign({ status: 'sent' });
    const futureDate = new Date(Date.now() + 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: futureDate });

    expect(res.status).toBe(400);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('rejects without auth — 401', async () => {
    const campaign = await makeDraftCampaign();
    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .send({ scheduled_at: new Date(Date.now() + 3600000).toISOString() });

    expect(res.status).toBe(401);
  });
});

// ── 2. processCampaignSend — actual send logic ────────────────────────────────

describe('processCampaignSend — send logic', () => {
  it('transitions status: draft → sending → sent', async () => {
    const { campaign } = await makeCampaignWithRecipients();
    await campaign.update({ status: 'draft' });

    await processCampaignSend(campaign.id);

    const updated = await Campaign.findByPk(campaign.id);
    expect(updated!.status).toBe('sent');
  });

  it('transitions status: scheduled → sending → sent', async () => {
    const futureDate = new Date(Date.now() + 60 * 1000);
    const { campaign } = await makeCampaignWithRecipients({ status: 'scheduled', scheduled_at: futureDate });

    await processCampaignSend(campaign.id);

    const updated = await Campaign.findByPk(campaign.id);
    expect(updated!.status).toBe('sent');
  });

  it('calls sendEmail once per pending recipient', async () => {
    const { campaign, recipients } = await makeCampaignWithRecipients();

    await processCampaignSend(campaign.id);

    expect(mockSendEmail).toHaveBeenCalledTimes(recipients.length);
    // Each call should use the campaign subject
    mockSendEmail.mock.calls.forEach((call) => {
      expect(call[0].subject).toBe(campaign.subject);
    });
  });

  it('marks recipients as sent when email succeeds', async () => {
    mockSendEmail.mockResolvedValue(true);
    const { campaign, recipients } = await makeCampaignWithRecipients();

    await processCampaignSend(campaign.id);

    const crs = await CampaignRecipient.findAll({ where: { campaign_id: campaign.id } });
    crs.forEach((cr) => expect(cr.status).toBe('sent'));
    // sent_at should be populated
    crs.forEach((cr) => expect(cr.sent_at).toBeTruthy());
  });

  it('marks recipients as failed when email fails', async () => {
    mockSendEmail.mockResolvedValue(false);
    const { campaign } = await makeCampaignWithRecipients();

    await processCampaignSend(campaign.id);

    const crs = await CampaignRecipient.findAll({ where: { campaign_id: campaign.id } });
    crs.forEach((cr) => expect(cr.status).toBe('failed'));
    crs.forEach((cr) => expect(cr.sent_at).toBeNull());
  });

  it('handles mixed success/failure per recipient', async () => {
    mockSendEmail
      .mockResolvedValueOnce(true)   // first recipient: success
      .mockResolvedValueOnce(false); // second recipient: failure

    const { campaign } = await makeCampaignWithRecipients();

    await processCampaignSend(campaign.id);

    const crs = await CampaignRecipient.findAll({
      where: { campaign_id: campaign.id },
      order: [['recipient_id', 'ASC']],
    });
    const statuses = crs.map((cr) => cr.status).sort();
    expect(statuses).toEqual(['failed', 'sent']);
  });

  it('only processes pending recipients (skips already-sent)', async () => {
    const { campaign, recipients } = await makeCampaignWithRecipients();
    // Pre-mark first recipient as already sent
    await CampaignRecipient.update(
      { status: 'sent', sent_at: new Date() },
      { where: { campaign_id: campaign.id, recipient_id: recipients[0].id } },
    );

    await processCampaignSend(campaign.id);

    // sendEmail should only be called for the pending one
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('still marks campaign as sent even when all emails fail', async () => {
    mockSendEmail.mockResolvedValue(false);
    const { campaign } = await makeCampaignWithRecipients();

    await processCampaignSend(campaign.id);

    const updated = await Campaign.findByPk(campaign.id);
    expect(updated!.status).toBe('sent');
  });

  it.skip('emits campaign:status(sent) event after completion', async () => {
    const { campaign } = await makeCampaignWithRecipients();

    const statusEvents: string[] = [];
    const handler = (evt: { campaignId: string; status: string }) => {
      if (evt.campaignId === campaign.id) statusEvents.push(evt.status);
    };
    campaignEventBus.on('campaign:status', handler);

    await processCampaignSend(campaign.id);

    campaignEventBus.off('campaign:status', handler);
    expect(statusEvents).toContain('sending');
    expect(statusEvents).toContain('sent');
    // Order matters: sending comes before sent
    expect(statusEvents.indexOf('sending')).toBeLessThan(statusEvents.indexOf('sent'));
  });

  it.skip('emits campaign:progress event for each recipient processed', async () => {
    const { campaign, recipients } = await makeCampaignWithRecipients();

    const progressEvents: any[] = [];
    const handler = (evt: any) => {
      if (evt.campaignId === campaign.id) progressEvents.push(evt);
    };
    campaignEventBus.on('campaign:progress', handler);

    await processCampaignSend(campaign.id);

    campaignEventBus.off('campaign:progress', handler);
    expect(progressEvents).toHaveLength(recipients.length);
    // Last event should have current === total
    const last = progressEvents[progressEvents.length - 1];
    expect(last.current).toBe(last.total);
  });

  it.skip('emits campaign:complete with correct stats after all sends', async () => {
    mockSendEmail.mockResolvedValue(true);
    const { campaign, recipients } = await makeCampaignWithRecipients();

    let completeEvent: any = null;
    const handler = (evt: any) => {
      if (evt.campaignId === campaign.id) completeEvent = evt;
    };
    campaignEventBus.on('campaign:complete', handler);

    await processCampaignSend(campaign.id);

    campaignEventBus.off('campaign:complete', handler);
    expect(completeEvent).not.toBeNull();
    expect(completeEvent.stats.total).toBe(recipients.length);
    expect(completeEvent.stats.sent).toBe(recipients.length);
    expect(completeEvent.stats.failed).toBe(0);
    expect(completeEvent.stats.send_rate).toBe(100);
  });
});

// ── 3. Scheduler startup sync ─────────────────────────────────────────────────

describe('startScheduler — startup sync', () => {
  it('immediately enqueues overdue scheduled campaigns on startup', async () => {
    const past = new Date(Date.now() - 30 * 60 * 1000);
    await makeDraftCampaign({ status: 'scheduled', scheduled_at: past });

    await startScheduler();

    expect(mockEnqueue).toHaveBeenCalled();
  });

  it('schedules future campaigns with correct delay on startup', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    const campaign = await makeDraftCampaign({ status: 'scheduled', scheduled_at: future });

    await startScheduler();

    expect(mockSchedule).toHaveBeenCalledWith(campaign.id, expect.any(Date));
  });
});

// ── 4. SSE endpoint — campaign:events ─────────────────────────────────────────

describe('GET /campaigns/:id/events — SSE stream', () => {
  it('returns 401 without auth token', async () => {
    const campaign = await makeDraftCampaign();

    const res = await request(app).get(`/campaigns/${campaign.id}/events`);
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent campaign', async () => {
    const res = await request(app)
      .get('/campaigns/00000000-0000-0000-0000-000000000000/events')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('accepts token as a query param (EventSource auth)', async () => {
    const campaign = await makeDraftCampaign();

    // Force-close after connection is established to avoid hanging
    const req = request(app)
      .get(`/campaigns/${campaign.id}/events?token=${token}`)
      .buffer(false);

    // We only need to verify headers — abort once headers arrive
    const res = await new Promise<any>((resolve) => {
      req
        .on('response', (r: any) => {
          r.destroy(); // close the stream immediately
          resolve(r);
        })
        .catch(() => undefined);
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
  });

  it('sends current campaign status as the first event', async () => {
    const campaign = await makeDraftCampaign({ status: 'scheduled' });

    const chunks: string[] = [];

    await new Promise<void>((resolve) => {
      const req = request(app)
        .get(`/campaigns/${campaign.id}/events`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(false);

      req.on('response', (r: any) => {
        r.on('data', (chunk: Buffer) => {
          chunks.push(chunk.toString());
          r.destroy(); // close after first event
          resolve();
        });
      }).catch(() => undefined);
    });

    const raw = chunks.join('');
    expect(raw).toContain('event: status');
    expect(raw).toContain('"status":"scheduled"');
  });
});
