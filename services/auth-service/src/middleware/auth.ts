import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { CryptoUtils, JWTPayload } from '../utils/crypto';
import { redisUtils } from '../config/redis';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { logger } from '../utils/logger';
import { ROLE_PERMISSIONS, Permission, isAdmin } from '../config/permissions';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: UserRole;
    sessionId?: string;
  };
  token?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = CryptoUtils.verifyAccessToken(token);

    const tokenId = CryptoUtils.getTokenId(token);
    if (tokenId && await redisUtils.isTokenBlacklisted(tokenId)) {
      throw new AuthenticationError('Token has been revoked');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId,
    };
    req.token = token;

    logger.debug('Token authenticated successfully', {
      userId: decoded.userId,
      email: decoded.email,
      role: user.role,
      requestId: req.headers['x-request-id'],
    });

    next();
  } catch (error) {
    logger.warn('Token authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'],
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    next(error);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (token) {
      try {
        const decoded = CryptoUtils.verifyAccessToken(token);

        const tokenId = CryptoUtils.getTokenId(token);
        if (tokenId && await redisUtils.isTokenBlacklisted(tokenId)) {
          return next();
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId, isActive: true },
          select: { id: true, email: true, role: true },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            sessionId: decoded.sessionId,
          };
          req.token = token;
        }
      } catch (error) {
        logger.debug('Optional auth token invalid', {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: req.headers['x-request-id'],
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

function resolveUserRole(roles: any): UserRole {
  return roles?.role ?? 'USER';
}

export const requirePermission = (permissions: string | string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const role = resolveUserRole(req.user);
      const userPermissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.USER;

      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission as Permission)
      );

      if (!hasPermission) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const role = resolveUserRole(req.user);
    const userIsAdmin = isAdmin(role);

    if (!userIsAdmin) {
      throw new AuthorizationError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const rateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = options.keyGenerator ? options.keyGenerator(req) : req.ip;
      const rateLimitKey = `rate_limit:${key}`;

      const current = await redisUtils.incrementRateLimit(rateLimitKey, options.windowMs);

      if (current > options.maxRequests) {
        const retryAfter = Math.ceil(options.windowMs / 1000);
        res.set('Retry-After', retryAfter.toString());

        throw new Error('Too many requests');
      }

      res.set({
        'X-RateLimit-Limit': options.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, options.maxRequests - current).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + options.windowMs).toISOString(),
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};
