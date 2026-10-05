# Test Cases - Arbitrage FE

> Single source of truth cho test cases. Cập nhật file này khi thêm feature mới.

---

## I. Manual Test Cases (API-level)

### 1. Email Auth

| #   | Case                  | Endpoint             | Input                           | Expected                              |
| --- | --------------------- | -------------------- | ------------------------------- | ------------------------------------- |
| M6  | Get profile OK        | `GET /auth/me`       | `Authorization: Bearer <valid>` | 200 `{ id, email, role, status }`     |
| M7  | Get profile no token  | `GET /auth/me`       | Không có header                 | 401                                   |
| M8  | Get profile expired   | `GET /auth/me`       | Expired JWT                     | 401                                   |
| M9  | Refresh token OK      | `POST /auth/refresh` | `{ refresh_token }` hợp lệ      | 200 `{ access_token, refresh_token }` |
| M10 | Refresh token expired | `POST /auth/refresh` | `{ refresh_token }` invalid     | 401                                   |
| M11 | Logout                | `POST /auth/logout`  | `Authorization: Bearer <valid>` | 204                                   |

### 2. Wallet Auth

| #   | Case                  | Endpoint                   | Input                    | Expected                    |
| --- | --------------------- | -------------------------- | ------------------------ | --------------------------- |
| W1  | Get nonce OK          | `POST /auth/wallet/nonce`  | `{ address, chain_id }`  | 200 `{ nonce, expires_at }` |
| W2  | Get nonce sai address | `POST /auth/wallet/nonce`  | `{ address: "xxx" }`     | 400                         |
| W3  | Verify OK (user mới)  | `POST /auth/wallet/verify` | `{ message, signature }` | 200 `AuthResponse`          |
| W4  | Verify OK (user cũ)   | `POST /auth/wallet/verify` | `{ message, signature }` | 200 `AuthResponse`          |
| W5  | Verify nonce expired  | `POST /auth/wallet/verify` | Nonce hết hạn            | 401 `NONCE_EXPIRED`         |
| W6  | Verify sai signature  | `POST /auth/wallet/verify` | `{ message, wrong_sig }` | 401 `INVALID_SIGNATURE`     |
| W7  | List wallets          | `GET /auth/wallet/list`    | `Bearer <valid>`         | 200 `WalletResponse[]`      |
| W8  | Unlink wallet         | `DELETE /auth/wallet/{id}` | `Bearer <valid>`         | 204                         |

---

## II. Unit Tests

### Coverage Summary

| Module                                                | File                                                       | Tests   | Status |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------- | ------ |
| `lib/token.ts`                                        | `tests/unit/lib/token.test.ts`                             | 14      | ✅     |
| `stores/auth.ts` (wallet-only)                        | `tests/unit/stores/auth.test.ts`                           | 11      | ✅     |
| `services/auth.ts`                                    | `tests/unit/services/auth.test.ts`                         | 8       | ✅     |
| `services/funding-arbitrage.ts`                       | `tests/unit/services/funding-arbitrage.test.ts`            | 13      | ✅     |
| `components/group-form.tsx`                           | `tests/unit/components/group-form.test.tsx`                | 7       | ✅     |
| `components/group-detail-page.tsx`                    | `tests/unit/components/group-detail-page.test.tsx`         | 9       | ✅     |
| `components/trader-filters.tsx`                       | `tests/unit/components/trader-filters.test.tsx`            | 6       | ✅     |
| `components/trader-table.tsx`                         | `tests/unit/components/trader-table.test.tsx`              | 9       | ✅     |
| `traders/_components/scanner-header.tsx`              | `tests/unit/components/scanner-header.test.tsx`            | 9       | ✅     |
| `components/add-to-trader-group-modal.tsx`            | `tests/unit/components/add-to-trader-group-modal.test.tsx` | 5       | ✅     |
| `components/saved-searches.tsx`                       | `tests/unit/components/saved-searches.test.tsx`            | 2       | ✅     |
| `app/[locale]/(protected)/traders/page.tsx`           | `tests/unit/components/trader-scanner-page.test.tsx`       | 15      | ✅     |
| `app/[locale]/(protected)/traders/[address]/page.tsx` | `tests/unit/components/trader-detail-page.test.tsx`        | 8       | ✅     |
| `components/copy-address.tsx`                         | `tests/unit/components/copy-address.test.tsx`              | 2       | ✅     |
| `services/traders.ts`                                 | `tests/unit/services/traders.test.ts`                      | 11      | ✅     |
| `lib/trader-saved-searches.ts`                        | `tests/unit/lib/trader-saved-searches.test.ts`             | 4       | ✅     |
| `lib/trader-validation.ts`                            | `tests/unit/lib/trader-validation.test.ts`                 | 13      | ✅     |
| `lib/trader-format.ts`                                | `tests/unit/lib/trader-format.test.ts`                     | 12      | ✅     |
| `lib/trader-url-state.ts`                             | `tests/unit/lib/trader-url-state.test.ts`                  | 6       | ✅     |
| `lib/trader-filter-draft.ts`                          | `tests/unit/lib/trader-filter-draft.test.ts`               | 9       | ✅     |
| `components/funding-table.tsx`                        | `tests/unit/components/funding-table.test.tsx`             | 26      | ✅     |
| `infrastructure/api-client.ts`                        | `tests/unit/infrastructure/api-client.test.ts`             | 14      | ✅     |
| **Total**                                             |                                                            | **213** |        |

### Test Details

#### `lib/token.ts` (14 tests)

| Test                          | Description                         |
| ----------------------------- | ----------------------------------- |
| getAccessToken returns null   | No token stored                     |
| getAccessToken returns token  | Token exists in localStorage        |
| setAccessToken stores token   | Saves to localStorage               |
| setAccessToken overwrites     | Updates existing token              |
| getRefreshToken returns null  | No token stored                     |
| getRefreshToken returns token | Token exists                        |
| setRefreshToken stores token  | Saves to localStorage               |
| setTokens sets both           | Sets access + refresh at once       |
| clearTokens removes both      | Clears both tokens                  |
| clearTokens no throw          | Does not throw when already cleared |
| hasTokens false when empty    | No tokens                           |
| hasTokens false with one      | Only access or refresh              |
| hasTokens true with both      | Both tokens exist                   |

#### `services/auth.ts` (9 tests)

| Test                        | Description              |
| --------------------------- | ------------------------ |
| getMe calls endpoint        | GET /auth/me             |
| refresh calls endpoint      | POST /auth/refresh       |
| logout calls endpoint       | POST /auth/logout        |
| getNonce calls endpoint     | POST /auth/wallet/nonce  |
| verifyWallet calls endpoint | POST /auth/wallet/verify |
| getWallets calls endpoint   | GET /auth/wallet/list    |
| linkWallet calls endpoint   | POST /auth/wallet/link   |
| unlinkWallet calls endpoint | DELETE /auth/wallet/{id} |

#### `services/funding-arbitrage.ts` (12 tests)

| Test                               | Description                   |
| ---------------------------------- | ----------------------------- |
| getVenues calls endpoint           | GET /api/v1/venues            |
| getVenues throws on no data        | Empty response                |
| getVenues throws on error          | Network error                 |
| getFundingArbitrage calls endpoint | GET /api/v1/funding/arbitrage |
| getFundingArbitrage with sort      | Includes sort param           |
| getFundingArbitrage with limit     | Includes limit param          |
| getFundingArbitrage with cursor    | Includes cursor param         |
| getFundingArbitrage returns data   | Returns data + meta           |
| getFundingArbitrage < 2 venues     | Validation error              |
| getFundingArbitrage > 10 venues    | Validation error              |
| getFundingArbitrage no data        | Empty response                |
| getFundingArbitrage API error      | Network error                 |

#### `services/traders.ts` (10 tests)

| Test                          | Description                 |
| ----------------------------- | --------------------------- |
| buildSearchRequest maps       | snake_case, omits undefined |
| buildSearchRequest empty      | Empty body                  |
| searchTraders POSTs defaults  | venue/period/sort/limit     |
| searchTraders no data         | Empty response              |
| fetchTraderDetail GETs        | venue + period params       |
| getTraderGroup GETs           | GET trader-groups/{id}      |
| getTraderGroup missing        | Empty response              |
| groups CRUD + members         | added/removed counts        |
| members period param          | default 30D + custom        |
| patch members reports updated | PATCH → {updated}           |

#### `components/group-form.tsx` (7 tests)

| Test                          | Description               |
| ----------------------------- | ------------------------- |
| renders create title          | No group prop, no color   |
| renders edit title            | Group prop                |
| blocks blank name             | No API call + error shown |
| blocks >100 char name         | nameTooLong, no API call  |
| shows duplicate on GROUP-002  | 409 GROUP-002 mapped      |
| success calls onSuccess+close | Create flow               |
| unauthenticated opens modal   | requireAuth, no API call  |

#### `components/group-detail-page.tsx` (8 tests)

| Test                   | Description              |
| ---------------------- | ------------------------ |
| header + member rows   | Name, address, alias     |
| member metrics columns | ROI/PnL + dashes         |
| local search filters   | Client-side filter       |
| remove refetches       | venue+address, reload    |
| group 404 → not found  | Error + retry            |
| empty members          | No members yet           |
| inline edit saves      | PATCH trimmed alias+note |
| Escape cancels edit    | No API call              |
| edit error surfaces    | Inline banner            |

#### `lib/trader-saved-searches.ts` (4 tests)

| Test                    | Description                 |
| ----------------------- | --------------------------- |
| sanitize drops cursor   | Keeps filters, drops cursor |
| saves, lists, removes   | Full storage lifecycle      |
| rejects blank, upserts  | null + single entry by name |
| ignores corrupt storage | Returns [] without crash    |

#### `components/saved-searches.tsx` (2 tests)

| Test               | Description              |
| ------------------ | ------------------------ |
| saves and applies  | Chip + onApply sanitized |
| requires + deletes | Error shown, chip gone   |

#### `components/trader-filters.tsx` (6 tests)

| Test                          | Description                          |
| ----------------------------- | ------------------------------------ |
| defaults + group auth hint    | hyperliquid/30D, hint when no groups |
| group options when loaded     | Group names in select                |
| edits draft and searches      | Parsed ranges + period in onSearch   |
| keeps raw text for validation | NaN passes through to page           |
| onReset                       | Reset button callback                |
| forwards draft changes        | onDraftChange per keystroke          |

#### `components/trader-table.tsx` (7 tests)

| Test                      | Description                          |
| ------------------------- | ------------------------------------ |
| formatted cells + tooltip | Signs, $K/$M, relative + UTC title   |
| dashes for null metrics   | — placeholders, — / — long/short     |
| copy address + feedback   | Clipboard + Copied                   |
| header sort + aria-sort   | onSortChange, PF header not sortable |
| select + view/add actions | Checkbox, View detail, Add to group  |
| negative PnL sign         | Minus prefix, not color only         |
| malicious name inert      | No executable HTML (FE-040)          |
| rank column               | One-based positions per loaded row   |
| numeric alignment         | text-right + tabular-nums on numbers |

#### `traders/_components/scanner-header.tsx` (9 tests)

| Test                 | Description                                |
| -------------------- | ------------------------------------------ |
| period pressed state | Active period has aria-pressed true        |
| period change        | onPeriodChange with the picked period      |
| venue static         | Badge text, no Venue control in tab order  |
| group options        | Group names in select                      |
| group auth hint      | Disabled select + hint when groups is null |
| group change         | onGroupChange with the picked group        |
| filters toggle       | aria-expanded + aria-controls, callback    |
| sort select          | onSortSelect with column and direction     |
| result count         | resultText shown when provided             |

#### `components/add-to-trader-group-modal.tsx` (5 tests)

| Test                       | Description                       |
| -------------------------- | --------------------------------- |
| lists groups and adds      | Radio + Add → Added N + onSuccess |
| requires selected group    | selectGroupRequired, no API call  |
| pasted addresses validated | EVM check, lowercase normalize    |
| long name + duplicate      | nameTooLong, GROUP-002 → inline   |
| zero additions reported    | Added 0 for duplicates (FE-016)   |

#### `traders/page.tsx` trader scanner (15 tests)

| Test                            | Description                        |
| ------------------------------- | ---------------------------------- |
| default without auto-search     | Controls visible, no API call      |
| search merges defaults + URL    | venue/period/sort/limit, push URL  |
| skeleton on first search        | role=status while loading (FE-010) |
| invalid min/max blocks          | Error, no API call                 |
| non-numeric blocks              | invalidNumber, no API call         |
| header toggles sort             | desc → asc, cursor reset           |
| load more appends deduped       | cursor sent, count grows           |
| error + retry recovers          | Banner, Retry → rows               |
| keep rows + Updating            | Old rows visible during search     |
| latest overlapping wins         | Stale response ignored (FE-034)    |
| reset clears all                | Form, rows, bare URL               |
| URL restore + auto-search       | Params → form + search             |
| group hint when unauthenticated | groupAuthHint shown                |
| capped count when has_more      | "N shown, more available"          |
| plain count when not capped     | "N results" kept                   |

#### `traders/[address]/page.tsx` trader detail (8 tests)

| Test                       | Description                           |
| -------------------------- | ------------------------------------- |
| invalid address blocks     | No API call                           |
| header, cards, long/short  | ROI/PnL/WR, counts, Ready status      |
| period switch refetches    | period=7D in request                  |
| null metrics → dashes      | Cards degrade gracefully              |
| 404 → retry recovers       | Trader not found → rows               |
| back + add-to-group modal  | router.back, dialog opens             |
| stored scan → push on back | Deterministic return, no history race |

#### `components/copy-address.tsx` (2 tests)

| Test                        | Description           |
| --------------------------- | --------------------- |
| copies full address         | Clipboard + Copied    |
| full display when short off | Detail header variant |

#### `lib/trader-filter-draft.ts` (9 tests)

| Test                      | Description                         |
| ------------------------- | ----------------------------------- |
| query ↔ draft round-trip  | Text ↔ numbers                      |
| invalid text stays NaN    | Page validation catches it          |
| immutable range update    | Original untouched                  |
| comma as decimal mark     | `0,5` → 0.5 (locale vi)             |
| strips currency on paste  | `$1,000` → 1000, `2 500` → 2500     |
| blank cells → undefined   | Whitespace-only means "no filter"   |
| garbage stays NaN         | `abc` passes through for validation |
| lastTradeAfter round-trip | Draft ↔ query both directions       |
| blank lastTradeAfter      | Empty string omitted from query     |

#### `stores/auth.ts` (11 tests)

| Test                         | Description               |
| ---------------------------- | ------------------------- |
| requireAuth true when authed | No modal opened           |
| requireAuth opens modal      | Returns false + modal     |
| logout clears tokens         | Calls API + wagmi + clear |
| logout clears on API error   | Clears even if API fails  |
| fetchUser sets user          | Gets user from API        |
| fetchUser clears on error    | Clears tokens on 401      |
| initialize loads user        | Token exists              |
| initialize clears on error   | getMe fails               |
| initialize no token          | Skips loading             |
| formatAddress formats        | Shows 0x1234...5678       |
| formatAddress empty          | Returns empty string      |

#### `infrastructure/api-client.ts` (14 tests)

| Test                              | Description        |
| --------------------------------- | ------------------ |
| apiClient adds Content-Type       | Header set         |
| apiClient adds X-Request-ID       | Unique ID header   |
| apiClient adds Authorization      | Token exists       |
| apiClient no Authorization        | No token           |
| apiClient returns JSON            | Success response   |
| apiClient returns {} on 204       | No content         |
| apiClient throws ApiError         | Non-OK response    |
| apiClient correct error fields    | Status + code      |
| apiClient retries on 401          | Token refresh flow |
| apiClient clears on refresh fail  | Refresh error      |
| apiClientNoAuth no Authorization  | No token header    |
| apiClientNoAuth adds Content-Type | Header set         |
| apiClientNoAuth returns JSON      | Success            |
| apiClientNoAuth throws on error   | Error response     |

---

## III. E2E Tests (Playwright)

### Test Matrix

| #   | File                        | Flow                    | Steps                             | Expected                      |
| --- | --------------------------- | ----------------------- | --------------------------------- | ----------------------------- |
| E1  | `protected.spec.ts`         | Settings open access    | Navigate /settings                | Settings renders, no redirect |
| E2  | `protected.spec.ts`         | Groups open access      | Navigate /groups                  | Groups renders, no redirect   |
| E3  | `protected.spec.ts`         | Mutation needs wallet   | Create group unauthenticated      | Connect wallet modal opens    |
| E4  | `funding-arbitrage.spec.ts` | Page renders            | Navigate /funding-arbitrage       | Title + buttons visible       |
| E5  | `funding-arbitrage.spec.ts` | Venue selector opens    | Click "Select venues"             | Dropdown with venues shown    |
| E6  | `funding-arbitrage.spec.ts` | Select All works        | Click "Select All"                | "10 venues" displayed         |
| E7  | `funding-arbitrage.spec.ts` | Clear works             | Click "Clear"                     | "Select venues" displayed     |
| E8  | `funding-arbitrage.spec.ts` | Search disabled         | No venues selected                | Search button disabled        |
| E9  | `groups.spec.ts`            | Groups page renders     | Navigate /groups                  | Title + Create visible        |
| E10 | `groups.spec.ts`            | Empty state             | Mock [] → /groups                 | "No groups yet"               |
| E11 | `groups.spec.ts`            | Create validates blank  | Open dialog → blank name → submit | "Group name is required"      |
| E12 | `groups.spec.ts`            | Lists groups            | Mock [Main] → /groups             | Name + count visible          |
| E13 | `groups.spec.ts`            | Error retry             | Mock 500 → /groups                | Retry button visible          |
| E14 | `groups.spec.ts`            | Detail lists members    | Mock group+members → /groups/g1   | Address row, no Scan needed   |
| E15 | `groups.spec.ts`            | Member name + alias     | Mock member with alias            | Display name + alias shown    |
| E16 | `groups.spec.ts`            | Empty members           | Mock [] members                   | No members yet                |
| E17 | `groups.spec.ts`            | Remove member refetch   | DELETE members → {removed:1}      | DELETE sent, list reloads     |
| E18 | `groups.spec.ts`            | Links to scanner        | Open /groups/g1                   | Link /traders?group=g1        |
| E19 | `groups.spec.ts`            | Scanner scans to list   | POST search mock → Search         | Name + address, body defaults |
| E20 | `groups.spec.ts`            | Invalid min/max blocks  | ROI 5/1 → Search                  | Error, no API call            |
| E21 | `groups.spec.ts`            | Non-numeric blocks      | PnL "abc" → Search                | invalidNumber, no API call    |
| E22 | `groups.spec.ts`            | Header sorts desc→asc   | Click PnL header                  | 2nd body sort_direction asc   |
| E23 | `groups.spec.ts`            | Cursor appends deduped  | Load more with cursor c1          | 2 rows, A shown once          |
| E24 | `groups.spec.ts`            | Empty + reset filters   | Mock [] → Search → Reset          | No traders, form cleared      |
| E25 | `groups.spec.ts`            | Error + retry recovers  | 500 → Retry                       | Rows after retry              |
| E26 | `groups.spec.ts`            | Group needs auth        | Group + 401 search                | Auth message shown            |
| E27 | `groups.spec.ts`            | Add modal from scan     | Tick + Add to group (1)           | Modal → Added 1               |
| E28 | `groups.spec.ts`            | Scan without wallet     | No auth → Search                  | Rows + group hint, no modal   |
| E29 | `groups.spec.ts`            | Save search persists    | Save "My 7D" → reload → apply     | Chip kept, period 7D, rows    |
| E30 | `groups.spec.ts`            | URL restores on refresh | ?period=7D&roi_min=30             | Form + auto search            |
| E31 | `groups.spec.ts`            | Venue/period in body    | Period 7D → Search                | venue + period in POST body   |
| E32 | `groups.spec.ts`            | Detail open + back      | View → detail → Back              | Filters + rows preserved      |
| E33 | `groups.spec.ts`            | Detail period tabs      | Click 7D on detail                | period=7D refetch             |
| E34 | `groups.spec.ts`            | Detail 404              | Direct detail URL, 404 mock       | Trader not found              |
| E35 | `groups.spec.ts`            | Create group dialog     | Fill name+desc → Create           | Row appears in list           |
| E36 | `groups.spec.ts`            | Edit group name         | Edit → rename → Save              | New name in list              |
| E37 | `groups.spec.ts`            | Delete with warning     | Delete → confirm text → confirm   | Membership text, row gone     |
| E38 | `groups.spec.ts`            | Group+ROI combine       | Group + ROI/PnL → Search          | group_id + mins in body       |
| E39 | `groups.spec.ts`            | Back restores search    | Search A → B → back               | Form A + refetch roi_min      |
| E40 | `groups.spec.ts`            | Network fail + retry    | Abort → error → Retry             | Filters kept, rows recover    |
| E41 | `groups.spec.ts`            | Stale rows inspectable  | Stale status mock → Search        | Stale text + data visible     |
| E42 | `groups.spec.ts`            | Detail inline create    | Add → new group → Add 1           | Added 1                       |
| E43 | `groups.spec.ts`            | Stale detail            | Stale + partial mock              | Stale + Partial + data        |
| E44 | `groups.spec.ts`            | Add/remove member flow  | 2 members → remove 1              | Count + table update          |

### Accessibility / Keyboard / Visual / Performance

| ID   | File                    | Coverage                                                                         |
| ---- | ----------------------- | -------------------------------------------------------------------------------- |
| A1-6 | `accessibility.spec.ts` | axe wcag2a+aa: scanner (default/results/error), detail, groups+dialog, add modal |
| K1-4 | `keyboard.spec.ts`      | Tab order, Enter-to-sort, focus trap + Escape, narrow scroll                     |
| V1-8 | `visual.spec.ts`        | Baselines (main region, frozen clock): scanner ×4, detail, groups, narrow ×2     |
| P1-3 | `performance.spec.ts`   | 100 rows <15s, slow-search keeps rows, 500-member group pages                    |

---

### Spec FE-001 → FE-040 coverage (Hyperliquid_Trader_Scanner_FE_Spec_v1.1)

| ID     | Scenario                  | Covered by                                           |
| ------ | ------------------------- | ---------------------------------------------------- |
| FE-001 | Default scanner state     | unit scanner default + E19                           |
| FE-002 | ROI filter validation     | unit validation + E20/E21                            |
| FE-003 | AND filters               | E19 (defaults) + E38 (group+ROI+PnL)                 |
| FE-004 | Reset filters             | unit reset + E24                                     |
| FE-005 | Period switch             | E31 (period in body); cursor reset in unit sort test |
| FE-006 | Server sort               | unit header toggle + E22                             |
| FE-007 | Cursor pagination         | unit load-more + E23                                 |
| FE-008 | Empty state               | unit (page) + E24                                    |
| FE-009 | Scanner error             | unit error + E25                                     |
| FE-010 | Loading state             | unit skeleton + P2 perf transition                   |
| FE-011 | Detail navigation         | unit view callback + E32                             |
| FE-012 | Detail periods            | unit period switch + E33                             |
| FE-013 | Detail stale data         | unit stale/partial + E43                             |
| FE-014 | Copy wallet               | unit copy-address + table copy                       |
| FE-015 | Add to group              | unit modal + E27/E42                                 |
| FE-016 | Duplicate group member    | unit Added 0                                         |
| FE-017 | Create group              | unit form success + E35                              |
| FE-018 | Invalid group name        | unit blank/too-long/duplicate                        |
| FE-019 | Edit group                | E36                                                  |
| FE-020 | Delete group confirmation | E37                                                  |
| FE-021 | Delete group result       | E37 (row gone)                                       |
| FE-022 | Remove member             | unit detail remove + E17/E44                         |
| FE-023 | Group scanner filter      | E38                                                  |
| FE-024 | URL state                 | unit restore + E30                                   |
| FE-025 | Back/forward              | E39                                                  |
| FE-026 | Long wallet formatting    | unit shortAddress + copy tests                       |
| FE-027 | Currency formatting       | unit formatUsd tiers                                 |
| FE-028 | Null profit factor        | unit dashes + table dashes                           |
| FE-029 | Responsive table          | K4 narrow (scroll, no page overflow) + V narrow      |
| FE-030 | Keyboard navigation       | K1 tab order, K2 Enter sort                          |
| FE-031 | Dialog focus              | K3 trap + Escape; Dialog `modal` default             |
| FE-032 | Status not color-only     | unit negative sign + status text; table cells        |
| FE-033 | API auth error            | E26 (401 group) + unit group hint                    |
| FE-034 | Slow search race          | unit overlapping wins                                |
| FE-035 | Detail stale cache        | E32 back-flow reloads via URL; unit 404/retry        |
| FE-036 | Large result rendering    | P1 perf (100 rows)                                   |
| FE-037 | Group member scale        | P3 perf (500 members, client paging)                 |
| FE-038 | Network offline           | E40 (abort → banner, filters kept, retry)            |
| FE-039 | Retry recovery            | unit retry + E25/E40                                 |
| FE-040 | XSS safety                | unit malicious display_name                          |

### E2E scenarios (§14) coverage

| #   | Scenario                                                       | Covered by                |
| --- | -------------------------------------------------------------- | ------------------------- |
| 1   | 30D + ROI≥30% + WR≥60% → Search → detail → back → filters kept | E38-style filters + E32   |
| 2   | Create group → add two → detail → remove one → count updates   | E35 + E42-style add + E44 |
| 3   | Detail → add → inline create → membership                      | E42                       |
| 4   | Group + ROI + PnL → verify AND                                 | E38                       |
| 5   | Stale row + detail freshness                                   | E41 + E43                 |
| 6   | Failure → Retry → success, error cleared                       | E25 + E40                 |

### Release exit criteria (§18)

| Criterion                                    | Status                                                     |
| -------------------------------------------- | ---------------------------------------------------------- |
| All P0 tests pass                            | ✅ — exit 0 locally; CI runs `pnpm test` + `pnpm test:e2e` |
| Core E2E flows pass against staging BE       | ✅ mocked + live-BE runs green (funding needs BE up)       |
| Visual baselines approved (desktop + narrow) | ✅ 8 baselines in `tests/e2e/visual.spec.ts-snapshots/`    |
| No direct Hyperliquid dependency in browser  | ✅ all calls via `/api` proxy to BE                        |
| Race-condition test passes                   | ✅ unit overlapping wins + ABORTED signal                  |
| Auth errors displayed safely                 | ✅ AUTH-003/GROUP-003/AUTH-005 mapped, no dumps            |

---

## IV. Running Tests

### Unit Tests

```bash
pnpm test              # Run once
pnpm test:watch        # Watch mode
```

### E2E Tests

```bash
pnpm test:e2e          # Run all
pnpm test:e2e:ui       # With Playwright UI
pnpm test:e2e:debug    # Debug mode
pnpm playwright test tests/e2e/accessibility.spec.ts  # axe a11y
pnpm playwright test tests/e2e/visual.spec.ts          # Visual baselines
```

Visual baselines live in `tests/e2e/visual.spec.ts-snapshots/` (main-region
screenshots, frozen clock, `nextjs-portal` hidden). Regenerate deliberately with
`pnpm playwright test tests/e2e/visual.spec.ts --update-snapshots` after
reviewing diffs — never blindly.

### Requirements

- Unit tests: Không cần backend
- E2E tests: Cần backend tại `localhost:8080` + frontend tại `localhost:3000`

---

## V. CI Integration

```yaml
# .github/workflows/ci.yml
- name: Unit tests
  run: pnpm test

- name: E2E tests
  run: pnpm test:e2e
```

---

## VI. Changelog

| Date       | Change                                                                                                                                                                                                       | Author |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 2026-09-19 | Initial test cases                                                                                                                                                                                           | —      |
| 2026-09-29 | Saved searches (localStorage) + public scan tests                                                                                                                                                            | —      |
| 2026-09-30 | Filter-config integration: DEX dropdown + config-driven filters                                                                                                                                              | —      |
| 2026-09-30 | Human-readable labels: metric/sort/operator/order options + i18n frame labels                                                                                                                                | —      |
| 2026-10-01 | P0 trader foundation: types/service/validation/format/url-state (spec v1.1)                                                                                                                                  | —      |
| 2026-10-01 | P1 scanner redo: filter grid, header sort, cursor pages, URL state, trader-groups modal (spec v1.1)                                                                                                          | —      |
| 2026-10-02 | P2 trader detail: header/tabs/cards/long-short/freshness/add-to-group (spec v1.1)                                                                                                                            | —      |
| 2026-10-02 | Cutover groups to trader-groups API: list/form/delete/detail, remove dead wallets/groups code                                                                                                                | —      |
| 2026-10-03 | P4 a11y/visual/perf/keyboard suites + P5 FE-040 gap closure (spec v1.1 exit criteria)                                                                                                                        | —      |
| 2026-10-03 | F1 member metrics columns + F2 inline alias/note edit via PATCH members                                                                                                                                      | —      |
| 2026-10-05 | Phase 4 scanner header: period segmented, venue badge, group select, filters toggle, sort select, rank column, mono numerals, status moved to identity cell (9 new unit tests, 3 visual baselines refreshed) | —      |
