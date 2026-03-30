# Rules: Security Standards

## Authentication & Authorization

1. **JWT tokens:** Chỉ chứa minimal payload (userId, email), không chứa sensitive data
2. **Password hashing:** bcrypt với salt rounds >= 10 (khuyến nghị 12)
3. **Token expiry:** 24h maximum, require re-authentication
4. **Authorization:** Verify campaign ownership trước khi cho phép CRUD operations

## Input Validation

1. **Validate tại boundary:** Mọi API input phải đi qua Zod validation middleware
2. **Sanitize output:** Không return `password_hash` trong bất kỳ response nào
3. **UUID validation:** Tất cả entity IDs phải là valid UUID format
4. **SQL Injection:** Sequelize handles parameterization — KHÔNG sử dụng raw SQL với user input trực tiếp
5. **XSS Prevention:** Campaign body chỉ stored as text, frontend render với sanitization

## HTTP Security Headers

```typescript
// Sử dụng Helmet middleware
import helmet from 'helmet';
app.use(helmet());
```

## CORS

```typescript
// Chỉ allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Rate Limiting (Recommended)

```typescript
// Optional nhưng recommended cho auth endpoints
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per window
});

app.use('/auth', authLimiter);
```

## Error Information Disclosure

1. **Production:** Generic error messages, log details server-side
2. **Development:** Full error details cho debugging
3. **Never expose:** Stack traces, database queries, internal paths
4. **Auth errors:** Generic "Invalid credentials" — không reveal email existence

## Database Security

1. **Parameterized queries:** Always (Sequelize ORM handles this)
2. **Least privilege:** Database user chỉ có permissions cần thiết
3. **Connection pooling:** Max connections limited
4. **SSL trong production:** Encrypt database connections
