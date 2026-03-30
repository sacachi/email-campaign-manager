# Rules: Testing Standards

## Nguyên tắc chung

1. **Mỗi test phải independent** — Không phụ thuộc vào thứ tự chạy
2. **Test behavior, không test implementation** — Kiểm tra output, không kiểm tra cách code chạy bên trong
3. **Meaningful test names** — Mô tả rõ scenario và expected outcome
4. **AAA Pattern** — Arrange, Act, Assert
5. **One assertion per concept** — Mỗi test tập trung vào một điều

## Naming Convention

```
describe('ComponentName / FunctionName / Endpoint', () => {
  describe('method / scenario', () => {
    it('should [expected behavior] when [condition]');
  });
});
```

**Ví dụ:**
```typescript
describe('Campaign Service', () => {
  describe('assertDraftStatus', () => {
    it('should pass when campaign status is draft');
    it('should throw AppError when campaign status is sent');
  });
});
```

## Backend Unit Test Rules

### Scope
- **Test:** Pure functions, business logic, validators, utils
- **Mock:** Database calls, external services
- **Don't test:** Express routes, middleware chains (→ integration test)

### Pattern
```typescript
describe('function/module', () => {
  // Setup shared fixtures
  const mockData = { ... };

  it('should [do something] when [condition]', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### What to Unit Test
| Module | What to Test |
|--------|-------------|
| JWT Utils | Token generation, verification, expiry, invalid tokens |
| Password Utils | Hash, compare, salt uniqueness |
| Business Rules | Status transitions, timestamp validation, stats calculation |
| Validators | Valid input passes, invalid input fails with correct message |
| Campaign Stats | Rate calculations, edge cases (0 recipients, all failed) |

## Backend Integration Test Rules

### Scope
- **Test:** Full HTTP request → response cycle
- **Use:** Supertest + real database (test DB)
- **Setup:** Fresh database per test suite, seed required data

### Pattern
```typescript
import request from 'supertest';
import app from '../../app';

describe('POST /campaigns', () => {
  let token: string;

  beforeAll(async () => {
    // Create user and get token
    const { token: t } = await createAuthenticatedUser();
    token = t;
  });

  afterEach(async () => {
    // Clean up test data
    await Campaign.destroy({ where: {}, truncate: true });
  });

  it('should create campaign — 201', async () => {
    const res = await request(app)
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', subject: 'Test', body: 'Body' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('draft');
  });
});
```

### What to Integration Test
| Flow | Test Cases |
|------|-----------|
| Auth | Register → Login → Access protected route |
| CRUD | Create → List → Detail → Update → Delete |
| Campaign Lifecycle | Create → Add Recipients → Schedule → Send → Stats |
| Error Handling | 400, 401, 403, 404, 409 responses |
| Business Rules | Edit sent campaign, delete scheduled, past date schedule |

## Frontend Unit Test Rules

### Scope
- **Test:** Component rendering, user interactions, store operations
- **Mock:** API calls (MSW), router navigation
- **Don't test:** Styling details, layout specifics

### Pattern
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('should render draft with grey styling', () => {
    render(<StatusBadge status="draft" />);
    const badge = screen.getByText('Draft');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100');
  });
});
```

## Frontend Integration Test Rules

### Scope
- **Test:** Full page flows, API interactions, state updates
- **Use:** MSW cho mock API, React Testing Library
- **Wrap:** Components trong necessary providers (Query, Router, Store)

### Test Wrapper
```typescript
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}
```

## Test Database Management

```typescript
// Tạo test database config
// backend/src/config/index.ts
const config = {
  db: {
    name: process.env.NODE_ENV === 'test' 
      ? process.env.DB_NAME_TEST || 'campaign_manager_test'
      : process.env.DB_NAME || 'campaign_manager',
    // ...
  },
};
```

## Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| Backend Services | 80% |
| Backend Validators | 90% |
| Backend Utils | 90% |
| Frontend Stores | 80% |
| Frontend Components | 70% |

## Rules Applied
- Không skip tests với `.skip` trong commit
- Không have `console.log` trong tests (use proper assertions)
- Test data phải là realistic (không dùng "aaa", "123")
- Clean up resources sau tests
- Environment variable `NODE_ENV=test` cho test runs
