import { Request, Response, NextFunction } from 'express';
import { CryptoUtils, JWTPayload } from '../utils/crypto';
import { redisUtils } from '../config/redis';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
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

    // Verify token
    const decoded = CryptoUtils.verifyAccessToken(token);
    
    // Check if token is blacklisted
    const tokenId = CryptoUtils.getTokenId(token);
    if (tokenId && await redisUtils.isTokenBlacklisted(tokenId)) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId,
    };
    req.token = token;

    logger.debug('Token authenticated successfully', {
      userId: decoded.userId,
      email: decoded.email,
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
        
        // Check if token is blacklisted
        const tokenId = CryptoUtils.getTokenId(token);
        if (tokenId && await redisUtils.isTokenBlacklisted(tokenId)) {
          // Token is blacklisted, but this is optional auth so continue without user
          return next();
        }

        req.user = {
          id: decoded.userId,
          email: decoded.email,
          sessionId: decoded.sessionId,
        };
        req.token = token;
      } catch (error) {
        // Token is invalid, but this is optional auth so continue without user
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

      // In a real implementation, you would check user permissions here
      // For now, we'll assume all authenticated users have basic permissions
      const userPermissions = ['read', 'write']; // This would come from database/cache
      
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
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

    // In a real implementation, check if user has admin role
    // For now, we'll use a simple check
    const isAdmin = false; // This would come from database
    
    if (!isAdmin) {
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

      // Set rate limit headers
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
