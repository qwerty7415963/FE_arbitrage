# Test Cases - Arbitrage FE

> Single source of truth cho test cases. Cập nhật file này khi thêm feature mới.

---

## I. Manual Test Cases (API-level)

### 1. Email Auth

| #   | Case                    | Endpoint                     | Input                            | Expected                                    |
| --- | ----------------------- | ---------------------------- | -------------------------------- | ------------------------------------------- |
| M1  | Register thành công     | `POST /auth/register`        | `{ email, password }` hợp lệ     | 201 `{ access_token, refresh_token, user }` |
| M2  | Register trùng email    | `POST /auth/register`        | Email đã tồn tại                 | 409 `{ code: "CONFLICT" }`                  |
| M3  | Register password ngắn  | `POST /auth/register`        | `password < 8 chars`             | 400 `{ code: "VALIDATION_ERROR" }`          |
| M4  | Login thành công        | `POST /auth/login`           | `{ email, password }` đúng       | 200 `{ access_token, refresh_token, user }` |
| M5  | Login sai password      | `POST /auth/login`           | `{ email, wrong_password }`      | 401 `{ code: "UNAUTHORIZED" }`              |
| M6  | Get profile OK          | `GET /auth/me`               | `Authorization: Bearer <valid>`  | 200 `{ id, email, role, status }`           |
| M7  | Get profile no token    | `GET /auth/me`               | Không có header                  | 401                                         |
| M8  | Get profile expired     | `GET /auth/me`               | Expired JWT                      | 401                                         |
| M9  | Refresh token OK        | `POST /auth/refresh`         | `{ refresh_token }` hợp lệ       | 200 `{ access_token, refresh_token }`       |
| M10 | Refresh token expired   | `POST /auth/refresh`         | `{ refresh_token }` invalid      | 401                                         |
| M11 | Logout                  | `POST /auth/logout`          | `Authorization: Bearer <valid>`  | 204                                         |
| M12 | Change password OK      | `POST /auth/change-password` | `{ old_password, new_password }` | 204                                         |
| M13 | Change password sai old | `POST /auth/change-password` | `{ wrong_old, new_password }`    | 400                                         |

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

| Module                         | File                                           | Tests  | Status |
| ------------------------------ | ---------------------------------------------- | ------ | ------ |
| `lib/token.ts`                 | `tests/unit/lib/token.test.ts`                 | 14     | ✅     |
| `lib/stores/wallet.ts`         | `tests/unit/lib/wallet.test.ts`                | 2      | ✅     |
| `services/auth.ts`             | `tests/unit/services/auth.test.ts`             | 12     | ✅     |
| `stores/auth.ts`               | `tests/unit/stores/auth.test.ts`               | 12     | ✅     |
| `infrastructure/api-client.ts` | `tests/unit/infrastructure/api-client.test.ts` | 14     | ✅     |
| **Total**                      |                                                | **54** |        |

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

#### `lib/stores/wallet.ts` (2 tests)

| Test                  | Description          |
| --------------------- | -------------------- |
| formatAddress formats | Shows 0x1234...5678  |
| formatAddress empty   | Returns empty string |

#### `services/auth.ts` (12 tests)

| Test                          | Description                |
| ----------------------------- | -------------------------- |
| login calls correct endpoint  | POST /auth/login           |
| login throws on no data       | Empty response             |
| register calls endpoint       | POST /auth/register        |
| getMe calls endpoint          | GET /auth/me               |
| refresh calls endpoint        | POST /auth/refresh         |
| logout calls endpoint         | POST /auth/logout          |
| changePassword calls endpoint | POST /auth/change-password |
| getNonce calls endpoint       | POST /auth/wallet/nonce    |
| verifyWallet calls endpoint   | POST /auth/wallet/verify   |
| getWallets calls endpoint     | GET /auth/wallet/list      |
| linkWallet calls endpoint     | POST /auth/wallet/link     |
| unlinkWallet calls endpoint   | DELETE /auth/wallet/{id}   |

#### `stores/auth.ts` (12 tests)

| Test                          | Description              |
| ----------------------------- | ------------------------ |
| login sets tokens and user    | Success flow             |
| login sets isLoading          | Loading state            |
| login throws on error         | Error handling           |
| register sets tokens and user | Success flow             |
| register throws on error      | Error handling           |
| logout clears tokens          | Calls API + clears       |
| logout clears on API error    | Clears even if API fails |
| fetchUser sets user           | Gets user from API       |
| fetchUser clears on error     | Clears tokens on 401     |
| initialize loads user         | Token exists             |
| initialize clears on error    | getMe fails              |
| initialize no token           | Skips loading            |

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

| #   | File                | Flow                   | Steps                        | Expected                        |
| --- | ------------------- | ---------------------- | ---------------------------- | ------------------------------- |
| E1  | `login.spec.ts`     | Login form renders     | Navigate /login              | Email + password fields visible |
| E2  | `login.spec.ts`     | Shows register link    | Navigate /login              | "Sign up" link visible          |
| E3  | `login.spec.ts`     | Login error            | Fill wrong creds → submit    | Error message shown             |
| E4  | `login.spec.ts`     | Login success          | Fill form → submit           | Redirect /funding-arbitrage     |
| E5  | `register.spec.ts`  | Register form renders  | Navigate /register           | All fields visible              |
| E6  | `register.spec.ts`  | Shows login link       | Navigate /register           | "Sign in" link visible          |
| E7  | `register.spec.ts`  | Email exists error     | Fill existing email → submit | Error shown                     |
| E8  | `register.spec.ts`  | Password mismatch      | Fill mismatched → submit     | "Passwords do not match"        |
| E9  | `register.spec.ts`  | Register success       | Fill form → submit           | Redirect /funding-arbitrage     |
| E10 | `logout.spec.ts`    | Logout flow            | Login → logout → confirm     | Redirect /login                 |
| E11 | `logout.spec.ts`    | Clears state           | After logout → /dashboard    | Redirect /login                 |
| E12 | `protected.spec.ts` | Auth guard no token    | Navigate /dashboard          | Redirect /login                 |
| E13 | `protected.spec.ts` | Auth guard valid token | Login → /dashboard           | Dashboard renders               |
| E14 | `protected.spec.ts` | Token expiry           | Remove tokens → /dashboard   | Redirect /login                 |

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

| Date       | Change             | Author |
| ---------- | ------------------ | ------ |
| 2026-09-19 | Initial test cases | —      |
