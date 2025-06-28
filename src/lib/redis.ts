import Redis from 'ioredis';
import { log } from './logger';

let redis: Redis | null = null;

type RedisType = Redis;

export function getRedisClient(): RedisType {
  if (!redis) {
    const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err): boolean => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redis.on('connect', () => {
      log.info('Redis connected');
    });

    redis.on('error', (error) => {
      log.error('Redis error', { error: error.message });
    });

    redis.on('close', () => {
      log.warn('Redis connection closed');
    });

    redis.on('reconnecting', () => {
      log.info('Redis reconnecting...');
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// Cache utilities
export class Cache {
  private redis: Redis;
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 3600) {
    this.redis = getRedisClient();
    this.prefix = `cache:${prefix}:`;
    this.defaultTTL = defaultTTL;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.getKey(key));
      if (value === null) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      log.error('Cache get error', {
        key,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl ?? this.defaultTTL;

      await this.redis.setex(this.getKey(key), ttlSeconds, serialized);
    } catch (error) {
      log.error('Cache set error', {
        key,
        error: (error as Error).message,
      });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      log.error('Cache delete error', {
        key,
        error: (error as Error).message,
      });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      log.error('Cache delete pattern error', {
        pattern,
        error: (error as Error).message,
      });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(this.getKey(key));
      return exists === 1;
    } catch (error) {
      log.error('Cache exists error', {
        key,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.getKey(key));
    } catch (error) {
      log.error('Cache ttl error', {
        key,
        error: (error as Error).message,
      });
      return -1;
    }
  }
}

// Pre-configured caches
export const userCache = new Cache('users', 300); // 5 minutes
export const teamCache = new Cache('teams', 600); // 10 minutes
export const kudosCache = new Cache('kudos', 60); // 1 minute
export const sessionCache = new Cache('sessions', 3600); // 1 hour

// Cache decorator for functions
type CacheableFunction = (...args: unknown[]) => Promise<unknown>;

export function cacheable<T extends CacheableFunction>(
  cacheKey: (args: Parameters<T>) => string,
  ttl: number = 300,
): (
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void {
  return function (_target: unknown, propertyName: string, descriptor: TypedPropertyDescriptor<T>) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      throw new Error(`Method ${propertyName} not found`);
    }
    const cache = new Cache(propertyName, ttl);

    // Type assertion to satisfy TypeScript
    const typedMethod = originalMethod as T;

    descriptor.value = async function (this: unknown, ...args: Parameters<T>) {
      const key = cacheKey(args);

      // Try to get from cache
      const cached = await cache.get<ReturnType<T>>(key);
      if (cached !== null) {
        log.debug('Cache hit', { method: propertyName, key });
        return cached;
      }

      // Execute original method
      const result = await typedMethod.apply(this, args);

      // Store in cache
      await cache.set(key, result, ttl);
      log.debug('Cache miss - stored', { method: propertyName, key });

      return result;
    } as T;

    return descriptor;
  };
}

// Session management
export class SessionManager {
  private redis: Redis;
  private prefix = 'session:';
  private ttl: number;

  constructor(ttl: number = 3600) {
    this.redis = getRedisClient();
    this.ttl = ttl;
  }

  async get<T = unknown>(sessionId: string): Promise<T | null> {
    try {
      const data = await this.redis.get(`${this.prefix}${sessionId}`);
      return data !== null ? (JSON.parse(data) as T) : null;
    } catch (error) {
      log.error('Session get error', {
        sessionId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async set<T>(sessionId: string, data: T): Promise<void> {
    try {
      await this.redis.setex(`${this.prefix}${sessionId}`, this.ttl, JSON.stringify(data));
    } catch (error) {
      log.error('Session set error', {
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  async destroy(sessionId: string): Promise<void> {
    try {
      await this.redis.del(`${this.prefix}${sessionId}`);
    } catch (error) {
      log.error('Session destroy error', {
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  async extend(sessionId: string): Promise<void> {
    try {
      await this.redis.expire(`${this.prefix}${sessionId}`, this.ttl);
    } catch (error) {
      log.error('Session extend error', {
        sessionId,
        error: (error as Error).message,
      });
    }
  }
}

// Rate limiting with Redis
export class RedisRateLimiter {
  private redis: Redis;
  private windowMs: number;
  private max: number;

  constructor(windowMs: number = 60000, max: number = 100) {
    this.redis = getRedisClient();
    this.windowMs = windowMs;
    this.max = max;
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
  }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await this.redis.zcard(key);

      if (count >= this.max) {
        return {
          allowed: false,
          count: this.max,
          resetTime: now + this.windowMs,
        };
      }

      // Add current request
      await this.redis.zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.expire(key, Math.ceil(this.windowMs / 1000));

      return {
        allowed: true,
        count: count + 1,
        resetTime: now + this.windowMs,
      };
    } catch (error) {
      log.error('Rate limit check error', {
        identifier,
        error: (error as Error).message,
      });
      // Allow on error to prevent blocking users
      return {
        allowed: true,
        count: 0,
        resetTime: now + this.windowMs,
      };
    }
  }
}
