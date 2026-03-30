import { Request, Response, NextFunction } from 'express';
import { fn, col, literal, Op } from 'sequelize';
import { Campaign, CampaignRecipient, Recipient } from '../models';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { from, to } = req.query as { from?: string; to?: string };

    const dateWhere: any = {};
    if (from) dateWhere.created_at = { [Op.gte]: new Date(from) };
    if (to) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      dateWhere.created_at = { ...(dateWhere.created_at || {}), [Op.lte]: toEnd };
    }

    // Campaign counts by status
    const campaigns = await Campaign.findAll({
      where: { created_by: user.userId, ...dateWhere },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const campaignCounts: Record<string, number> = {};
    (campaigns as any[]).forEach((c) => {
      campaignCounts[c.status] = Number(c.count);
    });

    const totalCampaigns = Object.values(campaignCounts).reduce((a, b) => a + b, 0);

    // Total recipients
    const totalRecipients = await Recipient.count();

    // Global email stats from campaign_recipients of user's campaigns
    const emailStats = await CampaignRecipient.findAll({
      attributes: [
        [fn('COUNT', col('CampaignRecipient.recipient_id')), 'total'],
        [fn('COUNT', literal("CASE WHEN \"CampaignRecipient\".\"status\" = 'sent' THEN 1 END")), 'sent'],
        [fn('COUNT', literal("CASE WHEN \"CampaignRecipient\".\"status\" = 'failed' THEN 1 END")), 'failed'],
        [fn('COUNT', literal("CASE WHEN \"CampaignRecipient\".\"opened_at\" IS NOT NULL THEN 1 END")), 'opened'],
      ],
      include: [{
        model: Campaign,
        as: 'campaign',
        attributes: [],
        where: { created_by: user.userId, ...dateWhere },
      }],
      raw: true,
    });

    const stats = (emailStats as any[])[0] || { total: 0, sent: 0, failed: 0, opened: 0 };
    const total = Number(stats.total) || 0;
    const sent = Number(stats.sent) || 0;
    const failed = Number(stats.failed) || 0;
    const opened = Number(stats.opened) || 0;

    res.json({
      data: {
        campaigns: {
          total: totalCampaigns,
          draft: campaignCounts.draft || 0,
          scheduled: campaignCounts.scheduled || 0,
          sending: campaignCounts.sending || 0,
          sent: campaignCounts.sent || 0,
        },
        recipients: {
          total: totalRecipients,
        },
        emails: {
          total,
          sent,
          failed,
          opened,
          open_rate: total > 0 ? Number(((opened / total) * 100).toFixed(2)) : 0,
          send_rate: total > 0 ? Number(((sent / total) * 100).toFixed(2)) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
