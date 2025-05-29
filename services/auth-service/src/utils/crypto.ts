import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import type { StringValue } from 'ms';
import { config } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class CryptoUtils {
  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptSaltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // JWT token management
  static generateAccessToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp' | 'jti'>): string {
    const tokenId = crypto.randomUUID();
    const jwtPayload = {
      ...payload,
      type: 'access' as const,
      jti: tokenId,
    };
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as StringValue,
      issuer: config.service.name,
      audience: 'vortex-frontend',
    };
    return jwt.sign(jwtPayload, config.jwt.secret as Secret, options);
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp' | 'jti'>): string {
    const tokenId = crypto.randomUUID();
    const jwtPayload = {
      ...payload,
      type: 'refresh' as const,
      jti: tokenId,
    };
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as StringValue,
      issuer: config.service.name,
      audience: 'vortex-frontend',
    };
    return jwt.sign(jwtPayload, config.jwt.refreshSecret as Secret, options);
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.service.name,
        audience: 'vortex-frontend',
      }) as JWTPayload;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.service.name,
        audience: 'vortex-frontend',
      }) as JWTPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static getTokenId(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded?.jti || null;
    } catch {
      return null;
    }
  }

  // MFA (Multi-Factor Authentication)
  static generateMFASecret(length: number = config.security.mfaSecretLength): string {
    return speakeasy.generateSecret({
      name: 'VortexCore',
      length,
    }).base32;
  }

  static async setupMFA(userEmail: string): Promise<MFASetup> {
    const secret = speakeasy.generateSecret({
      name: `VortexCore (${userEmail})`,
      issuer: 'VortexCore',
      length: config.security.mfaSecretLength,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  static verifyMFAToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      token,
      window: 2, // Allow 2 time windows (±1 minute)
      encoding: 'base32',
    });
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  static verifyBackupCode(code: string, backupCodes: string[]): boolean {
    return backupCodes.includes(code.toUpperCase());
  }

  // Secure random tokens
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Utility functions
  static createTokenPair(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp' | 'jti'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateSessionId(): string {
    return crypto.randomUUID();
  }

  // Time-based utilities
  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  static isExpired(date: Date): boolean {
    return date.getTime() < Date.now();
  }
}

export default CryptoUtils;
