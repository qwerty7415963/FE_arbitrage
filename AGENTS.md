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
