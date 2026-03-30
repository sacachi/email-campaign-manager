import { EventEmitter } from 'events';

export interface CampaignStatusEvent {
  campaignId: string;
  status: string;
}

export interface CampaignProgressEvent {
  campaignId: string;
  current: number;
  total: number;
  sent: number;
  failed: number;
}

export interface CampaignCompleteEvent {
  campaignId: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    opened: number;
    open_rate: number;
    send_rate: number;
  };
}

class CampaignEventBus extends EventEmitter {}

export const campaignEventBus = new CampaignEventBus();
// Allow up to 200 concurrent SSE listeners without Node.js warnings
campaignEventBus.setMaxListeners(200);
