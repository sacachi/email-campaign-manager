# Skill: Frontend State Management (Zustand + React Query)

## Mục tiêu
Setup state management với Zustand cho client state và React Query cho server state.

## Zustand Stores

### Auth Store
```typescript
// frontend/src/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      isAuthenticated: () => get().token !== null,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
```

### UI Store (optional)
```typescript
// frontend/src/store/ui.store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

## React Query Setup

### Query Client
```typescript
// frontend/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### API Client
```typescript
// frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Query Hooks Pattern

### Campaign Queries
```typescript
// frontend/src/hooks/useCampaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Query Keys
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

// List campaigns
export function useCampaigns(params: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/campaigns', { params });
      return data;
    },
  });
}

// Campaign detail
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Create campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCampaignPayload) => {
      const { data } = await api.post('/campaigns', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

// Schedule, Send, Delete — similar pattern
```

## Auth Hooks
```typescript
// frontend/src/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', creds);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: { email: string; name: string; password: string }) => {
      const { data } = await api.post('/auth/register', payload);
      return data;
    },
  });
}
```

## Unit Test Cases

### Auth Store Tests
```
✅ Initial state: token = null, user = null
✅ setAuth: sets token and user
✅ clearAuth: clears token and user
✅ isAuthenticated: true when token exists
✅ isAuthenticated: false when token is null
✅ Persistence: survives store recreation
```

### API Client Tests
```
✅ Attaches Bearer token when authenticated
✅ No Authorization header when not authenticated
✅ 401 response clears auth and redirects
```

## Rules Applied
- Zustand cho client state (auth, UI), React Query cho server state
- Query key factory pattern cho consistent cache management
- API interceptors cho auth token injection
- Token persistence với zustand/persist
- Invalidate queries after mutations
- Error boundary pattern cho API errors
