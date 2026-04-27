# Reorganization TODO

## Phase 0 — Discovery & Taxonomy
- [ ] Audit current root markdown files and script files by purpose.
- [ ] Define target folder taxonomy for docs and scripts.
- [ ] Define `src` legacy/new separation strategy and migration boundaries.

## Phase 1 — Planning Artifacts
- [ ] Create `docs/plans/MIGRATION_PLAN.md` with phased migration, risk/effort matrix, and gates.
- [ ] Create docs index structure and folder-level README files.
- [ ] Create scripts directory taxonomy README.

## Phase 2 — Root Documentation Cleanup (git mv)
- [ ] Move root `.md` files into organized docs subdirectories using `git mv`.
- [ ] Ensure archival and legacy docs are clearly separated from active docs.
- [ ] Create/update root docs navigation entry points.

## Phase 3 — Scripts Reorganization (git mv)
- [ ] Group root shell/js/sql utility scripts into purpose-based directories using `git mv`.
- [ ] Add per-directory README with usage and ownership notes.
- [ ] Keep executable permissions and verify references.

## Phase 4 — Source Reorganization Plan Scaffolding
- [ ] Create `src/legacy` and `src/new` strategy docs (plan-level, no unsafe mass moves yet).
- [ ] Add migration map for `src` modules and route boundaries.
- [ ] Define enforcement rules (naming, import boundaries, deprecation path).

## Phase 5 — README & Navigation
- [ ] Update root `README.md` to point to new docs and scripts structure.
- [ ] Add “where to find things” section for maintainers.
- [ ] Final verification checklist.
