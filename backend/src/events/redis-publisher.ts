import Redis from 'ioredis';
import config from '../config';

export const CAMPAIGN_EVENTS_CHANNEL = 'campaign-events';

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      lazyConnect: true,
    });
    publisher.on('error', (err) => {
      console.error('[redis-publisher] Error:', err.message);
    });
  }
  return publisher;
}

export async function publishCampaignEvent(
  type: 'campaign:status' | 'campaign:progress' | 'campaign:complete',
  payload: object
): Promise<void> {
  const message = JSON.stringify({ type, payload });
  await getPublisher().publish(CAMPAIGN_EVENTS_CHANNEL, message);
}

export async function closePublisher(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
