# Rules: Environment Configuration

## Environment Variables

### Required Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campaign_manager
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME_TEST=campaign_manager_test

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# Server
PORT=3000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000
```

### .env.example
Luôn maintain `.env.example` với tất cả required variables (không có values sensitive).

### Rules
1. **KHÔNG commit `.env`** — Chỉ commit `.env.example`
2. **JWT_SECRET** tối thiểu 32 characters
3. **Database passwords** không dùng default trong production
4. **Frontend env vars** phải prefix `VITE_` (Vite requirement)
5. **Validate env vars** khi app start — fail fast nếu thiếu

### Config Loading Pattern
```typescript
// backend/src/config/index.ts
import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: requireEnv('JWT_SECRET'),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.NODE_ENV === 'test'
      ? process.env.DB_NAME_TEST || 'campaign_manager_test'
      : process.env.DB_NAME || 'campaign_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
};

export default config;
```

## .gitignore Rules
```
node_modules/
dist/
.env
.env.local
coverage/
*.log
.DS_Store
```
