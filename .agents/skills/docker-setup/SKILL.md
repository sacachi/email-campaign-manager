# Skill: Docker Setup

## Mục tiêu
Setup Docker Compose cho development và production với PostgreSQL, backend, frontend.

## docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: campaign_manager
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: campaign_manager
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET:-super-secret-dev-key}
      PORT: 3000
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    command: >
      sh -c "npx sequelize-cli db:migrate &&
             npx sequelize-cli db:seed:all --debug &&
             npm run dev"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src

volumes:
  pgdata:
```

## Backend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]
```

## Frontend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install

COPY . .

EXPOSE 5173

CMD ["yarn", "dev", "--host", "0.0.0.0"]
```

## Verification Checklist
- [ ] `docker compose up` khởi động cả 3 services
- [ ] PostgreSQL healthy check pass
- [ ] Backend kết nối được DB
- [ ] Frontend accessible tại localhost:5173
- [ ] Hot reload hoạt động cho cả backend và frontend
- [ ] Migrations tự động chạy khi backend start

## Health Check Endpoint
Backend cần expose `GET /health` trả về:
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00Z" }
```

## Rules Applied
- Không hardcode secrets trong docker-compose
- Sử dụng Alpine images cho size nhỏ
- Volume mount source code cho development hot reload
- Health checks cho database dependency
