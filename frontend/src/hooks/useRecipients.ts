import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PaginationInfo } from './useCampaigns';

export interface Recipient {
  id: string;
  email: string;
  name: string;
  created_at: string;
  send_count: number;
  last_sent_at: string | null;
}

export interface RecipientsResponse {
  data: Recipient[];
  pagination: PaginationInfo;
}

export interface DashboardStats {
  campaigns: {
    total: number;
    draft: number;
    scheduled: number;
    sending: number;
    sent: number;
  };
  recipients: {
    total: number;
  };
  emails: {
    total: number;
    sent: number;
    failed: number;
    opened: number;
    open_rate: number;
    send_rate: number;
  };
}

export function useRecipients(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['recipients', params],
    queryFn: async () => {
      const { data } = await api.get('/recipients', { params });
      return data as RecipientsResponse;
    },
  });
}

export function useRecipient(id: string) {
  return useQuery({
    queryKey: ['recipient', id],
    queryFn: async () => {
      const { data } = await api.get(`/recipients/${id}`);
      return data as { data: Recipient };
    },
    enabled: !!id,
  });
}

export function useCreateRecipient() {
  return useMutation({
    mutationFn: async (payload: { email: string; name: string }) => {
      const { data } = await api.post('/recipients', payload);
      return data;
    },
  });
}

export function useUpdateRecipient() {
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; email?: string; name?: string }) => {
      const { data } = await api.put(`/recipients/${id}`, payload);
      return data;
    },
  });
}

export function useDeleteRecipient() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recipients/${id}`);
    },
  });
}

export function useBulkCreateRecipients() {
  return useMutation({
    mutationFn: async (recipients: { email: string; name: string }[]) => {
      const { data } = await api.post('/recipients/bulk', { recipients });
      return data as { data: { created: number; skipped: number; recipients: Recipient[] } };
    },
  });
}

export function useBulkDeleteRecipients() {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.post('/recipients/bulk-delete', { ids });
      return data as { data: { deleted: number } };
    },
  });
}

export function useExportRecipients() {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.post('/recipients/export', { ids }, { responseType: 'blob' });
      return data;
    },
  });
}

export function useDashboardStats(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['dashboard-stats', params],
    queryFn: async () => {
      const { data } = await api.get('/stats', { params });
      return data as { data: DashboardStats };
    },
  });
}
