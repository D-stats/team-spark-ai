# Caching Documentation

## Overview

TeamSpark AI uses Redis for caching to improve performance and reduce database load. The caching layer is implemented with:

- **ioredis** - Redis client for Node.js
- Custom cache utilities and decorators
- Service-level caching patterns

## Redis Setup

### Local Development

Redis runs in Docker:

```bash
# Start Redis
docker-compose up -d redis

# Check Redis is running
docker-compose ps redis

# Connect to Redis CLI
docker exec -it team-spark-redis redis-cli
```

### Production

Configure Redis connection via environment variable:

```env
REDIS_URL=redis://:password@redis-host:6379
```

## Cache Architecture

### Cache Layers

1. **API Response Cache** - Cache entire API responses
2. **Service Cache** - Cache service method results
3. **Query Cache** - Cache database query results
4. **Session Cache** - Store user sessions

### Cache Keys

Standard key format: `prefix:namespace:identifier`

Examples:

- `cache:users:123` - User with ID 123
- `cache:teams:org:456:1:20` - Teams for org 456, page 1, limit 20
- `session:abc123` - Session with ID abc123
- `ratelimit:ip:192.168.1.1` - Rate limit for IP

## Using the Cache

### Basic Cache Operations

```typescript
import { Cache } from '@/lib/redis';

// Create a cache instance
const myCache = new Cache('myprefix', 3600); // 1 hour TTL

// Set value
await myCache.set('key', { data: 'value' });

// Get value
const value = await myCache.get('key');

// Check existence
const exists = await myCache.exists('key');

// Delete value
await myCache.delete('key');

// Delete by pattern
await myCache.deletePattern('user:*');

// Get TTL
const ttl = await myCache.ttl('key');
```

### Pre-configured Caches

```typescript
import { userCache, teamCache, kudosCache, sessionCache } from '@/lib/redis';

// User cache (5 minutes TTL)
await userCache.set('user:123', userData);
const user = await userCache.get('user:123');

// Team cache (10 minutes TTL)
await teamCache.set('team:456', teamData);
const team = await teamCache.get('team:456');

// Kudos cache (1 minute TTL)
await kudosCache.set('recent', recentKudos);
const kudos = await kudosCache.get('recent');

// Session cache (1 hour TTL)
await sessionCache.set('session:abc', sessionData);
const session = await sessionCache.get('session:abc');
```

### Cache Decorator

Use the `@cacheable` decorator for automatic caching:

```typescript
import { cacheable } from '@/lib/redis';

class UserService {
  @cacheable((args) => `user:${args[0]}`, 300)
  async getUser(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  @cacheable((args) => `user:email:${args[0]}`, 600)
  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }
}
```

## Caching Patterns

### Cache-Aside Pattern

```typescript
async function getTeam(teamId: string) {
  // Try cache first
  const cached = await teamCache.get(teamId);
  if (cached) return cached;

  // Load from database
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  // Store in cache
  if (team) {
    await teamCache.set(teamId, team);
  }

  return team;
}
```

### Cache Invalidation

```typescript
async function updateTeam(teamId: string, data: any) {
  // Update database
  const team = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  // Invalidate cache
  await teamCache.delete(teamId);
  await teamCache.deletePattern(`org:${team.organizationId}:*`);

  return team;
}
```

### Cache Warming

```typescript
import { warmCache } from '@/services/cache-service';

// Warm cache on application start
await warmCache();

// Schedule periodic cache warming
setInterval(warmCache, 60 * 60 * 1000); // Every hour
```

## API Route Caching

### Example: Cached API Route

```typescript
import { teamCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  // Create cache key
  const cacheKey = `teams:${page}`;

  // Try cache
  const cached = await teamCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch data
  const teams = await fetchTeams(page);

  // Cache response
  await teamCache.set(cacheKey, teams, 300); // 5 minutes

  return NextResponse.json(teams);
}
```

## Session Management

```typescript
import { SessionManager } from '@/lib/redis';

const sessions = new SessionManager(3600); // 1 hour TTL

// Create session
await sessions.set(sessionId, {
  userId: '123',
  email: 'user@example.com',
  loginTime: Date.now(),
});

// Get session
const session = await sessions.get(sessionId);

// Extend session
await sessions.extend(sessionId);

// Destroy session
await sessions.destroy(sessionId);
```

## Rate Limiting with Redis

```typescript
import { RedisRateLimiter } from '@/lib/redis';

const limiter = new RedisRateLimiter(
  60 * 1000, // 1 minute window
  100, // 100 requests max
);

// Check rate limit
const { allowed, count, resetTime } = await limiter.checkLimit(userId);

if (!allowed) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    },
  });
}
```

## Cache Services

### UserCacheService

```typescript
import { userCacheService } from '@/services/cache-service';

// Get user (with automatic caching)
const user = await userCacheService.getUser(userId);

// Get user by email (with decorator caching)
const user = await userCacheService.getUserByEmail(email);

// Invalidate user cache
await userCacheService.invalidateUser(userId);
```

### TeamCacheService

```typescript
import { teamCacheService } from '@/services/cache-service';

// Get team
const team = await teamCacheService.getTeam(teamId);

// Get teams by organization
const { teams, total } = await teamCacheService.getTeamsByOrganization(organizationId, page, limit);

// Invalidate caches
await teamCacheService.invalidateTeam(teamId);
await teamCacheService.invalidateOrganizationTeams(organizationId);
```

### KudosCacheService

```typescript
import { kudosCacheService } from '@/services/cache-service';

// Get recent kudos
const recentKudos = await kudosCacheService.getRecentKudos(10);

// Get user kudos count
const { given, received } = await kudosCacheService.getUserKudosCount(userId);

// Invalidate kudos cache
await kudosCacheService.invalidateUserKudos(userId);
```

## Best Practices

### 1. Cache Key Design

- Use consistent naming conventions
- Include version numbers for breaking changes
- Make keys human-readable for debugging

### 2. TTL Strategy

- Short TTL for frequently changing data (1-5 minutes)
- Medium TTL for user data (5-15 minutes)
- Long TTL for configuration (1-24 hours)
- Consider business requirements

### 3. Cache Invalidation

- Invalidate on write operations
- Use patterns for bulk invalidation
- Consider eventual consistency

### 4. Error Handling

- Always handle cache failures gracefully
- Fall back to database on cache errors
- Log cache errors for monitoring

### 5. Memory Management

- Monitor Redis memory usage
- Set appropriate max memory policy
- Use expiration for all keys

## Monitoring

### Redis Metrics

Monitor these key metrics:

- Memory usage
- Hit/miss ratio
- Eviction rate
- Connection count
- Command latency

### Example Monitoring Commands

```bash
# Redis info
redis-cli INFO

# Memory usage
redis-cli INFO memory

# Monitor commands in real-time
redis-cli MONITOR

# Get cache hit ratio
redis-cli INFO stats | grep keyspace_hits
```

### Application Metrics

Log and monitor:

- Cache hit/miss rates per service
- Cache operation latency
- Invalidation frequency
- Error rates

## Troubleshooting

### Common Issues

1. **Connection Errors**

   - Check Redis is running
   - Verify connection string
   - Check network/firewall

2. **High Memory Usage**

   - Review TTL settings
   - Check for memory leaks
   - Enable eviction policy

3. **Low Hit Rate**

   - Analyze access patterns
   - Adjust TTL values
   - Review cache key design

4. **Stale Data**
   - Verify invalidation logic
   - Check TTL settings
   - Consider cache warming

### Debug Commands

```bash
# Check specific key
redis-cli GET "cache:users:123"

# Check key TTL
redis-cli TTL "cache:users:123"

# List keys by pattern
redis-cli KEYS "cache:teams:*"

# Flush cache (development only!)
redis-cli FLUSHDB
```

## Performance Tips

1. **Batch Operations**

   ```typescript
   // Good - batch get
   const keys = ['user:1', 'user:2', 'user:3'];
   const users = await Promise.all(keys.map((key) => userCache.get(key)));
   ```

2. **Pipeline Commands**

   ```typescript
   const pipeline = redis.pipeline();
   pipeline.get('key1');
   pipeline.get('key2');
   pipeline.get('key3');
   const results = await pipeline.exec();
   ```

3. **Use Appropriate Data Structures**
   - Strings for simple values
   - Hashes for objects
   - Sets for unique collections
   - Sorted sets for rankings
