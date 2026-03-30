import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { campaignKeys } from './useCampaigns';
import { useAuthStore } from '../store/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Opens an SSE connection to GET /campaigns/:id/events and keeps
 * React Query cache in sync with live status + stats updates.
 *
 * @param campaignId - the campaign to watch
 * @param active     - set to false to skip (e.g. campaign is already `sent`)
 */
export function useCampaignSSE(campaignId: string, active: boolean) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!active || !campaignId || !token) return;

    // EventSource cannot set Authorization headers; pass token as query param.
    const url = `${API_URL}/campaigns/${campaignId}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // status event — invalidate full detail + list cache
    es.addEventListener('status', () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    });

    // progress event — update stats in-place for instant feedback
    es.addEventListener('progress', (e: MessageEvent) => {
      const { total, sent, failed } = JSON.parse(e.data) as {
        campaignId: string;
        current: number;
        total: number;
        sent: number;
        failed: number;
      };
      queryClient.setQueryData(campaignKeys.detail(campaignId), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'sending',
            stats: {
              ...old.data.stats,
              total,
              sent,
              failed,
              send_rate: total > 0 ? Math.round((sent / total) * 100) : 0,
            },
          },
        };
      });
    });

    // complete event — final refresh then close connection
    es.addEventListener('complete', () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      es.close();
    });

    es.onerror = () => {
      // Browser will auto-reconnect on network errors; close on unrecoverable state
      if (es.readyState === EventSource.CLOSED) {
        esRef.current = null;
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [active, campaignId, token, queryClient]);
}
