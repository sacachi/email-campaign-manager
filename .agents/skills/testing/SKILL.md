# Skill: Testing Strategy (Unit + Integration)

## Mục tiêu
Comprehensive testing plan cho cả backend và frontend, bao gồm unit tests và integration tests.

---

## Backend Testing

### Test Framework
- **Jest** + **ts-jest** cho TypeScript
- **Supertest** cho HTTP integration tests
- **Test database** riêng biệt (campaign_manager_test)

### Test Config

```typescript
// backend/jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterSetup: ['<rootDir>/src/__tests__/helpers/setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/database/migrations/**',
    '!src/database/seeders/**',
  ],
};
```

### Test Setup Helper

```typescript
// backend/src/__tests__/helpers/setup.ts
import sequelize from '../../database/connection';

// Test database connection
beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // Reset DB cho tests
});

afterAll(async () => {
  await sequelize.close();
});
```

### Test Helper — Auth

```typescript
// backend/src/__tests__/helpers/auth.ts
import { generateToken } from '../../utils/jwt';
import User from '../../models/User';
import { hashPassword } from '../../utils/password';

export async function createTestUser(overrides = {}) {
  return User.create({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password_hash: await hashPassword('password123'),
    ...overrides,
  });
}

export function getAuthToken(userId: string, email: string): string {
  return generateToken({ userId, email });
}

export async function createAuthenticatedUser() {
  const user = await createTestUser();
  const token = getAuthToken(user.id, user.email);
  return { user, token };
}
```

---

## UNIT TESTS — Backend

### File: `backend/src/__tests__/unit/jwt.test.ts`

```typescript
describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should return a valid JWT string');
    it('should include userId and email in payload');
    it('should set expiration');
  });

  describe('verifyToken', () => {
    it('should decode valid token correctly');
    it('should throw on expired token');
    it('should throw on invalid token');
    it('should throw on tampered token');
  });
});
```

### File: `backend/src/__tests__/unit/password.test.ts`

```typescript
describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should return a hash different from original password');
    it('should generate different hashes for same password (salt)');
  });

  describe('comparePassword', () => {
    it('should return true for matching password');
    it('should return false for wrong password');
  });
});
```

### File: `backend/src/__tests__/unit/campaign-rules.test.ts`

```typescript
describe('Campaign Business Rules', () => {
  describe('assertDraftStatus', () => {
    it('should pass for draft status');
    it('should throw for scheduled status');
    it('should throw for sending status');
    it('should throw for sent status');
  });

  describe('assertCanSend', () => {
    it('should pass for draft campaign');
    it('should pass for scheduled campaign');
    it('should throw for sending campaign');
    it('should throw for sent campaign');
  });

  describe('assertFutureTimestamp', () => {
    it('should pass for future date');
    it('should throw for past date');
    it('should throw for current time');
  });
});
```

### File: `backend/src/__tests__/unit/stats.test.ts`

```typescript
describe('Campaign Stats Calculation', () => {
  it('should return zeros for empty recipients');
  it('should calculate correct send_rate');
  it('should calculate correct open_rate');
  it('should handle all sent recipients');
  it('should handle all failed recipients');
  it('should handle mixed sent/failed/pending');
  it('should handle division by zero (0 total)');
  it('should round rates to 2 decimal places');
});
```

### File: `backend/src/__tests__/unit/validators.test.ts`

```typescript
describe('Input Validators', () => {
  describe('registerSchema', () => {
    it('should pass with valid input');
    it('should fail with invalid email');
    it('should fail with short password');
    it('should fail with missing name');
  });

  describe('createCampaignSchema', () => {
    it('should pass with valid input');
    it('should fail without name');
    it('should fail without subject');
    it('should fail without body');
  });

  describe('scheduleCampaignSchema', () => {
    it('should pass with future datetime');
    it('should fail with past datetime');
    it('should fail with invalid format');
  });

  describe('updateCampaignSchema', () => {
    it('should pass with partial fields');
    it('should fail with empty body');
    it('should fail with invalid ID');
  });
});
```

---

## INTEGRATION TESTS — Backend

### File: `backend/src/__tests__/integration/auth.test.ts`

```typescript
describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register new user — 201', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'new@test.com', name: 'New User', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'new@test.com');
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('should reject duplicate email — 409');
    it('should reject invalid email — 400');
    it('should reject short password — 400');
    it('should reject missing fields — 400');
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials — 200 + token');
    it('should reject wrong password — 401');
    it('should reject non-existent email — 401');
    it('should reject missing fields — 400');
  });

  describe('Protected routes', () => {
    it('should return 401 without token');
    it('should return 401 with invalid token');
    it('should return 401 with expired token');
    it('should allow access with valid token');
  });
});
```

### File: `backend/src/__tests__/integration/campaign-crud.test.ts`

```typescript
describe('Campaign CRUD API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const { user, token: t } = await createAuthenticatedUser();
    token = t;
    userId = user.id;
  });

  describe('POST /campaigns', () => {
    it('should create campaign in draft status — 201');
    it('should auto-set status to draft');
    it('should reject invalid data — 400');
    it('should reject without auth — 401');
  });

  describe('GET /campaigns', () => {
    it('should list campaigns — 200 + pagination');
    it('should filter by status');
    it('should return only user campaigns');
    it('should paginate correctly');
  });

  describe('GET /campaigns/:id', () => {
    it('should return campaign detail with stats — 200');
    it('should return 404 for non-existent');
    it('should return 403 for other user campaign');
  });

  describe('PATCH /campaigns/:id', () => {
    it('should update draft campaign — 200');
    it('should reject update for non-draft — 400');
    it('should allow partial update');
    it('should return 404 for non-existent');
  });

  describe('DELETE /campaigns/:id', () => {
    it('should delete draft campaign — 204');
    it('should reject delete for non-draft — 400');
    it('should return 404 for non-existent');
  });
});
```

### File: `backend/src/__tests__/integration/campaign-actions.test.ts`

```typescript
describe('Campaign Actions API', () => {
  describe('POST /campaigns/:id/schedule', () => {
    it('should schedule draft campaign — 200');
    it('should set scheduled_at and status=scheduled');
    it('should reject past timestamp — 400');
    it('should reject non-draft campaign — 400');
  });

  describe('POST /campaigns/:id/send', () => {
    it('should send draft campaign — 200');
    it('should send scheduled campaign — 200');
    it('should mark recipients as sent/failed');
    it('should set campaign status to sent');
    it('should reject already sent campaign — 400');
    it('should return stats after send');
  });

  describe('Campaign Lifecycle', () => {
    it('should complete full lifecycle: create → add recipients → schedule → send → stats');
  });
});
```

### File: `backend/src/__tests__/integration/recipients.test.ts`

```typescript
describe('Recipients API', () => {
  describe('GET /recipients', () => {
    it('should list recipients with pagination — 200');
  });

  describe('POST /recipient', () => {
    it('should create recipient — 201');
    it('should reject duplicate email — 409');
    it('should reject invalid email — 400');
  });
});
```

---

## FRONTEND TESTS

### Test Framework
- **Vitest** + **React Testing Library** + **MSW** (Mock Service Worker)

### Vitest Config

```typescript
// frontend/vite.config.ts (test section)
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
  },
});
```

### MSW Setup

```typescript
// frontend/src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@test.com', name: 'Test' },
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.get('/campaigns', () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Campaign 1', status: 'draft', subject: 'Test' },
        { id: '2', name: 'Campaign 2', status: 'sent', subject: 'Test 2' },
      ],
      pagination: { page: 1, limit: 20, total: 2 },
    });
  }),

  // ... more handlers
];
```

### Frontend Unit Tests

```typescript
// frontend/src/__tests__/unit/StatusBadge.test.tsx
describe('StatusBadge', () => {
  it('renders draft badge with grey color');
  it('renders scheduled badge with blue color');
  it('renders sent badge with green color');
  it('renders sending badge with amber color');
});

// frontend/src/__tests__/unit/auth-store.test.ts
describe('Auth Store', () => {
  it('initial state has null token');
  it('setAuth stores token and user');
  it('clearAuth clears state');
  it('isAuthenticated returns correct value');
});
```

### Frontend Integration Tests

```typescript
// frontend/src/__tests__/integration/login.test.tsx
describe('Login Page', () => {
  it('renders login form');
  it('shows validation errors for empty fields');
  it('submits and redirects on success');
  it('shows error message on failed login');
});

// frontend/src/__tests__/integration/campaigns.test.tsx
describe('Campaigns Page', () => {
  it('renders campaign list after loading');
  it('shows loading skeleton while fetching');
  it('shows error state on API failure');
  it('status badges have correct colors');
});

// frontend/src/__tests__/integration/campaign-detail.test.tsx
describe('Campaign Detail Page', () => {
  it('renders campaign info and stats');
  it('shows correct action buttons for draft');
  it('hides edit/delete buttons for sent campaign');
  it('shows confirmation dialog before send');
});
```

---

## Test Execution Commands

```bash
# Backend
yarn workspace backend test              # All tests
yarn workspace backend test:unit         # Unit only
yarn workspace backend test:integration  # Integration only
yarn workspace backend test -- --coverage  # With coverage

# Frontend
yarn workspace frontend test             # All tests
yarn workspace frontend test -- --coverage  # With coverage

# All
yarn test                                # Both packages
```

## Coverage Targets
- **Backend:** >= 80% cho services, validators, utils
- **Frontend:** >= 70% cho components, stores, hooks

## Rules Applied
- Test database riêng biệt, không dùng production DB
- Reset DB trước mỗi test suite (force sync)
- Test helpers cho auth (avoid duplication)
- MSW cho frontend API mocking (không mock axios trực tiếp)
- Meaningful test names (mô tả behavior, không implementation)
- Each test independent (không depend on execution order)
- Clean up after tests (close connections, clear stores)
