# Wallet detail — Layout C: Account statement

Approved design for the wallet detail page (`/traders/[address]`). The page reads
as one account statement instead of a stack of metric cards: identity, one hero
account value, a balance row and a period performance strip. Every derived
number is computed on the client from the live snapshot payloads; no new API
fields, no invented deltas or sparklines.

## Wireframe

### Desktop (>= 1024px)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ (A) Smart Money                         ACCOUNT VALUE                       │
│     0xaaaa…aaaa [copy]  [hyperliquid]        $12.35K                        │
│     [trophy]                      [⋯]        uPnL +$1,300                   │
│     Ready · Last updated 2m ago · Metrics as of 1m ago · Partial data       │
│     ▸ Details                                Available margin $11.55K       │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Total notional │ Margin used │ Margin usage ▓▓░░ 6.5% │ Account leverage   │
│ $5.00K         │ $800.00     │                        │ 0.41×              │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────┐ ┌──────────────────────────────┐
│ [1D] [7D] [30D] [ALL]                     │ │ Recent Activity              │
│ ROI +25.00%  Win Rate 70.00%  Volume …    │ │ (unchanged)                  │
│ Trades 50  Profit Factor 2.10  Max DD —   │ │                              │
│ ───────────────────────────────────────── │ │                              │
│ [ Positions | Balances | … ]              │ │                              │
│ Open Positions                             │ │                              │
│ 2 positions · 50% long · 2× position lev  │ │                              │
│ …table…                                    │ │                              │
└───────────────────────────────────────────┘ └──────────────────────────────┘
```

### Mobile (< 1024px)

```text
┌───────────────────────────────┐
│ (A) Smart Money       [⋯]     │
│ 0xaaaa…aaaa [copy]           │
│ [hyperliquid] [trophy]       │
│ Ready · Last updated 2m ago  │
│ ACCOUNT VALUE                │
│ $12.35K                      │
│ uPnL +$1,300                 │
│ Available margin $11.55K     │
│ ▾ Details                    │
│ First seen │ Last seen       │
│ First trade│ Source          │
│ ───────────────────────────── │
│ Total notional │ Margin used │
│ Margin usage   │ Leverage     │
└───────────────────────────────┘
[1D] [7D] [30D] [ALL]  ← wraps
ROI +25.00%  Win Rate 70.00% …
─────────────────────────────
tabs + positions (context line)
```

## Tokens

- Panel: existing shadcn surfaces — `bg-card rounded-xl border p-4`, no inner
  cards and no shadows inside the statement.
- Numbers: `tabular-nums`; the hero value is `text-4xl font-semibold
tracking-tight`.
- Labels: sentence case, `text-xs text-muted-foreground` (11–12px); performance
  strip labels are `text-[11px]`, values `text-sm font-semibold`.
- Semantic tone: positive `text-primary`, negative `text-destructive` (same
  convention as the positions and activity tables).
- No gradients, no new colors except `amber-500` for the > 70% margin-usage bar.
- Bar: 96px (`w-24`) `bg-muted` track, `bg-primary` fill, rounded-full, clamped
  to 0–100.

## Derived formulas

All inputs come from `PositionSnapshot.summary` / `OpenPosition[]`:

| Value            | Formula                                                            | Null guard                                                 |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| uPnL             | `Σ position.unrealized_pnl` over non-null rows                     | no non-null rows → `—`                                     |
| Available margin | `summary.account_value − summary.total_margin_used`                | either operand null → `—`                                  |
| Margin usage     | `total_margin_used / account_value × 100`                          | either null or `account_value ≤ 0` → `—`                   |
| Account leverage | `total_ntl_pos / account_value`                                    | either null or `account_value ≤ 0` → `—`; 2 decimals + `×` |
| Long %           | `Σ position_value` where side = LONG / `Σ position_value` × 100    | all `position_value` null → count-based; empty → 0         |
| Position lev     | single position leverage when 1 row, else average of non-null levs | none → `—`                                                 |

Margin usage renders with one decimal (`40.0%`) via `formatPercent(value, 1)`.
The positions context uses an ICU plural: `{count, plural, one {# position}
other {# positions}} · {longPct}% long · {lev}× position lev`.

## Details disclosure

`<details>` + `<summary>` labelled **Details** with a chevron that rotates when
open. It holds First seen / Last seen / Last trade / Source (2 columns mobile,
4 desktop), reusing the pre-existing keys.

Behaviour:

- Client render starts closed (`useState(false)`) so SSR and the first client
  paint match (no hydration mismatch).
- After mount, `matchMedia('(max-width: 1023px)')` sets it open on mobile and
  keeps it in sync with viewport changes (`change` listener, cleaned up on
  unmount). Desktop stays closed until the user opens it.
- The `<summary>` remains keyboard operable; no extra JS toggle handler.
- `window.matchMedia` is feature-detected so non-browser test environments do
  not crash.

## Responsive rules

| Breakpoint | Statement header                                                                                  | Performance strip          | Positions           |
| ---------- | ------------------------------------------------------------------------------------------------- | -------------------------- | ------------------- |
| < 1024px   | single column; hero left-aligned; 2×2 balance grid; details open                                  | period + metrics wrap      | context line wraps  |
| >= 1024px  | `grid-cols-[minmax(0,1fr)_auto] gap-6`; hero right-aligned; balance row 4 columns with `divide-x` | single row, metrics inline | context line inline |

The page keeps `lg:grid-cols-3`: statement header full width, main column
`lg:col-span-2` (strip + tabs), activity feed right `lg:col-span-1` unchanged.

## De-duplication map (removed values)

| Value                                 | Before                                | After                                                                              |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| Account value                         | stat card + positions summary card    | statement hero only                                                                |
| Total notional                        | stat card + positions summary card    | balance row only                                                                   |
| Total margin                          | stat card + positions summary card    | balance row only                                                                   |
| Available margin                      | stat card                             | right column under uPnL                                                            |
| uPnL                                  | stat card                             | right column under hero                                                            |
| ROI / WR / Vol / Trades / PF / Max DD | stat cards                            | performance strip (single row)                                                     |
| Ready / as-of                         | identity card + positions status line | statement status line; positions only shows `Error` when `data_status === 'error'` |

Recent Activity is untouched.

## Wallet action

The header's wallet action is a labeled outline button (not icon-only): variant
`outline`, default size, `shrink-0`, rendered in the identity row after the
name/address block. It shows a `UserPlusIcon` (`size-4`, `aria-hidden`) followed
by the `addToGroup` label text, and triggers `onAdd`. Accessible name is the
visible `Add to group` text (no separate `aria-label`).

## Test list

Unit (`vitest`):

- `tests/unit/components/wallet-statement-header.test.tsx`
  - hero + formatted account value, available, uPnL sum (positive, negative, mixed)
  - margin usage percentage and account leverage, including null guards
  - null summary/positions → `—`
  - details closed when `matchMedia('(max-width: 1023px)')` is false, open when true
  - add button calls `onAdd`; status line shows Ready / Error / Partial
- `tests/unit/components/wallet-performance-strip.test.tsx`
  - period buttons render with `aria-pressed`, click calls `onPeriodChange`
  - six metric values render; null metrics → `—`
- `tests/unit/components/positions-section.test.tsx`
  - context line (count / long % / average leverage)
  - no Account value / Total notional / Total margin inside positions
  - error status only when `data_status === 'error'`; TP/SL and sorting kept
- `tests/unit/components/trader-detail-page.test.tsx`
  - one Account value on the page, one Total notional, statement header,
    performance strip, activity feed, period refetch

E2E (`tests/e2e/trader-detail.spec.ts`):

- Account value visible exactly once
- Details toggles: click closes/opens `First seen`
- period buttons visible in the main column
- positions context line visible
- recent activity visible

## Typography scale v2

| Token / size | Weight       | Color                | Usage                                                                              |
| ------------ | ------------ | -------------------- | ---------------------------------------------------------------------------------- |
| ext-[40px]   | ont-semibold | foreground           | Hero account value                                                                 |
| ext-xl       | ont-semibold | foreground           | BalanceItem value, uPnL value, available margin value                              |
| ext-lg       | ont-semibold | foreground           | Performance strip value                                                            |
| ext-sm       | ont-semibold | foreground           | (retained) Open Positions heading                                                  |
| ext-[13px]   | ont-medium   | ext-label (#a6b7ae)  | Labels: BalanceItem, account value, uPnL, available margin, positions context base |
| ext-xs       | ont-medium   | ext-label (#a6b7ae)  | Performance strip label                                                            |
| ext-xs       | —            | ext-muted-foreground | Status line and details summary (metadata, stays quiet)                            |

Contrast note: label color #a6b7ae on card background #121714 is ≈ 8.7:1, exceeding WCAG AA for small text.

## RSC conversion

The wallet detail page (src/app/[locale]/(protected)/traders/[address]/page.tsx) is now an async Server Component. It reads ddress from params and period from searchParams, then attempts server-side fetches to GET /v1/traders/{wallet}?period=...&sync=1 and GET /v1/traders/{wallet}/performance?period=...&mode=perps&sync=1&series_only=true using API_INTERNAL_URL (fallback NEXT_PUBLIC_API_URL, then http://localhost:8080). On failure it renders the client fallback _components/client-detail-page.tsx which preserves the previous client-side behavior. On success it seeds the client islands with initialDetail/initialPerformance via useTraderDetail's initialData. Auth is handled by the protected layout; no auth logic lives in the server component.
