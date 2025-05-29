import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { config } from './env';

let redisClient: ReturnType<typeof createClient>;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Redis reconnection failed after 5 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 50, 500);
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    logger.info('✅ Redis connection established successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis client disconnected');
  }
};

// Redis utility functions
export const redisUtils = {
  // Session management
  async setSession(sessionId: string, data: any, ttlSeconds: number = 604800): Promise<void> {
    const client = getRedisClient();
    await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
  },

  async getSession(sessionId: string): Promise<any | null> {
    const client = getRedisClient();
    const data = await client.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const client = getRedisClient();
    await client.del(`session:${sessionId}`);
  },

  // Rate limiting
  async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    const client = getRedisClient();
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, Math.ceil(windowMs / 1000));
    }
    return current;
  },

  // Blacklist management
  async blacklistToken(tokenId: string, expiresAt: Date): Promise<void> {
    const client = getRedisClient();
    const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    if (ttl > 0) {
      await client.setEx(`blacklist:${tokenId}`, ttl, '1');
    }
  },

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.get(`blacklist:${tokenId}`);
    return result === '1';
  },

  // Cache management
  async setCache(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const client = getRedisClient();
    await client.setEx(`cache:${key}`, ttlSeconds, JSON.stringify(data));
  },

  async getCache(key: string): Promise<any | null> {
    const client = getRedisClient();
    const data = await client.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
  },

  async deleteCache(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(`cache:${key}`);
  },

  // Lock mechanism for distributed operations
  async acquireLock(resource: string, ttlMs: number = 10000): Promise<string | null> {
    const client = getRedisClient();
    const lockKey = `lock:${resource}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    const result = await client.set(lockKey, lockValue, {
      PX: ttlMs,
      NX: true,
    });
    
    return result === 'OK' ? lockValue : null;
  },

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const client = getRedisClient();
    const lockKey = `lock:${resource}`;
    
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await client.eval(script, {
      keys: [lockKey],
      arguments: [lockValue],
    });
    
    return result === 1;
  },
};
