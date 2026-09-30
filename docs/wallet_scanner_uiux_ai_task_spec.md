# Wallet Scanner UI/UX Redesign --- AI Coding Task Specification

## 1. Mục tiêu

Redesign giao diện **Wallet Scanner** của ứng dụng trading terminal.

Tính năng dùng để scan và khám phá các ví đang trade trên perpetual DEX,
sau đó giúp user nhanh chóng:

1.  Tìm kiếm ví.
2.  Chọn timeframe và DEX.
3.  Áp dụng các điều kiện lọc về performance/trading/risk.
4.  Scan và xem danh sách ví phù hợp.
5.  Sort và customize columns.
6.  Click một wallet để xem nhanh thông tin chi tiết.
7.  Lưu wallet vào Watchlist.
8.  Lưu một bộ filter thành Saved Scan.

### Product principle

Flow chính phải tối ưu cho:

**Filter nhanh → Scan → Nhìn kết quả → Inspect wallet → Watchlist / mở
detail**

Không biến màn hình thành một form query builder quá phức tạp.

---

# 2. Phạm vi task

## In scope

- Redesign toàn bộ UI/UX của Wallet Scanner.
- Giữ nguyên sidebar/navigation hiện tại nếu không cần thay đổi
  architecture.
- Redesign khu vực scanner:
  - Header.
  - Search/control bar.
  - Quick filters.
  - Filter presets.
  - Results table.
  - Wallet row interaction.
  - Wallet detail drawer.
  - Watchlist interaction.
  - Empty/loading/error states.
  - Responsive behavior.
- Component hóa UI để có thể mở rộng thêm metric/DEX/filter sau này.
- Không thay đổi business logic/backend/API nếu không cần thiết.
- Nếu API hiện tại chưa có dữ liệu cho một UI field, dùng adapter/mock
  data rõ ràng và đánh dấu TODO; không tự ý giả định API contract mới.

## Out of scope

- Thay đổi thuật toán tính PnL/ROI/win rate.
- Thay đổi database schema.
- Thay đổi scanner engine.
- Thay đổi cách backend query dữ liệu.
- Thêm authentication/authorization.
- Thêm trading execution.
- Thay đổi các feature khác ngoài Scanner.

---

# 3. UX hiện tại cần giải quyết

UI hiện tại đang có:

- Search.
- Timeframe.
- DEX.
- Sort + order.
- Filter rows dạng `metric + operator + value`.

Các vấn đề cần giải quyết:

1.  Filter chiếm quá nhiều diện tích.
2.  UI giống query builder/admin form hơn là trading terminal.
3.  User phải thao tác nhiều với dropdown `metric/operator/value`.
4.  Không có quick presets.
5.  Không có result-first layout.
6.  Chưa có wallet detail preview.
7.  Chưa thể hiện rõ số lượng kết quả.
8.  Chưa có watchlist flow.
9.  Metric value chưa thể hiện rõ unit.
10. Layout chưa tận dụng tốt phần diện tích bên dưới filter.

---

# 4. Target information architecture

Scanner page nên có cấu trúc:

```text
Wallet Scanner
├── Header
├── Search / Scan Controls
├── Quick Filters
├── Filter Presets
├── Results Toolbar
├── Results Table
└── Wallet Detail Drawer
```

---

# 5. Header

## Layout

```text
Wallet Scanner                         1,284 wallets indexed
Discover profitable perp traders
```

### Requirements

- Title: `Wallet Scanner`
- Subtitle:

```text
Discover and analyze perp DEX traders
```

hoặc câu tương đương ngắn gọn.

- Bên phải có trạng thái index/data nếu backend hiện tại hỗ trợ.
- Không làm header quá cao.

---

# 6. Search / Scan Controls

Thiết kế thành một control bar duy nhất.

```text
┌────────────────────────────────────────────────────────────────────┐
│ 🔍 Search wallet / ENS / tag... │ 30D │ Hyperliquid + 2 │ SCAN    │
└────────────────────────────────────────────────────────────────────┘
```

## Search

Placeholder:

```text
Search wallet / ENS / tag...
```

Có thể search:

- Wallet address.
- ENS nếu backend hỗ trợ.
- Wallet tag nếu backend hỗ trợ.

Không cần implement fuzzy search nếu backend chưa hỗ trợ.

## Timeframe

Ưu tiên segmented control nếu đủ chỗ:

```text
7D | 30D | 90D | 1Y | ALL
```

Nếu responsive không đủ chỗ, chuyển thành dropdown.

Default:

```text
30D
```

## DEX

Cho phép chọn nhiều DEX.

Ví dụ:

```text
Hyperliquid + 2
```

Dropdown:

```text
☑ Hyperliquid
☑ Extended
☐ Lighter
☐ Aster
☐ Paradex
☐ ...
```

Không hard-code danh sách DEX trong component nếu app đã có config/API.

## Scan button

Primary action:

```text
Scan
```

States:

```text
Scan
Scanning...
```

Trong lúc scan:

- Disable repeated submit.
- Hiển thị loading indicator.
- Không làm layout nhảy.

---

# 7. Quick Filters

Thay cho việc render 3--5 filter rows lớn.

Hiển thị active filters dạng chips.

Ví dụ:

```text
QUICK FILTERS

[ PnL > $10K × ]
[ Win Rate > 55% × ]
[ Volume > $1M × ]
[ + Add filter ]
```

## Filter chip behavior

Mỗi chip phải:

- Hiển thị metric.
- Hiển thị operator.
- Hiển thị formatted value.
- Có nút remove.
- Click chip để edit filter.

Ví dụ:

```text
PnL > $10K ×
```

không được hiển thị:

```text
pnl gt 10000
```

---

# 8. Add Filter

Click:

```text
+ Add filter
```

mở popover/dropdown.

Chia metric thành category.

## Performance

- PnL
- ROI
- Win Rate
- Profit Factor

## Trading

- Volume
- Trades
- Avg Position
- Avg Hold Time

## Risk

- Max Drawdown
- Liquidations
- Avg Leverage

Chỉ hiển thị những metric thực sự có trong backend.

Không tạo fake metric chỉ để làm UI.

---

# 9. Filter operators

UI không nên expose technical shorthand như:

```text
gt
lt
eq
```

Thay bằng:

```text
Greater than
Less than
Equal
Between
```

Nếu UI compact:

```text
>
<
=
Between
```

Backend adapter có thể map:

```text
Greater than → gt
Less than    → lt
Equal        → eq
Between      → between
```

---

# 10. Metric-aware input

Input phải tự hiểu unit của metric.

Ví dụ:

```text
PnL
[ $10,000 ]

ROI
[ 20 % ]

Win Rate
[ 55 % ]

Volume
[ $1M ]

Trades
[ 50 ]

Avg Hold Time
[ 4 h ]
```

Không bắt user tự nhập `$`, `%`, `h` nếu UI có thể format.

Backend vẫn nhận data type chuẩn.

---

# 11. Filter presets

Hiển thị một hàng preset nhỏ.

```text
Presets:

[ Consistent Traders ]
[ High PnL ]
[ High Win Rate ]
[ Low Drawdown ]
[ Active Traders ]
[ Custom ]
```

## Behavior

Preset chỉ là shortcut để populate filters.

Ví dụ:

### Consistent Traders

```text
PnL > $10K
Win Rate > 55%
Trades > 30
```

Nếu backend có Max Drawdown:

```text
Max Drawdown < 20%
```

### High PnL

```text
PnL > $20K
```

### High Win Rate

```text
Win Rate > 60%
```

### Low Drawdown

```text
Max Drawdown < 15%
```

### Active Traders

```text
Trades > 100
```

### Important

Các giá trị trên phải được để trong cấu hình constants/config, không
hard-code rải rác trong component.

Preset không phải scoring/ranking system. Nó chỉ là filter shortcut.

---

# 12. Advanced Filters

Không hiển thị complex AND/OR builder mặc định.

Nếu cần hỗ trợ:

```text
+ Advanced filters
```

Mở UI cho:

```text
(
  Win Rate > 60%
  AND
  PnL > $20K
)
OR
(
  Profit Factor > 2.5
  AND
  Volume > $10M
)
```

Chỉ implement nếu backend/API hiện tại hỗ trợ logical groups.

Nếu backend chưa hỗ trợ, không tạo UI giả.

---

# 13. Results Section

Sau khi scan:

```text
127 wallets found
```

Results toolbar:

```text
127 WALLETS FOUND

Sort: [ PnL ↓ ]       Columns ⚙       [Table]
```

## Sort

Các option nên hỗ trợ nếu backend có:

- PnL
- ROI
- Win Rate
- Volume
- Trades
- Max Drawdown

Direction:

```text
Ascending
Descending
```

Default:

```text
PnL descending
```

Nếu business logic hiện tại có default khác, giữ behavior hiện tại.

---

# 14. Results Table

Table là phần quan trọng nhất của page.

Suggested columns:

```text
Wallet
PnL
ROI
Win Rate
Volume
Trades
Max Drawdown
```

Có thể thêm:

```text
Avg Position
Avg Hold Time
Profit Factor
```

nhưng không hiển thị quá nhiều mặc định.

## Example

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Wallet        PnL       ROI     Win Rate   Volume    Trades    DD    │
├──────────────────────────────────────────────────────────────────────┤
│ ☆ 0x82...91a  +$84.2K   +42.8%   68.4%    $12.4M     184    11.8% │
│ ☆ 0x71...a31  +$61.8K   +31.2%   64.1%     $8.2M     121    14.2% │
│ ☆ 0x93...8bc  +$48.1K   +27.4%   71.2%     $6.8M      94     9.4% │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 15. Wallet column

Wallet cell nên có:

```text
☆ 0x82...91a
```

Có thể hiển thị tag bên dưới nếu data có:

```text
☆ 0x82...91a
  Smart Money
```

Requirements:

- Shorten address.
- Full address khi hover/click nếu cần.
- Copy address action.
- Watchlist star.

Không tự gán label/tag cho wallet nếu backend không cung cấp.

---

# 16. Number formatting

Tất cả number phải dùng formatter chung.

Ví dụ:

```text
84231.22 → $84.2K
12400000 → $12.4M
0.428    → 42.8%
```

Rules:

- Currency: `$84.2K`, `$1.24M`.
- Percentage: `42.8%`.
- Integer: `184`.
- Large values không được render raw nếu có thể làm table khó đọc.
- Tooltip có thể hiển thị exact value.

Ví dụ:

```text
+$84.2K
```

hover:

```text
+$84,231.22
```

---

# 17. PnL visualization

Nếu backend có historical PnL/equity data, thêm sparkline nhỏ.

Ví dụ:

```text
PnL
+$84.2K

╭──╮
│  ╰──╮
│     ╰────╮
│          ╰──
```

Requirements:

- Không làm row quá cao.
- Sparkline chỉ là visual aid.
- Không thay thế numerical value.
- Nếu không có historical data thì không render fake chart.

---

# 18. Wallet Detail Drawer

Click một row mở drawer bên phải.

Không bắt user rời Scanner page.

Structure:

```text
┌──────────────────────────────┐
│ Wallet                   ×   │
│ 0x82...91a               ↗   │
│                              │
│ +$84.2K                      │
│ +42.8% ROI                   │
│                              │
│ ───────────────────────────  │
│                              │
│ EQUITY CURVE                 │
│                              │
│ [chart]                      │
│                              │
│ PERFORMANCE                  │
│ Win Rate          68.4%      │
│ Profit Factor      2.41      │
│ Max Drawdown      11.8%      │
│ Avg Position      $67K       │
│ Avg Hold          3.2h       │
│                              │
│ POSITIONS                    │
│ BTC              +$21K       │
│ ETH              +$14K       │
│ SOL               +$8K       │
│                              │
│ ☆ Add to Watchlist           │
│                              │
│ [ Open Wallet Details ↗ ]    │
└──────────────────────────────┘
```

## Drawer requirements

- Desktop: right-side drawer.
- Width khoảng 360--440px.
- Mobile/tablet: chuyển thành full-screen modal/sheet.
- Drawer không reset scanner state.
- Khi đóng drawer phải giữ nguyên filters, sort và scroll position.

---

# 19. Watchlist

Mỗi wallet có star:

```text
☆
```

Selected:

```text
★
```

Behavior:

- Click không mở drawer.
- Toggle watchlist.
- Optimistic UI nếu API hỗ trợ.
- Nếu request fail phải rollback UI và hiển thị error.

Có thể thêm toolbar:

```text
All | Watchlist | Recently Viewed
```

Chỉ implement nếu backend đã có persistence.

---

# 20. Saved Scans

Nếu backend hỗ trợ persistence:

```text
Saved Scans

★ Smart Money
   PnL > $20K
   Win Rate > 60%

★ High Conviction
   Avg Position > $50K
   Win Rate > 55%
```

Action:

```text
Save current scan
```

Saved scan nên lưu:

```text
name
timeframe
dexes
filters
sort
visible columns
```

Không cần lưu result data.

Khi load saved scan:

```text
restore filters
restore timeframe
restore DEX
restore sort
run scan
```

---

# 21. Empty states

## Chưa scan

```text
Find profitable perp traders

Set your filters and run a scan to discover wallets.

[ Scan wallets ]
```

## Không có kết quả

```text
No wallets found

Try:
• Lowering your minimum PnL
• Reducing the Win Rate requirement
• Expanding the timeframe
• Selecting more DEXs

[ Clear filters ]
```

Không dùng message kiểu:

```text
Nothing here.
```

vì không giúp user xử lý vấn đề.

---

# 22. Loading state

Trong lúc scan:

- Scan button → `Scanning...`
- Table giữ header.
- Rows dùng skeleton.
- Không render blank screen.
- Không thay đổi page height liên tục.

Ví dụ:

```text
127 wallets found

Wallet          PnL        ROI       Win Rate
─────────────────────────────────────────────
██████████      █████      █████     █████
██████████      █████      █████     █████
██████████      █████      █████     █████
```

---

# 23. Error state

Nếu scan API fail:

```text
Unable to scan wallets

The scanner could not load results.

[ Retry ]
```

Không expose raw backend error cho user.

Raw error chỉ đưa vào console/logging.

---

# 24. Responsive behavior

## Desktop

Ưu tiên desktop trading terminal.

- Full table.
- Drawer bên phải.
- Filter chips.
- Multiple columns.

## Tablet

- Reduce columns.
- DEX chuyển dropdown.
- Filter presets horizontal scroll.

## Mobile

Không cố nhét full table.

Card/list:

```text
0x82...91a       ☆

+$84.2K
+42.8% ROI

Win Rate    68.4%
Volume      $12.4M
Trades      184

[ View ]
```

Click card mở detail sheet.

---

# 25. Visual design

Giữ dark trading terminal aesthetic hiện tại.

## Principles

- Dark background.
- High contrast nhưng không quá nhiều màu.
- Green chỉ dành cho positive values/primary action.
- Red dành cho negative/risk/error.
- Neutral text cho labels.
- Border subtle.
- Không dùng quá nhiều card nesting.
- Không tạo shadow nặng.
- Density cao nhưng vẫn readable.

## Hierarchy

```text
Primary:
Wallet / PnL / main action

Secondary:
ROI / Win Rate / Volume

Tertiary:
labels / metadata / helper text
```

Không dùng màu sắc để biểu diễn mọi thứ.

---

# 26. Interaction rules

## Scan

```text
User changes filters
        ↓
No automatic API call
        ↓
User clicks Scan
        ↓
Run scanner
        ↓
Update results
```

Trừ khi product hiện tại đã có auto-scan behavior.

## Remove filter

```text
Click ×
↓
Remove filter
↓
Do not auto-scan
↓
User clicks Scan
```

Điều này tránh API spam.

## Edit filter

```text
Click chip
↓
Open filter popover
↓
Edit
↓
Save
↓
Update chip
```

Không tự scan.

---

# 27. State model

UI cần quản lý rõ các state:

```text
searchQuery
timeframe
selectedDexes
filters[]
sortBy
sortDirection
visibleColumns[]
isScanning
results[]
resultCount
selectedWallet
watchlistedWallets
savedScans[]
```

Không duplicate state giữa parent/child nếu không cần thiết.

Single source of truth cho scanner query.

---

# 28. Suggested filter model

Frontend model:

```ts
type FilterOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';

type WalletMetric =
  | 'pnl'
  | 'roi'
  | 'win_rate'
  | 'profit_factor'
  | 'volume'
  | 'trades'
  | 'avg_position'
  | 'avg_hold_time'
  | 'max_drawdown'
  | 'liquidations'
  | 'avg_leverage';

interface WalletFilter {
  id: string;
  metric: WalletMetric;
  operator: FilterOperator;
  value: number;
  valueTo?: number;
}
```

Do not introduce this model if an existing shared domain model already
provides equivalent functionality. Reuse existing types where possible.

---

# 29. Component architecture

Suggested component tree:

```text
WalletScannerPage
│
├── ScannerHeader
│
├── ScannerControls
│   ├── WalletSearch
│   ├── TimeframeSelector
│   ├── DexSelector
│   └── ScanButton
│
├── ScannerFilters
│   ├── FilterChips
│   ├── AddFilterPopover
│   ├── FilterPresets
│   └── AdvancedFilterBuilder
│
├── ScannerResults
│   ├── ResultsToolbar
│   ├── WalletTable
│   │   ├── WalletRow
│   │   ├── WalletCell
│   │   ├── MetricCell
│   │   └── PnlSparkline
│   ├── WalletCard
│   └── Pagination
│
├── WalletDetailDrawer
│   ├── WalletSummary
│   ├── EquityChart
│   ├── PerformanceStats
│   ├── PositionBreakdown
│   └── WatchlistAction
│
└── ScannerStateViews
    ├── InitialState
    ├── LoadingState
    ├── EmptyState
    └── ErrorState
```

AI coder phải ưu tiên reuse existing components/design system trước khi
tạo component mới.

---

# 30. API integration rules

Trước khi code:

1.  Inspect existing Scanner API.
2.  Inspect existing types.
3.  Inspect current filter payload.
4.  Inspect current result schema.
5.  Inspect existing DEX configuration.
6.  Inspect existing sorting implementation.

Không tự tạo API mới nếu API hiện tại đã đáp ứng.

Nếu API thiếu field:

```text
TODO:
Backend/API currently does not provide X.
Do not fabricate X.
Use a feature flag/conditional rendering or document the required API change.
```

---

# 31. Backward compatibility

Redesign không được làm hỏng:

- Existing scanner API.
- Existing filters.
- Existing sorting.
- Existing pagination.
- Existing DEX selection.
- Existing query params nếu scanner đang sử dụng URL state.
- Existing permissions.
- Existing analytics/tracking events.

Nếu cần thay đổi contract, phải document rõ trước khi implement.

---

# 32. Accessibility

Requirements:

- Keyboard navigation.
- Focus state rõ ràng.
- Buttons phải có accessible label.
- Icon-only button phải có tooltip/aria-label.
- Color không phải cách duy nhất để phân biệt positive/negative state.
- Modal/drawer trap focus nếu component system yêu cầu.
- Escape đóng drawer/popover.

---

# 33. Performance

Scanner có thể trả về nhiều wallets.

Requirements:

- Không render quá nhiều DOM nếu result list lớn.
- Nếu backend trả hàng nghìn rows, cân nhắc virtualization.
- Debounce search input nếu search trigger API.
- Không gọi scan API mỗi lần filter thay đổi.
- Memoize expensive formatting/calculation nếu cần.
- Sparkline không được làm table render chậm đáng kể.

---

# 34. Testing requirements

AI coder bắt buộc viết test cho phần UI logic mới.

## Unit tests

Test:

- Filter chip formatting.
- Metric formatting.
- Currency formatting.
- Percentage formatting.
- Filter operator mapping.
- Preset → filters mapping.
- Add/remove/edit filter.
- Sort state.
- DEX selection.
- Watchlist toggle state.

## Component tests

Test:

1.  Scanner renders initial state.
2.  User can add filter.
3.  User can remove filter.
4.  User can edit filter.
5.  User can select timeframe.
6.  User can select multiple DEX.
7.  Scan button enters loading state.
8.  Results render after successful scan.
9.  Empty state renders when result count = 0.
10. Error state renders on API failure.
11. Clicking wallet opens detail drawer.
12. Closing drawer preserves scanner state.
13. Watchlist can be toggled.
14. Responsive/mobile layout does not expose desktop-only table
    interactions.

## Integration tests

At minimum:

```text
Set filters
→ click Scan
→ mock API
→ results appear
→ click wallet
→ detail drawer opens
→ close drawer
→ filters/results remain unchanged
```

---

# 35. Acceptance Criteria

Task chỉ được xem là hoàn thành khi:

### Layout

- [ ] Scanner có clear visual hierarchy.
- [ ] Search/control bar nằm trên filter.
- [ ] Active filters hiển thị bằng chips.
- [ ] Filter không chiếm phần lớn màn hình.
- [ ] Results chiếm phần lớn diện tích page.
- [ ] Không còn 3 filter rows lớn mặc định như UI cũ.

### Filtering

- [ ] Add filter hoạt động.
- [ ] Remove filter hoạt động.
- [ ] Edit filter hoạt động.
- [ ] Metric có đúng unit.
- [ ] Operator được map đúng backend.
- [ ] Presets hoạt động nếu backend support.
- [ ] Không auto-scan khi chỉ thay đổi filter, trừ khi behavior cũ yêu
      cầu.

### Results

- [ ] Result count hiển thị.
- [ ] Sorting hoạt động.
- [ ] Numbers được format.
- [ ] Wallet address được truncate.
- [ ] Wallet có watchlist action nếu persistence có sẵn.
- [ ] Table không overflow trên desktop.

### Wallet detail

- [ ] Click row mở drawer.
- [ ] Drawer không navigate away.
- [ ] Drawer có summary + metrics.
- [ ] Đóng drawer giữ nguyên scanner state.

### States

- [ ] Initial state.
- [ ] Loading state.
- [ ] Empty state.
- [ ] Error state.

### Quality

- [ ] Reuse existing design system/components.
- [ ] Không duplicate business logic.
- [ ] Không hard-code API data.
- [ ] Không tạo fake metrics.
- [ ] Tests pass.
- [ ] Existing scanner functionality không bị regression.
- [ ] No TypeScript/lint/build errors.

---

# 36. Implementation phases

## Phase 1 --- Audit

AI phải trước tiên inspect:

```text
- Existing Scanner page
- Scanner components
- API/service
- Types
- Existing design system
- Existing table
- Existing drawer/modal
- Existing formatting utilities
- Existing tests
```

Output trước khi code:

```text
1. Current architecture
2. Reusable components
3. API contract
4. Missing fields
5. Proposed files to modify
6. Potential risks
```

Không code ngay trước khi audit.

---

## Phase 2 --- Core redesign

Implement:

```text
Header
Search
Timeframe
DEX selector
Scan button
Filter chips
Add filter
Results toolbar
Results table
```

Sau phase này:

- Run unit tests.
- Run component tests.
- Run lint.
- Run typecheck.
- Run build.

---

## Phase 3 --- Wallet detail

Implement:

```text
WalletDetailDrawer
WalletSummary
PerformanceStats
Positions
Watchlist
```

Không fabricate data.

Nếu API chưa có data:

```text
TODO/API GAP
```

và hide phần đó.

---

## Phase 4 --- Presets + Saved Scan

Implement:

```text
Filter Presets
Saved Scans
```

Chỉ implement persistence nếu backend hiện tại support.

---

## Phase 5 --- Polish

Review:

- Responsive.
- Keyboard navigation.
- Loading.
- Empty state.
- Error state.
- Micro-interactions.
- Number formatting.
- Table density.
- Performance.

---

# 37. AI coding rules

AI coder phải tuân thủ:

### Rule 1 --- Inspect before modify

Không sửa component trước khi hiểu:

```text
existing architecture
existing API
existing state management
existing design system
```

### Rule 2 --- Reuse before create

Ưu tiên:

```text
existing Button
existing Input
existing Select
existing Table
existing Drawer
existing Badge
existing Tooltip
existing formatting utilities
```

Không tạo component duplicate.

### Rule 3 --- No fake backend

Không tự tạo:

```text
fake API
fake metric
fake wallet performance
fake historical chart
```

chỉ để UI trông đẹp.

Nếu cần demo data, phải dùng mock fixture rõ ràng và không trộn vào
production path.

### Rule 4 --- No unnecessary backend changes

UI redesign không phải lý do để refactor backend.

### Rule 5 --- Small incremental changes

Mỗi phase:

```text
Implement
→ Test
→ Typecheck
→ Lint
→ Build
→ Review diff
```

### Rule 6 --- Preserve behavior

Nếu UI cũ đang support behavior mà spec không yêu cầu bỏ, giữ behavior
đó.

### Rule 7 --- Document API gaps

Nếu UI requirement không thể implement vì backend thiếu field:

```text
API GAP:
Field:
Endpoint:
Current response:
Required response:
Impact:
```

Không tự đoán.

### Rule 8 --- Do not over-engineer

Không implement:

- Complex state machine nếu không cần.
- Advanced query builder nếu backend chưa support.
- Virtualization cho vài chục rows.
- New global state chỉ để giữ local scanner state.

---

# 38. Definition of Done

```text
[ ] UI redesign completed
[ ] Existing Scanner functionality preserved
[ ] Filter chips implemented
[ ] Add/Edit/Delete filters implemented
[ ] Search implemented/preserved
[ ] Timeframe implemented/preserved
[ ] Multi-DEX implemented/preserved
[ ] Sort implemented/preserved
[ ] Results table implemented
[ ] Wallet detail drawer implemented
[ ] Watchlist implemented if supported
[ ] Empty/loading/error states implemented
[ ] Responsive layout implemented
[ ] Unit tests pass
[ ] Component tests pass
[ ] Integration tests pass
[ ] Typecheck passes
[ ] Lint passes
[ ] Build passes
[ ] No console errors
[ ] No fake production data
[ ] API gaps documented
[ ] Existing scanner regression check completed
```

---

# 39. Final instruction to AI coder

Do not treat this document as permission to rewrite the entire Scanner
module.

Your first task is **AUDIT**.

After auditing the existing codebase, produce:

```text
## Audit Result

### Existing architecture
...

### Existing reusable components
...

### Existing API
...

### Existing state management
...

### Existing tests
...

### Required UI changes
...

### API gaps
...

### Files to modify
...

### Files to create
...

### Risks
...
```

Then implement the redesign **phase by phase**.

For every phase:

```text
1. Explain planned changes.
2. Implement.
3. Add/update tests.
4. Run tests.
5. Run typecheck.
6. Run lint.
7. Run build when appropriate.
8. Report changed files.
9. Report remaining issues/API gaps.
```

Do not mark the task complete if tests/typecheck/lint/build fail.
