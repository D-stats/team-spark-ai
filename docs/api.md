# API Documentation

## Overview

TeamSpark AI provides a RESTful API for integrating with external systems. The API follows OpenAPI 3.0 specification.

## API Documentation URL

When running the development server, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

## Authentication

Most API endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:3000 (development)
https://your-domain.com (production)
```

## Available Endpoints

### Health Check

```
GET /api/health
```

Returns the health status of the application including database connectivity.

### Authentication

```
POST /api/auth/login
```

Authenticate with email and password to receive a JWT token.

### Users

```
GET /api/users
```

List users in the organization with pagination support.

### Kudos

```
GET /api/kudos
POST /api/kudos
```

Manage kudos - list kudos with filters or create new kudos.

## Error Handling

All error responses follow a standard format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Default: 100 requests per 15 minutes per IP
- Authenticated: 1000 requests per 15 minutes per user

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## OpenAPI Specification

The full OpenAPI specification is available at:

```
GET /api/openapi.json
```

You can use this specification to:

- Generate client SDKs
- Import into Postman/Insomnia
- Validate API requests/responses
- Generate API documentation

## SDK Generation

To generate client SDKs from the OpenAPI spec:

```bash
# JavaScript/TypeScript
npx openapi-generator-cli generate -i http://localhost:3000/api/openapi.json -g typescript-fetch -o ./sdk/typescript

# Python
openapi-generator generate -i http://localhost:3000/api/openapi.json -g python -o ./sdk/python

# Go
openapi-generator generate -i http://localhost:3000/api/openapi.json -g go -o ./sdk/go
```

## Testing API Endpoints

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# List users (authenticated)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <your-token>"
```

### Using HTTPie

```bash
# Health check
http GET localhost:3000/api/health

# Login
http POST localhost:3000/api/auth/login email=user@example.com password=password

# List users (authenticated)
http GET localhost:3000/api/users "Authorization: Bearer <your-token>"
```

## Development Tools

- **Swagger UI**: Available at `/api-docs` for interactive API exploration
- **Postman Collection**: Import the OpenAPI spec from `/api/openapi.json`
- **VS Code REST Client**: Create `.http` files with API requests

## Security Considerations

1. Always use HTTPS in production
2. Implement proper CORS policies
3. Use strong JWT secrets
4. Validate all input data
5. Implement rate limiting
6. Log API access for auditing

## Versioning

The API uses URL versioning. The current version is v1. Future versions will be available at:

```
/api/v2/*
```

## Support

For API support, please contact:

- Email: support@teamspark.ai
- Documentation: https://docs.teamspark.ai
- Issues: https://github.com/D-stats/team-spark-ai/issues
