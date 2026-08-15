# Testing Workflow

## Test Framework

**Bun test** — `bun test` runs all tests
```typescript
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Running Tests

```bash
bun test                    # Run all tests
bun test src/hooks/         # Run specific directory
bun test --watch            # Watch mode
bun test --bail             # Stop on first failure
```

## Test Structure

```
src/
├── __tests__/              # Co-located tests
├── components/
│   └── __tests__/          # Component tests
├── hooks/
│   └── __tests__/          # Hook tests
└── services/
    └── __tests__/          # Service tests
```

## Types of Tests

### Unit Tests
Test individual functions/hooks in isolation:
```typescript
test("normalizeAmount handles string", () => {
  expect(normalizeAmount("123.45")).toBe(123.45);
  expect(normalizeAmount("invalid")).toBe(0);
});
```

### Integration Tests
Test component + hook combinations:
```typescript
test("useDashboardData returns wallets", async () => {
  // Mock Supabase client
  // Render component
  // Assert on output
});
```

### Smoke Tests
```bash
node smoke-test.js          # Verify production endpoints
node test-login.js           # Test auth flow
node test-ai-functions.js    # Test AI edge functions
```

## Test Smoke Scripts

### Auth test
```bash
TEST_EMAIL=xxx TEST_PASSWORD=xxx node test-login.js
```

### AI endpoint test
```bash
node test-ai-functions.js
```

### Production verification
```bash
node smoke-test.js
```

## Writing Tests for Edge Functions

Test edge functions via curl:
```bash
# Auth-gated endpoint
curl -X POST http://localhost:54321/functions/v1/check-subscription \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Stripe webhook
curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: $SIGNATURE" \
  -d '{...}'
```

## React Testing

Use `@testing-library/react`:
```typescript
import { render, screen } from "@testing-library/react";

test("Dashboard shows wallets", () => {
  render(<Dashboard />);
  expect(screen.getByText("Primary")).toBeDefined();
});
```

## CI/CD Testing

Tests run on push via:
- GitHub Actions (`.github/workflows/`)
- Playwright for E2E (`playwright.config.ts`)

### Playwright E2E
```bash
npx playwright test           # Run all specs
npx playwright test --ui      # Interactive UI
npx playwright test --grep="" # Run matching tests
```

## Test Data

### Mock Supabase
```typescript
const mockSupabase = {
  auth: { getUser: () => ({ data: { user: mockUser } }) },
  from: () => ({
    select: () => ({
      eq: () => ({ data: mockData })
    })
  })
};
```

### Mock Environment
```typescript
import.meta.env = { VITE_OBF_LIVE: "false" };
```