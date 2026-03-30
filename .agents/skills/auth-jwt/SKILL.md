# Skill: JWT Authentication

## Mục tiêu
Implement secure JWT authentication middleware cho Express backend.

## JWT Utils

```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import config from '../config';

interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
```

## Auth Middleware

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

## Password Hashing

```typescript
// backend/src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## Auth Controller

```typescript
// backend/src/controllers/auth.controller.ts
// POST /auth/register
// - Validate input (email, name, password)
// - Check email uniqueness
// - Hash password
// - Create user
// - Return user data (NO password)

// POST /auth/login
// - Validate input (email, password)
// - Find user by email
// - Compare password
// - Generate JWT
// - Return token + user data
```

## Security Checklist
- [ ] JWT secret từ environment variable, không hardcode
- [ ] Password hash với bcrypt, salt rounds >= 10
- [ ] Token expiration set (24h recommended)
- [ ] Bearer token từ Authorization header
- [ ] Không return password_hash trong response
- [ ] Rate limiting cho auth endpoints (optional nhưng recommended)
- [ ] Input validation trước khi query database

## Unit Test Cases

### JWT Utils Tests
```
✅ generateToken() trả về valid JWT string
✅ verifyToken() với valid token trả về correct payload
✅ verifyToken() với expired token throws error
✅ verifyToken() với invalid token throws error
✅ verifyToken() với tampered token throws error
```

### Password Utils Tests
```
✅ hashPassword() trả về string khác password gốc
✅ comparePassword() trả về true cho matching password
✅ comparePassword() trả về false cho wrong password
```

### Auth Middleware Tests
```
✅ Request không có Authorization header → 401
✅ Request với invalid Bearer format → 401
✅ Request với expired token → 401
✅ Request với valid token → next() called, req.user set
```

## Integration Test Cases

### Register Flow
```
✅ POST /auth/register với valid data → 201 + user data
✅ POST /auth/register duplicate email → 409 Conflict
✅ POST /auth/register invalid email format → 400
✅ POST /auth/register missing required fields → 400
✅ POST /auth/register password too short → 400
```

### Login Flow
```
✅ POST /auth/login valid credentials → 200 + JWT token
✅ POST /auth/login wrong password → 401
✅ POST /auth/login non-existent email → 401
✅ POST /auth/login missing fields → 400
```

### Protected Route Access
```
✅ GET /campaigns without token → 401
✅ GET /campaigns with invalid token → 401
✅ GET /campaigns with valid token → 200
```

## Rules Applied
- JWT_SECRET tối thiểu 32 characters
- Không log JWT tokens
- Token chỉ chứa minimal payload (userId, email)
- Password validation: tối thiểu 8 characters
- Email validation: proper format check
- Consistent error responses: { error: string }
