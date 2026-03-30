# Skill: Project Setup (Monorepo + Yarn Workspaces)

## Mục tiêu
Khởi tạo monorepo với Yarn Workspaces chứa 2 packages: `backend` và `frontend`.

## Cấu trúc thư mục

```
campain-manager/
├── package.json              # Root workspace config
├── yarn.lock
├── docker-compose.yml
├── .gitignore
├── .env.example
├── README.md
├── PLAN.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── src/
│       ├── index.ts          # App entry point
│       ├── app.ts            # Express app setup
│       ├── config/
│       │   └── index.ts      # Env config
│       ├── database/
│       │   ├── connection.ts
│       │   ├── migrations/
│       │   └── seeders/
│       ├── models/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       ├── validators/
│       ├── utils/
│       └── __tests__/
│           ├── unit/
│           ├── integration/
│           └── helpers/
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── Dockerfile
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── router.tsx
        ├── lib/
        │   ├── api.ts
        │   └── query-client.ts
        ├── store/
        ├── pages/
        ├── components/
        ├── hooks/
        ├── types/
        └── __tests__/
```

## Steps

### 1. Root package.json
```json
{
  "name": "campain-manager",
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "dev": "concurrently \"yarn workspace backend dev\" \"yarn workspace frontend dev\"",
    "build": "yarn workspace backend build && yarn workspace frontend build",
    "test": "yarn workspace backend test && yarn workspace frontend test",
    "lint": "yarn workspace backend lint && yarn workspace frontend lint"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### 2. Backend package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration --runInBand",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "seed": "sequelize-cli db:seed:all"
  },
  "dependencies": {
    "express": "^4.18.0",
    "sequelize": "^6.35.0",
    "pg": "^8.12.0",
    "pg-hstore": "^2.3.4",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0",
    "sequelize-cli": "^6.6.0"
  }
}
```

### 3. Frontend package.json
```json
{
  "name": "frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.0",
    "msw": "^2.1.0",
    "jsdom": "^24.0.0"
  }
}
```

## Verification Checklist
- [ ] `yarn install` chạy thành công từ root
- [ ] `yarn workspace backend dev` khởi động backend
- [ ] `yarn workspace frontend dev` khởi động frontend
- [ ] TypeScript compilation thành công cho cả 2 packages

## Rules Applied
- Sử dụng TypeScript strict mode
- Không sử dụng `any` type
- Import paths sử dụng relative paths trong mỗi package
- Shared types có thể đặt ở root nếu cần
