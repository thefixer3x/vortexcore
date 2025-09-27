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

    // Collapse sidebar
    await page.click('[data-testid="sidebar-collapse-btn"]');

    // Verify chart expanded
    const chartExpanded = await page.locator('[data-testid="main-chart"]').boundingBox();
    expect(chartExpanded?.width).toBeGreaterThan(chartInitial?.width);
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
1. **Z-index Issues**: Verify sidebar doesn't overlay important content
2. **Animation Performance**: Check smooth transitions on slower devices
3. **Touch Targets**: Ensure buttons are >44px for mobile accessibility
4. **Chart Responsiveness**: Verify charts resize properly when sidebar toggles
5. **Keyboard Navigation**: Test tab order and focus management

### Performance Testing:
- **Layout Shift**: Measure CLS when sidebar toggles
- **Animation Frame Rate**: Monitor for 60fps during transitions
- **Memory Usage**: Check for memory leaks on repeated toggling

### Cross-browser Testing:
- Safari (iOS): Test touch interactions and Face ID
- Chrome (Android): Test fingerprint integration
- Desktop: Chrome, Firefox, Safari, Edge

## Biometric Testing Plan

### Device Testing:
1. **iOS Devices**: Test Face ID integration
2. **Android Devices**: Test fingerprint scanner
3. **Web Browsers**: Test WebAuthn API fallback
4. **Error Handling**: Test when biometrics unavailable

### Security Testing:
1. **Data Encryption**: Verify biometric data stays local
2. **Token Security**: Test secure storage of auth tokens
3. **Session Management**: Verify proper cleanup on logout