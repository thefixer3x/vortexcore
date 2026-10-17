import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateClientConfig } from '../../utils/configValidator';

afterEach(() => vi.unstubAllEnvs());
describe('publishable key configuration', () => {
  it('uses a publishable key without the legacy anon variable', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_fixture');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(validateClientConfig().isValid).toBe(true);
  });
  it('does not fall back to a legacy anon key when the new key is missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'legacy-test-fixture');
    expect(validateClientConfig().isValid).toBe(false);
  });
});