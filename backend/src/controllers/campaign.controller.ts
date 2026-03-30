import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Campaign, CampaignRecipient, Recipient } from '../models';
import { AppError } from '../utils/errors';
import { CampaignStatus } from '../models/Campaign';
import { enqueueCampaignSend, scheduleCampaignSend } from '../jobs/queue';
import { campaignEventBus, CampaignStatusEvent, CampaignProgressEvent, CampaignCompleteEvent } from '../events/campaign-events';

function assertDraftStatus(campaign: Campaign): void {
  if (campaign.status !== 'draft') {
    throw new AppError('Campaign can only be modified when status is draft', 400);
  }
}

function assertCanSend(campaign: Campaign): void {
  if (campaign.status === 'sent') {
    throw new AppError('Campaign has already been sent', 400);
  }
  if (campaign.status === 'sending') {
    throw new AppError('Campaign is currently being sent', 400);
  }
}

export async function listCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { created_by: user.userId };
    if (status) {
      where.status = status;
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    // Enrich each campaign with stats
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const recipients = await CampaignRecipient.findAll({
          where: { campaign_id: campaign.id },
        });
        return {
          ...campaign.toJSON(),
          stats: calculateStats(recipients),
        };
      })
    );

    res.json({
      data: campaignsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { name, subject, body, recipientIds, scheduled_at } = req.body;

    // Default to 5 minutes from now if no scheduled_at provided
    const scheduleDate = scheduled_at
      ? new Date(scheduled_at)
      : new Date(Date.now() + 5 * 60 * 1000);

    const campaign = await Campaign.create({
      name,
      subject,
      body,
      status: 'scheduled' as CampaignStatus,
      scheduled_at: scheduleDate,
      created_by: user.userId,
    });

    const recipients = await Recipient.findAll({
      where: { id: recipientIds },
    });

    if (recipients.length === 0) {
      throw new AppError('No valid recipients found', 400);
    }

    const campaignRecipients = recipients.map((r: any) => ({
      campaign_id: campaign.id,
      recipient_id: r.id,
      status: 'pending' as const,
    }));

    await CampaignRecipient.bulkCreate(campaignRecipients);

    // Enqueue the send job into BullMQ immediately after creation
    if (scheduleDate <= new Date()) {
      await enqueueCampaignSend(campaign.id);
    } else {
      await scheduleCampaignSend(campaign.id, scheduleDate);
    }

    const result = await Campaign.findByPk(campaign.id, {
      include: [{
        model: Recipient,
        as: 'recipients',
        through: { attributes: ['status'] },
      }],
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.created_by !== user.userId) {
      throw new AppError('Access denied', 403);
    }

    const recipients = await CampaignRecipient.findAll({
      where: { campaign_id: id },
      include: [{ model: Recipient, as: 'recipient' }],
    });

    const stats = calculateStats(recipients);

    res.json({
      data: {
        ...campaign.toJSON(),
        recipients: recipients.map((cr: any) => ({
          id: cr.recipient.id,
          email: cr.recipient.email,
          name: cr.recipient.name,
          status: cr.status,
          sent_at: cr.sent_at,
          opened_at: cr.opened_at,
        })),
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, subject, body, scheduled_at } = req.body;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.created_by !== user.userId) {
      throw new AppError('Access denied', 403);
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new AppError('Campaign can only be edited when status is draft or scheduled', 400);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (scheduled_at !== undefined) {
      if (scheduled_at === null) {
        updateData.scheduled_at = null;
      } else {
        const newSchedule = new Date(scheduled_at);
        if (newSchedule <= new Date()) {
          throw new AppError('scheduled_at must be a future timestamp', 400);
        }
        updateData.scheduled_at = newSchedule;
      }
    }

    await campaign.update(updateData);

    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function deleteCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.created_by !== user.userId) {
      throw new AppError('Access denied', 403);
    }

    assertDraftStatus(campaign);

    await campaign.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function scheduleCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { scheduled_at } = req.body;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.created_by !== user.userId) {
      throw new AppError('Access denied', 403);
    }

    assertDraftStatus(campaign);

    const scheduleDate = new Date(scheduled_at);
    if (scheduleDate <= new Date()) {
      throw new AppError('scheduled_at must be a future timestamp', 400);
    }

    await campaign.update({
      scheduled_at: scheduleDate,
      status: 'scheduled',
    });

    // Enqueue the send as a delayed BullMQ job
    await scheduleCampaignSend(campaign.id, scheduleDate);

    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function sendCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.created_by !== user.userId) {
      throw new AppError('Access denied', 403);
    }

    assertCanSend(campaign);

    // Enqueue immediately — worker will call processCampaignSend
    await enqueueCampaignSend(id!);

    res.json({ data: { ...campaign.toJSON(), queued: true } });
  } catch (error) {
    next(error);
  }
export async function duplicateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const original = await Campaign.findByPk(id);
    if (!original) throw new AppError('Campaign not found', 404);
    if (original.created_by !== user.userId) throw new AppError('Access denied', 403);

    // New schedule = now + 5 minutes (always draft, no immediate send)
    const scheduledAt = new Date(Date.now() + 5 * 60 * 1000);

    const copy = await Campaign.create({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      body: original.body,
      status: 'draft' as CampaignStatus,
      scheduled_at: scheduledAt,
      created_by: user.userId,
    });

    // Copy all recipients back to pending
    const originalRecipients = await CampaignRecipient.findAll({
      where: { campaign_id: id },
      attributes: ['recipient_id'],
    });

    if (originalRecipients.length > 0) {
      await CampaignRecipient.bulkCreate(
        originalRecipients.map((r: any) => ({
          campaign_id: copy.id,
          recipient_id: r.recipient_id,
          status: 'pending' as const,
        }))
      );
    }

    res.status(201).json({ data: copy });
  } catch (error) {
    next(error);
  }
}

function calculateStats(recipients: any[]) {
  const total = recipients.length;
  const sent = recipients.filter((r) => r.status === 'sent').length;
  const failed = recipients.filter((r) => r.status === 'failed').length;
  const opened = recipients.filter((r) => r.opened_at !== null).length;

  return {
    total,
    sent,
    failed,
    opened,
    open_rate: total > 0 ? Number(((opened / total) * 100).toFixed(2)) : 0,
    send_rate: total > 0 ? Number(((sent / total) * 100).toFixed(2)) : 0,
  };
}

export async function streamCampaignEvents(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  const { id } = req.params;

  const campaign = await Campaign.findOne({ where: { id, created_by: user.userId } });
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Send current state immediately so the client is in sync
  send('status', { campaignId: id, status: campaign.status });

  const onStatus = (data: CampaignStatusEvent) => {
    if (data.campaignId === id) send('status', data);
  };
  const onProgress = (data: CampaignProgressEvent) => {
    if (data.campaignId === id) send('progress', data);
  };
  const onComplete = (data: CampaignCompleteEvent) => {
    if (data.campaignId === id) {
      send('complete', data);
    }
  };

  campaignEventBus.on('campaign:status', onStatus);
  campaignEventBus.on('campaign:progress', onProgress);
  campaignEventBus.on('campaign:complete', onComplete);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    campaignEventBus.off('campaign:status', onStatus);
    campaignEventBus.off('campaign:progress', onProgress);
    campaignEventBus.off('campaign:complete', onComplete);
  });
}
