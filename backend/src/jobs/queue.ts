import { Queue } from 'bullmq';
import config from '../config';

export const CAMPAIGN_QUEUE_NAME = 'campaign-send';

export interface CampaignSendJobData {
  campaignId: string;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
};

export const campaignQueue = new Queue<CampaignSendJobData>(CAMPAIGN_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

/**
 * Enqueue a campaign to be sent immediately.
 */
export async function enqueueCampaignSend(campaignId: string): Promise<void> {
  await campaignQueue.add('send', { campaignId }, { jobId: `campaign-${campaignId}` });
  console.log(`[queue] Enqueued campaign ${campaignId} for immediate send`);
}

/**
 * Enqueue a campaign to be sent at a specific future time.
 */
export async function scheduleCampaignSend(campaignId: string, sendAt: Date): Promise<void> {
  const delay = sendAt.getTime() - Date.now();
  await campaignQueue.add(
    'send',
    { campaignId },
    {
      jobId: `campaign-${campaignId}`,
      delay: delay > 0 ? delay : 0,
    }
  );
  console.log(`[queue] Scheduled campaign ${campaignId} to send at ${sendAt.toISOString()} (delay: ${delay}ms)`);
}
