import { test, expect } from '@playwright/test';

test.describe('AI Chat Widget', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display chat button', async ({ page }) => {
    // Check if chat button is visible
    const chatButton = page.locator('button').filter({ hasText: /message/i }).or(
      page.locator('button[class*="rounded-full"]').first()
    );
    
    await expect(chatButton).toBeVisible();
  });

  test('should open chat widget when button is clicked', async ({ page }) => {
    // Click chat button
    const chatButton = page.locator('button').filter({ hasText: /message/i }).or(
      page.locator('button[class*="rounded-full"]').first()
    );
    
    await chatButton.click();
    
    // Should show chat interface
    await expect(page.getByText('VortexAI Assistant')).toBeVisible();
    await expect(page.getByText(/Welcome to VortexCore/i)).toBeVisible();
  });

  test('should display welcome message', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    // Check welcome message
    await expect(page.getByText(/Welcome to VortexCore! How can I assist you/i)).toBeVisible();
  });

  test('should allow typing in message input', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    // Find message input
    const messageInput = page.getByPlaceholder(/Type a message/i);
    await expect(messageInput).toBeVisible();
    
    // Type message
    await messageInput.fill('Hello AI assistant');
    await expect(messageInput).toHaveValue('Hello AI assistant');
  });

  test('should enable send button when message is typed', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    const messageInput = page.getByPlaceholder(/Type a message/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Initially disabled
    await expect(sendButton).toBeDisabled();
    
    // Type message
    await messageInput.fill('Test message');
    
    // Should be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should handle Enter key to send message', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    const messageInput = page.getByPlaceholder(/Type a message/i);
    
    // Type and press Enter
    await messageInput.fill('Test message');
    await messageInput.press('Enter');
    
    // Message should appear in chat
    await expect(page.getByText('Test message')).toBeVisible();
  });

  test('should handle Shift+Enter for new line', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    const messageInput = page.getByPlaceholder(/Type a message/i);
    
    // Type and press Shift+Enter
    await messageInput.fill('First line');
    await messageInput.press('Shift+Enter');
    await messageInput.type('Second line');
    
    // Should contain newline
    await expect(messageInput).toHaveValue('First line\nSecond line');
  });

  test('should minimize and restore chat', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    // Minimize chat
    const minimizeButton = page.getByTitle('Minimize');
    await minimizeButton.click();
    
    // Chat should be minimized
    await expect(page.getByText('VortexAI Assistant')).not.toBeVisible();
    
    // Restore chat
    const restoreButton = page.locator('button[class*="rounded-full"]').first();
    await restoreButton.click();
    
    // Chat should be visible again
    await expect(page.getByText('VortexAI Assistant')).toBeVisible();
  });

  test('should close chat', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    // Close chat
    const closeButton = page.getByTitle('Close');
    await closeButton.click();
    
    // Chat should be closed
    await expect(page.getByText('VortexAI Assistant')).not.toBeVisible();
    
    // Only chat button should remain
    await expect(page.locator('button[class*="rounded-full"]').first()).toBeVisible();
  });

  test('should clear chat history', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    // Send a message first
    const messageInput = page.getByPlaceholder(/Type a message/i);
    await messageInput.fill('Test message for clearing');
    await messageInput.press('Enter');
    
    // Clear chat
    await page.getByText('Clear Chat').click();
    
    // Should only show welcome message
    await expect(page.getByText('Test message for clearing')).not.toBeVisible();
    await expect(page.getByText(/Welcome to VortexCore/i)).toBeVisible();
  });

  test('should show loading state while processing', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    // Send message
    const messageInput = page.getByPlaceholder(/Type a message/i);
    await messageInput.fill('What is financial planning?');
    await messageInput.press('Enter');
    
    // Should show loading state
    await expect(page.getByText('Thinking...')).toBeVisible();
  });

  // Note: Testing actual AI responses would require proper backend setup
  test.skip('should receive AI response', async ({ page }) => {
    // This test would require actual AI backend to be running
    // Implementation depends on your test environment setup
    
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    await chatButton.click();
    
    const messageInput = page.getByPlaceholder(/Type a message/i);
    await messageInput.fill('What is VortexCore?');
    await messageInput.press('Enter');
    
    // Wait for AI response
    await expect(page.locator('.bg-muted').last()).toContainText(/VortexCore/i, { timeout: 10000 });
  });
});