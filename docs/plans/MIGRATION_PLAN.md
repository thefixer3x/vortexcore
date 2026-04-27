# VortexCore Reorganization Migration Plan

## Objective

Create a codebase that is easy to reference, navigate, and evolve by:
- separating legacy context from new implementation,
- organizing root-level documentation and operational assets,
- grouping scripts by purpose,
- preserving Git history with `git mv`,
- enforcing phased migration with explicit risk/effort controls.

This plan intentionally excludes “quick wins” and uses controlled phase gates.

---

## Guiding Principles

1. **History-preserving moves only**: use `git mv` for relocations.
2. **Separation before optimization**: separate legacy/new and active/archive first.
3. **No hidden big-bang**: move in bounded phases with verification.
4. **Discoverability first**: every major directory has a `README.md`.
5. **Single source of truth**: top-level `README.md` links to docs index.

---

## Target Repository Information Architecture

## Docs structure (active + archived)

- `docs/index/` — global indexes and navigation maps.
- `docs/plans/` — implementation plans, action plans, roadmaps.
- `docs/reports/` — audit reports, findings, performance/security reports.
- `docs/runbooks/` — troubleshooting, incident response, operational playbooks.
- `docs/guides/` — setup/integration/deployment guides.
- `docs/testing/` — testing plans and validation summaries.
- `docs/architecture/` — architecture decisions, module boundaries, layout strategy.
- `docs/migration/` — migration-specific guides, impact analyses, schema summaries.
- `docs/archive/` — deprecated/legacy historical docs no longer active.

## Scripts structure (purpose-based)

- `scripts/deployment/`
- `scripts/security/`
- `scripts/migration/`
- `scripts/database/`
- `scripts/auth/`
- `scripts/testing/`
- `scripts/diagnostics/`
- `scripts/maintenance/`
- `scripts/env/`
- `scripts/webhooks/`

## Source structure strategy (phased, safe)

No immediate mass `src/` code moves in this first restructuring wave.  
Instead, define migration boundaries and then move feature-by-feature:

- `src/legacy/` — current implementation modules not yet migrated.
- `src/new/` — new implementation aligned to target architecture.
- `src/shared/` (or existing shared dirs) — stable shared primitives (ui/lib/types).

Planned target in later phases:
- `src/new/app/` (bootstrap, providers, router shell)
- `src/new/features/<feature>/` (ui/hooks/services/routes/types/tests)
- `src/new/shared/` (design system wrappers, utilities, constants)

---

## Phased Migration Plan (No Quick Wins)

## Phase 1 — Foundation & Taxonomy (Current)
**Goal**: establish structure and documentation skeleton.

### Tasks
- Create docs/scripts target directories.
- Create migration plan and index readmes.
- Define classification rules for md and script files.
- Add root navigation updates (README links).

### Risk
- Low (mostly additive).

### Effort
- Medium (taxonomy clarity and consistency).

### Exit Criteria
- Directory scaffolding and plan docs exist.
- Team can classify files unambiguously.

---

## Phase 2 — Root Markdown Consolidation with `git mv`
**Goal**: clean root and move docs into purpose-based folders.

### Tasks
- Move root `.md` files into `docs/*` categories.
- Keep `README.md` at root.
- Place stale/historical docs under `docs/archive/`.
- Add docs index map (`docs/index/README.md`).

### Risk
- Medium:
  - Broken links in markdown references.
  - Temporary confusion during transition.

### Effort
- Medium–High (many files + link validation).

### Controls
- Move in batches by category.
- Verify references after each batch.
- Commit per category.

### Exit Criteria
- Root has only essential top-level files.
- All moved docs are index-linked and discoverable.

---

## Phase 3 — Script Reorganization with `git mv`
**Goal**: move loose scripts into purpose-grouped script directories.

### Tasks
- Classify each loose root script into taxonomy.
- Move using `git mv`.
- Add folder-level READMEs with usage and owners.
- Preserve executable bits and update invocation docs.

### Risk
- Medium–High:
  - Broken CI/local commands due to path changes.
  - Hidden external references to old script paths.

### Effort
- High (many scripts with mixed responsibilities).

### Controls
- Generate move manifest first.
- Search/replace references in docs and workflows.
- Validate with smoke execution of representative scripts.

### Exit Criteria
- Root script sprawl removed.
- Script locations are logical and documented.

---

## Phase 4 — `src` Legacy/New Separation (Controlled)
**Goal**: establish non-confusing modernization path.

### Tasks
- Introduce `src/legacy` and `src/new` boundaries.
- Define import boundary policy:
  - `new` may depend on `shared`,
  - `legacy` isolated except transitional adapters.
- Migrate one domain at a time (e.g., auth, dashboard, payments).
- Keep router integration explicit per migrated area.

### Risk
- High:
  - Import path breakage.
  - Circular dependencies while straddling old/new.
  - Test and route regressions.

### Effort
- Very High (core application behavior and routing).

### Controls
- Phase by domain, not by file type.
- Add lint/path rules and ADR notes.
- Run tests/build on each domain migration commit.

### Exit Criteria
- Clear old/new boundaries in code.
- Route-level behavior validated for migrated domains.

---

## Phase 5 — Final Normalization & Governance
**Goal**: lock clean structure and prevent drift.

### Tasks
- Enforce naming/location conventions.
- Add contribution docs for where files belong.
- Add CI checks for forbidden root doc/script additions.
- Archive obsolete documents and scripts.

### Risk
- Medium (process adoption).

### Effort
- Medium.

### Exit Criteria
- Structure is self-explanatory and sustained by tooling/docs.

---

## Risk / Effort Matrix

| Workstream | Risk | Effort | Primary Failure Mode | Mitigation |
|---|---|---:|---|---|
| Docs consolidation | Medium | Medium-High | Broken links, misplaced context | Batch moves + link checks + docs index |
| Scripts relocation | Medium-High | High | Broken script references | Move manifest + grep references + smoke run |
| src legacy/new separation | High | Very High | Runtime regressions/import churn | Domain-by-domain migration + tests + boundaries |
| Governance hardening | Medium | Medium | Structure drift reappears | CI guardrails + contribution docs |

---

## Classification Rules

## Markdown files
- **Guides/setup/how-to** → `docs/guides/`
- **Action plans/roadmaps/checklists** → `docs/plans/`
- **Findings/reports/summaries/audits** → `docs/reports/`
- **Troubleshooting/incident/runbook** → `docs/runbooks/`
- **Testing plans/reports/validation** → `docs/testing/`
- **Migration/impact/schema migration context** → `docs/migration/`
- **Historical/obsolete superseded** → `docs/archive/`

## Scripts/files
- `deploy*`, platform deploy utilities → `scripts/deployment/`
- `security*`, secret scans/fixes → `scripts/security/`
- `migrate*`, migration orchestration → `scripts/migration/`
- db checks/sql helpers wrappers → `scripts/database/`
- auth-related fixes/tests/setup → `scripts/auth/`
- test runners/smoke scripts → `scripts/testing/`
- inspect/debug/investigate scripts → `scripts/diagnostics/`
- cleanup/restore/maintenance tools → `scripts/maintenance/`
- env/setup/config helper scripts → `scripts/env/`
- webhook scripts → `scripts/webhooks/`

---

## Deliverables

1. `docs/plans/MIGRATION_PLAN.md` (this file)
2. `docs/index/README.md` (documentation navigation)
3. Folder READMEs under docs and scripts categories
4. Updated root `README.md` with new navigation
5. Relocation commits using `git mv` (traceable history)

---

## Commit Strategy

Recommended commit sequence:
1. `chore(structure): add docs/scripts taxonomy and migration plan`
2. `chore(docs): move root markdown files into docs categories using git mv`
3. `chore(scripts): reorganize loose scripts by purpose using git mv`
4. `docs(readme): update root and docs index navigation`
5. `docs(architecture): add legacy/new source migration map and boundaries`

---

## Definition of Done

- Root directory is clean and intentional.
- All major directories are documented with `README.md`.
- Documentation is categorized and indexed.
- Scripts are purpose-grouped and discoverable.
- Legacy/new migration path is explicit and non-confusing.
- All relocations preserve Git history via `git mv`.
