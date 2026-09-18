# Starter template — Next.js trắng

## Mục tiêu

Đây là bộ khung tối thiểu để nhiều developer có thể cùng bắt đầu code mà không phải tự quyết định lại cấu trúc, cách định dạng và kiểm tra chất lượng. Template **không chứa nghiệp vụ Arbitrage, API integration hay màn hình sản phẩm**.

## Quyết định nền tảng

| Hạng mục | Chuẩn dùng chung |
| --- | --- |
| Framework | Next.js, App Router |
| Ngôn ngữ | TypeScript, strict mode |
| Runtime | Node.js LTS, phiên bản cố định trong file version của repository |
| Package manager | pnpm, lockfile được commit |
| Styling | Tailwind CSS |
| UI component | shadcn/ui chọn lọc, custom theme/component theo design system của dự án |
| Localization | Chuẩn bị namespace `en` và `vi`; chưa cần nội dung dịch |
| State/API | TanStack Query cho server state; Zustand cho client state dùng chung |

## Cấu trúc thư mục thống nhất

```text
src/
  app/                 # route, layout và page của Next.js
  components/
    ui/                # component hiển thị dùng chung, không chứa nghiệp vụ
    shared/            # layout và component dùng chung ở cấp ứng dụng
  features/            # mỗi nghiệp vụ là một feature độc lập
  services/            # API client và endpoint, chỉ thêm khi có API integration
  hooks/               # React hook tái sử dụng
  lib/                 # utility, config và helper
  types/               # kiểu dữ liệu dùng chung
  messages/            # nội dung en/vi
tests/                 # test độc lập với mã nguồn ứng dụng
docs/                  # tài liệu dự án
```

Quy tắc: mã chỉ phục vụ một nghiệp vụ phải nằm trong `features/<feature-name>`; không đưa vào `components`, `hooks` hoặc `lib` chỉ vì muốn tái sử dụng sớm.

## Routing

Dùng Next.js App Router. Mọi URL công khai có locale ở đầu đường dẫn; hai locale hợp lệ là `vi` và `en`.

```text
src/app/
  [locale]/
    layout.tsx
    (public)/
      page.tsx                 # /vi, /en
    (auth)/
      login/page.tsx           # /vi/login
      register/page.tsx        # /vi/register
    (protected)/
      layout.tsx               # auth guard cấp khu vực
      dashboard/page.tsx       # /vi/dashboard
      settings/page.tsx        # /vi/settings
```

- Route group `(public)`, `(auth)` và `(protected)` chỉ tổ chức source code/layout; không xuất hiện trong URL.
- `/` chuyển hướng theo locale user đã chọn hoặc `Accept-Language`; dùng `vi` khi không xác định được lựa chọn.
- Locale ngoài `vi`/`en` trả 404.
- Middleware thực hiện redirect locale và chặn nhanh truy cập protected khi không có session. Layout `(protected)` vẫn kiểm tra session/user để không tin state phía client.
- Filter, sort, pagination và lựa chọn có thể chia sẻ phải nằm trong URL search params.
- Trang chi tiết dùng dynamic segment, ví dụ `/vi/opportunities/[id]` khi feature này được tạo.
- Mỗi feature thêm `loading.tsx`, `error.tsx` và `not-found.tsx` khi cần.
- Không tạo `app/api` proxy/BFF mặc định; chỉ thêm khi có yêu cầu bảo mật hoặc ràng buộc backend.

## UI foundation

Dùng shadcn/ui làm nền component, kết hợp Tailwind CSS. shadcn/ui được thêm component vào source project nên team sở hữu và có thể chỉnh sửa toàn bộ markup/style; không dùng giao diện mặc định như một design system cuối cùng.

- Chỉ thêm component khi có nhu cầu thực tế: Button, Input, Select, Dialog, Dropdown Menu, Tooltip, Tabs, Sheet, Skeleton, Table và Toast.
- Thiết lập token màu, typography, spacing, radius và trạng thái realtime riêng của Arbitrage trước khi làm feature UI.
- Component nền không chứa logic arbitrage. Logic nghiệp vụ nằm trong `features`.
- Có thể dùng Radix primitives dưới shadcn/ui cho accessibility/behavior; visual style luôn theo design system riêng.
- Dùng Lucide cho icon và TanStack Table cho logic bảng data-dense; hai thư viện này không quyết định phong cách hiển thị.

## Đa ngôn ngữ

Dùng `next-intl` với App Router. Locale hỗ trợ là `vi` và `en`; `vi` là mặc định, nhưng mọi URL đều có locale prefix để đường dẫn rõ ràng và có thể chia sẻ.

Thứ tự chọn ngôn ngữ: locale trên URL → cookie user đã chọn → `Accept-Language` của trình duyệt → `vi`. Khi URL chưa có locale, routing layer redirect sang URL có prefix.

```text
src/messages/
  vi/
    common.json
    auth.json
    errors.json
    <feature>.json
  en/
    common.json
    auth.json
    errors.json
    <feature>.json
```

- Mỗi feature sở hữu namespace translation của mình. `common` chỉ chứa text được dùng lại thực sự.
- Internal link phải dùng helper navigation của i18n để giữ locale. Đổi ngôn ngữ giữ nguyên pathname và URL query hiện tại, đồng thời ghi cookie.
- UI text, toast, validation, empty/error state dùng translation key; không hard-code nội dung hiển thị.
- Ticker, symbol, venue code, wallet address và số liệu thị trường không dịch.
- Error backend ưu tiên map theo `error.code` sang key trong `errors`; chỉ dùng message fallback an toàn khi chưa có code.
- Định dạng số, tiền, phần trăm, ngày giờ sử dụng `Intl` theo locale.
- `en` là bộ key chuẩn. CI kiểm tra `vi` và `en` có cùng key trước khi merge.

## Thiết lập bắt buộc trước khi code feature

1. TypeScript strict, import alias `@/*` trỏ tới `src/*`.
2. ESLint cho Next.js và TypeScript.
3. Prettier là nguồn định dạng duy nhất; có import sorting nhất quán.
4. EditorConfig để thống nhất newline, indent và encoding giữa các IDE.
5. Husky/lint-staged chạy format và lint trên các file đã thay đổi trước commit.
6. CI chạy `lint`, `type-check`, `test` và `build` cho mọi pull request.
7. `.env.example` chỉ mô tả tên biến môi trường; không commit URL nội bộ, token, khóa API hay bí mật.

## Quy ước quản lý state

| Loại state | Công cụ | Ví dụ |
| --- | --- | --- |
| Server state | TanStack Query | Dữ liệu REST, cache, loading/error, mutation và đồng bộ dữ liệu WebSocket vào cache. |
| Client state dùng chung | Zustand | Sidebar đang mở, giao diện đang chọn, subscription WebSocket và state UI cần nhiều feature cùng đọc. |
| State cục bộ | React `useState` / `useReducer` | Modal của một màn hình, tab nội bộ, thao tác tạm thời của component. |
| State có thể chia sẻ/link | URL search params | Filter, sort, phân trang, venue hoặc instrument đang chọn. |
| Form state | React Hook Form khi cần form phức tạp | Xác thực, validation và trạng thái submit; không lưu form vào global store. |

Không dùng Zustand hoặc Redux để cache response API. TanStack Query chịu trách nhiệm cache, refetch, invalidation và error state của dữ liệu server. Với dữ liệu realtime tần suất cao, chỉ cập nhật phần dữ liệu cần thiết và dùng selector của Zustand để tránh render lại toàn bộ ứng dụng.

## Hạ tầng REST API và thông báo

Mọi REST request đi qua một lớp `infrastructure/api-client`; feature không gọi HTTP trực tiếp.

```text
feature → service/repository → infrastructure/api-client → HTTP
```

`api-client` đảm nhiệm gắn access token, chuẩn hoá response/error, timeout, request ID và refresh token một lần khi gặp `401`. Nếu refresh thất bại, session bị xoá và ứng dụng chuyển user về đăng nhập.

Chuẩn hiển thị thông báo:

| Tình huống | Cách xử lý |
| --- | --- |
| Lỗi validation `400/422` | Trả về form để hiển thị tại field; không toast chung. |
| Hết phiên `401` | Refresh token một lần; thất bại thì đăng xuất và chuyển về đăng nhập. |
| Không có quyền `403` | Hiển thị trạng thái không có quyền; không retry. |
| Lỗi mạng/timeout/`5xx` | Hiển thị toast lỗi có thông điệp dễ hiểu; giữ request ID cho debug nếu backend trả về. |
| Thành công | Feature quyết định thông điệp thành công theo ngữ cảnh; không tự toast cho mọi request. |

WebSocket dùng `infrastructure/ws-manager` riêng. Nó dùng chung chuẩn auth, error và notification với REST, nhưng không đi qua `api-client`.

## API contract từ OpenAPI/Swagger

Backend `arbitrage_be/docs/swagger.yaml` là nguồn chuẩn cho REST contract. Template sẽ sinh TypeScript type từ file này thay vì viết thủ công type request/response.

```text
swagger.yaml → generated API types → service/repository → feature
```

- Generated types chỉ phản ánh contract API; không chỉnh sửa trực tiếp.
- Service/repository bọc generated types để feature không phụ thuộc vào cấu trúc OpenAPI.
- Không tự sinh toàn bộ React hook; TanStack Query hook được viết tại feature để query key, cache và hành vi UI rõ ràng.
- CI sinh lại type và thất bại nếu output khác với file đã commit. Thay đổi API vì vậy được review cùng pull request.

## Kiểm tra dữ liệu tại runtime

Dùng Zod tại ranh giới hệ thống:

- Parse/kiểm tra response REST trước khi dữ liệu đi vào ứng dụng khi endpoint cần an toàn dữ liệu cao.
- Kiểm tra mọi WebSocket event trước khi cập nhật Query cache hoặc Zustand realtime store.
- Payload không hợp lệ không được render; ghi lỗi có request ID hoặc thông tin kết nối an toàn để debug.
- Zod không thay thế generated TypeScript type: type hỗ trợ lúc lập trình, validation bảo vệ dữ liệu lúc chạy.

## Quản lý môi trường

Tất cả biến môi trường được đọc qua một module cấu hình duy nhất và được kiểm tra khi ứng dụng khởi động.

| Quy tắc | Áp dụng |
| --- | --- |
| Biến client | Chỉ dùng biến có tiền tố `NEXT_PUBLIC_`. |
| Bí mật | Không đưa token, private key hay secret vào browser, source code hoặc log. |
| Môi trường | Tách local, staging và production; có `.env.example` chỉ liệt kê tên biến. |
| REST/WS endpoint | Được cấu hình bằng biến môi trường, không hard-code trong feature. |
| Thiếu/sai cấu hình | App báo lỗi rõ ở thời điểm khởi động thay vì lỗi mơ hồ khi gọi API. |

## CI/CD với GitHub Actions

GitHub Actions là hệ thống CI/CD chuẩn của repository. Workflow nằm trong `.github/workflows/` khi bắt đầu tạo source code.

### CI — bắt buộc cho mọi pull request vào `main`

```text
checkout → cài Node/pnpm → restore dependency cache → install frozen lockfile
→ format check → lint → type-check → test → OpenAPI type generation check → build
```

Pull request chỉ được merge khi toàn bộ job CI thành công. Không chạy deploy từ pull request thông thường.

### CD — chỉ sau khi merge vào `main`

```text
CI thành công → deploy staging → smoke check → chờ duyệt production → deploy production
```

- `staging`: deploy tự động sau merge vào `main`.
- `production`: deploy thủ công hoặc yêu cầu approval qua GitHub Environment.
- Bật concurrency theo từng environment để không có hai deploy cùng lúc.
- Secret và biến môi trường đặt trong GitHub Environment, tách riêng `staging` và `production`; không ghi trong workflow hoặc source code.
- Nhà cung cấp hosting chưa chốt. Job deploy sẽ được thêm sau khi chọn Vercel, AWS, Cloudflare hoặc nền tảng phù hợp.

## Cấu hình GitHub cần bật

- Branch protection cho `main`: bắt buộc pull request, ít nhất một review và tất cả CI checks pass.
- GitHub Environments: `staging` và `production`.
- `production` chỉ cho phép deploy từ `main` và có required reviewer nếu gói GitHub của repository hỗ trợ.
- Bật Dependabot cho dependency và GitHub Actions sau khi repository có manifest/workflow.

## Template không được làm ở giai đoạn này

- Không thêm authentication, WebSocket, wallet, gọi API hoặc business state.
- Không hard-code danh sách sàn, role hoặc dữ liệu trading.
- Không thêm component library lớn trước khi có yêu cầu UI.
- Không tạo trang giả hoặc mock data để tránh bị coi nhầm là đặc tả sản phẩm.

## Điều kiện hoàn thành template

- Một developer clone repository, cài dependency và chạy được ứng dụng trắng.
- Lệnh lint, type-check, test và build chạy độc lập thành công.
- Bất kỳ developer nào dùng IDE khác cũng có định dạng file nhất quán.
- Có thể tạo feature mới theo cấu trúc trên mà không phải thay đổi khung nền.
