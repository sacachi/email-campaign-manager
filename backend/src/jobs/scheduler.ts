import { Op } from 'sequelize';
import { Campaign } from '../models';
import { scheduleCampaignSend, enqueueCampaignSend, campaignQueue } from './queue';

/**
 * On startup: find any scheduled campaigns that are already overdue and
 * enqueue them immediately. Also schedule future campaigns with BullMQ delay.
 *
 * BullMQ persists delayed jobs in Redis — no polling loop needed.
 */
async function syncScheduledCampaigns(): Promise<void> {
  const now = new Date();

  const campaigns = await Campaign.findAll({
    where: { status: 'scheduled' },
    attributes: ['id', 'name', 'scheduled_at'],
  });

  for (const campaign of campaigns) {
    // Skip if already in queue (job with same jobId exists)
    const existing = await campaignQueue.getJob(`campaign-${campaign.id}`);
    if (existing) {
      console.log(`[scheduler] Campaign ${campaign.id} already queued, skipping`);
      continue;
    }

    if (!campaign.scheduled_at || campaign.scheduled_at <= now) {
      console.log(`[scheduler] Campaign "${campaign.name}" (${campaign.id}) is overdue — enqueueing immediately`);
      await enqueueCampaignSend(campaign.id);
    } else {
      console.log(`[scheduler] Campaign "${campaign.name}" (${campaign.id}) scheduled at ${campaign.scheduled_at.toISOString()}`);
      await scheduleCampaignSend(campaign.id, campaign.scheduled_at);
    }
  }

  if (campaigns.length === 0) {
    console.log('[scheduler] No scheduled campaigns found on startup');
  }
}

export async function startScheduler(): Promise<void> {
  console.log('[scheduler] Syncing scheduled campaigns to BullMQ queue...');
  await syncScheduledCampaigns();
  console.log('[scheduler] Scheduler ready — BullMQ handles all delayed sends');
}

