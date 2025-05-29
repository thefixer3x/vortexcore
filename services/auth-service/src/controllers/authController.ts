import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CryptoUtils } from '../utils/crypto';
import { redisUtils } from '../config/redis';
import { logger } from '../utils/logger';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export class AuthController {
  // User registration
  static async register(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName }: RegisterRequest = req.body;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await CryptoUtils.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          createdAt: true,
        }
      });

      // Generate email verification token
      const verificationToken = CryptoUtils.generateEmailVerificationToken();
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          email: user.email,
          token: verificationToken,
          expiresAt: CryptoUtils.addDays(new Date(), 7),
        }
      });

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        requestId: req.headers['x-request-id'],
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          resource: 'USER',
          details: { email: user.email },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        }
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user,
          verificationRequired: true,
        }
      });
    } catch (error) {
      logger.error('Registration failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'],
      });
      throw error;
    }
  }

  // User login
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password, mfaToken, rememberMe = false }: LoginRequest = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { mfaSettings: true }
      });

      if (!user || !user.isActive) {
        // Log failed attempt
        await prisma.loginAttempt.create({
          data: {
            email: email.toLowerCase(),
            ipAddress: req.ip!,
            userAgent: req.get('User-Agent'),
            success: false,
            failureReason: 'USER_NOT_FOUND',
          }
        });
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const passwordValid = await CryptoUtils.verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            email: user.email,
            ipAddress: req.ip!,
            userAgent: req.get('User-Agent'),
            success: false,
            failureReason: 'INVALID_PASSWORD',
          }
        });
        throw new AuthenticationError('Invalid credentials');
      }

      // Check MFA if enabled
      if (user.mfaSettings?.isEnabled) {
        if (!mfaToken) {
          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress: req.ip!,
              userAgent: req.get('User-Agent'),
              success: false,
              failureReason: 'MFA_REQUIRED',
              mfaRequired: true,
            }
          });

          res.status(200).json({
            success: false,
            mfaRequired: true,
            message: 'MFA token required',
          });
          return;
        }

        // Verify MFA token
        const mfaValid = CryptoUtils.verifyMFAToken(mfaToken, user.mfaSettings.secret!);
        if (!mfaValid) {
          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress: req.ip!,
              userAgent: req.get('User-Agent'),
              success: false,
              failureReason: 'INVALID_MFA',
              mfaRequired: true,
              mfaSuccess: false,
            }
          });
          throw new AuthenticationError('Invalid MFA token');
        }

        // Update MFA last used
        await prisma.userMFASettings.update({
          where: { userId: user.id },
          data: { lastUsedAt: new Date() }
        });
      }

      // Generate session
      const sessionId = CryptoUtils.generateSessionId();
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        sessionId,
      };

      const { accessToken, refreshToken } = CryptoUtils.createTokenPair(tokenPayload);

      // Calculate expiration
      const expiresAt = rememberMe 
        ? CryptoUtils.addDays(new Date(), 30)
        : CryptoUtils.addDays(new Date(), 7);

      // Save session
      await prisma.userSession.create({
        data: {
          userId: user.id,
          refreshToken: await CryptoUtils.hashSensitiveData(refreshToken),
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          expiresAt,
        }
      });

      // Update user last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Log successful login
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress: req.ip!,
          userAgent: req.get('User-Agent'),
          success: true,
          mfaRequired: user.mfaSettings?.isEnabled || false,
          mfaSuccess: user.mfaSettings?.isEnabled ? true : null,
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: 'SESSION',
          details: { sessionId, mfaUsed: !!user.mfaSettings?.isEnabled },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        }
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        sessionId,
        mfaUsed: !!user.mfaSettings?.isEnabled,
        requestId: req.headers['x-request-id'],
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
            mfaEnabled: !!user.mfaSettings?.isEnabled,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: expiresAt.toISOString(),
          },
        }
      });
    } catch (error) {
      logger.error('Login failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'],
      });
      throw error;
    }
  }

  // Refresh token
  static async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      // Verify refresh token
      const decoded = CryptoUtils.verifyRefreshToken(refreshToken);
      
      // Check if token is blacklisted
      const tokenId = CryptoUtils.getTokenId(refreshToken);
      if (tokenId && await redisUtils.isTokenBlacklisted(tokenId)) {
        throw new AuthenticationError('Token has been revoked');
      }

      // Find session
      const hashedRefreshToken = CryptoUtils.hashSensitiveData(refreshToken);
      const session = await prisma.userSession.findFirst({
        where: {
          refreshToken: hashedRefreshToken,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        include: { user: true }
      });

      if (!session || !session.user.isActive) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const newSessionId = CryptoUtils.generateSessionId();
      const tokenPayload = {
        userId: session.user.id,
        email: session.user.email,
        sessionId: newSessionId,
      };

      const { accessToken, refreshToken: newRefreshToken } = CryptoUtils.createTokenPair(tokenPayload);

      // Update session with new refresh token
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: CryptoUtils.hashSensitiveData(newRefreshToken),
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
        }
      });

      // Blacklist old refresh token
      if (tokenId) {
        await redisUtils.blacklistToken(tokenId, new Date(decoded.exp! * 1000));
      }

      logger.info('Token refreshed successfully', {
        userId: session.user.id,
        sessionId: newSessionId,
        requestId: req.headers['x-request-id'],
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresAt: session.expiresAt.toISOString(),
          },
        }
      });
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'],
      });
      throw error;
    }
  }

  // User logout
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const token = req.token;

      if (!userId || !token) {
        throw new AuthenticationError('Authentication required');
      }

      // Get token ID for blacklisting
      const tokenId = CryptoUtils.getTokenId(token);
      
      // Find and revoke session
      const session = await prisma.userSession.findFirst({
        where: {
          userId,
          isRevoked: false,
        },
        orderBy: { createdAt: 'desc' }
      });

      if (session) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          }
        });
      }

      // Blacklist current access token
      if (tokenId) {
        const decoded = CryptoUtils.verifyAccessToken(token);
        await redisUtils.blacklistToken(tokenId, new Date(decoded.exp! * 1000));
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_LOGOUT',
          resource: 'SESSION',
          details: { sessionId: session?.id },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        }
      });

      logger.info('User logged out successfully', {
        userId,
        sessionId: session?.id,
        requestId: req.headers['x-request-id'],
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout failed', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'],
      });
      throw error;
    }
  }

  // Get current user profile
  static async profile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
          mfaSettings: {
            select: {
              isEnabled: true,
              lastUsedAt: true,
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...user,
            mfaEnabled: user.mfaSettings?.isEnabled || false,
            mfaSettings: undefined, // Remove nested object
          }
        }
      });
    } catch (error) {
      logger.error('Profile retrieval failed', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'],
      });
      throw error;
    }
  }
}
