import { test, expect } from '@playwright/test'

async function openChat(page) {
  const chatButton = page.locator('button[class*="rounded-full"]').first()
  await chatButton.click()
  await expect(page.getByText('VortexAI Assistant')).toBeVisible()
}

test.describe('AI Chat error handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows friendly message on 403', async ({ page }) => {
    await page.route('**/functions/v1/ai-router', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'forbidden' }) })
    })
    await openChat(page)
    await page.getByPlaceholder(/Type a message/i).fill('test 403')
    await page.keyboard.press('Enter')
    await expect(page.getByText('AI assistant access is currently restricted. Please check your account status.')).toBeVisible()
  })

  test('shows friendly message on 500', async ({ page }) => {
    await page.route('**/functions/v1/ai-router', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'server' }) })
    })
    await openChat(page)
    await page.getByPlaceholder(/Type a message/i).fill('test 500')
    await page.keyboard.press('Enter')
    await expect(page.getByText('AI assistant is experiencing technical difficulties. Please try again in a few moments.')).toBeVisible()
  })

  test('shows friendly message on 404', async ({ page }) => {
    await page.route('**/functions/v1/ai-router', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not found' }) })
    })
    await openChat(page)
    await page.getByPlaceholder(/Type a message/i).fill('test 404')
    await page.keyboard.press('Enter')
    await expect(page.getByText('AI assistant is temporarily unavailable. Our team is working to restore service.')).toBeVisible()
  })
})

