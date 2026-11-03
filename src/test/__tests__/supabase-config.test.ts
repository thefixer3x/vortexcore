import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateClientConfig } from '../../utils/configValidator';
import { MODERN_PUBLISHABLE_KEY, resolvePublishableKey } from '../../integrations/supabase/publishable-key';

afterEach(() => vi.unstubAllEnvs());
describe('publishable key configuration', () => {
  it('uses a publishable key without the legacy anon variable', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_fixture');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(validateClientConfig().isValid).toBe(true);
  });
  it('never uses the legacy anon key when the new key is missing', () => {
    expect(resolvePublishableKey('')).toBe(MODERN_PUBLISHABLE_KEY);
    expect(resolvePublishableKey(undefined)).not.toBe('legacy-test-fixture');
  });
  it('replaces a disabled legacy JWT key with the modern publishable key', () => {
    expect(resolvePublishableKey('eyJhbGciOiJIUzI1NiJ9.legacy.fixture')).toBe(MODERN_PUBLISHABLE_KEY);
    expect(MODERN_PUBLISHABLE_KEY.startsWith('sb_publishable_')).toBe(true);
  });
  it('keeps a modern key supplied by the environment', () => {
    expect(resolvePublishableKey('sb_publishable_test_fixture')).toBe('sb_publishable_test_fixture');
  });
});