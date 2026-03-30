import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

export interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  send_rate: number;
}

export interface Recipient {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  opened_at: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'sending' | 'scheduled' | 'sent';
  scheduled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  stats?: CampaignStats;
}

export interface CampaignDetail extends Campaign {
  recipients: Recipient[];
  stats: CampaignStats;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CampaignsResponse {
  data: Campaign[];
  pagination: PaginationInfo;
}

export function useCampaigns(params: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/campaigns', { params });
      return data as CampaignsResponse;
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}`);
      return data as { data: CampaignDetail };
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: async (payload: { name: string; subject: string; body: string; recipientIds: string[]; scheduled_at?: string }) => {
      const { data } = await api.post('/campaigns', payload);
      return data;
    },
  });
}

export function useUpdateCampaign() {
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; subject?: string; body?: string; scheduled_at?: string | null }) => {
      const { data } = await api.patch(`/campaigns/${id}`, payload);
      return data;
    },
  });
}

export function useDeleteCampaign() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/${id}`);
    },
  });
}

export function useScheduleCampaign() {
  return useMutation({
    mutationFn: async ({ id, scheduled_at }: { id: string; scheduled_at: string }) => {
      const { data } = await api.post(`/campaigns/${id}/schedule`, { scheduled_at });
      return data;
    },
  });
}

export function useSendCampaign() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/send`);
      return data;
    },
  });
}

export function useDuplicateCampaign() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/duplicate`);
      return data as { data: Campaign };
    },
  });
}
