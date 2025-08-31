import { test, expect } from '@playwright/test'

const projectRef = process.env.PROJECT_REF || 'mxtsdgkwzjzlttpotole'
const sessionJson = process.env.TEST_SUPABASE_SESSION_JSON // optional JSON string of a valid supabase-js v2 session

test.describe('Deep link after login', () => {
  test('redirects unauthenticated and (optionally) returns to deep link after setting session', async ({ page }) => {
    // Attempt to open a protected deep link
    await page.goto('/dashboard')
    // Current behavior: redirect to home/login
    await expect(page).toHaveURL('/')

    if (!sessionJson) {
      test.skip(true, 'Provide TEST_SUPABASE_SESSION_JSON to enable deep-link return test')
      return
    }

    // Inject Supabase session into localStorage and retry
    const storageKey = `sb-${projectRef}-auth-token`
    await page.addInitScript(([key, val]) => {
      try { localStorage.setItem(key, val as string) } catch {}
    }, [storageKey, sessionJson])

    // Reload and try deep link again
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/Control Room|Dashboard|Welcome/i)).toBeVisible()
  })
})

