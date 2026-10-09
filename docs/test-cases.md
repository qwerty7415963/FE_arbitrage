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

| Module                                                                                    | File                                                       | Tests   | Status |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------- | ------ |
| `lib/token.ts`                                                                            | `tests/unit/lib/token.test.ts`                             | 14      | ✅     |
| `stores/auth.ts` (wallet-only)                                                            | `tests/unit/stores/auth.test.ts`                           | 11      | ✅     |
| `services/auth.ts`                                                                        | `tests/unit/services/auth.test.ts`                         | 8       | ✅     |
| `services/funding-arbitrage.ts`                                                           | `tests/unit/services/funding-arbitrage.test.ts`            | 13      | ✅     |
| `components/group-form.tsx`                                                               | `tests/unit/components/group-form.test.tsx`                | 7       | ✅     |
| `components/group-detail-page.tsx`                                                        | `tests/unit/components/group-detail-page.test.tsx`         | 9       | ✅     |
| `components/trader-table.tsx`                                                             | `tests/unit/components/trader-table.test.tsx`              | 10      | ✅     |
| `traders/_components/scanner-header.tsx`                                                  | `tests/unit/components/scanner-header.test.tsx`            | 6       | ✅     |
| `traders/_components/filter-sheet.tsx`                                                    | `tests/unit/components/filter-sheet.test.tsx`              | 11      | ✅     |
| `traders/_components/filter-chips.tsx`                                                    | `tests/unit/components/filter-chips.test.tsx`              | 6       | ✅     |
| `components/add-to-trader-group-modal.tsx`                                                | `tests/unit/components/add-to-trader-group-modal.test.tsx` | 5       | ✅     |
| `components/saved-searches.tsx`                                                           | `tests/unit/components/saved-searches.test.tsx`            | 3       | ✅     |
| `app/[locale]/(protected)/traders/page.tsx`                                               | `tests/unit/components/trader-scanner-page.test.tsx`       | 20      | ✅     |
| `app/[locale]/(protected)/traders/[address]/page.tsx`                                     | `tests/unit/components/trader-detail-page.test.tsx`        | 13      | ✅     |
| `components/copy-address.tsx`                                                             | `tests/unit/components/copy-address.test.tsx`              | 2       | ✅     |
| `services/traders.ts`                                                                     | `tests/unit/services/traders.test.ts`                      | 33      | ✅     |
| `lib/trader-saved-searches.ts`                                                            | `tests/unit/lib/trader-saved-searches.test.ts`             | 4       | ✅     |
| `lib/trader-validation.ts`                                                                | `tests/unit/lib/trader-validation.test.ts`                 | 13      | ✅     |
| `lib/trader-format.ts`                                                                    | `tests/unit/lib/trader-format.test.ts`                     | 21      | ✅     |
| `lib/trader-url-state.ts`                                                                 | `tests/unit/lib/trader-url-state.test.ts`                  | 10      | ✅     |
| `components/shared/pagination.tsx`                                                        | `tests/unit/components/pagination.test.tsx`                | 5       | ✅     |
| `lib/trader-filter-draft.ts`                                                              | `tests/unit/lib/trader-filter-draft.test.ts`               | 9       | ✅     |
| `components/funding-table.tsx`                                                            | `tests/unit/components/funding-table.test.tsx`             | 26      | ✅     |
| `infrastructure/api-client.ts`                                                            | `tests/unit/infrastructure/api-client.test.ts`             | 14      | ✅     |
| `lib/trader-activity-ws.ts`                                                               | `tests/unit/lib/trader-activity-ws.test.ts`                | 7       | ✅     |
| `hooks/use-trader-activity.ts`                                                            | `tests/unit/hooks/use-trader-activity.test.tsx`            | 2       | ✅     |
| `traders/[address]/_components/positions-section.tsx`                                     | `tests/unit/components/positions-section.test.tsx`         | 4       | ✅     |
| `traders/[address]/_components/activity-feed.tsx`                                         | `tests/unit/components/activity-feed.test.tsx`             | 9       | ✅     |
| `lib/wallet-tab-state.ts`                                                                 | `tests/unit/lib/wallet-tab-state.test.ts`                  | 8       | ✅     |
| `hooks/use-trader-trades.ts`                                                              | `tests/unit/hooks/use-trader-trades.test.tsx`              | 4       | ✅     |
| `hooks/use-trader-{positions,balances,fills,orders,transfers,performance}.ts`             | `tests/unit/hooks/wallet-tab-hooks.test.tsx`               | 7       | ✅     |
| `traders/[address]/_components/trades-section.tsx`                                        | `tests/unit/components/trades-section.test.tsx`            | 11      | ✅     |
| `traders/[address]/_components/wallet-tabs.tsx`                                           | `tests/unit/components/wallet-tabs.test.tsx`               | 5       | ✅     |
| `traders/[address]/_components/{balances,orders,fills,transfers,performance}-section.tsx` | `tests/unit/components/wallet-tab-sections.test.tsx`       | 10      | ✅     |
| `lib/trader-sync.ts` (contract v1.1 F1/F2 helpers)                                        | `tests/unit/lib/trader-sync.test.ts`                       | 14      | ✅     |
| `hooks/use-trader-sync.ts` (once-guarded POST /sync)                                      | `tests/unit/hooks/use-trader-sync.test.tsx`                | 5       | ✅     |
| `hooks/*` sync polling + activity `dataStatus`                                            | `tests/unit/hooks/trader-sync-polling.test.tsx`            | 6       | ✅     |
| **Total**                                                                                 |                                                            | **366** |        |

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

#### `services/traders.ts` (33 tests)

| Test                          | Description                                 |
| ----------------------------- | ------------------------------------------- |
| buildSearchRequest maps       | snake_case, omits undefined                 |
| buildSearchRequest empty      | Empty body                                  |
| searchTraders POSTs defaults  | venue/period/sort/limit/page:1              |
| searchTraders sends page      | page:2 in body                              |
| searchTraders no data         | Empty response                              |
| fetchTraderDetail GETs        | venue + period params                       |
| fetchTraderPositions GETs     | venue default, maps snapshot                |
| fetchTraderPositions no data  | Empty response                              |
| fetchTraderActivity default   | venue + limit=20                            |
| fetchTraderActivity paged     | limit + cursor forwarded                    |
| fetchTraderActivity no data   | Empty response                              |
| activity sort/filter          | sort/dir/result/side forwarded, counts kept |
| positions sort forwards       | sort=unrealized_pnl + dir in URL            |
| positions sort omitted        | bare `?venue=` URL by default               |
| balances GETs                 | `/balances?venue=`, no-data throws          |
| fills paged                   | limit=100 default, cursor forwarded         |
| orders open/historical        | status + limit=200, historical keeps fields |
| transfers paged               | days=30 + limit=200 defaults                |
| performance period            | period=30D default, 7D forwarded            |
| no-data throws ×5             | balances/fills/orders/transfers/performance |
| getTraderGroup GETs           | GET trader-groups/{id}                      |
| getTraderGroup missing        | Empty response                              |
| groups CRUD + members         | added/removed counts                        |
| members period param          | default 30D + custom                        |
| patch members reports updated | PATCH → {updated}                           |
| triggerTraderSync POSTs sync  | POST /traders/{wallet}/sync?venue=, queued  |
| sync in_flight/recent         | Contract statuses kept, no invented fields  |
| trigger sync no data          | Empty response                              |

#### `lib/trader-activity-ws.ts` (7 tests)

| Test                      | Description                                |
| ------------------------- | ------------------------------------------ |
| builds ws url lowercase   | `ws://host/api/v1/traders/ws?wallet=`      |
| uses wss for https        | `wss://` scheme                            |
| backoff caps at 30s       | 1s→2s→4s→…→30s                             |
| activity routes to onFill | `subscribed` ignored, `activity` validated |
| ping every 25s            | heartbeat `{type:ping}`                    |
| reconnect after close     | `reconnecting` + new socket after 1s       |
| hidden suspends (M4)      | `visibilitychange` closes + resubscribes   |

#### `hooks/use-trader-activity.ts` (2 tests)

| Test                      | Description                     |
| ------------------------- | ------------------------------- |
| maps pages + cursor       | `next_cursor` → `fetchNextPage` |
| starts empty disconnected | `liveFills=[]`, `hasMore=false` |

#### `traders/[address]/_components/positions-section.tsx` (4 tests)

| Test                    | Description                        |
| ----------------------- | ---------------------------------- |
| renders row + chips     | BTC LONG + account/notional/margin |
| empty state             | `noOpenPositions` when `[]`        |
| never-synced syncing M5 | `syncing` when `summary=null`      |
| sortable headers        | aria-sort + `onSortChange` column  |
| retry after error       | Button calls `onRetry`             |

#### `traders/[address]/_components/activity-feed.tsx` (9 tests)

| Test                       | Description                                      |
| -------------------------- | ------------------------------------------------ |
| live + closed render       | LIVE badge, ETH fill + BTC trade                 |
| empty state                | `noActivity` when both lists empty               |
| load more when hasMore     | Button calls `onLoadMore`                        |
| retry initial via onRetry  | Retry calls `onRetry`, not `onLoadMore`          |
| syncing skeleton (v1.1 F3) | `syncing` + empty → status skeleton, never empty |
| genuine empty (v1.1 F3)    | `ready` + empty → `noActivity` only              |
| Sync now on syncing        | Button calls `onSyncNow`                         |
| Sync now on empty          | Fallback button on the genuine empty state       |
| Sync now hidden            | No button when no handler wired                  |

#### `lib/wallet-tab-state.ts` (8 tests)

| Test                     | Description                              |
| ------------------------ | ---------------------------------------- |
| nine tabs contract order | positions…performance, default positions |
| accepts contract ids     | every `WALLET_TABS` id incl swap         |
| rejects unknown          | funding/empty/null → false               |
| parses ?tab=             | valid value kept                         |
| fallback                 | missing/invalid → positions              |
| sets ?tab=               | non-default tabs in URL                  |
| omits default            | positions drops `?tab=`                  |
| preserves siblings       | other params kept on switch              |

#### `hooks/use-trader-trades.ts` (4 tests)

| Test               | Description                           |
| ------------------ | ------------------------------------- |
| maps rows + counts | contract row, `counts` from response  |
| forwards filters   | sort/dir/result/side/limit to service |
| cursor pagination  | `next_cursor` → second page           |
| idle when disabled | no fetch while tab inactive           |

#### `hooks/wallet-tab-hooks.ts` (7 tests)

| Test                         | Description                        |
| ---------------------------- | ---------------------------------- |
| positions sort/dir           | lowercased wallet + sort forwarded |
| positions idle when disabled | no fetch while tab inactive        |
| balances snapshot            | perp/spot `data_status` mapped     |
| fills cursor paging          | ETH fixture row, `tid` cursor      |
| orders status                | historical filter forwarded        |
| transfers days               | days=7 forwarded                   |
| performance period           | period=7D forwarded                |

#### `traders/[address]/_components/trades-section.tsx` (11 tests)

| Test               | Description                                           |
| ------------------ | ----------------------------------------------------- |
| contract columns   | ENTRY/EXIT/NOTIONAL/DURATION/FUNDING —/NET            |
| chips + counts     | All/Win/Loss + All/Long/Short from response           |
| server-side sort   | header click → sort=net_pnl                           |
| server-side filter | Win chip → result=win                                 |
| null entry/exit    | dashes, no fake prices                                |
| empty state        | `noTrades` when `rows=[]`                             |
| error retry        | Button calls `refetch`                                |
| load more          | Button calls `fetchNextPage`                          |
| syncing skeleton   | `syncing` + empty → status skeleton, never `noTrades` |
| Sync now on empty  | Fallback button on the genuine empty state            |
| Sync now posts     | POST /sync with wallet, then `refetch`                |

#### `traders/[address]/_components/wallet-tabs.tsx` (5 tests)

| Test              | Description                             |
| ----------------- | --------------------------------------- |
| nine tabs default | positions active, BTC row visible       |
| writes ?tab=      | click Balances → `router.replace` URL   |
| restores ?tab=    | `?tab=trades` opens the trades panel    |
| placeholders      | predictions/swap coming-soon, no tables |
| positions sort    | uPnL header → sort + dir to service     |

#### `traders/[address]/_components/wallet-tab-sections.tsx` (10 tests)

| Test                   | Description                     |
| ---------------------- | ------------------------------- |
| balances fixture       | perp cards + HYPE/USDC rows     |
| balances empty + retry | `noBalances`, Retry → `refetch` |
| orders open            | BUY row, no status columns      |
| orders historical      | `filled` status columns shown   |
| orders empty           | `noOrders`                      |
| fills fixture          | ETH SELL + Close Long + fee     |
| fills empty            | `noFills`                       |
| transfers fixture      | subAccountTransfer + $50.00K    |
| transfers empty        | `noTransfers`                   |
| performance fixture    | metrics + equity 2026-10-01 row |

#### `lib/trader-sync.ts` (14 tests, contract v1.1 F1/F2)

| Test                         | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| trigger on positions ≠ ready | syncing/stale/error positions trigger even with trades |
| trigger on empty trades      | ready positions + empty trades trigger                 |
| no trigger when ready        | ready positions + trades present never trigger         |
| no trigger before load       | missing snapshot / unloaded signals never trigger      |
| missing snapshot inert       | null/undefined status without load does not trigger    |
| keep polling while syncing   | syncing/stale under the cap keep polling               |
| stop on ready                | ready stops polling                                    |
| stop on error                | error stops polling                                    |
| stop at attempt cap          | 7 keeps polling, 8+ stops (~8 attempts)                |
| no poll before snapshot      | null/undefined status never polls                      |
| 10–15s interval              | `SYNC_POLL_INTERVAL_MS` = 12s                          |
| interval false on stop       | ready/error/cap ⇒ `false`                              |
| missing signal ⇒ ready       | pre-v1.1 payload without `data_status` is ready        |
| signal kept                  | syncing/stale/error/ready pass through                 |

#### `hooks/use-trader-sync.ts` (5 tests, contract v1.1 F1)

| Test                 | Description                                     |
| -------------------- | ----------------------------------------------- |
| trigger-once         | repeated `ensureSync` POSTs exactly once        |
| empty wallet inert   | no POST for an empty wallet                     |
| wallet change resets | navigating wallets re-arms the once-guard       |
| syncNow always POSTs | explicit action bypasses the guard (1 + 2 more) |
| failure keeps guard  | failed auto-trigger does not retry by itself    |

#### `hooks/*` sync polling + `dataStatus` (6 tests, contract v1.1 F2/§2)

| Test                        | Description                                    |
| --------------------------- | ---------------------------------------------- |
| positions poll then stop    | syncing ⇒ refetch at 12s, ready ⇒ stop         |
| positions cap ~8            | endless syncing stops after 8 fetches (~2 min) |
| ready positions never poll  | single fetch when already ready                |
| trades `dataStatus` default | payload without signal ⇒ `ready`               |
| trades poll while syncing   | syncing ⇒ refetch, ready ⇒ stop                |
| activity `dataStatus`       | Recent Activity exposes the syncing signal     |

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

#### `components/saved-searches.tsx` (3 tests)

| Test               | Description                       |
| ------------------ | --------------------------------- |
| renders cluster    | Fieldset labelled "Saved filters" |
| saves and applies  | Chip + onApply sanitized          |
| requires + deletes | Error shown, chip gone            |

#### `traders/_components/filter-chips.tsx` (6 tests)

| Test                       | Description                                    |
| -------------------------- | ---------------------------------------------- |
| chip per active filter     | `ROI ≥20%`, `PnL ≤$500` short key/value chips  |
| no filters → no chips      | Renders nothing when all metric filters clear  |
| collapse over four         | Four visible chips + a `+N` overflow chip      |
| remove calls back with key | `Remove ROI ≥20%` → `onRemove('roi')`          |
| remove re-runs search      | Page re-searches without the removed filter    |
| reset clears nine metrics  | Period/Venue kept, ROI cleared, search re-runs |

#### `components/trader-table.tsx` (10 tests)

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
| numeric header alignment  | text-right headers match cells       |

#### `traders/_components/scanner-header.tsx` (6 tests)

| Test                 | Description                                      |
| -------------------- | ------------------------------------------------ |
| period pressed state | Active period has aria-pressed true              |
| period change        | onPeriodChange with the picked period            |
| venue static         | Badge text, no Venue control in tab order        |
| no group control     | No Group label/combobox, hint or load-error text |
| filters toggle       | aria-expanded + aria-controls, callback          |
| result count         | resultText shown when provided                   |

#### `traders/_components/filter-sheet.tsx` (11 tests)

| Test                           | Description                                                |
| ------------------------------ | ---------------------------------------------------------- |
| three clusters + nine metrics  | Performance/Scale/Order bias, no Group cluster             |
| dialog, no aria-modal          | Sheet labelled by heading, "Close without applying"        |
| reveal min/max via Custom      | Preset → Custom reveals the from/to pair                   |
| preset sets min                | Win rate ≥60% → from = 60                                  |
| preset reopens as preset       | Applied preset still a preset, not Custom                  |
| preset survives URL round-trip | Profit-factor 1.0 reopens as preset after draft round-trip |
| non-preset reopens as Custom   | Typed 47 reopens under Custom                              |
| per-field errors + first alert | Invalid/integer/range/date errors, only first is alert     |
| Esc discards draft             | Reopen shows the last committed value                      |
| focus returns to opener        | Focus restoration after close                              |
| commits only on Apply          | onApply fires once on submit with the draft                |

#### `components/add-to-trader-group-modal.tsx` (5 tests)

| Test                       | Description                       |
| -------------------------- | --------------------------------- |
| lists groups and adds      | Radio + Add → Added N + onSuccess |
| requires selected group    | selectGroupRequired, no API call  |
| pasted addresses validated | EVM check, lowercase normalize    |
| long name + duplicate      | nameTooLong, GROUP-002 → inline   |
| zero additions reported    | Added 0 for duplicates (FE-016)   |

#### `traders/page.tsx` trader scanner (20 tests)

| Test                          | Description                                 |
| ----------------------------- | ------------------------------------------- |
| auto-search on mount (page 1) | Controls visible, defaults POST incl page:1 |
| does not fetch groups         | No listTraderGroups call on load            |
| search merges defaults + URL  | venue/period/sort/limit/page:1, push URL    |
| skeleton on first search      | role=status while loading (FE-010)          |
| invalid min/max blocks        | Error, exactly 1 call (mount)               |
| non-numeric blocks            | invalidNumber, exactly 1 call (mount)       |
| header toggles sort           | desc → asc, page reset to 1                 |
| page change replaces rows     | page:2 sent, rows replaced (never append)   |
| current-page click no-op      | No request when clicking the active page    |
| filter change resets to 1     | ROI apply re-searches with page:1           |
| beyond-total falls back       | page=5 → empty → auto re-search last page   |
| error + retry recovers        | Banner, Retry → rows                        |
| keep rows + Updating          | Old rows visible during search              |
| latest overlapping wins       | Stale response ignored (FE-034)             |
| reset re-runs default search  | Form, rows, bare URL, re-fetch page:1       |
| URL restore + auto-search     | Params → form + search                      |
| ignores ?group_id=            | Param stripped, search without groupId      |
| Page X of Y count             | "Page 2 of 20 · 40 results"                 |
| Page 1 of 1 fallback          | "Page 1 of 1 · 1 results" when no meta      |
| restores ?page=3              | Deep link searches with page:3              |

#### `components/shared/pagination.tsx` (5 tests)

| Test                         | Description                         |
| ---------------------------- | ----------------------------------- |
| single page renders nothing  | totalPages<=1 → null                |
| numbers + aria-current       | Active page has aria-current="page" |
| ellipsis for long ranges     | 10 pages collapse with …            |
| prev/next disabled at bounds | First/last page edge states         |
| disabled while loading       | All buttons disabled                |

#### `traders/[address]/page.tsx` trader detail (13 tests)

| Test                       | Description                            |
| -------------------------- | -------------------------------------- |
| invalid address blocks     | No API call                            |
| header, cards, long/short  | ROI/PnL/WR, counts, Ready status       |
| period switch refetches    | period=7D in request                   |
| null metrics → dashes      | Cards degrade gracefully               |
| 404 → retry recovers       | Trader not found → rows                |
| back + add-to-group modal  | router.back, dialog opens              |
| stored scan → push on back | Deterministic return, no history race  |
| auto-sync on empty trades  | One POST /sync when trades empty       |
| auto-sync on stale pos     | One POST when positions not ready      |
| no sync when ready         | No POST when ready + trades exist      |
| no repeat on period        | Period switch never re-POSTs           |
| Sync now + refetch         | Recent Activity button POSTs + reloads |

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

| #   | File                         | Flow                         | Steps                             | Expected                                                    |
| --- | ---------------------------- | ---------------------------- | --------------------------------- | ----------------------------------------------------------- |
| E1  | `protected.spec.ts`          | Settings open access         | Navigate /settings                | Settings renders, no redirect                               |
| E2  | `protected.spec.ts`          | Groups open access           | Navigate /groups                  | Groups renders, no redirect                                 |
| E3  | `protected.spec.ts`          | Mutation needs wallet        | Create group unauthenticated      | Connect wallet modal opens                                  |
| E4  | `funding-arbitrage.spec.ts`  | Page renders                 | Navigate /funding-arbitrage       | Title + buttons visible                                     |
| E5  | `funding-arbitrage.spec.ts`  | Venue selector opens         | Click "Select venues"             | Dropdown with venues shown                                  |
| E6  | `funding-arbitrage.spec.ts`  | Select All works             | Click "Select All"                | "10 venues" displayed                                       |
| E7  | `funding-arbitrage.spec.ts`  | Clear works                  | Click "Clear"                     | "Select venues" displayed                                   |
| E8  | `funding-arbitrage.spec.ts`  | Search disabled              | No venues selected                | Search button disabled                                      |
| E9  | `groups.spec.ts`             | Groups page renders          | Navigate /groups                  | Title + Create visible                                      |
| E10 | `groups.spec.ts`             | Empty state                  | Mock [] → /groups                 | "No groups yet"                                             |
| E11 | `groups.spec.ts`             | Create validates blank       | Open dialog → blank name → submit | "Group name is required"                                    |
| E12 | `groups.spec.ts`             | Lists groups                 | Mock [Main] → /groups             | Name + count visible                                        |
| E13 | `groups.spec.ts`             | Error retry                  | Mock 500 → /groups                | Retry button visible                                        |
| E14 | `groups.spec.ts`             | Detail lists members         | Mock group+members → /groups/g1   | Address row, no Scan needed                                 |
| E15 | `groups.spec.ts`             | Member name + alias          | Mock member with alias            | Display name + alias shown                                  |
| E16 | `groups.spec.ts`             | Empty members                | Mock [] members                   | No members yet                                              |
| E17 | `groups.spec.ts`             | Remove member refetch        | DELETE members → {removed:1}      | DELETE sent, list reloads                                   |
| E18 | `groups.spec.ts`             | Links to scanner             | Open /groups/g1                   | Link /traders?group=g1                                      |
| E19 | `groups.spec.ts`             | Scanner scans to list        | POST search mock → Search         | Name + address, body defaults                               |
| E20 | `groups.spec.ts`             | Invalid min/max blocks       | ROI 5/1 → Search                  | Error, no API call                                          |
| E21 | `groups.spec.ts`             | Non-numeric blocks           | PnL "abc" → Search                | invalidNumber, no API call                                  |
| E22 | `groups.spec.ts`             | Header sorts desc→asc        | Click PnL header                  | 2nd body sort_direction asc                                 |
| E23 | `groups.spec.ts`             | Numbered page replaces       | Page 2 click, page:2 in body      | 2nd row only, Page 2 of 2, ?page=2                          |
| E24 | `groups.spec.ts`             | Empty + reset filters        | Mock [] → Search → Reset          | No traders, form cleared                                    |
| E25 | `groups.spec.ts`             | Error + retry recovers       | 500 → Retry                       | Rows after retry                                            |
| E26 | `groups.spec.ts`             | Group needs auth             | Group + 401 search                | Auth message shown                                          |
| E27 | `groups.spec.ts`             | Add modal from scan          | Tick + Add to group (1)           | Modal → Added 1                                             |
| E28 | `groups.spec.ts`             | Scan without wallet          | No auth → Search                  | Rows + group hint, no modal                                 |
| E29 | `groups.spec.ts`             | Save search persists         | Save "My 7D" → reload → apply     | Chip kept, period 7D, rows                                  |
| E30 | `groups.spec.ts`             | URL restores on refresh      | ?period=7D&roi_min=30             | Form + auto search                                          |
| E31 | `groups.spec.ts`             | Venue/period in body         | Period 7D → Search                | venue + period in POST body                                 |
| E32 | `groups.spec.ts`             | Detail open + back           | View → detail → Back              | Filters + rows preserved                                    |
| E33 | `groups.spec.ts`             | Detail period tabs           | Click 7D on detail                | period=7D refetch                                           |
| E34 | `groups.spec.ts`             | Detail 404                   | Direct detail URL, 404 mock       | Trader not found                                            |
| E35 | `groups.spec.ts`             | Create group dialog          | Fill name+desc → Create           | Row appears in list                                         |
| E36 | `groups.spec.ts`             | Edit group name              | Edit → rename → Save              | New name in list                                            |
| E37 | `groups.spec.ts`             | Delete with warning          | Delete → confirm text → confirm   | Membership text, row gone                                   |
| E38 | `groups.spec.ts`             | Group+ROI combine            | Group + ROI/PnL → Search          | group_id + mins in body                                     |
| E39 | `groups.spec.ts`             | Back restores search         | Search A → B → back               | Form A + refetch roi_min                                    |
| E40 | `groups.spec.ts`             | Network fail + retry         | Abort → error → Retry             | Filters kept, rows recover                                  |
| E41 | `groups.spec.ts`             | Stale rows inspectable       | Stale status mock → Search        | Stale text + data visible                                   |
| E42 | `groups.spec.ts`             | Detail inline create         | Add → new group → Add 1           | Added 1                                                     |
| E43 | `groups.spec.ts`             | Stale detail                 | Stale + partial mock              | Stale + Partial + data                                      |
| E44 | `groups.spec.ts`             | Add/remove member flow       | 2 members → remove 1              | Count + table update                                        |
| E45 | `groups.spec.ts`             | Groups 500 while authed      | 500 → error + Retry → 200         | No auth hint, Main in Group                                 |
| E46 | `scanner-pagination.spec.ts` | Page click replaces          | Page 2 → page:2 in body           | Trader 21 only, ?page=2                                     |
| E47 | `scanner-pagination.spec.ts` | Deep link ?page=3            | Goto ?page=3                      | page:3 sent, Page 3 current                                 |
| E48 | `scanner-pagination.spec.ts` | Back/forward restores        | Page 2 → back → forward           | Trader 1 → 2 → 1 → 2                                        |
| E49 | `scanner-pagination.spec.ts` | Beyond-total clamps          | Goto ?page=9 (2 pages)            | Falls to page 2, Page 2 of 2                                |
| E50 | `scanner-pagination.spec.ts` | Rapid 2→3 latest wins        | Click 2 then 3 (2 delayed)        | Trader 3 only                                               |
| E51 | `scanner-pagination.spec.ts` | 500 on page 2 + retry        | Page 2 fails → Retry              | Trader 2, page:2 kept, ?page=2                              |
| E52 | `scanner-pagination.spec.ts` | Invalid ?page= clamps        | Goto ?page=0                      | page:1 sent                                                 |
| E53 | `scanner-pagination.spec.ts` | Axe on paginated list        | wcag2a+aa                         | No violations                                               |
| E54 | `scanner-pagination.spec.ts` | Keyboard pagination          | Focus Page 2 + Enter              | Trader 2 visible                                            |
| E55 | `scanner-pagination.spec.ts` | Narrow no overflow           | 640px, 10 pages                   | Pagination visible, no overflow                             |
| E56 | `trader-detail.spec.ts`      | Positions + activity         | Mock positions/activity → detail  | BTC row + Net PnL visible                                   |
| E57 | `trader-detail.spec.ts`      | Empty positions/activity     | Mock [] → detail                  | No open positions + No activity                             |
| E58 | `trader-detail.spec.ts`      | Never-synced syncing M5      | data_status=syncing               | Syncing visible                                             |
| E59 | `trader-detail.spec.ts`      | Activity Load more           | has_more → Load more click        | ETH second page visible                                     |
| E60 | `trader-detail.spec.ts`      | Positions 500 keeps overview | positions 500 → detail            | Heading + Open Positions visible                            |
| E61 | `wallet-tabs.spec.ts`        | Nine tabs default            | Navigate detail (mock fixtures)   | 9 tabs, Positions active, BTC row                           |
| E62 | `wallet-tabs.spec.ts`        | Deep link ?tab=balances      | Goto ?tab=balances                | Balances active, HYPE visible                               |
| E63 | `wallet-tabs.spec.ts`        | Tab writes ?tab=             | Click Trades tab                  | URL /tab=trades/, tab selected                              |
| E64 | `wallet-tabs.spec.ts`        | Placeholders, no fake data   | predictions → swap tabs           | Coming-soon, zero tables                                    |
| E65 | `wallet-tabs.spec.ts`        | Positions server sort        | Click uPnL header                 | sort=unrealized_pnl in request                              |
| E66 | `wallet-tabs.spec.ts`        | Positions empty/syncing      | summary=null, []                  | No open positions                                           |
| E67 | `wallet-tabs.spec.ts`        | Trades full table            | ?tab=trades                       | ENTRY/EXIT/NOTIONAL/DURATION/—/NET                          |
| E68 | `wallet-tabs.spec.ts`        | Trades result filter         | Win chip → result=win             | BTC only, counts stable All (2)                             |
| E69 | `wallet-tabs.spec.ts`        | Trades side filter           | Short chip → side=short           | ETH only                                                    |
| E70 | `wallet-tabs.spec.ts`        | Trades server sort           | Click Net PnL header              | sort=net_pnl in request                                     |
| E71 | `wallet-tabs.spec.ts`        | Trades empty                 | rows=[]                           | No closed trades                                            |
| E72 | `wallet-tabs.spec.ts`        | Balances perp+spot           | ?tab=balances                     | Withdrawable + HYPE/USDC                                    |
| E73 | `wallet-tabs.spec.ts`        | Fills shape                  | ?tab=fills                        | ETH SELL + Close Long                                       |
| E74 | `wallet-tabs.spec.ts`        | Orders open vs historical    | open → Historical click           | No status → filled visible                                  |
| E75 | `wallet-tabs.spec.ts`        | Transfers enum type          | ?tab=transfers                    | subAccountTransfer + $50.00K                                |
| E76 | `wallet-tabs.spec.ts`        | Performance + equity         | ?tab=performance                  | Equity curve + 2026-10-01 row                               |
| E77 | `wallet-tabs.spec.ts`        | Balances error + retry       | 500 ×4 → Retry                    | Error → Perp account recovers                               |
| E78 | `wallet-tabs.spec.ts`        | Vietnamese tabs              | /vi/ ?tab=trades                  | Giao dịch selected, BTC visible                             |
| E79 | `trader-sync.spec.ts`        | First view auto-syncs (v1.1) | Seed unsynced → detail            | 1× POST /sync, syncing skeleton → BTC + Net PnL, no refresh |
| E80 | `trader-sync.spec.ts`        | Trades tab syncing (v1.1)    | ?tab=trades unsynced              | Syncing skeleton → BTC rows, 1× POST                        |
| E81 | `trader-sync.spec.ts`        | Genuine empty + Sync now     | ready + [] → ?tab=trades          | No closed trades + Sync now → 2nd POST                      |
| E82 | `trader-sync.spec.ts`        | Vietnamese sync states       | /vi/ unsynced → detail + trades   | Đang đồng bộ... + Đồng bộ ngay visible                      |

### Accessibility / Keyboard / Visual / Performance

| ID   | File                    | Coverage                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1-9 | `accessibility.spec.ts` | axe wcag2a+aa: scanner (default/results/error), detail, groups+dialog, add modal, open filter sheet ×2 locales + active chip                                                                                                                                                                                                                                             |
| K1-5 | `keyboard.spec.ts`      | Tab order, Enter-to-sort, focus trap + Escape, filter sheet Escape + focus return, narrow scroll                                                                                                                                                                                                                                                                         |
| V1-9 | `visual.spec.ts`        | Baselines (frozen clock): scanner ×4, filter sheet open (whole-page viewport, not `fullPage`; sheet portals to `<body>`), detail, groups, narrow ×2 — STALE after numbered pagination (Load more gone, `resultsPaged` copy): `scanner-results.png` + `scanner-results-narrow.png` (+ `scanner-default.png` count copy) need per-image review before `--update-snapshots` |
| P1-3 | `performance.spec.ts`   | Numbered page (20 rows, Page 1 of 5) <15s, slow-search keeps rows, 500-member group pages                                                                                                                                                                                                                                                                                |

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
| FE-007 | Numbered pagination       | unit page replace/no-op/reset/clamp + E23 + E46-E55  |
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
| Visual baselines approved (desktop + narrow) | ✅ 9 baselines in `tests/e2e/visual.spec.ts-snapshots/`    |
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

Visual baselines live in `tests/e2e/visual.spec.ts-snapshots/` (frozen clock,
`nextjs-portal` hidden; most are main-region captures, while the filter-sheet
baseline is a whole-page viewport capture (not `fullPage`) because the sheet
portals to `<body>`). Regenerate deliberately with
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

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Author |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2026-09-19 | Initial test cases                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —      |
| 2026-09-29 | Saved searches (localStorage) + public scan tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | —      |
| 2026-09-30 | Filter-config integration: DEX dropdown + config-driven filters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | —      |
| 2026-09-30 | Human-readable labels: metric/sort/operator/order options + i18n frame labels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —      |
| 2026-10-01 | P0 trader foundation: types/service/validation/format/url-state (spec v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | —      |
| 2026-10-01 | P1 scanner redo: filter grid, header sort, cursor pages, URL state, trader-groups modal (spec v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | —      |
| 2026-10-02 | P2 trader detail: header/tabs/cards/long-short/freshness/add-to-group (spec v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | —      |
| 2026-10-02 | Cutover groups to trader-groups API: list/form/delete/detail, remove dead wallets/groups code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —      |
| 2026-10-03 | P4 a11y/visual/perf/keyboard suites + P5 FE-040 gap closure (spec v1.1 exit criteria)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | —      |
| 2026-10-03 | F1 member metrics columns + F2 inline alias/note edit via PATCH members                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | —      |
| 2026-10-05 | Phase 4 scanner header: period segmented, venue badge, group select, filters toggle, sort select, rank column, mono numerals, status moved to identity cell (9 new unit tests, 3 visual baselines refreshed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | —      |
| 2026-10-05 | Header bugfix: numeric headers right-aligned, header Sort select removed (table sort only), groups refetch on auth change with 401/403 vs load-error split + Retry (E45)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —      |
| 2026-10-05 | Phase 5 sheet: metric filters moved from inline panel into `filter-sheet.tsx` (3 clusters, 9 metrics, presets + Custom, per-field validation, group cluster only disabled when unauthenticated). New `filter-sheet.test.tsx` (10 tests); deferred 5.4 reset/period behaviour and 5.5 saved-search move to Batch 5B                                                                                                                                                                                                                                                                                                                                                                                                                                                | —      |
| 2026-10-05 | Phase 5B chips + saved searches: `filter-chips.tsx` shows one short key-value chip per active metric filter (4 visible + `+N`), each `×` removes exactly that filter and re-runs; sheet Reset now clears only the 9 metric filters, keeps Period/Venue/Group, and re-runs; `saved-searches.tsx` renders as a "Saved filters" fieldset cluster inside the sheet. New `filter-chips.test.tsx` (6 tests), saved-searches +1, scanner reset test repointed to the empty-state full reset                                                                                                                                                                                                                                                                              | —      |
| 2026-10-05 | Phase 5 review fixes: sheet width override uses the base's `data-[side=right]:sm:` modifier order so `cn` drops `sm:max-w-sm` (400px honored); `SheetContent` gains `showOverlay` (defaults true) and the non-modal filter sheet renders no backdrop so page controls stay clickable; overlay honors `prefers-reduced-motion`; header Group select now commits + re-runs the search like Period; `deriveCustom` reopens an applied preset as a preset. filter-sheet +2, scanner page +1                                                                                                                                                                                                                                                                           | —      |
| 2026-10-05 | Phase 5C (5.7 non-visual): accessibility +3 (open filter sheet axe-clean in en + vi, and with an active filter chip) and keyboard +1 (Escape closes the sheet and returns focus to the header Filters button). Deleted dead `trader-filters.tsx` + its 6-test spec (no `src` importer; replaced by `filter-sheet.tsx`). Unit total 237 → 231                                                                                                                                                                                                                                                                                                                                                                                                                      | —      |
| 2026-10-06 | Scanner direction change (human-approved): header Group select and the sheet Group cluster are removed, so the earlier group-select entries above no longer describe the product. Entering the scanner always searches — URL params restore that search, an empty URL loads the default list (venue hyperliquid, period 30D, sort pnl desc), `?group_id=` is stripped and Reset re-runs the default search. Unit specs re-synced (scanner-header 10→6, filter-sheet 12→10, scanner page 18→16; unit total 231→223) and dead group i18n keys removed from en + vi.                                                                                                                                                                                                 | —      |
| 2026-10-06 | Numbered pagination (CONTRACT.md §3): scanner cursor/Load-more replaced by numbered pages (20/page, `?page=` omitted when 1, clamp 0/abc→1, reset-to-1 on filter/sort/period, beyond-total falls to last page, current-page click no-op). `Meta` + `page/total/total_pages/offset` + `TraderSearchQuery.page` match BE swagger exactly; shared `components/shared/pagination.tsx` (funding + groups + scanner); copy `resultsPaged`/`pageOf` in en+vi. Tests: url-state 6→10, services 11→12, scanner 16→20, new pagination unit (5) + `scanner-pagination.spec.ts` (E46-E55); P1 reworked to 20 rows / Page 1 of 5. Visual `scanner-results*` baselines change (Load more gone, new count copy) — NOT regenerated, needs per-image approval. Unit total 224→238. | —      |
| 2026-10-06 | Phase 5 review fixes: `errOutOfRange` copy made range-agnostic (en/vi); `matchesPreset` compares parsed numeric values so profit-factor presets (1.0/1.5/2.0) survive the URL round-trip; dead `traders.minPlaceholder`/`maxPlaceholder`/`search`/`reset` keys removed from en + vi; `visual.spec.ts` filter-sheet-open now mocks `/api/v1/traders/search` (baseline `scanner-sheet-open` refreshed). filter-sheet +1 (unit total 223→224).                                                                                                                                                                                                                                                                                                                       | —      |
| 2026-10-07 | Trader Detail positions + activity (DETAIL-PLAN Part B): types/services/format/WS client (backoff 1s-30s, ping 25s, hidden suspend M4) + useTraderActivity, positions-section + activity-feed, 2-col layout, i18n en+vi incl positionsSyncing M5. Unit 238-263 (+25), E2E trader-detail.spec.ts REST-only E56-E60 (M3 WS via stubbed unit, M7 no WS e2e).                                                                                                                                                                                                                                                                                                                                                                                                         | --     |
| 2026-10-08 | Wallet tabs contract v1 (FE §5): 9-tab shell with ?tab= URL state + en/vi, POSITIONS sortable header, TRADES full table (server sort + Win/Loss + Long/Short chips with counts, FUNDING —), BALANCES/ORDERS/FILLS/TRANSFERS/PERFORMANCE tables on shared format helpers, PREDICTIONS/SWAP coming-soon placeholders (no fake data). Types in trader.ts, services in traders.ts, hooks per tab. Unit 263→325 (+62), E2E wallet-tabs.spec.ts E61-E78 mocked from fixtures.                                                                                                                                                                                                                                                                                           | —      |
| 2026-10-08 | Sync-on-view contract v1.1 (FE §4): POST /sync service + `useTraderSyncOnView` once-guard (F1), 12s/≤8-attempt polling on positions + activity/trades (F2), syncing skeleton vs genuine empty + Sync now fallback in TradesSection + ActivityFeed/Recent Activity (F3), en/vi keys `tradesSyncing`/`activitySyncing`/`syncNow` (F4). `ActivityPage.data_status?` additive (missing ⇒ ready). Unit 325→366 (+41: lib/trader-sync 14, use-trader-sync 5, polling 6, services +3, activity-feed +5, trades-section +3, detail +5), E2E trader-sync.spec.ts E79-E82 mocked per §5.                                                                                                                                                                                    | —      |
