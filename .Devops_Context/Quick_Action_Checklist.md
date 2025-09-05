# Tonight's Quick Action Checklist
**Total Time: ~2 hours**  
**Goal: Get testing infrastructure working**

---

## 🏃‍♂️ **Phase 1: Component Test Fixes (60 mins)**

### **Task 1.1: Fix OpenAIChat Button Test (15 mins)**
- [ ] **Open file:** `src/test/__tests__/components/ai/OpenAIChat.test.tsx`
- [ ] **Find line ~15:** `screen.getByRole('button', { name: /send/i })`
- [ ] **Replace with:** `screen.getByRole('button', { type: 'submit' })`
- [ ] **Test:** `bunx vitest run src/test/__tests__/components/ai/OpenAIChat.test.tsx`
- [ ] **Expected:** Test should pass ✅

**Alternative if that doesn't work:**
- [ ] **Open:** `src/components/ai/OpenAIChat.tsx`  
- [ ] **Find submit button**
- [ ] **Add:** `data-testid="send-button"`
- [ ] **Update test to:** `screen.getByTestId('send-button')`

### **Task 1.2: Fix LoginForm Mocking (30 mins)**
- [ ] **Create file:** `src/test/mocks/setup.ts`
- [ ] **Add mock setup code:**
```typescript
import { vi } from 'vitest'

export const setupMocks = () => {
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn()
      }
    }
  }))
  
  vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
      isAuthenticated: false,
      user: null,
      isLoading: false
    })
  }))
}

// Call setup
setupMocks()
```

- [ ] **Update vitest.config.ts:**
```typescript
setupFiles: ['./src/test/setup.ts', './src/test/mocks/setup.ts']
```

- [ ] **Test:** `bunx vitest run src/test/__tests__/components/auth/LoginForm.test.tsx`

### **Task 1.3: Validate Component Tests (15 mins)**
- [ ] **Run all component tests:** `bunx vitest run src/test/__tests__/components/`
- [ ] **Check results:** At least 1 component test should pass
- [ ] **If failing:** Note specific error for tomorrow

---

## 🎭 **Phase 2: E2E Configuration (45 mins)**

### **Task 2.1: Create Playwright Config (15 mins)**
- [ ] **Create file:** `playwright.config.ts` (in project root)
- [ ] **Add configuration:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### **Task 2.2: Test E2E Setup (15 mins)**
- [ ] **Dry run:** `bunx playwright test --dry-run`
- [ ] **Expected:** Should list E2E test files without errors
- [ ] **If errors:** Check file paths in test files

### **Task 2.3: Run Basic E2E Test (15 mins)**
- [ ] **Start dev server:** `bun run dev` (separate terminal)
- [ ] **Run E2E:** `bunx playwright test src/test/e2e/auth.spec.ts --headed`
- [ ] **Expected:** Browser should open and run test
- [ ] **If failing:** Note specific error for tomorrow

---

## ✅ **Phase 3: Validation (15 mins)**

### **Task 3.1: Run Full Test Suite**
- [ ] **Unit tests:** `bunx vitest run`
- [ ] **E2E tests:** `bunx playwright test`
- [ ] **Count passing:** Should be >3 total

### **Task 3.2: Document Results**
- [ ] **Update this file** with actual results
- [ ] **Note any blockers** discovered
- [ ] **Set priorities** for tomorrow

---

## 📊 **Success Criteria**

**Minimum Success (Good Night):**
- [ ] **1 component test passing** (was 0)
- [ ] **E2E tests run without config errors** 
- [ ] **No regressions** (3 original tests still pass)

**Stretch Goals (Great Night):**
- [ ] **2+ component tests passing**
- [ ] **1+ E2E test passing**
- [ ] **Test coverage report generated**

---

## 🆘 **If You Get Stuck**

### **Common Issues & Quick Fixes**

**"Cannot find module" errors:**
```bash
bun install  # Reinstall deps
```

**Vitest not finding tests:**
```bash
bunx vitest run --reporter=verbose  # See what it finds
```

**Playwright browser issues:**
```bash
bunx playwright install  # Reinstall browsers
```

**Path alias issues (@/ imports):**
- Try changing `@/` to relative paths `../../../` in test files temporarily

### **Emergency Rollback**
If anything breaks badly:
```bash
git checkout dev-cleanup-backup  # Go back to working state
git branch -D dev-cleanup         # Delete broken branch
git checkout -b dev-cleanup-v2    # Start fresh
```

---

## 📝 **Results Log (Fill this out as you go)**

### **Component Tests Results:**
- OpenAIChat: ❓ (Not tested yet)
- LoginForm: ❓ (Not tested yet) 
- Total passing: ❓/5

### **E2E Tests Results:**
- Config created: ❓ (Not done yet)
- Dry run works: ❓ (Not tested yet)
- Auth test runs: ❓ (Not tested yet)

### **Overall Status:**
- Tests passing: 3/21 → ❓/21
- Time spent: ❓ hours
- Biggest blocker: ❓
- Next priority: ❓

---

## 🎯 **Tomorrow's Priorities (Based on Tonight)**
- [ ] ❓ (Fill based on what you discover)
- [ ] ❓ 
- [ ] ❓

**Remember: Even small progress is still progress! 🚀**