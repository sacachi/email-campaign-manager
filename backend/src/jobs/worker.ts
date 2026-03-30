import { Worker, Job } from 'bullmq';
import config from '../config';
import { processCampaignSend } from '../services/campaign-send.service';
import { CAMPAIGN_QUEUE_NAME, type CampaignSendJobData } from './queue';

let worker: Worker | null = null;

async function processJob(job: Job<CampaignSendJobData>): Promise<void> {
  const { campaignId } = job.data;
  console.log(`[worker] Processing campaign send job ${job.id} for campaign ${campaignId}`);
  await processCampaignSend(campaignId);
}

export function startWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<CampaignSendJobData>(CAMPAIGN_QUEUE_NAME, processJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed — campaign ${job.data.campaignId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed — campaign ${job?.data.campaignId}:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[worker] Worker error:', err);
  });

  console.log('[worker] Campaign send worker started');
  return worker;
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[worker] Campaign send worker stopped');
  }
}
