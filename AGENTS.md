<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Orchestration Policy (RAO v1)

See `docs/AGENT_ORCHESTRATION.md` (v1). Tiers: L1 Simple / L2 Standard / L3 Critical. Hard gates: L3 plan approval, API contract approval, commit/push approval. Workers/reviewers are read-only on policy and never self-approve. Classification is by task description AND actual diff; uncertainty escalates upward; no downgrade after critical detection.

## Testing Rules

- L1 styling/copy/trivial: targeted unit/type-check if logic touched; E2E not required; no `test-cases.md` update required.
- L2/L3 new feature: unit test required; new interactive UI component: E2E required (unit cannot catch rendering).
- L2/L3: update `docs/test-cases.md` when tests/behavior change.
- Run relevant targeted tests + `pnpm type-check` before completion. Run the full `pnpm test` only per tier (L2 at most once at end; L3 as required; L1 not required). Visual snapshots only with explicit approval.
- E2E tests need backend `localhost:8080` + frontend `localhost:3000` running.
- L2 review is mandatory by default; only the narrow exemption in the policy may skip it.

## Git Rules

- **KHÔNG** commit hoặc push nếu chưa được yêu cầu rõ ràng
- Luôn hỏi trước khi commit: "Bạn muốn tôi commit + push không?"
- Chỉ commit khi user xác nhận

## Workflow & Allowlist (RAO v1)

- Allowlist: BE agent edits only `go_be_arbitrage/`; FE agent edits only `FE_arbitrage/`. Contract: `plans/wallet-groups/contract-v1.0.md` (BE) / `docs/contracts/wallet-groups-v1.0.md` (FE mirror) — owned by BE, frozen; FE mocks against it, never edits it.
- Brief template per batch: Goal / Allowlist / Acceptance criteria / Test commands / Contract link / Self-check.
- Worker report: `Batch | Agent | Files changed | Tests (cmd → result) | Deviations | Open questions`.
- Review: code-reviewer after each batch, max 2 fix rounds, then escalate to human.
- Gates: plan approval (done), contract approval (done), final commit+push approval (pending).

## Workflow (multi-agent, RAO v1)

Roles: Orchestrator plans/dispatches/reviews; BE agent edits only backend repo; FE agent edits only frontend repo; code-reviewer read-only.
Gates: HUMAN GATE 1 (plan/batch), HUMAN GATE 2 (contract, if API), final gate (commit+push). No API work before contract approved.
Brief per batch (required): Goal / Allowlist (files) / Acceptance criteria / Test commands / Contract link / Self-check checklist.
Worker report: `Batch | Agent | Files changed | Tests (cmd → result) | Deviations | Open questions`.
Review: code-reviewer after each batch, max 2 fix rounds then escalate to human.
Safety: no secrets in code; .env gitignored, only .env.example tracked; do not edit tests to make them green unless behavior intentionally changed (document reason).
FE-specific: mock against contract; do not edit contract; new interactive UI component needs e2e (unit cannot catch rendering); update docs/test-cases.md when tests/behavior change.

## Workflow Reference

See `docs/WORKFLOW.md` for the OpenCode parallel FE/BE agent workflow (roles, batch schema, gates, sync points, dispatch/verify). State: `docs/WORKFLOW_STATE.md`.
Lead may write plan/docs/state; FE/BE agents write source only within their repo allowlist. Contract is frozen in `plans/wallet-groups/contract-v1.0.md` (BE) + `docs/contracts/wallet-groups-v1.0.md` (FE mirror).
