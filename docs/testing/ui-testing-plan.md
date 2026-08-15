# UI Testing Plan for VortexCore Dashboard

## Side Panel Responsiveness Testing

### Manual Testing Steps:
1. **Desktop Testing (1920x1080)**:
   - Load dashboard at full width
   - Click sidebar collapse button
   - Verify charts expand to use available space
   - Check no elements are blocked

2. **Tablet Testing (768px width)**:
   - Resize browser to tablet size
   - Verify sidebar auto-collapses
   - Test touch interactions
   - Ensure charts remain readable

3. **Mobile Testing (375px width)**:
   - Switch to mobile view
   - Verify hamburger menu appears
   - Test overlay sidebar functionality
   - Check chart scrolling behavior

### Automated Playwright Tests:

```javascript
// Test file: tests/dashboard-responsive.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Responsiveness', () => {
  test('sidebar collapses on small screens', async ({ page }) => {
    await page.goto('/dashboard');

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-collapse-btn"]')).toBeVisible();

    // Test tablet view - auto collapse
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/collapsed/);

    // Test mobile view - hamburger menu
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeHidden();
  });

  test('charts expand when sidebar collapses', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Get initial chart width
    const chartInitial = await page.locator('[data-testid="main-chart"]').boundingBox();
    if (chartInitial === null) {
      throw new Error('Initial chart boundingBox returned null — chart element not found or not visible');
    }

    // Collapse sidebar
    await page.click('[data-testid="sidebar-collapse-btn"]');

    // Verify chart expanded
    const chartExpanded = await page.locator('[data-testid="main-chart"]').boundingBox();
    if (chartExpanded === null) {
      throw new Error('Expanded chart boundingBox returned null — chart element not found or not visible');
    }
    expect(chartExpanded.width).toBeGreaterThan(chartInitial.width);
  });

  test('mobile overlay does not block chart interactions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();

    // Close mobile menu by clicking outside
    await page.click('[data-testid="chart-area"]');
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeHidden();

    // Verify chart is still interactive
    await page.hover('[data-testid="chart-point"]');
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
  });
});
```

### Critical Test Cases:
1. **testSidebarZIndex**: Render the sidebar and assert computed z-index and stacking context — verify sidebar renders above main content and modal overlays
2. **testSidebarAnimationPerformance**: Measure CSS transition frame rates using `requestAnimationFrame` sampling; assert 60fps or no dropped frames > 16ms during toggle on throttled CPU
3. **testTouchTargetSizes**: Query all actionable elements with `getBoundingClientRect`; assert all height/width >= 44px per WCAG accessibility guidelines
4. **testKeyboardNavigationFocus**: Simulate Tab/Shift+Tab key presses; verify tab order follows logical DOM sequence and focus trap works in modal/sidebar overlays

### Performance Testing:
- **Layout Shift (CLS)**: Measure CLS when sidebar toggles using Chrome DevTools Performance tab or Lighthouse; acceptable threshold: **CLS < 0.1**
- **Animation Frame Rate**: Capture 60s traces during sidebar toggle using Chrome DevTools Performance tab; assert 60fps (no frames > 16ms) or flag as failing
- **Memory Leak**: Perform 100 toggle iterations, record JS heap size before/after using `performance.memory`; flag as leak if sustained increase > 10MB or > 5% growth across 3 consecutive runs

### Cross-browser Testing:
- Safari (iOS): Test touch interactions (see Biometric Testing Plan for authentication/biometrics)
- Chrome (Android): Test responsive layout and touch targets
- Desktop: Chrome, Firefox, Safari, Edge

> **Note:** Face ID and fingerprint integration tests are covered in the Biometric Testing Plan section below.

## Biometric Testing Plan

### Device Testing (iOS Face ID):
**Manual test steps:**
1. Enable Face ID in device settings for the app
2. Attempt biometric login on iOS device
3. Verify system authentication prompt appears
4. Confirm user is authenticated and token is returned/stored

**Automated test example (Playwright-style):**
```typescript
test('iOS Face ID authentication succeeds', async ({ page }) => {
  // Setup: mock WebAuthn credential for test environment
  await page.addCredentials({ id: 'webauthn-cred-fido2', payload: mockFIDO2Credential });

  // Execute Face ID flow
  await page.click('[data-testid="biometric-login-btn"]');
  
  // Verify success state
  await expect(page.locator('[data-testid="auth-success"]')).toBeVisible({ timeout: 5000 });
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();
});
```
**Acceptance criteria:** System prompt shown → user authenticated → token returned and stored → redirect to dashboard.

**Error scenario (3 failed attempts):** After 3 failed Face ID attempts, verify fallback to PIN/password prompt appears.

---

### Device Testing (Android Fingerprint):
**Manual test steps:**
1. Enable fingerprint in device settings for the app
2. Attempt biometric login on Android device
3. Verify fingerprint sensor activates
4. Confirm successful authentication and token storage

**Automated test example (Playwright-style):**
```typescript
test('Android fingerprint authentication succeeds', async ({ page }) => {
  await page.setBiometricEnrollment(true);
  await page.click('[data-testid="biometric-login-btn"]');
  await page.waitForEvent('fingerprint-success');
  await expect(page).toHaveURL(/dashboard/);
});
```
**Acceptance criteria:** Fingerprint sensor activated → authentication successful → session persists.

**Error scenario (no fingerprint enrolled):** Detect `NotAllowedError` and verify graceful fallback UI is displayed.

---

### Device Testing (WebAuthn API fallback):
**Explanation:** WebAuthn API fallback triggers when platform biometric (Face ID / fingerprint) is unavailable — it attempts to use a platform authenticator (e.g., Windows Hello, security key) as fallback.

**Manual test steps:**
1. Attempt biometric login on desktop browser without platform biometric
2. Verify WebAuthn prompt appears
3. Confirm authentication succeeds via fallback method

**Automated test:**
```typescript
test('WebAuthn fallback succeeds when biometrics unavailable', async ({ page }) => {
  // Simulate no platform biometric by mocking navigator.credentials to return null
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'credentials', { get: () => ({ create: () => Promise.resolve(mockCredential) }) });
  });
  await page.click('[data-testid="biometric-login-btn"]');
  await expect(page.locator('[data-testid="auth-success"]')).toBeVisible({ timeout: 5000 });
});
```

---

### Security Testing

**Data Encryption:** Verify biometric template data stays local and is never transmitted to server. Inspect network tab during biometric flow — no biometric raw data should leave the device.

**Token Security:**
- Inspect `localStorage`/`Keychain` after login to verify auth tokens are stored (not plaintext passwords)
- Capture network requests to confirm tokens are transmitted only over HTTPS

**Session Management:**
- Verify logout clears all stored tokens and biometric session state
- Test session expiry: confirm redirect to login after token TTL

Tools for verification: browser DevTools network tab, `localStorage` inspection, `sessionStorage` inspection, proxy tools like Charles/mitmproxy for traffic capture.