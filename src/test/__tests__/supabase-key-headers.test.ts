import { describe, it, expect } from 'vitest';
import { apiKeyHeaders } from '../../../supabase/functions/_shared/api-key-headers';

describe('modern Supabase API key transport', () => {
  it('sends an opaque server key only as apikey', () => {
    const key = 'sb_secret_test_fixture';
    const headers = apiKeyHeaders(key, { Authorization: `Bearer ${key}` });
    expect(headers.has('Authorization')).toBe(false);
    expect(headers.get('apikey')).toBe(key);
  });
  it('preserves a caller JWT with a publishable key', () => {
    const key = 'sb_publishable_test_fixture';
    const headers = apiKeyHeaders(key, { Authorization: 'Bearer user-jwt-fixture' });
    expect(headers.get('Authorization')).toBe('Bearer user-jwt-fixture');
    expect(headers.get('apikey')).toBe(key);
  });
  it('does not turn a publishable key into user authentication', () => {
    const key = 'sb_publishable_test_fixture';
    expect(apiKeyHeaders(key, { Authorization: `Bearer ${key}` }).has('Authorization')).toBe(false);
  });
});