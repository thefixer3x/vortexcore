import { test, expect, request } from '@playwright/test';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

test.describe('Stripe Edge Function Auth', () => {
  test.skip(!supabaseUrl, 'SUPABASE_URL is not configured');

  test('should return 401 without Authorization for sensitive action', async () => {
    const api = await request.newContext();
    const res = await api.post(`${supabaseUrl}/functions/v1/stripe`, {
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { 'apikey': anonKey } : {}),
      },
      data: { action: 'get_transactions', data: { card_id: 'fake', limit: 1 } },
    });
    expect(res.status()).toBe(401);
  });
});

