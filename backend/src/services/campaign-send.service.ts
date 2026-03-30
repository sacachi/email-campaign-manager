import { Op } from 'sequelize';
import { Campaign, CampaignRecipient, Recipient } from '../models';
import { sendEmail } from './email.service';
import config from '../config';
import { publishCampaignEvent } from '../events/redis-publisher';

/**
 * Sends all pending emails for a campaign.
 * Reusable by both the HTTP controller and the cron scheduler.
 */
export async function processCampaignSend(campaignId: string): Promise<void> {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) {
    console.error(`[campaign-send] Campaign ${campaignId} not found`);
    return;
  }

  await campaign.update({ status: 'sending' });
  await publishCampaignEvent('campaign:status', { campaignId, status: 'sending' });

  const recipients = await CampaignRecipient.findAll({
    where: {
      campaign_id: campaignId,
      status: 'pending',
    },
    include: [{ model: Recipient, as: 'recipient' }],
  });

  const total = recipients.length;
  let sent = 0;
  let failed = 0;

  for (const campaignRecipient of recipients) {
    const recipientData = (campaignRecipient as any).recipient;
    if (!recipientData) {
      await campaignRecipient.update({ status: 'failed' });
      failed++;
      await publishCampaignEvent('campaign:progress', { campaignId, current: sent + failed, total, sent, failed });
      continue;
    }

    const trackingToken = Buffer.from(`${campaignId}:${recipientData.id}`).toString('base64url');
    const pixelUrl = `${config.baseUrl}/track/open/${trackingToken}`;

    const success = await sendEmail({
      to: recipientData.email,
      subject: campaign.subject,
      text: campaign.body,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${campaign.subject}</h2>
        <div style="white-space: pre-wrap;">${campaign.body}</div>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">Sent to ${recipientData.name || recipientData.email}</p>
        <img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />
      </div>`,
    });

    await campaignRecipient.update({
      status: success ? 'sent' : 'failed',
      sent_at: success ? new Date() : null,
    });

    if (success) sent++; else failed++;
    await publishCampaignEvent('campaign:progress', { campaignId, current: sent + failed, total, sent, failed });
  }

  await campaign.update({ status: 'sent' });
  await publishCampaignEvent('campaign:status', { campaignId, status: 'sent' });

  const opened = await CampaignRecipient.count({ where: { campaign_id: campaignId, status: 'sent', opened_at: { [Op.ne]: null } } });
  await publishCampaignEvent('campaign:complete', {
    campaignId,
    stats: {
      total,
      sent,
      failed,
      opened,
      open_rate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      send_rate: total > 0 ? Math.round((sent / total) * 100) : 0,
    },
  } as object);
  console.log(`[campaign-send] Campaign "${campaign.name}" (${campaignId}) sent to ${total} recipients`);
}
