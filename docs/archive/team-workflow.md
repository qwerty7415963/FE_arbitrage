# Quy ước làm việc cho team frontend

## Nhánh và pull request

- Nhánh ổn định: `main`.
- Nhánh công việc: `feature/<ten-ngan>`, `fix/<ten-ngan>`, `chore/<ten-ngan>`, `docs/<ten-ngan>`.
- Không push trực tiếp vào `main`.
- Mỗi pull request chỉ nên giải quyết một thay đổi có thể review được.
- Pull request phải qua CI và ít nhất một review trước khi merge.
- Merge vào `main` sẽ kích hoạt deploy staging sau khi CI thành công; production cần qua GitHub Environment theo chính sách deploy.

## Commit

Dùng Conventional Commits:

```text
feat: add opportunity filter
fix: prevent stale price display
docs: define team workflow
chore: update lint configuration
```

Commit mô tả kết quả thay đổi, không mô tả thao tác như “update code”.

## Trước khi mở pull request

1. Chạy format, lint, type-check, test và build.
2. Nếu Swagger thay đổi, sinh lại API types và commit output cùng thay đổi contract.
3. Cập nhật tài liệu nếu có thay đổi route, API contract, cấu hình hoặc quyết định kiến trúc.
4. Không đưa secrets, file môi trường thật, output build hoặc dependency cache vào commit.
5. Nêu rõ ảnh hưởng UI/API và cách reviewer kiểm tra trong mô tả pull request.

## Quy ước mã nguồn

- Tên file component React: `PascalCase.tsx`; utility/hook: `kebab-case.ts` hoặc `useXxx.ts`.
- TypeScript không dùng `any`; kiểu dữ liệu API phải được định nghĩa rõ.
- Không gọi HTTP trực tiếp từ component hoặc feature; mọi REST request đi qua `infrastructure/api-client`.
- Không hiển thị toast thành công từ lớp API chung; feature quyết định thông điệp theo hành động của user.
- Không chỉnh sửa API types được sinh từ Swagger; sửa Swagger/backend hoặc lớp service/repository khi contract thay đổi.
- Mọi WebSocket payload phải được kiểm tra runtime trước khi ghi vào state.
- Không hard-code text hiển thị. Text UI, toast, validation và error state phải dùng translation key; thêm key đồng thời cho `en` và `vi`.
- Không import xuyên feature. Nếu thực sự cần dùng chung, chuyển phần đó vào `components/shared`, `lib` hoặc `types` sau khi review.
- Mỗi feature chịu trách nhiệm loading, empty, error và trạng thái không có quyền của chính nó.
- Nội dung hiển thị cho user phải đi qua i18n, không viết trực tiếp trong component.

## Quản lý quyết định

Mọi thay đổi ảnh hưởng nhiều feature — ví dụ thư viện UI, xác thực, cách gọi API, cache, WebSocket hay quyền — phải được ghi trong `docs/architecture.md` trước hoặc cùng pull request. Điều này giúp developer mới hiểu lý do thay vì chỉ thấy cấu trúc mã hiện tại.
