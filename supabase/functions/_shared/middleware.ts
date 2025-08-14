/**
 * Supabase Edge Function middleware for vortexcore
 * 
 * This middleware enforces JWT validation and project scope checking
 * for all Edge Functions in the vortexcore project.
 */

import { createAuditLogger, createJWTMiddleware, createErrorResponse } from '../../../../packages/onasis-core/src/security/index.ts';

// Configuration from environment
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://mxtsdgkwzjzlttpotole.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!;
const PROJECT_NAME = 'vortexcore';

// Initialize audit logger
const auditLogger = createAuditLogger({
  supabaseUrl: SUPABASE_URL,
  supabaseServiceKey: SUPABASE_SERVICE_KEY,
  projectName: PROJECT_NAME
});

// Initialize JWT middleware
const jwtMiddleware = createJWTMiddleware(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  auditLogger,
  {
    allowedProjects: ['vortexcore', 'vortex'], // Allow both project names
    requireProjectScope: false // Start with false, can be enabled later
  }
);

export interface MiddlewareOptions {
  requireAuth?: boolean;
  allowedMethods?: string[];
  publicPath?: boolean;
}

/**
 * Middleware wrapper for Edge Functions
 */
export function withMiddleware(
  handler: (request: Request, context: any) => Promise<Response>,
  options: MiddlewareOptions = {}
) {
  return async function(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    try {
      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      // Check allowed methods
      if (options.allowedMethods && !options.allowedMethods.includes(method)) {
        await auditLogger.log({
          action: 'method_not_allowed',
          target: pathname,
          status: 'denied',
          meta: { 
            method, 
            allowedMethods: options.allowedMethods 
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });

        return createErrorResponse(`Method ${method} not allowed`, 405);
      }

      let userId: string | undefined;
      let projectScope: string | undefined;

      // Validate authentication if required
      if (options.requireAuth !== false && !options.publicPath) {
        const validation = await jwtMiddleware(request);

        if (!validation.isValid) {
          await auditLogger.log({
            action: 'auth_failure',
            target: pathname,
            status: 'denied',
            meta: { 
              reason: validation.error,
              method,
              path: pathname
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          });

          return createErrorResponse(validation.error || 'Authentication required', 401);
        }

        userId = validation.userId;
        projectScope = validation.projectScope;

        // Log successful authentication
        await auditLogger.logFunctionCall(
          pathname,
          userId,
          'allowed',
          {
            method,
            projectScope
          }
        );
      }

      // Create enhanced context for the handler
      const context = {
        userId,
        projectScope,
        auditLogger,
        request: {
          ...request,
          userId,
          projectScope
        }
      };

      // Call the actual handler
      const response = await handler(request, context);

      // Add security headers to response
      const headers = new Headers(response.headers);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Add CORS headers
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      // Log middleware errors
      await auditLogger.log({
        action: 'middleware_error',
        target: pathname,
        status: 'error',
        meta: {
          error: error instanceof Error ? error.message : 'Unknown middleware error',
          method,
          path: pathname
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return createErrorResponse('Internal server error', 500);
    }
  };
}

/**
 * Helper for public endpoints that don't require authentication
 */
export function withPublicMiddleware(handler: (request: Request) => Promise<Response>) {
  return withMiddleware(handler, { publicPath: true });
}

/**
 * Helper for protected endpoints that require authentication
 */
export function withAuthMiddleware(
  handler: (request: Request, context: any) => Promise<Response>,
  allowedMethods: string[] = ['GET', 'POST']
) {
  return withMiddleware(handler, { 
    requireAuth: true, 
    allowedMethods 
  });
}