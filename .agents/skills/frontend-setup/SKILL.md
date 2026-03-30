# Skill: Frontend Setup (Vite + React + TypeScript + Tailwind)

## Mục tiêu
Khởi tạo frontend với Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui.

## Vite Config

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

## TypeScript Config

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Tailwind Config

```typescript
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Campaign status colors
        'status-draft': '#6B7280',      // grey
        'status-scheduled': '#3B82F6',  // blue
        'status-sending': '#F59E0B',    // amber
        'status-sent': '#10B981',       // green
      },
    },
  },
  plugins: [],
};

export default config;
```

## App Entry Point

```typescript
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { queryClient } from './lib/query-client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

## Router Setup

```typescript
// frontend/src/router.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import Login from './pages/Login';
import Campaigns from './pages/Campaigns';
import CampaignNew from './pages/CampaignNew';
import CampaignDetail from './pages/CampaignDetail';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthGuard />}>
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<CampaignNew />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/campaigns" replace />} />
    </Routes>
  );
}
```

## Verification Checklist
- [ ] `yarn dev` starts Vite dev server
- [ ] React app renders tại localhost:5173
- [ ] Tailwind CSS classes hoạt động
- [ ] TypeScript strict mode, no errors
- [ ] Path alias `@/` hoạt động
- [ ] API proxy hoạt động (dev mode)

## Rules Applied
- Path alias `@/` cho clean imports
- Proxy API calls trong dev (avoid CORS issues)
- Strict TypeScript config
- Custom colors cho campaign statuses
