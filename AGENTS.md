<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Testing Rules

- Mỗi feature mới **bắt buộc** có unit test trong `tests/unit/`
- Mỗi flow mới **bắt buộc** có E2E test trong `tests/e2e/`
- Cập nhật `docs/test-cases.md` khi thêm test mới
- Chạy `pnpm test` trước khi commit
- Chạy `pnpm type-check` để kiểm tra type
- E2E tests cần backend `localhost:8080` + frontend `localhost:3000` đang chạy

## Git Rules

- **KHÔNG** commit hoặc push nếu chưa được yêu cầu rõ ràng
- Luôn hỏi trước khi commit: "Bạn muốn tôi commit + push không?"
- Chỉ commit khi user xác nhận
