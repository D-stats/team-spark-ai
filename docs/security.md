# Security Documentation

## Overview

TeamSpark AI implements comprehensive security measures to protect user data and prevent common web vulnerabilities.

## Security Features

### 1. Security Headers

All responses include security headers based on OWASP recommendations:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Strict-Transport-Security**: Forces HTTPS (production only)
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **X-XSS-Protection**: Additional XSS protection

### 2. Rate Limiting

Protection against brute force and DoS attacks:

- **API Routes**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **File Uploads**: 10 uploads per hour per IP
- **Authenticated Users**: 1000 requests per 15 minutes

### 3. CORS Configuration

Cross-Origin Resource Sharing controls:

```typescript
// Allowed origins configured via environment variable
ALLOWED_ORIGINS=https://app.teamspark.ai,https://www.teamspark.ai
```

### 4. Input Validation

All user inputs are validated and sanitized:

- Email validation with max length
- Password strength requirements
- HTML tag stripping
- File type and size validation
- SQL injection prevention via Prisma

### 5. Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Session management with secure cookies
- Password hashing with bcrypt

## Security Configuration

Configuration is centralized in `src/config/security.ts`:

```typescript
import { securityConfig } from '@/config/security';

// Use security configuration
const { rateLimit, validation, headers } = securityConfig;
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## File Upload Security

- Maximum file size: 10MB
- Allowed types: JPEG, PNG, GIF, WebP
- File type validation
- Virus scanning (future implementation)

## API Security

### Using Rate Limiting

```typescript
import { withRateLimit } from '@/lib/api-helpers';

export const GET = withRateLimit(async (request) => {
  // Your API logic
});
```

### Combining Security Middleware

```typescript
import { withMiddleware, withAuth, withRateLimit, withErrorHandler } from '@/lib/api-helpers';

export const GET = withMiddleware(handler, withErrorHandler, withAuth, withRateLimit);
```

## Environment Variables

Security-related environment variables:

```env
# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Best Practices

### 1. Development

- Never commit sensitive data
- Use environment variables for secrets
- Enable security headers in development
- Test rate limiting locally

### 2. Code Review

- Check for SQL injection vulnerabilities
- Verify input validation
- Ensure proper authentication checks
- Review error messages for information leakage

### 3. Deployment

- Use HTTPS in production
- Enable all security headers
- Configure proper CORS origins
- Set up monitoring and alerting
- Regular security updates

### 4. Monitoring

- Track rate limit violations
- Monitor authentication failures
- Log security events
- Set up alerts for suspicious activity

## Testing Security

### Rate Limiting Test

```bash
# Test rate limiting
for i in {1..110}; do
  curl -X GET http://localhost:3000/api/users
  echo "Request $i"
done
```

### Security Headers Test

```bash
# Check security headers
curl -I http://localhost:3000
```

### CORS Test

```bash
# Test CORS
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3000/api/users
```

## Incident Response

1. **Detection**: Monitor logs and alerts
2. **Containment**: Apply rate limiting or block IPs
3. **Investigation**: Analyze attack patterns
4. **Recovery**: Restore normal operations
5. **Post-mortem**: Document and improve defenses

## Security Checklist

- [ ] All API routes have rate limiting
- [ ] Authentication is required for sensitive endpoints
- [ ] Input validation is implemented
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Passwords meet complexity requirements
- [ ] File uploads are validated
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Security monitoring is enabled

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email security@teamspark.ai
3. Include details and reproduction steps
4. Allow time for patching before disclosure

## Compliance

TeamSpark AI follows security standards:

- OWASP Top 10 mitigation
- GDPR compliance for data protection
- SOC 2 Type II (in progress)
- Regular penetration testing
