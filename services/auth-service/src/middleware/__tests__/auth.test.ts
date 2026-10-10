import { describe, it, expect } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { requirePermission, requireAdmin, AuthenticatedRequest } from '../auth';
import { AuthenticationError, AuthorizationError } from '../errorHandler';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
    },
  })),
  UserRole: { USER: 'USER', ADMIN: 'ADMIN' },
}));

jest.mock('../../utils/crypto', () => ({
  CryptoUtils: {
    verifyAccessToken: jest.fn(),
    getTokenId: jest.fn(),
  },
}));

jest.mock('../../config/redis', () => ({
  redisUtils: {
    isTokenBlacklisted: jest.fn(),
    incrementRateLimit: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function makeMockRequest(user?: { id: string; email: string; role: string; sessionId?: string }): AuthenticatedRequest {
  return {
    user,
    headers: {
      authorization: user ? 'Bearer valid-token' : undefined,
    },
    get: jest.fn().mockReturnValue('test-agent'),
    ip: '127.0.0.1',
  } as unknown as AuthenticatedRequest;
}

function makeMockResponse(): Response {
  return {} as Response;
}

function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

describe('requirePermission middleware', () => {
  it('throws AuthenticationError when no user is authenticated', async () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    const next = makeNext();

    await requirePermission('read')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication required' })
    );
  });

  it('grants read permission to USER role', async () => {
    const req = makeMockRequest({ id: 'u1', email: 'u@e.com', role: 'USER' });
    const res = makeMockResponse();
    const next = makeNext();

    await requirePermission('read')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('grants write permission to USER role', async () => {
    const req = makeMockRequest({ id: 'u1', email: 'u@e.com', role: 'USER' });
    const res = makeMockResponse();
    const next = makeNext();

    await requirePermission('write')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies admin permission to USER role', async () => {
    const req = makeMockRequest({ id: 'u1', email: 'u@e.com', role: 'USER' });
    const res = makeMockResponse();
    const next = makeNext();

    await requirePermission('admin')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Insufficient permissions' })
    );
  });

  it('grants all permissions to ADMIN role', async () => {
    const req = makeMockRequest({ id: 'a1', email: 'a@e.com', role: 'ADMIN' });
    const res = makeMockResponse();
    const next = makeNext();

    await requirePermission(['read', 'write', 'admin'])(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies when any required permission is missing', async () => {
    const req = makeMockRequest({ id: 'u1', email: 'u@e.com', role: 'USER' });
    const res = makeMockResponse();
    const next = makeNext();

    await requirePermission(['read', 'admin'])(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });
});

describe('requireAdmin middleware', () => {
  it('throws AuthenticationError when no user', async () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    const next = makeNext();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('grants access to ADMIN role', async () => {
    const req = makeMockRequest({ id: 'a1', email: 'a@e.com', role: 'ADMIN' });
    const res = makeMockResponse();
    const next = makeNext();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies access to USER role', async () => {
    const req = makeMockRequest({ id: 'u1', email: 'u@e.com', role: 'USER' });
    const res = makeMockResponse();
    const next = makeNext();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Admin access required' })
    );
  });
});
