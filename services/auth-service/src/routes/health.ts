import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  dependencies: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
  metrics?: {
    memory: NodeJS.MemoryUsage;
    cpu: number;
  };
}

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      database: 'healthy',
      redis: 'healthy',
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health.dependencies.database = 'unhealthy';
    health.status = 'degraded';
    logger.error('Database health check failed:', error);
  }

  try {
    // Check Redis connection
    const redis = getRedisClient();
    await redis.ping();
  } catch (error) {
    health.dependencies.redis = 'unhealthy';
    health.status = health.status === 'degraded' ? 'unhealthy' : 'degraded';
    logger.error('Redis health check failed:', error);
  }

  const responseTime = Date.now() - startTime;
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    ...health,
    responseTime: `${responseTime}ms`,
  });
}));

// Detailed health check with metrics
router.get('/detailed', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      database: 'healthy',
      redis: 'healthy',
    },
    metrics: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
    },
  };

  try {
    // Check database connection with timing
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;
    
    if (dbTime > 1000) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.dependencies.database = 'unhealthy';
    health.status = 'degraded';
    logger.error('Database health check failed:', error);
  }

  try {
    // Check Redis connection with timing
    const redisStart = Date.now();
    const redis = getRedisClient();
    await redis.ping();
    const redisTime = Date.now() - redisStart;
    
    if (redisTime > 500) {
      health.status = health.status === 'degraded' ? 'degraded' : 'degraded';
    }
  } catch (error) {
    health.dependencies.redis = 'unhealthy';
    health.status = health.status === 'degraded' ? 'unhealthy' : 'degraded';
    logger.error('Redis health check failed:', error);
  }

  const responseTime = Date.now() - startTime;
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    ...health,
    responseTime: `${responseTime}ms`,
  });
}));

// Readiness probe
router.get('/ready', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if service is ready to accept traffic
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedisClient();
    await redis.ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies not available',
    });
  }
}));

// Liveness probe
router.get('/live', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
