import { expect, test } from '@playwright/test'

test.describe('Release smoke', () => {
  test('login surface is reachable', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/VortexCore/i)
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
  })

  for (const protectedPath of ['/dashboard', '/settings']) {
    test(`unauthenticated ${protectedPath} redirects to login`, async ({ page }) => {
      await page.goto(protectedPath)

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
    })
  }
})
