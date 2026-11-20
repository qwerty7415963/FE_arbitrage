# Test Cases - Arbitrage FE

> Single source of truth cho test cases. Cáº­p nháº­t file nÃ y khi thÃªm feature má»›i.

---

## I. Manual Test Cases (API-level)

### 1. Email Auth

| #   | Case                  | Endpoint             | Input                           | Expected                              |
| --- | --------------------- | -------------------- | ------------------------------- | ------------------------------------- |
| M6  | Get profile OK        | `GET /auth/me`       | `Authorization: Bearer <valid>` | 200 `{ id, email, role, status }`     |
| M7  | Get profile no token  | `GET /auth/me`       | KhÃ´ng cÃ³ header               | 401                                   |
| M8  | Get profile expired   | `GET /auth/me`       | Expired JWT                     | 401                                   |
| M9  | Refresh token OK      | `POST /auth/refresh` | `{ refresh_token }` há»£p lá»‡  | 200 `{ access_token, refresh_token }` |
| M10 | Refresh token expired | `POST /auth/refresh` | `{ refresh_token }` invalid     | 401                                   |
| M11 | Logout                | `POST /auth/logout`  | `Authorization: Bearer <valid>` | 204                                   |

### 2. Wallet Auth

| #   | Case                   | Endpoint                   | Input                    | Expected                    |
| --- | ---------------------- | -------------------------- | ------------------------ | --------------------------- |
| W1  | Get nonce OK           | `POST /auth/wallet/nonce`  | `{ address, chain_id }`  | 200 `{ nonce, expires_at }` |
| W2  | Get nonce sai address  | `POST /auth/wallet/nonce`  | `{ address: "xxx" }`     | 400                         |
| W3  | Verify OK (user má»›i) | `POST /auth/wallet/verify` | `{ message, signature }` | 200 `AuthResponse`          |
| W4  | Verify OK (user cÅ©)   | `POST /auth/wallet/verify` | `{ message, signature }` | 200 `AuthResponse`          |
| W5  | Verify nonce expired   | `POST /auth/wallet/verify` | Nonce háº¿t háº¡n        | 401 `NONCE_EXPIRED`         |
| W6  | Verify sai signature   | `POST /auth/wallet/verify` | `{ message, wrong_sig }` | 401 `INVALID_SIGNATURE`     |
| W7  | List wallets           | `GET /auth/wallet/list`    | `Bearer <valid>`         | 200 `WalletResponse[]`      |
| W8  | Unlink wallet          | `DELETE /auth/wallet/{id}` | `Bearer <valid>`         | 204                         |

---

## II. Unit Tests

### Coverage Summary

| Module                                                                                    | File                                                       | Tests   | Status |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------- | ------ |
| `lib/token.ts`                                                                            | `tests/unit/lib/token.test.ts`                             | 14      | âœ…    |
| `stores/auth.ts` (wallet-only)                                                            | `tests/unit/stores/auth.test.ts`                           | 16      | âœ…    |
| `services/auth.ts`                                                                        | `tests/unit/services/auth.test.ts`                         | 8       | âœ…    |
| `services/funding-arbitrage.ts`                                                           | `tests/unit/services/funding-arbitrage.test.ts`            | 13      | âœ…    |
| `components/group-form.tsx`                                                               | `tests/unit/components/group-form.test.tsx`                | 7       | âœ…    |
| `components/group-detail-page.tsx`                                                        | `tests/unit/components/group-detail-page.test.tsx`         | 9       | âœ…    |
| `components/trader-table.tsx`                                                             | `tests/unit/components/trader-table.test.tsx`              | 10      | âœ…    |
| `traders/_components/scanner-header.tsx`                                                  | `tests/unit/components/scanner-header.test.tsx`            | 6       | âœ…    |
| `traders/_components/filter-sheet.tsx`                                                    | `tests/unit/components/filter-sheet.test.tsx`              | 11      | âœ…    |
| `traders/_components/filter-chips.tsx`                                                    | `tests/unit/components/filter-chips.test.tsx`              | 6       | âœ…    |
| `components/add-to-trader-group-modal.tsx`                                                | `tests/unit/components/add-to-trader-group-modal.test.tsx` | 5       | âœ…    |
| `components/saved-searches.tsx`                                                           | `tests/unit/components/saved-searches.test.tsx`            | 3       | âœ…    |
| `app/[locale]/(protected)/traders/page.tsx`                                               | `tests/unit/components/trader-scanner-page.test.tsx`       | 20      | âœ…    |
| `app/[locale]/(protected)/traders/[address]/page.tsx` (reskin, live â€” no sync)          | `tests/unit/components/trader-detail-page.test.tsx`        | 10      | âœ…    |
| `components/copy-address.tsx`                                                             | `tests/unit/components/copy-address.test.tsx`              | 2       | âœ…    |
| `services/traders.ts` (live, no POST /sync)                                               | `tests/unit/services/traders.test.ts`                      | 30      | âœ…    |
| `lib/trader-saved-searches.ts`                                                            | `tests/unit/lib/trader-saved-searches.test.ts`             | 4       | âœ…    |
| `lib/trader-validation.ts`                                                                | `tests/unit/lib/trader-validation.test.ts`                 | 13      | âœ…    |
| `lib/trader-format.ts`                                                                    | `tests/unit/lib/trader-format.test.ts`                     | 21      | âœ…    |
| `lib/trader-url-state.ts`                                                                 | `tests/unit/lib/trader-url-state.test.ts`                  | 10      | âœ…    |
| `components/shared/pagination.tsx`                                                        | `tests/unit/components/pagination.test.tsx`                | 7       | âœ…    |
| `lib/trader-filter-draft.ts`                                                              | `tests/unit/lib/trader-filter-draft.test.ts`               | 9       | âœ…    |
| `components/funding-table.tsx` (7 columns incl. Symbol)                                   | `tests/unit/components/funding-table.test.tsx`             | 27      | âœ…    |
| `lib/funding-format.ts`                                                                   | `tests/unit/lib/funding-format.test.ts`                    | 16      | âœ…    |
| `infrastructure/api-client.ts` (401 emits unauthorized once)                              | `tests/unit/infrastructure/api-client.test.ts`             | 17      | âœ…    |
| `lib/trader-activity-ws.ts` (v1.2 wallet.* + SIDEBAR-3EVENTS order.created)               | `tests/unit/lib/trader-activity-ws.test.ts`                | 21      | âœ…    |
| `hooks/use-trader-activity.ts` (SIDEBAR-3EVENTS WS-only merge/sort/cap)                   | `tests/unit/hooks/use-trader-activity.test.tsx`            | 5       | âœ…    |
| `traders/[address]/_components/positions-section.tsx` (live, statement context)           | `tests/unit/components/positions-section.test.tsx`         | 11      | âœ…    |
| `traders/[address]/_components/activity-feed.tsx` (SIDEBAR-3EVENTS 3 renderers)           | `tests/unit/components/activity-feed.test.tsx`             | 12      | âœ…    |
| `lib/wallet-tab-state.ts`                                                                 | `tests/unit/lib/wallet-tab-state.test.ts`                  | 8       | âœ…    |
| `hooks/use-trader-{positions,balances,fills,orders,transfers,performance}.ts`             | `tests/unit/hooks/wallet-tab-hooks.test.tsx`               | 9       | ?      |
| `traders/[address]/_components/trades-section.tsx` (live FUNDING + as_of)                 | `tests/unit/components/trades-section.test.tsx`            | 9       | âœ…    |
| `traders/[address]/_components/wallet-tabs.tsx`                                           | `tests/unit/components/wallet-tabs.test.tsx`               | 5       | âœ…    |
| `traders/[address]/_components/{balances,orders,fills,transfers,performance}-section.tsx` | `tests/unit/components/wallet-tab-sections.test.tsx`       | 10      | âœ…    |
| `traders/[address]/_components/portfolio-chart.tsx` (SVG PnL/value, 4 ranges, 2 modes)    | `tests/unit/components/portfolio-chart.test.tsx`           | 6       | âœ…    |
| `lib/trader-poll.ts` + 8 REST hooks + WS-only activity (30s poll, error stop)             | `tests/unit/hooks/trader-polling.test.tsx`                 | 14      | âœ…    |
| `lib/trader-retry.ts` (selective retry 429/408/5xx, max 2, backoff 1sâ†’5s cap)           | `tests/unit/lib/trader-retry.test.ts`                      | 14      | âœ…    |
| `traders/[address]/_components/wallet-statement-header.tsx` (Layout C statement)          | `tests/unit/components/wallet-statement-header.test.tsx`   | 10      | âœ…    |
| `traders/[address]/_components/wallet-performance-strip.tsx` (Layout C statement)         | `tests/unit/components/wallet-performance-strip.test.tsx`  | 4       | âœ…    |
| `lib/auth-events.ts`                                                                      | `tests/unit/lib/auth-events.test.ts`                       | 4       | âœ…    |
| `hooks/use-auth-gate.ts`                                                                  | `tests/unit/hooks/use-auth-gate.test.ts`                   | 6       | âœ…    |
| `hooks/use-telegram.ts`                                                                   | `tests/unit/hooks/use-telegram.test.tsx`                   | 5       | âœ…    |
| `app/[locale]/(protected)/settings/page.tsx`                                              | `tests/unit/components/settings-page.test.tsx`             | 7       | âœ…    |
| `(protected)/groups` + `/groups/[groupId]` auth gate (no API pre-auth)                    | `tests/unit/components/groups-auth-gate.test.tsx`          | 3       | âœ…    |
| **Total**                                                                                 |                                                            | **488** |        |

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

#### `services/auth.ts` (8 tests)

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

#### `services/funding-arbitrage.ts` (13 tests)

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

#### `services/traders.ts` (30 tests, live â€” no POST /sync)

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
| no-data throws Ã—5            | balances/fills/orders/transfers/performance |
| getTraderGroup GETs           | GET trader-groups/{id}                      |
| getTraderGroup missing        | Empty response                              |
| groups CRUD + members         | added/removed counts                        |
| members period param          | default 30D + custom                        |
| patch members reports updated | PATCH â†’ {updated}                         |

#### `lib/trader-activity-ws.ts` (21 tests, v1.2 Â§2 + SIDEBAR-3EVENTS)

| Test                                    | Description                                  |
| --------------------------------------- | -------------------------------------------- |
| builds ws url lowercase                 | `ws://host/api/v1/traders/ws?wallet=`        |
| uses wss for https                      | `wss://` scheme                              |
| backoff caps at 30s                     | 1sâ†’2sâ†’4sâ†’â€¦â†’30s                     |
| legacy activity routes to onFill        | `subscribed` ignored, `activity` validated   |
| wallet.fill.created â†’ onFill          | incremental fill, no refetch                 |
| wallet.funding.created â†’ onFunding    | signed usdc attributed, net unchanged        |
| wallet.order.updated â†’ onOrder        | oid + status validated                       |
| wallet.order.created â†’ onOrderCreated | placements only, updates stay on onOrder     |
| wallet.position.updated â†’ onPosition  | ready\|error snapshot only                   |
| wallet.activity.created â†’ onActivity  | trade prepended, funding defaulted to 0      |
| wallet.connection.updated Ã—6           | DISCONNECTEDâ€¦LIVEâ€¦ERROR all routed       |
| malformed ignored                       | bad fill/ping/pong/state-updated never crash |
| listener cleanup after close            | messages after `close()` ignored             |
| ping every 25s                          | heartbeat `{type:ping}`                      |
| reconnect after close                   | `reconnecting` + new socket after 1s         |
| hidden suspends (M4)                    | `visibilitychange` closes + resubscribes     |

#### `hooks/use-trader-activity.ts` (5 tests, SIDEBAR-3EVENTS WS-only)

| Test                         | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| no REST, starts disconnected | `fetchTraderActivity` never called, `isLoading=true`     |
| merges 3 kinds sorted DESC   | limit + open fill + close â†’ newest first, 3 rows       |
| skips Close-dir fills        | `Close Long`/`close short` dropped, open kept            |
| caps merged timeline at 50   | 60 fills â†’ 50 newest kept                              |
| keeps WS status/reconnect    | `live` + `connection` surface, `isLoading` gates loading |

#### `traders/[address]/_components/positions-section.tsx` (11 tests, live statement)

| Test                        | Description                                      |
| --------------------------- | ------------------------------------------------ |
| row + context line          | BTC/ETH rows + `2 positions Â· 50% long Â· 2Ã—`  |
| no duplicated account stats | No Account value / Total notional / Total margin |
| empty state                 | `noOpenPositions` when `[]`                      |
| count-based long % fallback | Missing `position_value` â†’ 50% from counts     |
| inline error status         | `data_status=error` â†’ Error only               |
| no old ready/as-of line     | No `Ready`/`Syncing`/`Stale`                     |
| retry after error           | Button calls `onRetry`                           |
| sortable headers            | aria-sort + `onSortChange` column                |
| TP/SL headers               | TP + SL column headers                           |
| TP/SL overflow + title      | Truncated list with full-price title             |
| TP/SL dash                  | Empty lists render `â€”`                         |

#### `traders/[address]/_components/activity-feed.tsx` (12 tests, SIDEBAR-3EVENTS)

| Test                         | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| loading while connecting     | `reconnecting` + empty â†’ skeleton `role=status` |
| waiting copy once connected  | empty â†’ `activityWaiting`, zero buttons         |
| limit/fill/close rows        | LIMIT/BTC + LONG/ETH + CLOSED/SOL +$195           |
| spot fallback BUY/SELL       | `Sell` dir â†’ SELL (not SHORT)                   |
| LIVE gated on connection     | RECONNECTING/ERROR â†’ no badge                   |
| no badge while disconnected  | transport down â†’ no badge even with LIVE state  |
| legacy connected badge       | `connected` + null connection â†’ LIVE            |
| no Load more/Retry (WS-only) | zero buttons, dead props removed                  |
| notional both present        | limit $30.00K + fill $2.77K `approx` lines        |
| notional hides without size  | missing size â†’ no `approx` line                 |
| notional hides without price | missing price â†’ no `approx` line                |
| notional zero shows $0.00    | size 0 â†’ `approx $0.00`                         |

#### `lib/wallet-tab-state.ts` (8 tests)

| Test                     | Description                                |
| ------------------------ | ------------------------------------------ |
| nine tabs contract order | positionsâ€¦performance, default positions |
| accepts contract ids     | every `WALLET_TABS` id incl swap           |
| rejects unknown          | funding/empty/null â†’ false               |
| parses ?tab=             | valid value kept                           |
| fallback                 | missing/invalid â†’ positions              |
| sets ?tab=               | non-default tabs in URL                    |
| omits default            | positions drops `?tab=`                    |
| preserves siblings       | other params kept on switch                |

#### `hooks/use-trader-trades.ts` (5 tests, live)

| Test                           | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| maps rows + funding/counts     | funding âˆ’12.5, `net=1470` unchanged, counts kept |
| forwards filters               | sort/dir/result/side/limit to service              |
| cursor pagination              | `next_cursor` â†’ second page                      |
| idle when disabled             | no fetch while tab inactive                        |
| WS subscribed once, no polling | single fetch + single `connectTradeActivityWS`     |

#### `hooks/wallet-tab-hooks.ts` (9 tests)

| Test                         | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| positions sort/dir           | lowercased wallet + sort forwarded               |
| positions idle when disabled | no fetch while tab inactive                      |
| balances snapshot            | perp/spot `data_status` mapped                   |
| fills cursor paging          | ETH fixture row, `tid` cursor                    |
| orders status                | historical filter forwarded                      |
| transfers days               | days=7 forwarded                                 |
| performance period           | period=7D + default mode=perps forwarded         |
| performance mode query key   | mode=combined forwarded and keyed in react-query |

#### `traders/[address]/_components/trades-section.tsx` (9 tests, live)

| Test                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| funding + net unchanged    | âˆ’$12.5 informational, +$1,470 = pnlâˆ’fees |
| as_of + partial markers    | `As of` + `Partial data` from live page      |
| chips + counts             | All/Win/Loss + All/Long/Short from response  |
| server-side sort           | header click â†’ sort=net_pnl                |
| server-side filter         | Win chip â†’ result=win                      |
| null entry/exit            | dashes, no fake prices                       |
| genuine empty, no Sync now | `noTrades`, no Sync button                   |
| error retry                | Button calls `refetch`                       |
| load more                  | Button calls `fetchNextPage`                 |

#### `traders/[address]/_components/wallet-tabs.tsx` (5 tests)

| Test              | Description                             |
| ----------------- | --------------------------------------- |
| nine tabs default | positions active, BTC row visible       |
| writes ?tab=      | click Balances â†’ `router.replace` URL |
| restores ?tab=    | `?tab=trades` opens the trades panel    |
| placeholders      | predictions/swap coming-soon, no tables |
| positions sort    | uPnL header â†’ sort + dir to service   |

#### `traders/[address]/_components/wallet-tab-sections.tsx` (10 tests)

| Test                   | Description                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| balances fixture       | perp cards (withdrawable + cross) + HYPE/USDC rows; duplicate top cards + Positions value absent    |
| balances empty + retry | `noBalances`, Retry â†’ `refetch`                                                                   |
| orders open            | BUY row, no status columns                                                                          |
| orders historical      | `filled` status columns shown                                                                       |
| orders empty           | `noOrders`                                                                                          |
| fills fixture          | ETH SELL + Close Long + fee                                                                         |
| fills empty            | `noFills`                                                                                           |
| transfers fixture      | subAccountTransfer + $50.00K                                                                        |
| transfers empty        | `noTransfers`                                                                                       |
| performance fixture    | portfolio chart title/ranges + equity only (no metric cards in tab; shared period) + 2026-10-01 row |

#### `traders/[address]/_components/portfolio-chart.tsx` (6 tests)

| Test               | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| default ALL + PNL  | title `ALL PERPS PNL` + latest point `+$250`, four range buttons   |
| local range switch | 24H â†’ `24H PERPS PNL` + `+$120`, no parent callback (no refetch) |
| VALUE metric       | `ALL PERPS VALUE` + latest account value `$81.00K`                 |
| empty series       | keeps the title, shows `No data`                                   |
| mode buttons       | COMBINED/PERPS call `onModeChange` with the picked mode            |
| loading skeleton   | `role=status` while loading                                        |

#### `lib/trader-retry.ts` (14 tests)

| Test                       | Description                               |
| -------------------------- | ----------------------------------------- |
| retries 429 rate limit     | `shouldRetryTraderQuery(0, 429)` â†’ true |
| retries 500 server error   | `shouldRetryTraderQuery(0, 500)` â†’ true |
| retries 503 unavailable    | `shouldRetryTraderQuery(0, 503)` â†’ true |
| retries 408 timeout        | `shouldRetryTraderQuery(0, 408)` â†’ true |
| never retries 400/401/403  | client errors â†’ false                   |
| never retries 404/422/499  | not-found/validation/abort â†’ false      |
| never retries non-ApiError | plain `Error` â†’ false                   |
| stops after max retries    | `failureCount` 2 and 3 â†’ false          |
| backs off 1000 then 2000   | `traderRetryDelay(0/1)` â†’ 1000/2000     |
| caps at 5000               | `traderRetryDelay(3/10)` â†’ 5000         |

> Contract v1.2 (live): sync machinery deleted â€” `src/lib/trader-sync.ts`,
> `src/hooks/use-trader-sync.ts`, sync polling specs and `POST /sync` service
> are gone. Detail states are loading / error / ready only (`ready|error`,
> `as_of` + `partial`); `wallet.*` WS envelopes patch incrementally.

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

| Test                    | Description              |
| ----------------------- | ------------------------ |
| header + member rows    | Name, address, alias     |
| member metrics columns  | ROI/PnL + dashes         |
| local search filters    | Client-side filter       |
| remove refetches        | venue+address, reload    |
| group 404 â†’ not found | Error + retry            |
| empty members           | No members yet           |
| inline edit saves       | PATCH trimmed alias+note |
| Escape cancels edit     | No API call              |
| edit error surfaces     | Inline banner            |

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

| Test                       | Description                                       |
| -------------------------- | ------------------------------------------------- |
| chip per active filter     | `ROI â‰¥20%`, `PnL â‰¤$500` short key/value chips |
| no filters â†’ no chips    | Renders nothing when all metric filters clear     |
| collapse over four         | Four visible chips + a `+N` overflow chip         |
| remove calls back with key | `Remove ROI â‰¥20%` â†’ `onRemove('roi')`         |
| remove re-runs search      | Page re-searches without the removed filter       |
| reset clears nine metrics  | Period/Venue kept, ROI cleared, search re-runs    |

#### `components/trader-table.tsx` (10 tests)

| Test                      | Description                            |
| ------------------------- | -------------------------------------- |
| formatted cells + tooltip | Signs, $K/$M, relative + UTC title     |
| dashes for null metrics   | â€” placeholders, â€” / â€” long/short |
| copy address + feedback   | Clipboard + Copied                     |
| header sort + aria-sort   | onSortChange, PF header not sortable   |
| select + view/add actions | Checkbox, View detail, Add to group    |
| negative PnL sign         | Minus prefix, not color only           |
| malicious name inert      | No executable HTML (FE-040)            |
| rank column               | One-based positions per loaded row     |
| numeric alignment         | text-right + tabular-nums on numbers   |
| numeric header alignment  | text-right headers match cells         |

#### `traders/_components/scanner-header.tsx` (6 tests)

| Test                 | Description                                      |
| -------------------- | ------------------------------------------------ |
| period pressed state | Active period has aria-pressed true              |
| period change        | onPeriodChange with the picked period            |
| venue static         | Badge text, no Venue control in tab order        |
| no group control     | No Group label/combobox, hint or load-error text |
| filters toggle       | aria-expanded + aria-controls, callback          |
| result count         | resultText shown when provided                   |

#### `traders/_components/filter-sheet.tsx` (16 tests)

| Test                           | Description                                                |
| ------------------------------ | ---------------------------------------------------------- |
| three clusters + nine metrics  | Performance/Scale/Order bias, no Group cluster             |
| dialog, no aria-modal          | Sheet labelled by heading, "Close without applying"        |
| reveal min/max via Custom      | Preset â†’ Custom reveals the from/to pair                 |
| preset sets min                | Win rate â‰¥60% â†’ from = 60                              |
| preset reopens as preset       | Applied preset still a preset, not Custom                  |
| preset survives URL round-trip | Profit-factor 1.0 reopens as preset after draft round-trip |
| non-preset reopens as Custom   | Typed 47 reopens under Custom                              |
| per-field errors + first alert | Invalid/integer/range/date errors, only first is alert     |
| Esc discards draft             | Reopen shows the last committed value                      |
| focus returns to opener        | Focus restoration after close                              |
| commits only on Apply          | onApply fires once on submit with the draft                |
| active preset lights up        | Clicked preset renders default + aria-pressed=true         |
| committed preset reopens lit   | Draft with min=55 reopens with 55% lit                     |
| preset exits Custom mode       | Clicking preset hides custom inputs, lights preset         |
| last-trade preset lights up    | 7 days click lights it, others stay outline                |
| preset buttons sm size         | Option buttons render h-7                                  |

#### `components/add-to-trader-group-modal.tsx` (5 tests)

| Test                       | Description                         |
| -------------------------- | ----------------------------------- |
| lists groups and adds      | Radio + Add â†’ Added N + onSuccess |
| requires selected group    | selectGroupRequired, no API call    |
| pasted addresses validated | EVM check, lowercase normalize      |
| long name + duplicate      | nameTooLong, GROUP-002 â†’ inline   |
| zero additions reported    | Added 0 for duplicates (FE-016)     |

#### `traders/page.tsx` trader scanner (20 tests)

| Test                          | Description                                   |
| ----------------------------- | --------------------------------------------- |
| auto-search on mount (page 1) | Controls visible, defaults POST incl page:1   |
| does not fetch groups         | No listTraderGroups call on load              |
| search merges defaults + URL  | venue/period/sort/limit/page:1, push URL      |
| skeleton on first search      | role=status while loading (FE-010)            |
| invalid min/max blocks        | Error, exactly 1 call (mount)                 |
| non-numeric blocks            | invalidNumber, exactly 1 call (mount)         |
| header toggles sort           | desc â†’ asc, page reset to 1                 |
| page change replaces rows     | page:2 sent, rows replaced (never append)     |
| current-page click no-op      | No request when clicking the active page      |
| filter change resets to 1     | ROI apply re-searches with page:1             |
| beyond-total falls back       | page=5 â†’ empty â†’ auto re-search last page |
| error + retry recovers        | Banner, Retry â†’ rows                        |
| keep rows + Updating          | Old rows visible during search                |
| latest overlapping wins       | Stale response ignored (FE-034)               |
| reset re-runs default search  | Form, rows, bare URL, re-fetch page:1         |
| URL restore + auto-search     | Params â†’ form + search                      |
| ignores ?group_id=            | Param stripped, search without groupId        |
| Page X of Y count             | "Page 2 of 20 Â· 40 results"                  |
| Page 1 of 1 fallback          | "Page 1 of 1 Â· 1 results" when no meta       |
| restores ?page=3              | Deep link searches with page:3                |

#### `components/shared/pagination.tsx` (7 tests)

| Test                         | Description                         |
| ---------------------------- | ----------------------------------- |
| single page renders nothing  | totalPages<=1 â†’ null              |
| numbers + aria-current       | Active page has aria-current="page" |
| ellipsis for long ranges     | 10 pages collapse with â€¦          |
| prev/next disabled at bounds | First/last page edge states         |
| disabled while loading       | All buttons disabled                |
| range thousands + en dash    | "Showing 1–20 of 10,539" (no u2013) |
| page size select labelled    | "Page size" combobox reports 50     |

#### `traders/[address]/page.tsx` trader detail (10 tests, reskin â€” live, no sync)

| Test                         | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| invalid address blocks       | No API call                                               |
| identity, cards, tabs        | Statement header, ROI/WR/Volume strip, Leaderboard, Ready |
| period switch refetches      | Page 7D drives shared period, detail refetch period=7D    |
| null metrics â†’ dashes      | Cards degrade gracefully                                  |
| partial keeps data           | Partial marker in card + rows still visible               |
| 404 â†’ retry recovers       | Trader not found â†’ rows                                 |
| back + add-to-group modal    | router.back, overflow button opens dialog                 |
| stored scan â†’ push on back | Deterministic return, no history race                     |
| never Sync now               | No Sync button, no `Syncing` text                         |
| live activity funding-aware  | BTC row from `wallet.*` activity                          |

#### `traders/[address]/_components/wallet-statement-header.tsx` (10 tests, Layout C)

| Test                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| hero + identity        | Account value, avatar, full address, venue, trophy     |
| derived values         | Available, 6.5% usage + bar, 0.41Ã— leverage, uPnL sum |
| negative-only uPnL     | âˆ’$200                                                |
| nulls â†’ dashes       | Null summary + empty positions                         |
| leverage/usage guard   | `account_value = 0` â†’ dashes, no progressbar         |
| details closed desktop | `matchMedia` false â†’ no `open` attribute             |
| details open mobile    | `matchMedia` true â†’ `open` attribute                 |
| add button             | `Add to group` calls `onAdd`                           |
| ready status line      | Ready + Last updated + Metrics as of + Partial         |
| error status line      | Metrics `data_status=error` â†’ Error                  |

#### `traders/[address]/_components/wallet-performance-strip.tsx` (4 tests, Layout C)

| Test         | Description                           |
| ------------ | ------------------------------------- |
| period group | 30D pressed, 7D not pressed           |
| period click | `onPeriodChange('7D')`                |
| six metrics  | ROI/WR/Volume/Trades/PF/Max DD values |
| null metrics | Six `â€”` values                      |

#### `components/copy-address.tsx` (2 tests)

| Test                        | Description           |
| --------------------------- | --------------------- |
| copies full address         | Clipboard + Copied    |
| full display when short off | Detail header variant |

#### `lib/trader-filter-draft.ts` (9 tests)

| Test                       | Description                         |
| -------------------------- | ----------------------------------- |
| query â†” draft round-trip | Text â†” numbers                    |
| invalid text stays NaN     | Page validation catches it          |
| immutable range update     | Original untouched                  |
| comma as decimal mark      | `0,5` â†’ 0.5 (locale vi)           |
| strips currency on paste   | `$1,000` â†’ 1000, `2 500` â†’ 2500 |
| blank cells â†’ undefined  | Whitespace-only means "no filter"   |
| garbage stays NaN          | `abc` passes through for validation |
| lastTradeAfter round-trip  | Draft â†” query both directions     |
| blank lastTradeAfter       | Empty string omitted from query     |

#### `stores/auth.ts` (16 tests)

| Test                               | Description                               |
| ---------------------------------- | ----------------------------------------- |
| requireAuth true when authed       | No modal opened                           |
| requireAuth opens modal            | Returns false + modal                     |
| logout clears tokens               | Calls API + wagmi + clear                 |
| logout clears on API error         | Clears even if API fails                  |
| fetchUser sets user                | Gets user from API                        |
| fetchUser clears on error          | Clears tokens on 401                      |
| initialize loads user              | Token exists                              |
| initialize keeps persisted address | Wagmi not reconnected yet                 |
| initialize uses wagmi address      | Wagmi account available                   |
| initialize clears on error         | getMe fails                               |
| initialize no token                | Skips loading                             |
| clearSession clears state          | Clears address + disconnect + clearTokens |
| initialize no token + account      | Address stays null                        |
| initialize getMe fail              | Address null + disconnect                 |
| formatAddress formats              | Shows 0x1234...5678                       |
| formatAddress empty                | Returns empty string                      |

#### `infrastructure/api-client.ts` (17 tests)

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
| apiClient 401 emits once          | No refresh token   |
| apiClient refresh fail emits      | Session expired    |
| apiClient refresh ok no emit      | Retried 200        |
| apiClientNoAuth never emits       | 401 stays silent   |

#### Auth gate / global 401 policy (2026-10-30)

- `lib/auth-events.ts` (4 tests): subscribe/unsubscribe, listener errors never propagate, repeated emits are safe.
- `hooks/use-auth-gate.ts` (6 tests): loading, unauthenticated, expired on any `ApiError` 401 (AUTH-003/AUTH-005), error for non-401, ready.
- `hooks/use-telegram.ts` (5 tests): `enabled: false` never fetches; failures are not retried.
- `settings/page.tsx` (7 tests): unauthenticated CTA with zero `/telegram/status` calls; 401 session-expired copy + reconnect; non-401 error + Retry.
- `groups` pages (3 tests): unauthenticated `/groups` and `/groups/[groupId]` render the neutral heading + connect CTA while `listTraderGroups`/`getTraderGroup`/`listGroupMembers`/`getStatus` stay uncalled; `/groups` fetches once `isAuthenticated` flips to true.

---

## III. E2E Tests (Playwright)

### Test Matrix

| #   | File                         | Flow                             | Steps                                 | Expected                                                                  |
| --- | ---------------------------- | -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| E1  | `protected.spec.ts`          | Settings open access             | Navigate /settings                    | Settings renders, no redirect                                             |
| E2  | `protected.spec.ts`          | Groups open access               | Navigate /groups                      | Groups renders, no redirect                                               |
| E3  | `protected.spec.ts`          | Mutation needs wallet            | Create group unauthenticated          | Connect wallet modal opens                                                |
| E4  | `funding-arbitrage.spec.ts`  | Page renders                     | Navigate /funding-arbitrage           | Title + buttons visible                                                   |
| E5  | `funding-arbitrage.spec.ts`  | Venue selector opens             | Click "Select venues"                 | Dropdown with venues shown                                                |
| E6  | `funding-arbitrage.spec.ts`  | Select All works                 | Click "Select All"                    | "10 venues" displayed                                                     |
| E7  | `funding-arbitrage.spec.ts`  | Clear works                      | Click "Clear"                         | "Select venues" displayed                                                 |
| E8  | `funding-arbitrage.spec.ts`  | Search disabled                  | No venues selected                    | Search button disabled                                                    |
| E9  | `groups.spec.ts`             | Groups page renders              | Navigate /groups                      | Title + Create visible                                                    |
| E10 | `groups.spec.ts`             | Empty state                      | Mock [] â†’ /groups                   | "No groups yet"                                                           |
| E11 | `groups.spec.ts`             | Create validates blank           | Open dialog â†’ blank name â†’ submit | "Group name is required"                                                  |
| E12 | `groups.spec.ts`             | Lists groups                     | Mock [Main] â†’ /groups               | Name + count visible                                                      |
| E13 | `groups.spec.ts`             | Error retry                      | Mock 500 â†’ /groups                  | Retry button visible                                                      |
| E14 | `groups.spec.ts`             | Detail lists members             | Mock group+members â†’ /groups/g1     | Address row, no Scan needed                                               |
| E15 | `groups.spec.ts`             | Member name + alias              | Mock member with alias                | Display name + alias shown                                                |
| E16 | `groups.spec.ts`             | Empty members                    | Mock [] members                       | No members yet                                                            |
| E17 | `groups.spec.ts`             | Remove member refetch            | DELETE members â†’ {removed:1}        | DELETE sent, list reloads                                                 |
| E18 | `groups.spec.ts`             | Links to scanner                 | Open /groups/g1                       | Link /traders?group=g1                                                    |
| E19 | `groups.spec.ts`             | Scanner scans to list            | POST search mock â†’ Search           | Name + address, body defaults                                             |
| E20 | `groups.spec.ts`             | Invalid min/max blocks           | ROI 5/1 â†’ Search                    | Error, no API call                                                        |
| E21 | `groups.spec.ts`             | Non-numeric blocks               | PnL "abc" â†’ Search                  | invalidNumber, no API call                                                |
| E22 | `groups.spec.ts`             | Header sorts descâ†’asc          | Click PnL header                      | 2nd body sort_direction asc                                               |
| E23 | `groups.spec.ts`             | Numbered page replaces           | Page 2 click, page:2 in body          | 2nd row only, Page 2 of 2, ?page=2                                        |
| E24 | `groups.spec.ts`             | Empty + reset filters            | Mock [] â†’ Search â†’ Reset          | No traders, form cleared                                                  |
| E25 | `groups.spec.ts`             | Error + retry recovers           | 500 â†’ Retry                         | Rows after retry                                                          |
| E26 | `groups.spec.ts`             | Group needs auth                 | Group + 401 search                    | Auth message shown                                                        |
| E27 | `groups.spec.ts`             | Add modal from scan              | Tick + Add to group (1)               | Modal â†’ Added 1                                                         |
| E28 | `groups.spec.ts`             | Scan without wallet              | No auth â†’ Search                    | Rows + group hint, no modal                                               |
| E29 | `groups.spec.ts`             | Save search persists             | Save "My 7D" â†’ reload â†’ apply     | Chip kept, period 7D, rows                                                |
| E30 | `groups.spec.ts`             | URL restores on refresh          | ?period=7D&roi_min=30                 | Form + auto search                                                        |
| E31 | `groups.spec.ts`             | Venue/period in body             | Period 7D â†’ Search                  | venue + period in POST body                                               |
| E32 | `groups.spec.ts`             | Detail open + back               | View â†’ detail â†’ Back              | Filters + rows preserved                                                  |
| E33 | `groups.spec.ts`             | Detail period tabs               | Click 7D on detail                    | period=7D refetch                                                         |
| E34 | `groups.spec.ts`             | Detail 404                       | Direct detail URL, 404 mock           | Trader not found                                                          |
| E35 | `groups.spec.ts`             | Create group dialog              | Fill name+desc â†’ Create             | Row appears in list                                                       |
| E36 | `groups.spec.ts`             | Edit group name                  | Edit â†’ rename â†’ Save              | New name in list                                                          |
| E37 | `groups.spec.ts`             | Delete with warning              | Delete â†’ confirm text â†’ confirm   | Membership text, row gone                                                 |
| E38 | `groups.spec.ts`             | Group+ROI combine                | Group + ROI/PnL â†’ Search            | group_id + mins in body                                                   |
| E39 | `groups.spec.ts`             | Back restores search             | Search A â†’ B â†’ back               | Form A + refetch roi_min                                                  |
| E40 | `groups.spec.ts`             | Network fail + retry             | Abort â†’ error â†’ Retry             | Filters kept, rows recover                                                |
| E41 | `groups.spec.ts`             | Stale rows inspectable           | Stale status mock â†’ Search          | Stale text + data visible                                                 |
| E42 | `groups.spec.ts`             | Detail inline create             | Add â†’ new group â†’ Add 1           | Added 1                                                                   |
| E43 | `groups.spec.ts`             | Error detail (live, no stale)    | Error + partial mock                  | Error + Partial + data                                                    |
| E44 | `groups.spec.ts`             | Add/remove member flow           | 2 members â†’ remove 1                | Count + table update                                                      |
| E45 | `groups.spec.ts`             | Groups 500 while authed          | 500 â†’ error + Retry â†’ 200         | No auth hint, Main in Group                                               |
| E46 | `scanner-pagination.spec.ts` | Page click replaces              | Page 2 â†’ page:2 in body             | Trader 21 only, ?page=2                                                   |
| E47 | `scanner-pagination.spec.ts` | Deep link ?page=3                | Goto ?page=3                          | page:3 sent, Page 3 current                                               |
| E48 | `scanner-pagination.spec.ts` | Back/forward restores            | Page 2 â†’ back â†’ forward           | Trader 1 â†’ 2 â†’ 1 â†’ 2                                                |
| E49 | `scanner-pagination.spec.ts` | Beyond-total clamps              | Goto ?page=9 (2 pages)                | Falls to page 2, Page 2 of 2                                              |
| E50 | `scanner-pagination.spec.ts` | Rapid 2â†’3 latest wins          | Click 2 then 3 (2 delayed)            | Trader 3 only                                                             |
| E51 | `scanner-pagination.spec.ts` | 500 on page 2 + retry            | Page 2 fails â†’ Retry                | Trader 2, page:2 kept, ?page=2                                            |
| E52 | `scanner-pagination.spec.ts` | Invalid ?page= clamps            | Goto ?page=0                          | page:1 sent                                                               |
| E53 | `scanner-pagination.spec.ts` | Axe on paginated list            | wcag2a+aa                             | No violations                                                             |
| E54 | `scanner-pagination.spec.ts` | Keyboard pagination              | Focus Page 2 + Enter                  | Trader 2 visible                                                          |
| E55 | `scanner-pagination.spec.ts` | Narrow no overflow               | 640px, 10 pages                       | Pagination visible, no overflow                                           |
| E56 | `trader-detail.spec.ts`      | Positions + waiting sidebar      | Mock positions â†’ detail (WS-only)   | BTC row + Waiting copy, activity 0                                        |
| E57 | `trader-detail.spec.ts`      | Empty positions + waiting        | Mock [] â†’ detail (WS-only)          | No open positions + Waiting, 0Ã— Load more                                |
| E58 | `trader-detail.spec.ts`      | Ready, never syncing (v1.2)      | ready + empty                         | Ready visible, 0Ã— Syncing, 0Ã— Sync now                                  |
| E59 | `trader-detail.spec.ts`      | Sidebar 3-event merge (C1+C3)    | limit+open fill+close broadcast       | LIMIT/BTC + LONG/ETH + CLOSED/SOL, 3 rows, funding ignored, activity 0    |
| E60 | `trader-detail.spec.ts`      | Positions 500 keeps overview     | positions 500 â†’ detail              | Heading + Open Positions visible                                          |
| E61 | `wallet-tabs.spec.ts`        | Nine tabs default                | Navigate detail (mock fixtures)       | 9 tabs, Positions active, BTC row                                         |
| E62 | `wallet-tabs.spec.ts`        | Deep link ?tab=balances          | Goto ?tab=balances                    | Balances active, HYPE visible                                             |
| E63 | `wallet-tabs.spec.ts`        | Tab writes ?tab=                 | Click Trades tab                      | URL /tab=trades/, tab selected                                            |
| E64 | `wallet-tabs.spec.ts`        | Placeholders, no fake data       | predictions â†’ swap tabs             | Coming-soon, zero tables                                                  |
| E65 | `wallet-tabs.spec.ts`        | Positions server sort            | Click uPnL header                     | sort=unrealized_pnl in request                                            |
| E66 | `wallet-tabs.spec.ts`        | Positions empty, ready (v1.2)    | summary=null, []                      | No open positions, 0Ã— Syncing                                            |
| E67 | `wallet-tabs.spec.ts`        | Trades full table                | ?tab=trades                           | ENTRY/EXIT/NOTIONAL/DURATION/â€”/NET                                      |
| E68 | `wallet-tabs.spec.ts`        | Trades result filter             | Win chip â†’ result=win               | BTC only, counts stable All (2)                                           |
| E69 | `wallet-tabs.spec.ts`        | Trades side filter               | Short chip â†’ side=short             | ETH only                                                                  |
| E70 | `wallet-tabs.spec.ts`        | Trades server sort               | Click Net PnL header                  | sort=net_pnl in request                                                   |
| E71 | `wallet-tabs.spec.ts`        | Trades empty                     | rows=[]                               | No closed trades                                                          |
| E72 | `wallet-tabs.spec.ts`        | Balances perp+spot               | ?tab=balances                         | Withdrawable + HYPE/USDC                                                  |
| E73 | `wallet-tabs.spec.ts`        | Fills shape                      | ?tab=fills                            | ETH SELL + Close Long                                                     |
| E74 | `wallet-tabs.spec.ts`        | Orders open vs historical        | open â†’ Historical click             | No status â†’ filled visible                                              |
| E75 | `wallet-tabs.spec.ts`        | Transfers enum type              | ?tab=transfers                        | subAccountTransfer + $50.00K                                              |
| E76 | `wallet-tabs.spec.ts`        | Performance chart + equity       | ?tab=performance â†’ VALUE            | `ALL PERPS PNL`, 4 ranges, VALUE â†’ `ALL PERPS VALUE` + equity row       |
| E77 | `wallet-tabs.spec.ts`        | Balances error + retry           | 500 Ã—3 â†’ Retry                     | Error â†’ Perp account recovers                                           |
| E78 | `wallet-tabs.spec.ts`        | Vietnamese tabs                  | /vi/ ?tab=trades                      | Giao dá»‹ch selected, BTC visible                                         |
| E79 | `wallet-live.spec.ts` (v1.2) | L1 FUNDING + as_of, no /sync     | ?tab=trades live fixtures             | âˆ’$12.5, +$1,470, As of, 0Ã— POST /sync                                  |
| E80 | `wallet-live.spec.ts` (v1.2) | L2 fill prepends, no refetch     | wallet.fill.created ETH BUY           | ETH + $2.31K live, activity count unchanged                               |
| E81 | `wallet-live.spec.ts` (v1.2) | L3 funding patches, no refetch   | wallet.funding.created BTC âˆ’3.44    | âˆ’$15.94, net +$1,470 unchanged, no refetch                              |
| E82 | `wallet-live.spec.ts` (v1.2) | L4 connection gates LIVE         | DISCONNECTEDâ€¦ERROR then LIVE        | badge hidden until LIVE                                                   |
| E83 | `wallet-live.spec.ts` (v1.2) | L5 position patches, no refetch  | wallet.position.updated []            | No open positions, positions count unchanged                              |
| E84 | `wallet-live.spec.ts` (v1.2) | L6 activity prepends, no refetch | wallet.activity.created SOL           | SOL visible, activity count unchanged                                     |
| E85 | `wallet-live.spec.ts` (v1.2) | L7 Vietnamese asOf + funding     | /vi/ ?tab=trades                      | âˆ’$12.5 + LÃºc visible, 0Ã— POST /sync                                   |
| E86 | `trader-detail.spec.ts`      | 30s poll, inactive silent        | Mock detail â†’ wait 30s              | detail â‰¥2, positions â‰¥2, balances 0, activity 0                       |
| E87 | `trader-detail.spec.ts`      | Sidebar skips Close fills (C2)   | Close Long fill broadcast             | Waiting stays, 0 rows, activity 0                                         |
| E88 | `settings-auth.spec.ts`      | Unauthenticated settings         | Navigate /settings (no auth)          | Connect CTA; zero telegram/status requests                                |
| E89 | `settings-auth.spec.ts`      | Expired session (401)            | Auth + status 401 + refresh 401       | Banner + expired copy + reconnect CTA + modal                             |
| E90 | `trader-detail.spec.ts`      | Layout C statement               | Mock detail + positions               | 1Ã— Account value, Details toggle, strip periods, positions context, feed |

> Contract v1.2: `trader-sync.spec.ts` (E79â€“E82 v1.1) deleted with the sync
> machinery. FakeWS in `wallet-live.spec.ts` delegates non-`/traders/ws`
> sockets to the real WebSocket so Next HMR never sees the stub.

### Accessibility / Keyboard / Visual / Performance

| ID   | File                    | Coverage                                                                                                                                                                                                                 |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1-9 | `accessibility.spec.ts` | axe wcag2a+aa: scanner (default/results/error), detail, groups+dialog, add modal, open filter sheet Ã—2 locales + active chip                                                                                            |
| K1-5 | `keyboard.spec.ts`      | Tab order, Enter-to-sort, focus trap + Escape, filter sheet Escape + focus return, narrow scroll                                                                                                                         |
| V1-9 | `visual.spec.ts`        | Baselines (frozen clock): scanner Ã—4, filter sheet open (whole-page viewport, not `fullPage`; sheet portals to `<body>`), detail, groups, narrow Ã—2 â€” baselines regenerated 2026-11-20 after the pagination redesign |
| P1-3 | `performance.spec.ts`   | Numbered page (20 rows, Page 1 of 5) <15s, slow-search keeps rows, 500-member group pages                                                                                                                                |

---

### Spec FE-001 â†’ FE-040 coverage (Hyperliquid_Trader_Scanner_FE_Spec_v1.1)

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
| FE-038 | Network offline           | E40 (abort â†’ banner, filters kept, retry)          |
| FE-039 | Retry recovery            | unit retry + E25/E40                                 |
| FE-040 | XSS safety                | unit malicious display_name                          |

### E2E scenarios (Â§14) coverage

| #   | Scenario                                                                   | Covered by                |
| --- | -------------------------------------------------------------------------- | ------------------------- |
| 1   | 30D + ROIâ‰¥30% + WRâ‰¥60% â†’ Search â†’ detail â†’ back â†’ filters kept | E38-style filters + E32   |
| 2   | Create group â†’ add two â†’ detail â†’ remove one â†’ count updates       | E35 + E42-style add + E44 |
| 3   | Detail â†’ add â†’ inline create â†’ membership                            | E42                       |
| 4   | Group + ROI + PnL â†’ verify AND                                           | E38                       |
| 5   | Stale row + detail freshness                                               | E41 + E43                 |
| 6   | Failure â†’ Retry â†’ success, error cleared                               | E25 + E40                 |

### Release exit criteria (Â§18)

| Criterion                                    | Status                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| All P0 tests pass                            | âœ… â€” exit 0 locally; CI runs `pnpm test` + `pnpm test:e2e` |
| Core E2E flows pass against staging BE       | âœ… mocked + live-BE runs green (funding needs BE up)         |
| Visual baselines approved (desktop + narrow) | âœ… 9 baselines in `tests/e2e/visual.spec.ts-snapshots/`      |
| No direct Hyperliquid dependency in browser  | âœ… all calls via `/api` proxy to BE                          |
| Race-condition test passes                   | âœ… unit overlapping wins + ABORTED signal                    |
| Auth errors displayed safely                 | âœ… AUTH-003/GROUP-003/AUTH-005 mapped, no dumps              |

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
reviewing diffs â€” never blindly.

### Requirements

- Unit tests: KhÃ´ng cáº§n backend
- E2E tests: `PW_PORT=3001 pnpm playwright test <spec>` (Playwright khá»Ÿi dev server
  riÃªng qua `webServer`, khÃ´ng dÃ¹ng láº¡i port 3000 cá»§a repo chÃ­nh)

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

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Author |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 2026-09-19 | Initial test cases                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | â€”    |
| 2026-09-29 | Saved searches (localStorage) + public scan tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | â€”    |
| 2026-09-30 | Filter-config integration: DEX dropdown + config-driven filters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | â€”    |
| 2026-09-30 | Human-readable labels: metric/sort/operator/order options + i18n frame labels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | â€”    |
| 2026-10-01 | P0 trader foundation: types/service/validation/format/url-state (spec v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | â€”    |
| 2026-10-01 | P1 scanner redo: filter grid, header sort, cursor pages, URL state, trader-groups modal (spec v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | â€”    |
| 2026-10-02 | P2 trader detail: header/tabs/cards/long-short/freshness/add-to-group (spec v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | â€”    |
| 2026-10-02 | Cutover groups to trader-groups API: list/form/delete/detail, remove dead wallets/groups code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | â€”    |
| 2026-10-03 | P4 a11y/visual/perf/keyboard suites + P5 FE-040 gap closure (spec v1.1 exit criteria)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | â€”    |
| 2026-10-03 | F1 member metrics columns + F2 inline alias/note edit via PATCH members                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | â€”    |
| 2026-10-05 | Phase 4 scanner header: period segmented, venue badge, group select, filters toggle, sort select, rank column, mono numerals, status moved to identity cell (9 new unit tests, 3 visual baselines refreshed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | â€”    |
| 2026-10-05 | Header bugfix: numeric headers right-aligned, header Sort select removed (table sort only), groups refetch on auth change with 401/403 vs load-error split + Retry (E45)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | â€”    |
| 2026-10-05 | Phase 5 sheet: metric filters moved from inline panel into `filter-sheet.tsx` (3 clusters, 9 metrics, presets + Custom, per-field validation, group cluster only disabled when unauthenticated). New `filter-sheet.test.tsx` (10 tests); deferred 5.4 reset/period behaviour and 5.5 saved-search move to Batch 5B                                                                                                                                                                                                                                                                                                                                                                                                                                                             | â€”    |
| 2026-10-05 | Phase 5B chips + saved searches: `filter-chips.tsx` shows one short key-value chip per active metric filter (4 visible + `+N`), each `Ã—` removes exactly that filter and re-runs; sheet Reset now clears only the 9 metric filters, keeps Period/Venue/Group, and re-runs; `saved-searches.tsx` renders as a "Saved filters" fieldset cluster inside the sheet. New `filter-chips.test.tsx` (6 tests), saved-searches +1, scanner reset test repointed to the empty-state full reset                                                                                                                                                                                                                                                                                          | â€”    |
| 2026-10-05 | Phase 5 review fixes: sheet width override uses the base's `data-[side=right]:sm:` modifier order so `cn` drops `sm:max-w-sm` (400px honored); `SheetContent` gains `showOverlay` (defaults true) and the non-modal filter sheet renders no backdrop so page controls stay clickable; overlay honors `prefers-reduced-motion`; header Group select now commits + re-runs the search like Period; `deriveCustom` reopens an applied preset as a preset. filter-sheet +2, scanner page +1                                                                                                                                                                                                                                                                                        | â€”    |
| 2026-10-05 | Phase 5C (5.7 non-visual): accessibility +3 (open filter sheet axe-clean in en + vi, and with an active filter chip) and keyboard +1 (Escape closes the sheet and returns focus to the header Filters button). Deleted dead `trader-filters.tsx` + its 6-test spec (no `src` importer; replaced by `filter-sheet.tsx`). Unit total 237 â†’ 231                                                                                                                                                                                                                                                                                                                                                                                                                                 | â€”    |
| 2026-10-06 | Scanner direction change (human-approved): header Group select and the sheet Group cluster are removed, so the earlier group-select entries above no longer describe the product. Entering the scanner always searches â€” URL params restore that search, an empty URL loads the default list (venue hyperliquid, period 30D, sort pnl desc), `?group_id=` is stripped and Reset re-runs the default search. Unit specs re-synced (scanner-header 10â†’6, filter-sheet 12â†’10, scanner page 18â†’16; unit total 231â†’223) and dead group i18n keys removed from en + vi.                                                                                                                                                                                                    | â€”    |
| 2026-10-06 | Numbered pagination (CONTRACT.md Â§3): scanner cursor/Load-more replaced by numbered pages (20/page, `?page=` omitted when 1, clamp 0/abcâ†’1, reset-to-1 on filter/sort/period, beyond-total falls to last page, current-page click no-op). `Meta` + `page/total/total_pages/offset` + `TraderSearchQuery.page` match BE swagger exactly; shared `components/shared/pagination.tsx` (funding + groups + scanner); copy `resultsPaged`/`pageOf` in en+vi. Tests: url-state 6â†’10, services 11â†’12, scanner 16â†’20, new pagination unit (5) + `scanner-pagination.spec.ts` (E46-E55); P1 reworked to 20 rows / Page 1 of 5. Visual `scanner-results*` baselines change (Load more gone, new count copy) â€” NOT regenerated, needs per-image approval. Unit total 224â†’238. | â€”    |
| 2026-10-06 | Phase 5 review fixes: `errOutOfRange` copy made range-agnostic (en/vi); `matchesPreset` compares parsed numeric values so profit-factor presets (1.0/1.5/2.0) survive the URL round-trip; dead `traders.minPlaceholder`/`maxPlaceholder`/`search`/`reset` keys removed from en + vi; `visual.spec.ts` filter-sheet-open now mocks `/api/v1/traders/search` (baseline `scanner-sheet-open` refreshed). filter-sheet +1 (unit total 223â†’224).                                                                                                                                                                                                                                                                                                                                  | â€”    |
| 2026-10-07 | Trader Detail positions + activity (DETAIL-PLAN Part B): types/services/format/WS client (backoff 1s-30s, ping 25s, hidden suspend M4) + useTraderActivity, positions-section + activity-feed, 2-col layout, i18n en+vi incl positionsSyncing M5. Unit 238-263 (+25), E2E trader-detail.spec.ts REST-only E56-E60 (M3 WS via stubbed unit, M7 no WS e2e).                                                                                                                                                                                                                                                                                                                                                                                                                      | --     |
| 2026-10-08 | Wallet tabs contract v1 (FE Â§5): 9-tab shell with ?tab= URL state + en/vi, POSITIONS sortable header, TRADES full table (server sort + Win/Loss + Long/Short chips with counts, FUNDING â€”), BALANCES/ORDERS/FILLS/TRANSFERS/PERFORMANCE tables on shared format helpers, PREDICTIONS/SWAP coming-soon placeholders (no fake data). Types in trader.ts, services in traders.ts, hooks per tab. Unit 263â†’325 (+62), E2E wallet-tabs.spec.ts E61-E78 mocked from fixtures.                                                                                                                                                                                                                                                                                                   | â€”    |
| 2026-10-08 | Sync-on-view contract v1.1 (FE Â§4): POST /sync service + `useTraderSyncOnView` once-guard (F1), 12s/â‰¤8-attempt polling on positions + activity/trades (F2), syncing skeleton vs genuine empty + Sync now fallback in TradesSection + ActivityFeed/Recent Activity (F3), en/vi keys `tradesSyncing`/`activitySyncing`/`syncNow` (F4). `ActivityPage.data_status?` additive (missing â‡’ ready). Unit 325â†’366 (+41: lib/trader-sync 14, use-trader-sync 5, polling 6, services +3, activity-feed +5, trades-section +3, detail +5), E2E trader-sync.spec.ts E79-E82 mocked per Â§5.                                                                                                                                                                                         | â€”    |
| 2026-10-09 | Wallet live contract v1.2 (LIVE-CONTRACT.md frozen): sync machinery deleted (`useTraderSyncOnView`, polling, syncing skeletons, `trader-sync.spec.ts`, `POST /sync` service, sync unit 25 tests); `wallet.*` WS envelope adopted (fill/funding/order/position/activity/connection), FUNDING column + `as_of`/`partial` per tab, states loading/error/ready only. Unit 366â†’348 (ws 7â†’20, activity-hook 2â†’3, positions 4â†’6, activity-feed 9â†’8, trades-hook 4â†’5, trades-section 11â†’9, detail 13â†’10, services 33â†’30), E2E `wallet-live.spec.ts` L1â€“L7 = E79â€“E85. FakeWS delegates non-`/traders/ws` sockets to the real WebSocket so Next HMR never sees the stub.                                                                                           | â€”    |
| 2026-10-10 | Trader 30s polling (FE-only): `lib/trader-poll.ts` + `refetchInterval` on 9 hooks (positions/trades/activity/detail-overview/performance/balances/fills/orders/transfers), `staleTime` unchanged, `enabled:false` never timers, background pause + unmount cleanup via react-query defaults, error stops with manual retry. New `hooks/use-trader-detail.ts` replaces manual `useEffect` overview fetch. Unit 353â†’367 (+14 fake-timer polling), E2E `trader-detail.spec.ts` E86 (overview + positions â‰¥2 after 30s, balances 0 while inactive).                                                                                                                                                                                                                            | â€”    |
| 2026-10-10 | Sidebar 3-event (SIDEBAR-3EVENTS frozen delta over v1.2): `ActivityFill.dir`, `LiveActivityItem` union, `wallet.order.created` route, WS-only `useTraderActivity` (limit/open-fill/close merge DESC cap 50, Close skipped, no REST/fundings), 3-renderer `ActivityFeed` (LIMIT/LONG-SHORT-BUY-SELL/CLOSED, connecting-loading, waiting-empty, LIVE badge kept, Load more/retry/dead props removed), `page.tsx` props + en/vi `activityWaiting`/`limit`/`closed`. Unit 367â†’370 (ws 20â†’21, activity-hook 3â†’5, feed 8â†’8 rewritten, polling 14 kept WS-only), E2E `trader-detail.spec.ts` E56/E57/E59 rewritten + E87 (3 rows, /activity 0, funding ignored, Close skipped). Trades tab untouched.                                                                         | â€”    |
| 2026-10-11 | Selective retry for trader detail tabs (FE-only): `lib/trader-retry.ts` (`TRADER_QUERY_MAX_RETRIES=2`, retry 429/408/5xx only, never 499/other 4xx/non-ApiError, backoff 1sâ†’5s cap) wired as `retry`/`retryDelay` on 8 REST hooks (detail/positions/balances/fills/orders/trades/transfers/performance), `traderDataRefetchInterval`/`staleTime`/`enabled` untouched, `use-trader-activity.ts` untouched. Unit 370â†’384 (+14 trader-retry), `trader-polling.test.tsx` 14 kept (final error state unchanged). E2E `trader-detail.spec.ts` untouched (Playwright auto-wait covers ~3s mocked-500 retry lag).                                                                                                                                                                  | â€”    |
| 2026-10-11 | Wallet reskin (UI-only, no functional change): identity-card, stat-cards (no deltas/sparklines), positions-panel (top5 + View all), equity-chart (hand SVG, shared period); breadcrumb row; 9 tabs kept style-only; feed rows restyled; positions+performance always-on; Long/Short block removed per mock; i18n +7; no new deps. Unit 384->406 (+22). E2E: detail 7/7, E62 scoped, E77 fail x3, L4 red pre-existing, visual baselines need approval.                                                                                                                                                                                                                                                                                                                          | â€”    |
| 2026-10-11 | Drop equity-chart + sidebar notional: page chart deleted, page-level period group restored, equityPnl removed en/vi; PerformanceSection kept; notional approx USD on limit/fill rows. Unit 406->405.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | â€”    |
| 2026-10-12 | Drop Top Positions panel + relocate metrics status into identity card: page drops PositionsPanel import/usage (always-on positions hook kept), WalletIdentityCard gains optional metrics prop rendering Ready/Error + Metrics as of + Partial marker, topPositions/viewAll/totalPnl removed en/vi, positions-panel spec deleted, identity-card 5->9, detail asserts status inside card. Unit 405->402. E2E: no Top Positions refs, skipped (dev-lock).                                                                                                                                                                                                                                                                                                                         | â€”    |
| 2026-10-29 | Telegram notifications FE (contract v1.4): services/telegram.ts, hooks/use-telegram.ts, settings page card, groups notify toggle, i18n en/vi. Unit tests: use-telegram, settings-page, groups-notify-toggle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-17 | Typography refinement (v2): label token `--label`/`text-label`, wallet statement header / performance strip / positions context font scale; positionsContext rich text with `<strong>` spans; visual baselines refreshed. Tests: `wallet-statement-header.test.tsx`, `wallet-performance-strip.test.tsx`, `positions-section.test.tsx`, `trader-detail-page.test.tsx`, `trader-detail.spec.ts` (visual baselines). Unit tests 550 pass.                                                                                                                                                                                                                                                                                                                                        | â€”    |
| 2026-11-17 | Empty search result fix: searchTraders no longer throws on falsy res.data; returns data:[] + meta passthrough; scanner shows "No traders found" instead of error banner. Tests: `traders.test.ts`, `trader-scanner-page.test.tsx`, `scanner-empty.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | â€”    |
| 2026-11-18 | Contract v2.3 Plan B WS position push: on `wallet.position.updated`, patch react-query cache with client-side resort (`src/lib/position-sort.ts` `sortPositionsClient`); REST 30s fallback retained. Tests: `position-sort.test.ts` (16), `use-trader-positions.test.tsx` (2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | —      |
| 2026-11-20 | Wallet connect user rejection: `isUserRejection` helper (error name / code 4001 / cause chain) in `stores/auth.ts`; `connectWallet` no longer rethrows, so `void connectWallet()` cannot raise an unhandled rejection overlay. User rejections clear the stored error; generic failures stay in state. Tests: `tests/unit/stores/auth.test.ts` (+3, rejection / generic error / success).                                                                                                                                                                                                                                                                                                                                                                                      | —      |

- 2026-10-30: Global 401 policy - `lib/auth-events.ts` pub/sub (listener errors isolated), `apiClient` emits only on the final 401 (refresh failure or no refresh token, never `apiClientNoAuth`), providers reset auth + session-expired banner + auto-open connect modal, `useAuthGate` (`expired` only via `ApiError.status === 401`), `useTelegramStatus({ enabled })` with `retry: false`, settings/groups gate (unauthenticated CTA, expired reconnect, generic retry, 403 unchanged), i18n en/vi. Unit +18; E2E `settings-auth.spec.ts` E88/E89.
- 2026-10-30: Groups gate regression fix - `/groups` skips `listTraderGroups()` while unauthenticated (neutral heading + connect CTA, clears list/error, refetches when auth flips true) and `/groups/[groupId]` skips both `getTraderGroup()`/`listGroupMembers()` the same way, so the global modal stays reserved for the expired-token case. Authenticated path unchanged. Unit +3 (`groups-auth-gate.test.tsx`, total 433). E2E data tests seed auth; `groups.spec.ts` + `accessibility.spec.ts` remain green.
- 2026-10-30: Option B session loss = disconnect - clearSession() in auth store; initialize no-token keeps address null; getMe fail clears session + disconnect. Unit +3 (stores/auth, total 436).
- 2026-11-01: Dedup Performance tab with top page metrics (Option A): PerformanceSection drops local period state + period button group + 7 metric cards + status line; keeps realized PnL header line + equity table; period now shared via props from page; WalletTabs requires period/onPeriodChange. Test count unchanged (436).
- 2026-11-01: Dedup Balances tab (Option A): BalancesSection drops 4 duplicate perp cards (Account value, Total notional, Total margin, Positions value); keeps Withdrawable + 3 cross cards (4 cards, 1 row) + spot table + status line. Removed i18n key `assetPositionsValue` from en/vi. Test assertions updated (absence checks).
- 2026-11-03: Auth address persistence fix - `initialize()` keeps the persisted address/chainId when wagmi has not reconnected (`getAccount` address undefined) and only overwrites with the live account when available; `WagmiAuthSync` inside `WagmiProvider` syncs a late wagmi reconnect into the auth store. Unit +2 (`stores/auth`, total 438). E2E skipped (existing `next dev` on :3000 holds `.next/dev/lock`; :3001 webServer refused connection).
- 2026-11-03: Compact funding-arbitrage table - merged venue columns (Long / Short) and rate columns (Rate A / B), dropped Status column and StatusBadge (BE returns live only). Unit 26 -> 24 (funding-table). E2E status badge test replaced with merged header assertions.
- 2026-11-06: Funding arbitrage table redesign - 6 columns (Pair/Funding/Funding Spread/APR/OI/Price Spread), BE venue_*_oi USD notional, long/short markers in Pair column, funding-format helpers.
- 2026-11-06: Funding arbitrage table ticker split - 7 columns (Pair/Ticker/Funding/Funding Spread/APR/OI/Price Spread); Pair keeps LONG/SHORT markers + venue names only, Ticker shows the long venue symbol then the short one (â€” fallback). Unit 24 -> 28 (funding-table: header order, ticker ordering for long=A/B, placeholder fallback, pair cell excludes tickers); E2E header assertion adds Ticker.
- 2026-11-06: Funding arbitrage table combines venue tickers into a single first "Symbol" column (Symbol/Pair/Funding/Funding Spread/APR/OI/Price Spread); Symbol = row.symbol with trailing "-PERP" stripped (fallback 'â€”'); Pair keeps LONG/SHORT markers + venue names only. Unit 28 -> 27 (funding-table: header order, symbol base asset + fallback, pair cell excludes tickers); E2E header assertion Ticker -> Symbol.
- 2026-11-05: Hyperdash-style portfolio chart in the Performance tab - `PortfolioChart` (hand-rolled SVG, no new deps) with PERPS/COMBINED mode tabs, PNL/VALUE toggle, local 24H/7D/30D/ALL ranges (no refetch), PnL split above/below zero in primary/destructive, compact USD y-axis and range-aware x-axis. `PerformanceSnapshot.mode/series`, performance service + hook `mode` param (query key + `mode=perps` default), en/vi keys. Unit 436 -> 443 (+6 portfolio-chart, +1 hook mode); E2E E76 extended with chart title/ranges and VALUE switch.

### Trader Overview (added)

- tests/unit/components/trader-overview.test.tsx (16 tests)
- tests/unit/hooks/use-trader-overview.test.tsx (3 tests)
- tests/e2e/trader-overview.spec.ts (3 tests)

### PnL=0 exclusion (2026-11-09)

- BE excludes PnL=0 wallets from PnL buckets; when all wallets have PnL=0 (or none), `pnl_buckets` is empty.
- FE shows "No wallets with non-zero PnL in this period" (`traders.overview.noPnlWallets`) in the performance section while the account section still renders.

### Account-size bucket notional (2026-11-09)

- BE now returns `volume_total`, `long_ratio`, `long_notional`, `short_notional` for account buckets (same as PnL buckets).
- FE `OverviewAccountBucket` type and `OverviewCard` updated to use account bucket notional for LONG/SHORT rendering.

### Account-size bucket sentiment (2026-11-09)

- BE now returns `sentiment` for account buckets (derived from long_count/short_count).
- FE `OverviewAccountBucket` type and `OverviewCard` updated to use account bucket sentiment when PnL bucket sentiment unavailable.

## Bucket Detail (Trader Overview)

### Coverage Summary (added)

| Module     | File                                                                        | Tests                                                                             | Status  |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------- |
| Services   | src/services/traders.ts                                                     | fetchBucketDetail, fetchBucketWallets, fetchBucketMarkets                         | Covered |
| Hooks      | src/hooks/use-bucket-detail.ts                                              | useBucketDetail                                                                   | Covered |
| Hooks      | src/hooks/use-bucket-wallets.ts                                             | useBucketWallets                                                                  | Covered |
| Hooks      | src/hooks/use-bucket-markets.ts                                             | useBucketMarkets                                                                  | Covered |
| Components | src/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/* | BucketHeader, BucketStatBars, BucketPositioningChart, BucketTreemap, BucketTables | Covered |
| Lib        | src/lib/treemap.ts                                                          | squarify (bounds, overlap, normalisation, single/empty/zero)                      | Covered |

### Changelog

- Added Bucket Detail feature: types, services, hooks, page, components, i18n, tests, E2E.
- 2026-11-11: Hyperdash-style bucket detail visuals - positioning chart rewritten with stacked long/short areas, right-side y-axis (100/75/50/25/0%), five date labels, hover/focus tooltip and range caption; the 24H/7D/30D selector moved from the bucket header into the chart header. Treemap rewritten with a squarified layout (`src/lib/treemap.ts`), coin badges, uppercase symbols, signed UPNL, sentiment labels and upnl-based tinting (top 12 markets). Unit tests added (`tests/unit/lib/treemap.test.ts`, `tests/unit/components/bucket-positioning-chart.test.tsx`, `tests/unit/components/bucket-treemap.test.tsx`); E2E `trader-bucket-detail.spec.ts` extended for chart captions, range tabs and treemap tiles.

- 2026-11-12: Bucket detail chart + treemap laid out side-by-side in a 2-column grid (50/50) on desktop, stacked on mobile; chart resized to 640x320; treemap card uses flexible height with min-h 280px. Squarify switched to shorter-side layout to avoid strip tiles; treemap.test.ts adds max aspect ratio <= 3 check for 12-item sample. E2E trader-bucket-detail.spec.ts asserts aligned tops and equal widths on desktop and stacking on mobile.
- 2026-11-13: Asset icons + treemap improvements. Added src/lib/asset-meta.ts (stripDexPrefix, classifyAsset, hasCryptoIcon, sets), src/components/shared/asset-icon.tsx, vendored crypto SVGs under public/icons/crypto, top 8 + Other treemap with adaptive labels, TradFi badge, tooltip. Applied AssetIcon across bucket tables, positions, balances, fills, orders, activity, funding table.
- 2026-11-13: Tests: asset-meta.test.ts, asset-icon.test.tsx; updated bucket-treemap.test.tsx and funding-table.test.tsx.
- 2026-11-13: Expanded crypto icons (~50) + stock icons (~10) from simple-icons; added use-element-size hook; pixel-based treemap levels (XL/L/M/S/XS/hidden); larger treemap fonts/icons; lazy loading for table icons; eager for treemap.
- 2026-11-15: Fixed bucket wallet table win_rate display: BE returns 0..100, so FE no longer multiplies by 100; null volume/realized_pnl/win_rate render "â€”". Type BucketWalletRow fields nullable. Added tests/unit/components/bucket-tables.test.tsx cases (44.49 -> "44.5%", null -> "â€”").
- 2026-11-16: Added sort indicator arrows (lucide ArrowUp/ArrowDown/ArrowUpDown) to WALLETS sortable columns (Equity, Win Rate, Volume, PnL) in bucket-tables.tsx. Added unit tests (default equity desc indicator, win rate click, aria-sort) and E2E trader-bucket-detail.spec.ts sort header case.
- Clickable wallet rows in bucket table: wallet rows navigate to trader detail on click/Enter with aria-label; tests in `bucket-tables.test.tsx` and `trader-bucket-detail.spec.ts`.
- 2026-11-16: Positions table TP/SL columns (contract v2.2): added tp_pxs/sl_pxs to OpenPosition, formatTpSlList helper, TP/SL columns after liquidation price, i18n tp/sl, unit + E2E tests: `positions-section.test.tsx`, `trader-detail.spec.ts`, `trader-format.test.ts`.

## Asset Logo Registry (Phase 4)

### E2E Coverage (tests/e2e/asset-logo.spec.ts)

| Case      | Description                                                  | Status  |
| --------- | ------------------------------------------------------------ | ------- |
| AL-E2E-01 | Crypto logo renders as <img> with correct src                | Covered |
| AL-E2E-02 | Missing logo renders fallback (letter badge/category icon)   | Covered |
| AL-E2E-03 | Provider timeout -> fallback                                 | Covered |
| AL-E2E-04 | No console errors                                            | Covered |
| AL-E2E-05 | UPNL update (re-fetch) does not create new logo requests     | Covered |
| AL-E2E-06 | No layout shift (bounding box stable before/after logo load) | Covered |
| AL-E2E-07 | Responsive icon sizes (mobile/desktop)                       | Covered |

### Changelog

- 2026-11-14: Added asset-logo.spec.ts E2E; README attribution note.

## Asset Logo Registry (Phase 3)

- AssetIcon renders logoUrl img, falls back on error, category icon, initials, empty symbol.
- Treemap adaptive sizes, watermark only large, preload, no layout shift, empty state.
- E2E crypto + TradFi logos render, missing logo fallback, no console errors.

- 2026-11-15: Source-aware labels + live positions display: markets_source-driven UPNL/Realized PnL labels, nullable position_value/sum_upnl, volume split tooltip, volume (range) header.
- 2026-11-16: Wallet detail Layout C "Account statement": new `wallet-statement-header` (single panel, hero account value, uPnL/available, notional/margin/margin usage/account leverage row, Details disclosure) and `wallet-performance-strip` (period buttons + six inline metrics), replacing `wallet-identity-card` + `wallet-stat-cards` (files and tests deleted). Positions section drops the account/notional/margin cards and status line, adds `{count} positions Â· {longPct}% long Â· {lev}Ã— position lev` context and an inline error only for `data_status=error`. Removed duplicated values across the page; Recent Activity unchanged. i18n +4 (en/vi). Unit: statement header 10, performance strip 4, positions 6â†’11, detail page 10; E2E `trader-detail.spec.ts` E90.

- 2026-11-17: Wallet statement header action button changed from icon-only ellipsis to labeled outline button (UserPlusIcon + Add to group text); unit assertion added for visible text; visual baselines trader-detail.png / trader-detail-narrow.png regenerated.
- 2026-11-18: Contract v2.4 overview split: /overview returns cards without series; new /overview/series endpoint; FE adds fetchTraderOverviewSeries, useTraderOverviewSeries, OverviewTab series skeleton; cards render before series. Tests: services/traders, use-trader-overview, trader-overview.

## Changelog

- Converted wallet detail page to RSC with client fallback; updated trader-detail-page unit test to cover client fallback component.
- 2026-11-19: Custom thin scrollbar (CSS-only, auto-show on overflow): 6px trackless, muted thumb → green on hover, Firefox + WebKit, reduced-motion. Visual baselines regenerated.
- 2026-11-20: Market detail redesign: custom date-range picker (day+hour+minute), sortable table headers, tape/ledger layout, formatPrice, compact OI.
- 2026-11-20: Market snapshot ribbon cleanup: removed the average leverage row, fixed the em-dash glyph, long/short ratio now renders a single em dash when open notional is zero, and the tracked-wallets tooltip is localized. Unit: market-detail-page (3 tests, incl. no leverage row and zero-notional ratio empty state).
- 2026-11-20: Scanner redesign: command bar + ledger table + quick presets + full pagination (command bar, row click, page size, First/Last). Tests: scanner-command-bar (5), trader-table, trader-scanner-page.
- 2026-11-20: Scanner pagination redesign: readable h-7 controls, page size select beside the controls, "Showing" label with thousands-separated range (fixes literal u2013), page numbers hidden below sm, formatted result count. Unit pagination 5 -> 7 tests; scanner visual baselines regenerated (scanner-default/results/error/sheet-open/results-narrow).
