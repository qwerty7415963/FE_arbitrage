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

| Module                                      | File                                                       | Tests   | Status |
| ------------------------------------------- | ---------------------------------------------------------- | ------- | ------ |
| `lib/token.ts`                              | `tests/unit/lib/token.test.ts`                             | 14      | ✅     |
| `stores/auth.ts` (wallet-only)              | `tests/unit/stores/auth.test.ts`                           | 11      | ✅     |
| `services/auth.ts`                          | `tests/unit/services/auth.test.ts`                         | 8       | ✅     |
| `services/funding-arbitrage.ts`             | `tests/unit/services/funding-arbitrage.test.ts`            | 13      | ✅     |
| `services/groups.ts`                        | `tests/unit/services/groups.test.ts`                       | 18      | ✅     |
| `services/wallets.ts`                       | `tests/unit/services/wallets.test.ts`                      | 10      | ✅     |
| `lib/trader-saved-searches.ts`              | `tests/unit/lib/trader-saved-searches.test.ts`             | 4       | ✅     |
| `components/group-form.tsx`                 | `tests/unit/components/group-form.test.tsx`                | 6       | ✅     |
| `components/trader-filters.tsx`             | `tests/unit/components/trader-filters.test.tsx`            | 6       | ✅     |
| `components/trader-table.tsx`               | `tests/unit/components/trader-table.test.tsx`              | 5       | ✅     |
| `components/add-to-trader-group-modal.tsx`  | `tests/unit/components/add-to-trader-group-modal.test.tsx` | 4       | ✅     |
| `components/saved-searches.tsx`             | `tests/unit/components/saved-searches.test.tsx`            | 2       | ✅     |
| `app/[locale]/(protected)/wallets/page.tsx` | `tests/unit/components/trader-scanner-page.test.tsx`       | 12      | ✅     |
| `services/traders.ts`                       | `tests/unit/services/traders.test.ts`                      | 7       | ✅     |
| `lib/trader-validation.ts`                  | `tests/unit/lib/trader-validation.test.ts`                 | 11      | ✅     |
| `lib/trader-format.ts`                      | `tests/unit/lib/trader-format.test.ts`                     | 12      | ✅     |
| `lib/trader-url-state.ts`                   | `tests/unit/lib/trader-url-state.test.ts`                  | 4       | ✅     |
| `lib/trader-filter-draft.ts`                | `tests/unit/lib/trader-filter-draft.test.ts`               | 3       | ✅     |
| `components/wallet-table.tsx`               | `tests/unit/components/wallet-table.test.tsx`              | 6       | ✅     |
| `components/funding-table.tsx`              | `tests/unit/components/funding-table.test.tsx`             | 26      | ✅     |
| `infrastructure/api-client.ts`              | `tests/unit/infrastructure/api-client.test.ts`             | 14      | ✅     |
| **Total**                                   |                                                            | **196** |        |

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

#### `services/groups.ts` (18 tests)

| Test                          | Description                |
| ----------------------------- | -------------------------- |
| listGroups calls endpoint     | GET /api/v1/groups         |
| listGroups throws on no data  | Empty response             |
| getGroup calls endpoint       | GET /api/v1/groups/{id}    |
| createGroup trims + POSTs     | Name trimmed               |
| createGroup rejects blank     | No API call                |
| createGroup throws on no data | Empty response             |
| updateGroup PATCHes trimmed   | Name trimmed               |
| updateGroup throws on no data | Empty response             |
| deleteGroup calls DELETE      | DELETE /api/v1/groups/{id} |
| propagates API errors         | Network error              |
| buildParams defaults          | include+page+limit         |
| buildParams csv               | dex/chain/market join      |
| buildParams single-op         | metric_operator param      |
| buildParams between           | lo,hi string               |
| buildParams skips incomplete  | Missing value/min/max      |
| buildParams search/sort       | Trim + enums               |
| listGroupWallets calls API    | GET groups/{id}/wallets    |
| listGroupWallets no data      | Empty response             |

#### `components/group-form.tsx` (6 tests)

| Test                          | Description               |
| ----------------------------- | ------------------------- |
| renders create title          | No group prop             |
| renders edit title            | Group prop                |
| blocks blank name             | No API call + error shown |
| shows duplicate on GROUP-002  | 409 GROUP-002 mapped      |
| success calls onSuccess+close | Create flow               |
| unauthenticated opens modal   | requireAuth, no API call  |

#### `services/wallets.ts` (10 tests)

| Test                          | Description                   |
| ----------------------------- | ----------------------------- |
| buildParams start/end         | Scanner date range            |
| buildParams defaults          | page/limit, no include        |
| scanWallets calls API         | GET /api/v1/wallets           |
| scanWallets no data           | Empty response                |
| addWallets POSTs ids          | Returns added/skipped         |
| addWallets no data            | Empty response                |
| removeWallets DELETEs ids     | Membership removal            |
| fetchFilterConfig calls API   | GET filter-config             |
| fetchFilterConfig test venues | test-venue/e2e-* filtered out |
| fetchFilterConfig bad shape   | Throws Invalid filter config  |

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

#### `components/wallet-table.tsx` (6 tests)

| Test                  | Description            |
| --------------------- | ---------------------- |
| empty state           | No wallets / undefined |
| truncated address row | 0x1234...5678          |
| null metrics N/A      | Not 0                  |
| null dex/tag N/A      | Placeholders           |
| PnL color pos/neg     | primary / destructive  |

#### `components/trader-filters.tsx` (6 tests)

| Test                          | Description                          |
| ----------------------------- | ------------------------------------ |
| defaults + group auth hint    | hyperliquid/30D, hint when no groups |
| group options when loaded     | Group names in select                |
| edits draft and searches      | Parsed ranges + period in onSearch   |
| keeps raw text for validation | NaN passes through to page           |
| onReset                       | Reset button callback                |
| forwards draft changes        | onDraftChange per keystroke          |

#### `components/trader-table.tsx` (5 tests)

| Test                      | Description                          |
| ------------------------- | ------------------------------------ |
| formatted cells + tooltip | Signs, $K/$M, relative + UTC title   |
| dashes for null metrics   | — placeholders, — / — long/short     |
| copy address + feedback   | Clipboard + Copied                   |
| header sort + aria-sort   | onSortChange, PF header not sortable |
| select + view/add actions | Checkbox, View detail, Add to group  |

#### `components/add-to-trader-group-modal.tsx` (4 tests)

| Test                       | Description                       |
| -------------------------- | --------------------------------- |
| lists groups and adds      | Radio + Add → Added N + onSuccess |
| requires selected group    | selectGroupRequired, no API call  |
| pasted addresses validated | EVM check, lowercase normalize    |
| long name + duplicate      | nameTooLong, GROUP-002 → inline   |

#### `wallets/page.tsx` trader scanner (12 tests)

| Test                            | Description                          |
| ------------------------------- | ------------------------------------ |
| default without auto-search     | Controls visible, no API call        |
| search merges defaults + URL    | venue/period/sort/limit, replace URL |
| invalid min/max blocks          | Error, no API call                   |
| non-numeric blocks              | invalidNumber, no API call           |
| header toggles sort             | desc → asc, cursor reset             |
| load more appends deduped       | cursor sent, count grows             |
| error + retry recovers          | Banner, Retry → rows                 |
| keep rows + Updating            | Old rows visible during search       |
| latest overlapping wins         | Stale response ignored               |
| reset clears all                | Form, rows, bare URL                 |
| URL restore + auto-search       | Params → form + search               |
| group hint when unauthenticated | groupAuthHint shown                  |

#### `lib/trader-filter-draft.ts` (3 tests)

| Test                     | Description                |
| ------------------------ | -------------------------- |
| query ↔ draft round-trip | Text ↔ numbers             |
| invalid text stays NaN   | Page validation catches it |
| immutable range update   | Original untouched         |

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
| E14 | `groups.spec.ts`            | Detail lists members    | Mock group+wallets → /groups/g1   | Address row, no Scan needed   |
| E15 | `groups.spec.ts`            | Null metrics N/A        | Mock null metrics                 | N/A shown                     |
| E16 | `groups.spec.ts`            | Links to scanner        | Open /groups/g1                   | Link /wallets?group=g1        |
| E17 | `groups.spec.ts`            | Scanner scans to list   | POST search mock → Search         | Name + address, body defaults |
| E18 | `groups.spec.ts`            | Invalid min/max blocks  | ROI 5/1 → Search                  | Error, no API call            |
| E19 | `groups.spec.ts`            | Non-numeric blocks      | PnL "abc" → Search                | invalidNumber, no API call    |
| E20 | `groups.spec.ts`            | Header sorts desc→asc   | Click PnL header                  | 2nd body sort_direction asc   |
| E21 | `groups.spec.ts`            | Cursor appends deduped  | Load more with cursor c1          | 2 rows, A shown once          |
| E22 | `groups.spec.ts`            | Empty + reset filters   | Mock [] → Search → Reset          | No traders, form cleared      |
| E23 | `groups.spec.ts`            | Error + retry recovers  | 500 → Retry                       | Rows after retry              |
| E24 | `groups.spec.ts`            | Group needs auth        | Group + 401 search                | Auth message shown            |
| E25 | `groups.spec.ts`            | Add modal from scan     | Tick + Add to group (1)           | Modal → Added 1               |
| E26 | `groups.spec.ts`            | Scan without wallet     | No auth → Search                  | Rows + group hint, no modal   |
| E27 | `groups.spec.ts`            | Save search persists    | Save "My 7D" → reload → apply     | Chip kept, period 7D, rows    |
| E28 | `groups.spec.ts`            | URL restores on refresh | ?period=7D&roi_min=30             | Form + auto search            |
| E29 | `groups.spec.ts`            | Venue/period in body    | Period 7D → Search                | venue + period in POST body   |

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
```

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

| Date       | Change                                                                                              | Author |
| ---------- | --------------------------------------------------------------------------------------------------- | ------ |
| 2026-09-19 | Initial test cases                                                                                  | —      |
| 2026-09-29 | Saved searches (localStorage) + public scan tests                                                   | —      |
| 2026-09-30 | Filter-config integration: DEX dropdown + config-driven filters                                     | —      |
| 2026-09-30 | Human-readable labels: metric/sort/operator/order options + i18n frame labels                       | —      |
| 2026-10-01 | P0 trader foundation: types/service/validation/format/url-state (spec v1.1)                         | —      |
| 2026-10-01 | P1 scanner redo: filter grid, header sort, cursor pages, URL state, trader-groups modal (spec v1.1) | —      |
