import Redis from 'ioredis';
import config from '../config';
import { campaignEventBus } from './campaign-events';
import { CAMPAIGN_EVENTS_CHANNEL } from './redis-publisher';

let subscriber: Redis | null = null;

export function startCampaignEventSubscriber(): void {
  if (subscriber) return;

  subscriber = new Redis({
    host: config.redis.host,
    port: config.redis.port,
  });

  subscriber.on('error', (err) => {
    console.error('[redis-subscriber] Error:', err.message);
  });

  subscriber.subscribe(CAMPAIGN_EVENTS_CHANNEL, (err) => {
    if (err) {
      console.error('[redis-subscriber] Failed to subscribe:', err.message);
      return;
    }
    console.log('[redis-subscriber] Subscribed to campaign-events channel');
  });

  subscriber.on('message', (_channel, message) => {
    try {
      const { type, payload } = JSON.parse(message);
      campaignEventBus.emit(type, payload);
    } catch (err) {
      console.error('[redis-subscriber] Failed to parse message:', err);
    }
  });
}

export async function stopCampaignEventSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}
