# Rules: API Conventions

## REST Conventions

### HTTP Methods
| Method | Usage | Success Code |
|--------|-------|-------------|
| GET | Read resource(s) | 200 |
| POST | Create resource | 201 |
| PATCH | Partial update | 200 |
| DELETE | Remove resource | 204 |

### URL Patterns
```
GET    /campaigns          → List campaigns
POST   /campaigns          → Create campaign
GET    /campaigns/:id      → Get campaign detail
PATCH  /campaigns/:id      → Update campaign
DELETE /campaigns/:id      → Delete campaign
POST   /campaigns/:id/send → Action on campaign
```

## Response Shapes

### Success — Single Resource
```json
{
  "data": {
    "id": "uuid",
    "name": "Campaign Name",
    "status": "draft"
  }
}
```

### Success — List
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "error": "Human readable error message",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Resource created |
| 204 | Deleted (no content) |
| 400 | Validation error / Bad request |
| 401 | Authentication required |
| 403 | Forbidden (wrong owner) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |

## Pagination

```
GET /campaigns?page=1&limit=20&status=draft

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## Authentication

- JWT Bearer token in `Authorization` header
- Format: `Authorization: Bearer <token>`
- Token payload: `{ userId, email, iat, exp }`
- Token expiry: 24 hours

## Error Handling Rules

1. **Validation errors (400):** Return field-level details
2. **Auth errors (401):** Generic message, no detail leaking
3. **Not found (404):** "Campaign not found" — don't reveal existence
4. **Business rule violations (400):** Specific message about what rule was violated
5. **Server errors (500):** Log full error server-side, generic message to client

## CORS Configuration
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```
