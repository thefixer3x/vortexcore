import { Request, Response, NextFunction } from 'express';
import { logger, createRequestId } from '../utils/logger';

export interface RequestWithContext extends Request {
  requestId: string;
  startTime: number;
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Cast req to RequestWithContext to add custom properties
  const requestWithContext = req as RequestWithContext;
  
  // Generate unique request ID
  requestWithContext.requestId = req.headers['x-request-id'] as string || createRequestId();
  requestWithContext.startTime = Date.now();

  // Set request ID in response headers
  res.setHeader('x-request-id', requestWithContext.requestId);

  // Log incoming request
  const requestInfo = {
    requestId: requestWithContext.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  logger.info('Incoming request', requestInfo);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - requestWithContext.startTime;
    
    const responseInfo = {
      requestId: requestWithContext.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Log response (excluding sensitive data)
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', responseInfo);
    } else {
      logger.info('Request completed successfully', responseInfo);
    }

    return originalJson.call(this, body);
  };

  next();
};
