import { test, expect, request } from '@playwright/test';

const supabaseUrl = process.env.SUPABASE_URL;

test.describe('CORS for ai-router', () => {
  test.skip(!supabaseUrl, 'SUPABASE_URL is not configured');

  test('OPTIONS preflight reflects Origin and sets Vary', async () => {
    const api = await request.newContext();
    const origin = 'https://example.com';
    const res = await api.fetch(`${supabaseUrl}/functions/v1/ai-router`, {
      method: 'OPTIONS',
      headers: { 'Origin': origin, 'Access-Control-Request-Method': 'POST' },
    });
    expect(res.status()).toBe(200);
    const allowOrigin = res.headers()['access-control-allow-origin'];
    expect(allowOrigin === origin || allowOrigin === '*').toBeTruthy();
    expect(res.headers()['vary']).toContain('Origin');
  });
});

