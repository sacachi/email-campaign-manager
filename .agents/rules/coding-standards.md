# Rules: Coding Standards

## General

- **Language:** TypeScript strict mode cho cả backend và frontend
- **No `any` type:** Sử dụng proper types, `unknown` nếu cần
- **Naming conventions:**
  - Files: `kebab-case.ts` (e.g., `campaign.controller.ts`)
  - Classes/Interfaces/Types: `PascalCase`
  - Functions/Variables: `camelCase`
  - Database columns: `snake_case`
  - Environment variables: `UPPER_SNAKE_CASE`
  - Constants: `UPPER_SNAKE_CASE`

## File Organization

### Backend
```
controllers/  → HTTP request/response handling, input parsing
services/     → Business logic, database operations
models/       → Sequelize models, type definitions
validators/   → Zod schemas
middleware/    → Express middleware (auth, validation, error handling)
routes/       → Route definitions
utils/        → Pure utility functions
config/       → Environment config
```

### Frontend
```
pages/        → Route-level components
components/   → Reusable UI components
hooks/        → Custom React hooks (React Query, business logic)
store/        → Zustand stores
lib/          → API client, utilities
types/        → TypeScript type definitions
```

## Code Style

### Imports Order
1. External packages
2. Internal modules (alias `@/`)
3. Relative imports
4. Type imports (separated)

### Error Handling
- Backend: Throw `AppError` với statusCode, catch trong error middleware
- Frontend: React Query error handling, ErrorBoundary

### Function Length
- Maximum 30 lines per function (prefer shorter)
- Extract complex logic into helper functions

### Comments
- Comment WHY, not WHAT
- JSDoc cho public API functions
- No commented-out code in commits

## Git Conventions
- Branch naming: `feature/task-name`, `fix/bug-name`
- Commit messages: Conventional Commits
  - `feat: add campaign creation endpoint`
  - `fix: validate scheduled_at is future date`
  - `test: add campaign business rules unit tests`
  - `docs: add API documentation`
