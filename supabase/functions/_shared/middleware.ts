// Lightweight, self-contained middleware for Supabase Edge Functions
// Provides: dynamic CORS, security headers, optional JWT verification and simple RBAC hook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);

const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminSupabase = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

export interface AuthContext {
  userId?: string;
  roles: string[];
}

export interface MiddlewareOptions {
  requireAuth?: boolean;
  allowedMethods?: string[];
  allowedRoles?: string[]; // if provided, user must have at least one
}

function resolveOrigin(origin?: string | null) {
  if (!origin) return '*';
  if (!ALLOWED_ORIGINS.length) return origin; // reflect by default
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  } else {
    console.warn(`[CORS] Rejected origin: ${origin} at ${new Date().toISOString()}`);
    return '*';
  }
}

function corsHeadersFromRequest(req: Request) {
  const origin = req.headers.get('Origin');
  const allowOrigin = resolveOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-idempotency-key',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  } as Record<string, string>;
}

async function getAuthContext(req: Request): Promise<AuthContext> {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';
  if (!token) return { roles: [] };
  const { data, error } = await publicSupabase.auth.getUser(token);
  if (error || !data?.user) return { roles: [] };
  const roles = (data.user.app_metadata?.roles as string[]) || (data.user.app_metadata?.role ? [data.user.app_metadata.role] : []);
  return { userId: data.user.id, roles };
}

export function withMiddleware(
  handler: (request: Request, context: { auth: AuthContext; admin: typeof adminSupabase }) => Promise<Response>,
  options: MiddlewareOptions = {}
) {
  return async (req: Request) => {
    const method = req.method.toUpperCase();
    const cors = corsHeadersFromRequest(req);

    // OPTIONS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (options.allowedMethods && !options.allowedMethods.includes(method)) {
      return new Response(JSON.stringify({ error: `Method ${method} not allowed` }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const auth = await getAuthContext(req);
    if (options.requireAuth && !auth.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (options.allowedRoles && options.allowedRoles.length) {
      const hasRole = auth.roles.some(r => options.allowedRoles!.includes(r));
      if (!hasRole) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    try {
      const res = await handler(req, { auth, admin: adminSupabase });
      const secure = new Headers(res.headers);
      secure.set('X-Content-Type-Options', 'nosniff');
      secure.set('X-Frame-Options', 'DENY');
      secure.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      secure.set('X-XSS-Protection', '1; mode=block');
      Object.entries(cors).forEach(([k, v]) => secure.set(k, v));
      return new Response(res.body, { status: res.status, headers: secure });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  };
}

export const withPublicMiddleware = (handler: (req: Request) => Promise<Response>) =>
  withMiddleware((req) => handler(req), { requireAuth: false });

export const withAuthMiddleware = (
  handler: (req: Request, ctx: { auth: AuthContext; admin: typeof adminSupabase }) => Promise<Response>,
  allowedMethods: string[] = ['GET', 'POST'],
  allowedRoles?: string[]
) => withMiddleware(handler, { requireAuth: true, allowedMethods, allowedRoles });

export { adminSupabase };
