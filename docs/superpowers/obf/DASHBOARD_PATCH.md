# OBF-001-V: Dashboard.tsx patch
# Apply these two changes to src/pages/Dashboard.tsx
# The rest of the file is untouched.

# ── CHANGE 1: Add import at the top (after existing imports) ──────────────────
# Find the last import line (currently: import { DASHBOARD_ACTIONS } from ...)
# ADD after it:

import { OBFAccountPanel } from "@/components/obf";

# ── CHANGE 2: Add feature flag constant after the const declarations ──────────
# Find: const [selectedAction, setSelectedAction] = useState<DashboardActionType | null>(null);
# ADD the line below it:

const OBF_LIVE = import.meta.env.VITE_OBF_LIVE === "true";

# ── CHANGE 3: Insert OBF panel after the account cards grid ──────────────────
# Find this closing block:
#
#         {!hasWallets && (
#           <div className="animate-stagger-in [animation-delay:0.3s]">
#             <AddAccountCard />
#           </div>
#         )}
#       </div>
#
# ADD immediately after the closing </div> of the account cards grid:

      {/* OBF Accounts — Providus via onasis-gateway (gated by VITE_OBF_LIVE) */}
      {OBF_LIVE && (
        <div className="animate-fade-in [animation-delay:0.25s]">
          <OBFAccountPanel />
        </div>
      )}

# ── RESULT: Dashboard layout when VITE_OBF_LIVE=true ─────────────────────────
#
#   ┌────────────────────────────────────────────┐
#   │  ModernDashboardHeader                      │
#   ├────────────────────────────────────────────┤
#   │  Internal Wallets (ModernAccountCard × n)   │  ← unchanged
#   ├────────────────────────────────────────────┤
#   │  OBF Accounts (OBFAccountPanel)             │  ← new, gated
#   ├────────────────────────────────────────────┤
#   │  QuickActionsGrid                           │  ← unchanged
#   ├────────────────────────────────────────────┤
#   │  ModernTransactionList (internal)           │  ← unchanged
#   ├────────────────────────────────────────────┤
#   │  AIInsightsDashboard                        │  ← unchanged
#   └────────────────────────────────────────────┘
