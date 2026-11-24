<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Orchestrator v2

See `plans/supervisor/ORCHESTRATOR_V2.md`. Contract freeze before code; FE/BE workers and QA never commit; human commits. Risk-based review for concurrency, money, migrations, auth. Contract: `plans/<feature>/contract.md` (canonical BE, mirror FE).

## Testing Rules

- L1 styling/copy/trivial: targeted unit/type-check if logic touched; E2E not required; no `test-cases.md` update required.
- L2/L3 new feature: unit test required; new interactive UI component: E2E required (unit cannot catch rendering).
- L2/L3: update `docs/test-cases.md` when tests/behavior change.
- Run relevant targeted tests + `pnpm type-check` before completion. Run the full `pnpm test` only per tier (L2 at most once at end; L3 as required; L1 not required). Visual snapshots only with explicit approval.
- E2E tests need backend `localhost:8080` + frontend `localhost:3000` running.
- Risk review is auto-triggered when the diff touches concurrency, money, migrations, or auth.

## Git Rules

- **KHÔNG** commit hoặc push nếu chưa được yêu cầu rõ ràng
- Luôn hỏi trước khi commit: "Bạn muốn tôi commit + push không?"
- Chỉ commit khi user xác nhận
