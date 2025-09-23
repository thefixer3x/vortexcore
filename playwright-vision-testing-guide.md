# Playwright Vision Testing Guide for VortexCore UI Issues

## Configuration Setup

### Recommended MCP Configuration:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--caps", "tabs,vision",
        "--viewport-size", "1280,720"
      ]
    }
  }
}
```

### Alternative Configurations for Different Testing Scenarios:

#### Mobile Testing:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--caps", "vision",
        "--viewport-size", "375,667"
      ]
    }
  }
}
```

#### Tablet Testing:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--caps", "vision",
        "--viewport-size", "768,1024"
      ]
    }
  }
}
```

## Testing Strategy for Side Panel Issues

### 1. Desktop Layout Testing (1280x720)
**Goal**: Verify sidebar collapse doesn't block charts

**Test Steps**:
1. Navigate to dashboard
2. Take screenshot of full layout
3. Click sidebar collapse button
4. Take screenshot of collapsed state
5. Verify charts expanded to fill space
6. Test chart interactions (hover, click)

### 2. Mobile Layout Testing (375x667)
**Goal**: Verify mobile overlay doesn't interfere with content

**Test Steps**:
1. Resize to mobile viewport
2. Verify hamburger menu appears
3. Take screenshot of mobile layout
4. Open mobile sidebar
5. Verify overlay behavior
6. Test closing sidebar by clicking outside
7. Verify chart remains interactive

### 3. Biometric Authentication Testing
**Goal**: Test enhanced biometric UI across devices

**Test Steps**:
1. Navigate to settings/authentication page
2. Take screenshot of biometric options
3. Test toggle switches
4. Verify proper visual feedback
5. Test mobile app promotion display

## Visual Regression Testing Approach

### Key Screenshots to Capture:
1. **Dashboard - Full Width**: Sidebar expanded, charts visible
2. **Dashboard - Collapsed**: Sidebar collapsed, charts expanded
3. **Mobile - Menu Closed**: Clean mobile layout
4. **Mobile - Menu Open**: Overlay sidebar visible
5. **Biometric Settings**: All authentication options
6. **Chat Interface**: AI chat with session management

### Accessibility Testing Points:
- Focus indicators visible
- Touch targets ≥44px on mobile
- Contrast ratios meet WCAG standards
- Keyboard navigation flow

## Common UI Issues to Check

### Side Panel Problems:
- ✅ **Z-index conflicts**: Sidebar overlaying important content
- ✅ **Layout shift**: Content jumping when sidebar toggles
- ✅ **Mobile blocking**: Sidebar preventing chart interactions
- ✅ **Animation issues**: Jerky or incomplete transitions

### Chart Responsiveness:
- ✅ **Size adaptation**: Charts resize when space available
- ✅ **Interaction preservation**: Hover/click still work after resize
- ✅ **Axis scaling**: Labels and axes adjust properly
- ✅ **Mobile scrolling**: Charts scrollable on small screens

### Biometric UI:
- ✅ **Device detection**: Proper fallbacks when unavailable
- ✅ **Visual feedback**: Clear success/error states
- ✅ **Mobile optimization**: Touch-friendly controls
- ✅ **Security messaging**: Clear privacy information

## Sample Test Commands

### Using Playwright MCP Tools:

```bash
# Navigate to dashboard
browser_navigate("http://localhost:5173/dashboard")

# Take initial screenshot
browser_take_screenshot("dashboard-initial.png", fullPage=true)

# Test sidebar collapse
browser_click('[data-testid="sidebar-toggle"]')

# Take screenshot after collapse
browser_take_screenshot("dashboard-collapsed.png", fullPage=true)

# Test mobile responsiveness
browser_resize(375, 667)
browser_take_screenshot("mobile-layout.png", fullPage=true)

# Test mobile menu
browser_click('[data-testid="mobile-menu-toggle"]')
browser_take_screenshot("mobile-menu-open.png", fullPage=true)
```

## Expected Visual Results

### Desktop Behavior:
- **Expanded**: Sidebar ~240px wide, charts fill remaining space
- **Collapsed**: Sidebar ~60px wide, charts expand by ~180px
- **Transitions**: Smooth 300ms animation between states

### Mobile Behavior:
- **Closed**: Full-width content, hamburger menu visible
- **Open**: Overlay sidebar from left, content dimmed behind
- **Closing**: Tap outside or swipe to close

### Chart Adaptation:
- **Desktop Expand**: Charts grow horizontally, maintain proportions
- **Mobile**: Charts stack vertically, horizontal scroll if needed
- **Interactions**: All hover tooltips and click events preserved

## Debugging Common Issues

### If Sidebar Blocks Charts:
1. Check z-index values (sidebar should be lower than overlays)
2. Verify mobile overlay uses proper positioning (fixed/absolute)
3. Test click-through behavior on mobile

### If Animations Are Jerky:
1. Check for layout thrashing (use CSS transforms)
2. Verify 60fps performance with dev tools
3. Test on slower devices/network

### If Charts Don't Resize:
1. Verify chart container uses flexible CSS (flex/grid)
2. Check for fixed width values preventing resize
3. Test chart library's responsive options

## Performance Benchmarks

### Target Metrics:
- **Layout Shift (CLS)**: < 0.1 when toggling sidebar
- **Animation Frame Rate**: 60fps during transitions
- **First Paint**: < 1s on 3G connection
- **Interaction Ready**: < 2s for chart interactions

### Mobile Performance:
- **Touch Response**: < 100ms for menu toggle
- **Scroll Performance**: 60fps for chart scrolling
- **Memory Usage**: < 50MB increase per page

This guide provides a comprehensive approach to testing the responsive UI issues using Playwright's vision capabilities while maintaining focus on accessibility and performance.