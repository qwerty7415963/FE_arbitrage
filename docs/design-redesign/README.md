# HyperScan AI — Design System Redesign

**Direction:** Graphite & Acid Lime. Graphite defines structure; acid lime is a selective interaction accent; financial colors carry financial meaning; Dark and Light share the same semantics.

**Status:** implementation complete through Phase 6 (see consolidated plan). This folder is intentionally two files:

- `README.md` — executive summary, decisions, status.
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — consolidated audit, tokens, impact analysis, migration plan, risks, and acceptance criteria (sections 01–05).

## Current problems solved by this plan

1. Dark-only UI with no light theme or persisted theme choice.
2. Two token systems (app + landing) and unused `--chart-1..5`.
3. Inconsistent financial colors: PnL sometimes `text-primary`, sometimes `emerald-400`; short is `blue-500` in one component and `rose-500` in another.
4. Five copies of amber warning banners; light-mode contrast failures.
5. Hardcoded series colors in charts; no light/dark chart baselines.

## What shipped

- Theme store + no-FOUC script, `light` / `dark` / `system`, persisted in `localStorage` (`hyperscan.theme`).
- Light `:root` and `.dark` token blocks for foundation, text, brand, interactive, semantic, financial, direction, wallet, alert, and chart tokens.
- Shared primitives, feature surfaces, charts, and hierarchy aligned to tokens.
- Theme toggle in desktop header and Settings.
- Legacy raw palette classes removed; visual baselines regenerated.

## Decisions

1. Light primary: lime fill + dark ink + `#5F7D18` boundary border.
2. Long/short: green/red with labels and signs (industry convention).
3. Base font size: 17px (kept).
4. Landing: migrated to app tokens (no separate dark-only palette).
5. Chart palette: `--chart-1..8` with light-safe variants.
6. Phased migration: foundation → shared → features → charts → hierarchy → QA.

## Verification

- `pnpm type-check`, `pnpm lint`, `pnpm build` pass.
- Unit: 661/664 (3 pre-existing groups auth/notify failures).
- E2E: accessibility 9/9, visual 9/9 (baselines regenerated), wallet-tabs 18/18, groups 38/38, funding pass.
- No business logic/API/type changes.
