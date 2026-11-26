# HyperScan AI — Design System (Graphite & Acid Lime)

> Consolidated plan. Source sections: 01 audit, 02 tokens, 03 impact, 04 migration, 05 risks.

---

## 01 — Current State Audit

**Repository:** `FE_arbitrage`
**Branch:** `dev`
**Audit type:** read-only. This document records the working tree as found on 2026-11-26.
**Pre-existing uncommitted changes:** `src/app/globals.css`, `src/hooks/use-trader-positions.ts`, `src/app/[locale]/(protected)/groups/[groupId]/page.tsx`, `src/app/[locale]/(protected)/groups/[groupId]/_components/group-activity-timeline.tsx`, `src/app/[locale]/(protected)/groups/compare/page.tsx`, `tests/conformance/wallet-groups.spec.ts`. They are part of the current UI state (for example, the base font size is 17px).

---

## 1. Design system architecture

### 1.1 Styling stack

| Layer                 | Implementation                                                    | Path                                               |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| CSS framework         | Tailwind CSS v4, CSS-first configuration (no `tailwind.config.*`) | `src/app/globals.css`                              |
| Component primitives  | shadcn-style wrappers over Base UI (`@base-ui/react`)             | `src/components/ui/*`                              |
| shadcn styles         | `@import 'shadcn/tailwind.css'`                                   | `src/app/globals.css:4`                            |
| Animations            | `tw-animate-css`                                                  | `src/app/globals.css:3`                            |
| Dark variant          | `@custom-variant dark (&:is(.dark *))`                            | `src/app/globals.css:6`                            |
| Theme class           | `dark` hardcoded on `<html>`                                      | `src/app/layout.tsx:22`                            |
| Global tokens         | shadcn token block in `:root`                                     | `src/app/globals.css:54-89`                        |
| Tailwind token bridge | `@theme inline` maps CSS variables to Tailwind colors             | `src/app/globals.css:8-52`                         |
| Landing tokens        | separate local palette in a second `:root`                        | `src/app/globals.css:138-150`                      |
| Fonts                 | General Sans via Fontshare; Geist/Geist Mono via `next/font`      | `src/app/globals.css:1`, `src/app/layout.tsx:2-13` |
| Base size             | `html { font-size: 17px }`                                        | `src/app/globals.css:171-174`                      |
| Radius                | `--radius: 0.625rem` + `*0.6 … *2.6` scale                        | `src/app/globals.css:75`, `45-51`                  |

### 1.2 Theme and provider architecture

| Concern               | Current state                                          | Path                                  |
| --------------------- | ------------------------------------------------------ | ------------------------------------- |
| Theme provider        | none                                                   | —                                     |
| Theme store           | none                                                   | —                                     |
| Persisted preference  | none                                                   | —                                     |
| System preference     | not read                                               | —                                     |
| `color-scheme`        | not set                                                | —                                     |
| Light theme           | does not exist                                         | —                                     |
| Dark class            | always present                                         | `src/app/layout.tsx:22`               |
| Providers             | Wagmi, React Query, session-expired context, auth init | `src/components/shared/providers.tsx` |
| i18n/layout providers | `NextIntlClientProvider`, `TooltipProvider`            | `src/app/[locale]/layout.tsx:32-40`   |

Consequence: every `dark:` utility in shared components (`button.tsx`, `input.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, `sheet.tsx`) is effectively always active. Adding a light theme without an audit would leave dark-specific border/background rules applied in light mode.

### 1.3 Typography

| Role         | Current implementation                                                   | Notes                                                                |
| ------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| UI sans      | `'General Sans', ui-sans-serif, system-ui`                               | Loaded from `api.fontshare.com` (external network dependency)        |
| Mono         | `var(--font-geist-mono)`                                                 | Geist Mono loaded in root layout                                     |
| Heading      | alias of `--font-sans`                                                   | `font-heading` is defined but rarely used                            |
| Numeric data | mix of default sans + `tabular-nums`, occasional `font-mono`             | Addresses and order IDs use mono; PnL often uses sans + tabular-nums |
| Scale        | Tailwind `text-xs`…`text-5xl`, plus arbitrary `text-[8px]`…`text-[40px]` | `text-[8px]`–`text-[10px]` appear in dense UI                        |
| Base size    | 17px                                                                     | Makes `text-xs` 12.75px and `text-sm` 14.875px                       |

### 1.4 Spacing, radius, border, shadow conventions

- Spacing: Tailwind 4px ladder (`gap-1`…`gap-6`), pages use `p-4 lg:p-6`, cards `p-4`, dialogs `p-4`.
- Radius: base 10px; cards commonly `rounded-xl` (14px); buttons/inputs `rounded-lg`; pills `rounded-full`.
- Borders: default 1px `border`; cards and tables rely on visible borders; some sticky cells add `border-r shadow-sm`.
- Shadows: `shadow-sm` on cards; `shadow-lg` on popovers/sheets; dark surfaces cannot rely on shadow for depth.
- Overlays: `bg-black/10` in both `dialog.tsx:32` and `sheet.tsx:32`; not tokenized, no theme-aware scrim.

### 1.5 Token families and duplication

1. **shadcn app tokens:** `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar-*`, `chart-1..5`, plus custom `label`, `freshness`.
2. **Landing tokens:** `--landing-surface`, `-surface-2`, `-border`, `-ink`, `-muted`, `-accent`, `-positive`, `-negative`, `-ribbon`, `-ribbon-soft`, `-grid`. They duplicate the app palette but are scoped separately.
3. **Hardcoded utility colors:** emerald/rose/amber/blue/indigo/purple/green classes throughout feature components.
4. **Hardcoded raw colors:** hex in `opengraph-image.tsx`, `logo.tsx` fallbacks, compare chart `COLORS`, rgba in scrollbar and landing tokens.

`--chart-1`…`--chart-5` are defined but **not used anywhere** in `src/`.

---

## 2. Component inventory

> Path shorthand in the tables below: `.../` = `src/app/[locale]/(protected)`. All other paths are complete relative to the repo root.

### 2.1 Shared UI primitives (`src/components/ui`)

| Component     | Path                                  | Notes                                                                                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Button        | `src/components/ui/button.tsx`        | cva variants: default, outline, secondary, ghost, destructive, link; sizes xs–lg + icon variants; hover/active/focus/disabled states |
| Input         | `src/components/ui/input.tsx`         | Base UI input; `bg-transparent`, dark-specific `dark:bg-input/30`                                                                    |
| Label         | `src/components/ui/label.tsx`         | 19 lines, minimal                                                                                                                    |
| Table         | `src/components/ui/table.tsx`         | Header `border-b`, row hover `bg-muted/50`, selected `bg-muted`                                                                      |
| Dialog        | `src/components/ui/dialog.tsx`        | Overlay `bg-black/10`, content `bg-popover`, `ring-foreground/10`                                                                    |
| Sheet         | `src/components/ui/sheet.tsx`         | Overlay `bg-black/10`, content `bg-popover`                                                                                          |
| Dropdown menu | `src/components/ui/dropdown-menu.tsx` | `bg-popover`, `focus:bg-accent`, destructive item variants                                                                           |
| Popover       | `src/components/ui/popover.tsx`       | `bg-card`, `border`, `shadow-lg`                                                                                                     |
| Tooltip       | `src/components/ui/tooltip.tsx`       | Base UI tooltip, muted content                                                                                                       |
| Skeleton      | `src/components/ui/skeleton.tsx`      | `bg-muted animate-pulse`                                                                                                             |

### 2.2 Layout, navigation, shared components

| Component             | Path                                                          |
| --------------------- | ------------------------------------------------------------- |
| App shell             | `src/components/shared/layout/app-layout.tsx`                 |
| Header                | `src/components/shared/layout/header/index.tsx`               |
| Sidebar shell         | `src/components/shared/layout/sidebar/index.tsx`              |
| Sidebar header        | `src/components/shared/layout/sidebar/sidebar-header.tsx`     |
| Sidebar nav           | `src/components/shared/layout/sidebar/sidebar-nav.tsx`        |
| Sidebar footer        | `src/components/shared/layout/sidebar/sidebar-footer.tsx`     |
| Language switcher     | `src/components/shared/language-switcher.tsx`                 |
| Brand logo            | `src/components/shared/brand/logo.tsx`                        |
| Asset icon            | `src/components/shared/asset-icon.tsx`                        |
| Pagination            | `src/components/shared/pagination.tsx`                        |
| Date range picker     | `src/components/shared/date-range-picker.tsx`                 |
| Saved searches        | `src/components/shared/traders/saved-searches.tsx`            |
| Trader table          | `src/components/shared/traders/trader-table.tsx`              |
| Long/short bar        | `src/components/shared/traders/long-short-bar.tsx`            |
| Copy address          | `src/components/shared/traders/copy-address.tsx`              |
| Add-to-group modal    | `src/components/shared/traders/add-to-trader-group-modal.tsx` |
| Connect wallet button | `src/components/shared/auth/connect-wallet-button.tsx`        |
| Connect wallet modal  | `src/components/shared/auth/connect-wallet-modal.tsx`         |
| Wagmi auth sync       | `src/components/shared/auth/wagmi-auth-sync.tsx`              |

### 2.3 Pages and feature components

| Area          | Page / component                  | Path                                                                                           |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Marketing     | Marketing layout                  | `src/app/[locale]/(marketing)/layout.tsx`                                                      |
| Marketing     | Landing page view                 | `src/app/[locale]/(marketing)/_components/landing-page-view.tsx`                               |
| Marketing     | Open Graph image                  | `src/app/[locale]/(marketing)/opengraph-image.tsx`                                             |
| Scanner       | Scanner page                      | `src/app/[locale]/(protected)/traders/page.tsx`                                                |
| Scanner       | Page header                       | `.../traders/_components/scanner-page-header.tsx`                                              |
| Scanner       | Toolbar                           | `.../traders/_components/scanner-toolbar.tsx`                                                  |
| Scanner       | Command bar                       | `.../traders/_components/scanner-command-bar.tsx`                                              |
| Scanner       | Bottom bar                        | `.../traders/_components/scanner-bottom-bar.tsx`                                               |
| Scanner       | Filters panel (docked + sheet)    | `.../traders/_components/scanner-filters-panel.tsx`                                            |
| Scanner       | Filter chips                      | `.../traders/_components/filter-chips.tsx`                                                     |
| Scanner       | Legacy filter sheet               | `.../traders/_components/filter-sheet.tsx`                                                     |
| Wallet detail | Client detail page                | `.../traders/[address]/_components/client-detail-page.tsx`                                     |
| Wallet detail | Statement header                  | `.../traders/[address]/_components/wallet-statement-header.tsx`                                |
| Wallet detail | Wallet tabs                       | `.../traders/[address]/_components/wallet-tabs.tsx`                                            |
| Wallet detail | Positions                         | `.../traders/[address]/_components/positions-section.tsx`                                      |
| Wallet detail | Balances                          | `.../traders/[address]/_components/balances-section.tsx`                                       |
| Wallet detail | Orders                            | `.../traders/[address]/_components/orders-section.tsx`                                         |
| Wallet detail | Fills                             | `.../traders/[address]/_components/fills-section.tsx`                                          |
| Wallet detail | Trades                            | `.../traders/[address]/_components/trades-section.tsx`                                         |
| Wallet detail | Transfers                         | `.../traders/[address]/_components/transfers-section.tsx`                                      |
| Wallet detail | Performance                       | `.../traders/[address]/_components/performance-section.tsx`                                    |
| Wallet detail | Portfolio chart                   | `.../traders/[address]/_components/portfolio-chart.tsx`                                        |
| Wallet detail | Activity feed                     | `.../traders/[address]/_components/activity-feed.tsx`                                          |
| Wallet detail | Performance strip                 | `.../traders/[address]/_components/wallet-performance-strip.tsx`                               |
| Wallet detail | Placeholder tab                   | `.../traders/[address]/_components/placeholder-tab.tsx`                                        |
| Overview      | Overview page                     | `.../traders/overview/page.tsx`                                                                |
| Overview      | Overview tab/cards                | `.../traders/overview/_components/overview-tab.tsx`, `overview-card.tsx`                       |
| Overview      | Sparkline                         | `.../traders/overview/_components/overview-sparkline.tsx`                                      |
| Bucket detail | Bucket page/header                | `.../traders/overview/[kind]/[bucket]/page.tsx`, `_components/bucket-header.tsx`               |
| Bucket detail | Positioning chart                 | `.../traders/overview/[kind]/[bucket]/_components/bucket-positioning-chart.tsx`                |
| Bucket detail | Stat bars                         | `.../traders/overview/[kind]/[bucket]/_components/bucket-stat-bars.tsx`                        |
| Bucket detail | Tables                            | `.../traders/overview/[kind]/[bucket]/_components/bucket-tables.tsx`                           |
| Bucket detail | Treemap                           | `.../traders/overview/[kind]/[bucket]/_components/bucket-treemap.tsx`                          |
| Market        | Market page/header                | `.../traders/markets/[market]/page.tsx`, `_components/market-header.tsx`                       |
| Market        | Snapshot ribbon                   | `.../traders/markets/[market]/_components/market-snapshot-ribbon.tsx`                          |
| Market        | Wallet table                      | `.../traders/markets/[market]/_components/market-wallet-table.tsx`                             |
| Groups        | Groups page/table/stats           | `.../groups/page.tsx`, `_components/groups-table.tsx`, `_components/groups-overview-stats.tsx` |
| Groups        | Group form / delete dialog        | `.../groups/_components/group-form.tsx`, `_components/delete-group-dialog.tsx`                 |
| Groups        | Compare page                      | `.../groups/compare/page.tsx`                                                                  |
| Groups        | Group detail                      | `.../groups/[groupId]/page.tsx`                                                                |
| Groups        | Activity timeline                 | `.../groups/[groupId]/_components/group-activity-timeline.tsx`                                 |
| Groups        | Alerts panel/form                 | `.../groups/[groupId]/_components/group-alerts-panel.tsx`, `group-alert-form-dialog.tsx`       |
| Groups        | Performance chart                 | `.../groups/[groupId]/_components/group-performance-chart.tsx`                                 |
| Settings      | Settings page                     | `.../settings/page.tsx`                                                                        |
| Funding       | Funding page/table/venue selector | `.../funding-arbitrage/page.tsx`, `funding-table.tsx`, `venue-selector.tsx`                    |

---

## 3. Color usage inventory

### 3.1 Central tokens (current)

| Token                  | Current value                                         | Intended use / observed use                                       |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `--background`         | `#040605`                                             | app background                                                    |
| `--foreground`         | `#ffffff`                                             | text                                                              |
| `--card`               | `#121714`                                             | cards, sticky table cells                                         |
| `--popover`            | `#121714`                                             | dialogs, menus, sheets                                            |
| `--primary`            | `#55d396`                                             | buttons, active nav, positive PnL, ready status, live badge, bars |
| `--secondary`          | `#169a50`                                             | secondary buttons, hover on landing CTA                           |
| `--muted`              | `#272c2a`                                             | hover backgrounds, skeletons, chips                               |
| `--muted-foreground`   | `#8a9b93`                                             | secondary text                                                    |
| `--label`              | `#a6b7ae`                                             | statement labels                                                  |
| `--accent`             | `#169a50`                                             | menu focus background                                             |
| `--destructive`        | `#ef4444`                                             | negative values, destructive actions                              |
| `--border` / `--input` | `#2a302d`                                             | borders, inputs                                                   |
| `--ring`               | `#55d396`                                             | focus rings                                                       |
| `--sidebar*`           | dark greys/mint                                       | sidebar                                                           |
| `--chart-1..5`         | `#55d396`, `#169a50`, `#272c2a`, `#8a9b93`, `#0c100e` | **unused**                                                        |
| `--freshness`          | `#e0a94a`                                             | stale data dot                                                    |
| landing tokens         | `#0b100d` … `#55d396`                                 | landing page only                                                 |

### 3.2 Hardcoded raw colors

| Location                                                     | Value(s)                                   | Problem                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `src/app/globals.css:107-126`                                | rgba scrollbar colors                      | not theme-aware                                                                           |
| `src/app/globals.css:139-149`                                | landing palette                            | separate system; dark-only                                                                |
| `src/components/shared/brand/logo.tsx:47,84,87`              | `#55d396`, `#040605` fallbacks             | brand color duplicated                                                                    |
| `src/app/[locale]/(marketing)/opengraph-image.tsx:20-43`     | `#040605`, `#E9EFEA`, `#55D396`, `#8A9B93` | static image; cannot follow theme                                                         |
| `src/app/[locale]/(protected)/groups/compare/page.tsx:24-35` | 10 series hex (`#60a5fa`, `#34d399`, …)    | chart palette outside tokens; includes colors that clash with positive/negative semantics |
| `src/components/ui/dialog.tsx:32`, `sheet.tsx:32`            | `bg-black/10`                              | overlay not tokenized                                                                     |

### 3.3 Hardcoded Tailwind palette classes

| File / line                                                                                                         | Class                                                                        | Semantics                    |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `components/shared/traders/trader-table.tsx:241`                                                                    | `from-indigo-500 to-purple-500 text-white`                                   | avatar gradient              |
| `components/shared/traders/trader-table.tsx:254,268`                                                                | `text-primary` / `text-destructive` status + PnL                             | status and PnL share primary |
| `components/shared/traders/long-short-bar.tsx:37,43`                                                                | `bg-primary`, `bg-blue-500`                                                  | long = mint, short = blue    |
| `app/(public)/funding-arbitrage/funding-table.tsx:120-126`                                                          | `bg-emerald-500`, `text-emerald-500`, `bg-rose-500`, `text-rose-500`         | long/short                   |
| `app/(public)/funding-arbitrage/funding-table.tsx:141`                                                              | `text-primary` / `text-destructive`                                          | funding spread               |
| `app/(protected)/groups/_components/groups-table.tsx:75,89`                                                         | `text-amber-500`, `text-emerald-400`                                         | favorite star, PnL           |
| `app/(protected)/groups/compare/page.tsx:368,475`                                                                   | `amber-500/40`, `amber-500/10`, `text-amber-200`, `text-emerald-400`         | warnings, best value         |
| `app/(protected)/groups/[groupId]/_components/group-performance-chart.tsx:155`                                      | `text-emerald-400`                                                           | last value                   |
| `app/(protected)/groups/[groupId]/page.tsx:280,610`                                                                 | `amber-500/*`                                                                | session-expired banners      |
| `components/shared/layout/app-layout.tsx:42`                                                                        | `amber-500/*`                                                                | session-expired banner       |
| `app/(protected)/traders/markets/[market]/_components/market-header.tsx:63`                                         | `bg-amber-500/15 text-amber-600`                                             | HL · 30s badge               |
| `app/(protected)/traders/markets/[market]/_components/market-snapshot-ribbon.tsx:84-85`                             | `bg-emerald-500`, `bg-rose-500`                                              | long/short ratio             |
| `app/(protected)/traders/overview/_components/overview-card.tsx:52,56,146`                                          | `emerald-500/15`, `emerald-600 dark:emerald-400`, `rose-*`, `bg-emerald-500` | sentiment, split bar         |
| `app/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-header.tsx:75-77`                              | `emerald-*`, `rose-*`                                                        | sentiment                    |
| `app/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-positioning-chart.tsx:144-145,264-285,359-362` | `text/fill/stroke-emerald-500`, `rose-500`                                   | long/short chart             |
| `app/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-stat-bars.tsx:40-70`                           | `bg-emerald-500`, `bg-rose-500`                                              | profit/loss and long/short   |
| `app/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-tables.tsx:281-285,441-445`                    | `emerald-600 dark:emerald-400`, `rose-*`                                     | PnL                          |
| `app/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-treemap.tsx:33-34`                             | `bg-emerald-500/15 border-emerald-500/30 text-emerald-100`, rose equivalent  | tile tone                    |
| `app/(protected)/traders/[address]/_components/wallet-statement-header.tsx:142-143,292`                             | `text-primary`, `text-destructive`, `bg-amber-500`                           | PnL, margin usage            |
| `components/shared/auth/connect-wallet-button.tsx:32`                                                               | `bg-green-500`                                                               | connected dot                |

### 3.4 Inline style / SVG colors

| Location                                                                                                          | Usage                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `components/shared/brand/logo.tsx:47,84,87`                                                                       | SVG `fill`/`stroke` with token fallbacks                                                                       |
| `app/(marketing)/_components/landing-page-view.tsx:96-340`                                                        | inline `boxShadow`, `stroke="var(--landing-ribbon)"`, arbitrary `text-[var(--landing-accent)]`-style utilities |
| `groups/compare/page.tsx:409-423`                                                                                 | SVG path `stroke={color}` and legend swatch `style={{ background: color }}`                                    |
| `traders/overview/_components/overview-sparkline.tsx:54,72`                                                       | `stroke="currentColor"` / prop color                                                                           |
| `portfolio-chart.tsx:269,288-331`                                                                                 | `stroke-border/40`, `fill-primary`, `fill-destructive`                                                         |
| `group-performance-chart.tsx:170-177`                                                                             | `stroke-border`, `stroke-primary`                                                                              |
| `bucket-positioning-chart.tsx:255-362`                                                                            | `stroke-border/20`, `fill/stroke-emerald/rose`, tooltip `fill-background stroke-border`                        |
| bars (`long-short-bar`, `overview-card`, `bucket-stat-bars`, `market-snapshot-ribbon`, `wallet-statement-header`) | inline `width` percentages only                                                                                |

---

## 4. Chart / data-visualization inventory

| Chart                  | Implementation                         | Colors                                                                    | Gaps                                                         |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Portfolio chart        | Hand-written SVG (line + clipped area) | `stroke-primary`, `fill-primary` / `fill-destructive`, `stroke-border/40` | No tooltip/crosshair; PnL uses brand primary as profit color |
| Group performance      | Hand-written SVG line                  | `stroke-primary`, `stroke-border`, last value `text-emerald-400`          | No axes/tooltip                                              |
| Bucket positioning     | Hand-written SVG area/line             | `emerald-500`, `rose-500`, `border/20`                                    | Long/short colors only; no dark/light variants               |
| Bucket stat bars       | div bars                               | `emerald-500`, `rose-500`                                                 | Profit and long share the same green                         |
| Treemap                | div squarify                           | `emerald-500/15`, `rose-500/15`, `text-emerald-100`                       | Text colors tuned for dark only                              |
| Overview sparkline     | SVG polyline                           | `currentColor`                                                            | Depends on parent color; no semantic data color              |
| Long/short bar         | div bars                               | `bg-primary`, `bg-blue-500`                                               | Short is blue here, rose elsewhere                           |
| Market snapshot ribbon | div bars                               | `emerald-500`, `rose-500`                                                 | same inconsistency                                           |
| Compare chart          | Hand-written SVG multi-series          | 10 hardcoded hex + legend                                                 | No axes/grid/tooltip; palette not tokenized                  |
| Funding table          | table                                  | emerald/rose, primary/destructive                                         | Long/short vs spread semantics mixed                         |

No chart library is installed. `--chart-1..5` are dead tokens. There are no candlestick charts.

---

## 5. Inconsistent design patterns

1. **Positive PnL:** `text-primary` (`trader-table.tsx:268`, `wallet-statement-header.tsx:142`), `text-emerald-400` (`groups-table.tsx:89`, `group-performance-chart.tsx:155`), `text-emerald-600 dark:text-emerald-400` (`bucket-tables.tsx`), `text-emerald-500` (`bucket-positioning-chart.tsx`).
2. **Short side:** `bg-blue-500`, `bg-rose-500`, `text-rose-500`, `fill-rose-500` depending on component.
3. **Status colors:** `ready` = `text-primary`; `stale` = `text-freshness`; `error` = `text-destructive`; live badge = `bg-primary/10 text-primary`. No `info` or `warning` token.
4. **Alert banners:** five copies of `border-amber-500/40 bg-amber-500/10 text-amber-200` across pages; `text-amber-200` is unreadable on light.
5. **Elevation:** cards use `border` + `shadow-sm`; dialogs `ring-foreground/10`; sheets `shadow-lg`; overlays `bg-black/10`. No consistent elevation ladder.
6. **Focus:** global `outline-ring/50` plus `ring-3 ring-ring/50`; at 50% opacity the focus indicator may not meet 3:1.
7. **Overlay:** `bg-black/10` is very light for a modal scrim and ignores theme.
8. **Density:** arbitrary `text-[8px]`–`text-[10px]` in treemap, bucket tables, funding table, chart axes; inconsistent with 17px base.
9. **Layout:** scanner toolbar is sticky `top-0` inside the scroll container; page padding `p-4 lg:p-6`; group detail duplicates the same pattern; marketing uses its own header/footer.

---

## 6. Dark/Light limitations

- No light token values at all. `:root` is dark.
- `dark:` utilities assume a dark default; switching to light would leave `dark:` rules inactive but also leave light-specific tokens missing.
- Text and status colors chosen for dark (emerald-400, rose-400, amber-200) fail contrast on light backgrounds.
- Landing page is hardcoded dark via `--landing-*`; it would remain dark in a light theme.
- Scrollbars, native selects, checkboxes, and `color-scheme` do not adapt.
- Overlays and shadows are tuned for dark; light mode needs stronger borders and lighter shadows.
- Charts have no theme-aware series colors; axes/grid/tooltips are only partially tokenized.
- Visual snapshots exist only for dark and only for scanner/trader/groups states (`tests/e2e/visual.spec.ts`), so light mode has no baseline.

---

## 7. Technical risks and dependencies

| Risk                      | Detail                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Tailwind v4 CSS-first     | No JS config; token changes happen in `globals.css` via `@theme inline`; class names are generated from CSS variables |
| Always-on dark variant    | Removing the hardcoded `dark` class will expose missing light styles in `button/input/dropdown/dialog/sheet`          |
| Base UI/shadcn            | Focus rings, overlay colors, and `dark:` variants live in `src/components/ui/*`, not in a single theme file           |
| Charts                    | 9 hand-written chart surfaces; colors and axes are component-local                                                    |
| Tests                     | Unit tests assert specific classes/roles; e2e visual snapshots are dark-only; axe tests run on dark                   |
| Fonts                     | General Sans is loaded from Fontshare; theme work should not add another font dependency                              |
| Landing                   | Separate token family; must be migrated or explicitly exempted                                                        |
| Existing uncommitted work | Base 17px and wallet/group NIT fixes are in the working tree; migration must not discard them                         |

---

## 8. Areas requiring special attention

1. **Financial semantics:** separate brand lime from positive PnL; audit every `text-primary` use.
2. **Short/long direction:** choose one convention and apply it to `long-short-bar`, funding table, bucket charts, market ribbon, overview cards.
3. **Charts:** replace hardcoded series colors with `--chart-*`, add light/dark variants and inactive/selected states.
4. **Light contrast:** emerald/rose/amber Tailwind classes and `text-amber-200` banners must be replaced with semantic tokens.
5. **Overlays and focus:** tokenize scrim, set `color-scheme`, raise focus ring contrast.
6. **Landing:** decide dark-only brand surface vs. true light theme.
7. **Density:** keep 17px base or normalize to 16px before tuning table row heights and chart labels.
8. **Tests/snapshots:** add light-mode axe and visual baselines; update dark baselines after token changes.

---

## 02 — Proposed Design System: Graphite & Acid Lime

**Direction:** graphite defines structure; acid lime is a selective interaction accent; financial colors carry financial meaning; both themes share the same semantics.

**Rules that drive every token choice**

1. Lime is for primary action, selection, focus, and brand emphasis. It is **not** the positive PnL color.
2. Graphite surfaces carry hierarchy; borders are a fallback, not decoration.
3. Light theme is designed independently — it is not an inversion.
4. Financial meaning always has a second cue (sign, label, arrow, icon).
5. Charts use their own palette; they never reuse lime for every series.

---

## 1. Semantic color tokens

### 1.1 Foundation

| Token                 | Dark                | Light                 | Use                                                         |
| --------------------- | ------------------- | --------------------- | ----------------------------------------------------------- |
| `--background`        | `#101210`           | `#F3F5EF`             | app canvas                                                  |
| `--foreground`        | `#F0F3EB`           | `#141812`             | default text                                                |
| `--surface`           | `#191D19`           | `#FAFBF7`             | cards, panels, tables                                       |
| `--surface-secondary` | `#1E231E`           | `#F0F2EA`             | table headers, inset panels                                 |
| `--surface-tertiary`  | `#232923`           | `#E9ECE2`             | hover rows, chips, inputs                                   |
| `--elevated`          | `#242A24`           | `#FFFFFF`             | modals, dropdowns, popovers                                 |
| `--overlay`           | `rgba(8,10,8,0.64)` | `rgba(20,24,18,0.32)` | modal scrim                                                 |
| `--border`            | `#343D32`           | `#D5DACB`             | default dividers                                            |
| `--border-subtle`     | `#29312A`           | `#E2E6DB`             | non-interactive separators                                  |
| `--border-strong`     | `#66755E`           | `#828D76`             | input borders, focus-adjacent boundaries (≥3:1 on surfaces) |

### 1.2 Text

| Token              | Dark      | Light     | Use                                 |
| ------------------ | --------- | --------- | ----------------------------------- |
| `--text-primary`   | `#F0F3EB` | `#141812` | headings, values                    |
| `--text-secondary` | `#C2C9BA` | `#3D453A` | body, table labels                  |
| `--text-muted`     | `#929A8D` | `#5E685A` | metadata, secondary labels          |
| `--text-disabled`  | `#6A7266` | `#8B9386` | disabled labels (exempt; 3.1–3.8:1) |
| `--text-inverse`   | `#101210` | `#F7F9F3` | text on filled brand/danger         |

### 1.3 Brand

| Token                  | Dark      | Light     | Use                                                                  |
| ---------------------- | --------- | --------- | -------------------------------------------------------------------- |
| `--primary`            | `#C1F36B` | `#B7E85A` | primary button fill, selected control fill                           |
| `--primary-hover`      | `#D3FA86` | `#C6F26E` | primary hover                                                        |
| `--primary-active`     | `#AEE25C` | `#A9DB4A` | primary pressed                                                      |
| `--primary-subtle`     | `#2A331F` | `#EDF6D6` | selected rows, active nav background                                 |
| `--primary-foreground` | `#101210` | `#101210` | ink on lime (14.6:1 / 13.2:1)                                        |
| `--primary-text`       | `#C1F36B` | `#4F6B12` | lime used as text/icon/link color (≥5.5:1 light)                     |
| `--primary-border`     | `#66755E` | `#5F7D18` | boundary for lime buttons in light mode (3.3:1 vs lime, 4.3:1 vs bg) |
| `--accent`             | `#8FD9C4` | `#177A6B` | secondary accent: teal, charts, highlights                           |
| `--accent-subtle`      | `#1B2B27` | `#E0F0EA` | accent backgrounds                                                   |
| `--accent-foreground`  | `#101210` | `#F7F9F3` | text on accent                                                       |

> `primary` is the action **surface**. `primary-text` is the text-safe brand color. Do not use `text-primary` for body text in light mode; migrate those cases to `text-primary-text`.

> **Accent compatibility:** `--accent` is the teal brand accent. shadcn's Tailwind alias `--color-accent` must map to `--interactive-hover` (neutral), so existing `bg-accent`/`focus:bg-accent` classes do not turn teal. Migrate those menu focus classes to `interactive-hover` in Phase 2; use `var(--accent)` or `brand-accent` utilities only for intentional teal highlights.

### 1.4 Interactive

| Token                   | Dark      | Light     | Use                                    |
| ----------------------- | --------- | --------- | -------------------------------------- |
| `--interactive-hover`   | `#232A22` | `#EDF0E7` | neutral hover fill                     |
| `--interactive-active`  | `#2C352A` | `#E3E8D9` | neutral pressed/selected fill          |
| `--focus-ring`          | `#C1F36B` | `#4F6B12` | 2px ring + 2px offset                  |
| `--selection`           | `#3A4A2A` | `#E3F2C4` | text selection, multi-select highlight |
| `--disabled-background` | `#1E231E` | `#E9ECE2` | disabled control fill                  |
| `--disabled-foreground` | `#6A7266` | `#8B9386` | disabled label                         |

### 1.5 Semantic status

| Token              | Dark      | Light     | Use                              |
| ------------------ | --------- | --------- | -------------------------------- |
| `--success`        | `#6DCE91` | `#177A4D` | ready, success, positive outcome |
| `--success-subtle` | `#1B2E22` | `#E3F2E9` | success badge background         |
| `--warning`        | `#E8C15A` | `#8A6A12` | stale data, caution, near-limit  |
| `--warning-subtle` | `#332B17` | `#F6EED6` | warning banner                   |
| `--danger`         | `#F07878` | `#C43D3D` | errors, destructive actions      |
| `--danger-subtle`  | `#3A1F1F` | `#F7E3E2` | error banner                     |
| `--info`           | `#7FB3D9` | `#2F6FA3` | syncing, informational           |
| `--info-subtle`    | `#1B2933` | `#E3EEF7` | info banner                      |

### 1.6 Token mapping from the current system

| Current token                 | Proposed token                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--background`                | `--background`                                                                                           |
| `--card`                      | `--surface`                                                                                              |
| `--popover`                   | `--elevated`                                                                                             |
| `--primary`                   | `--primary` (surface) + `--primary-text` (text)                                                          |
| `--secondary`                 | `--surface-secondary` (neutral secondary button)                                                         |
| `--muted`                     | `--surface-tertiary`                                                                                     |
| `--muted-foreground`          | `--text-muted`                                                                                           |
| `--label`                     | `--text-secondary`                                                                                       |
| `--accent` (old shadcn alias) | `--interactive-hover` (neutral); `--accent` becomes the teal brand accent and is not used for menu focus |
| `--destructive`               | `--danger`                                                                                               |
| `--border` / `--input`        | `--border` / `--border-strong`                                                                           |
| `--ring`                      | `--focus-ring`                                                                                           |
| `--freshness`                 | `--warning`                                                                                              |
| `--chart-1..5`                | `--chart-1..8` (see §3)                                                                                  |
| `--landing-*`                 | app tokens + a small brand-only subset                                                                   |
| `--sidebar-*`                 | `--surface` / `--surface-secondary` / `--primary-text`                                                   |

---

## 2. Trading & financial semantic colors

| Token                         | Dark      | Light     | Meaning                                                   |
| ----------------------------- | --------- | --------- | --------------------------------------------------------- |
| `--financial-positive`        | `#6DCE91` | `#177A4D` | positive PnL, profit, gain                                |
| `--financial-positive-subtle` | `#1B2E22` | `#E3F2E9` | positive badge/row tint                                   |
| `--financial-negative`        | `#F07878` | `#C43D3D` | negative PnL, loss                                        |
| `--financial-negative-subtle` | `#3A1F1F` | `#F7E3E2` | negative badge/row tint                                   |
| `--financial-neutral`         | `#929A8D` | `#5E685A` | zero/unknown/not-applicable                               |
| `--direction-long`            | `#6DCE91` | `#177A4D` | long side                                                 |
| `--direction-short`           | `#E88C7D` | `#B85C50` | short side                                                |
| `--trade-buy`                 | `#6DCE91` | `#177A4D` | buy                                                       |
| `--trade-sell`                | `#F07878` | `#C43D3D` | sell                                                      |
| `--funding-positive`          | `#6DCE91` | `#177A4D` | funding received                                          |
| `--funding-negative`          | `#F07878` | `#C43D3D` | funding paid                                              |
| `--position-active`           | `#C1F36B` | `#4F6B12` | active/open position marker (ring/dot); not text on white |
| `--position-inactive`         | `#929A8D` | `#5E685A` | closed/inactive                                           |
| `--wallet-ready`              | `#6DCE91` | `#177A4D` | ready/active                                              |
| `--wallet-syncing`            | `#7FB3D9` | `#2F6FA3` | syncing                                                   |
| `--wallet-stale`              | `#E8C15A` | `#8A6A12` | stale                                                     |
| `--wallet-error`              | `#F07878` | `#C43D3D` | error/offline                                             |
| `--alert-critical`            | `#F07878` | `#C43D3D` | critical alert                                            |
| `--alert-warning`             | `#E8C15A` | `#8A6A12` | warning alert                                             |
| `--alert-info`                | `#7FB3D9` | `#2F6FA3` | informational alert                                       |
| `--alert-success`             | `#6DCE91` | `#177A4D` | resolved/success alert                                    |

**Rules**

- Never use `--primary` lime for positive PnL; use `--financial-positive`.
- Long/short and buy/sell always include a label or icon (`LONG`, `SHORT`, `BUY`, `SELL`).
- Use the same semantic role across both themes; only the hex changes.
- Table cells use a two-tier emphasis: hero PnL uses 600 weight + full color; repeated cells use 500 weight and `color-mix(in srgb, token 88%, text-primary 12%)` (or 0.88 opacity) to reduce noise.
- Do not tint whole rows green/red; tint only the value cell or add a 2px left marker on hover/selection.

---

## 3. Chart color system

### 3.1 Series palette

| Token       | Dark      | Light     | Use                                   |
| ----------- | --------- | --------- | ------------------------------------- |
| `--chart-1` | `#C1F36B` | `#4F6B12` | primary series (only when one series) |
| `--chart-2` | `#7FB3D9` | `#2F6FA3` | comparison series                     |
| `--chart-3` | `#E8C15A` | `#8A6A12` | third series                          |
| `--chart-4` | `#C9A7EB` | `#6B4FA1` | fourth series                         |
| `--chart-5` | `#6DCE91` | `#1E8E5A` | fifth series                          |
| `--chart-6` | `#F49C9C` | `#B03A3A` | sixth series                          |
| `--chart-7` | `#8FD9C4` | `#177A6B` | seventh series                        |
| `--chart-8` | `#B8B8B8` | `#6F7868` | baseline/other                        |

All series above meet ≥3:1 against their theme surface (computed in §5). In light mode, `--chart-1` is dark olive, **not** lime, so a 1px line stays visible; lime is reserved for the selected point/active legend swatch.

### 3.2 Chart chrome

| Token                    | Dark                     | Light                  | Use                        |
| ------------------------ | ------------------------ | ---------------------- | -------------------------- |
| `--chart-grid`           | `rgba(148,160,141,0.16)` | `rgba(94,104,90,0.18)` | grid lines                 |
| `--chart-axis`           | `#929A8D`                | `#5E685A`              | axis labels, ticks         |
| `--chart-crosshair`      | `#929A8D`                | `#5E685A`              | crosshair (dashed 4 4)     |
| `--chart-tooltip-bg`     | `#242A24`                | `#FFFFFF`              | tooltip surface            |
| `--chart-tooltip-border` | `#343D32`                | `#D5DACB`              | tooltip border             |
| `--chart-tooltip-text`   | `#F0F3EB`                | `#141812`              | tooltip text               |
| `--chart-inactive`       | `#4F5C48`                | `#B8C1AC`              | inactive/legend-off series |
| `--chart-selected`       | `#F0F3EB`                | `#141812`              | selected point ring        |
| `--chart-positive-area`  | `rgba(109,206,145,0.18)` | `rgba(23,122,77,0.12)` | positive area fill         |
| `--chart-negative-area`  | `rgba(240,120,120,0.18)` | `rgba(196,61,61,0.12)` | negative area fill         |
| `--chart-volume`         | `rgba(193,243,107,0.24)` | `rgba(79,107,18,0.18)` | volume bars                |

**Rules**

- PnL charts: positive line/area uses `--financial-positive`; negative uses `--financial-negative`. Do not use `--chart-1` for PnL.
- Multi-series comparisons: use `--chart-1..8` in order; never color two series with the same hue.
- Inactive series: 1px line + `--chart-inactive`; selected series: 2px line + 3px ring on legend.
- Grid lines are subtle; no vertical grid by default for line charts. Axis labels 11–12px, `--chart-axis`.
- Tooltips: elevated surface, border, title in `--text-primary`, values in series colors, date/time in `--text-muted`.
- Every chart needs a text summary (headline value + change) so color is not the only carrier.

---

## 4. Component visual language

### 4.1 Buttons (`src/components/ui/button.tsx`)

| Variant     | Default                                                                      | Hover                 | Active                              | Focus                           | Disabled                                         |
| ----------- | ---------------------------------------------------------------------------- | --------------------- | ----------------------------------- | ------------------------------- | ------------------------------------------------ |
| Primary     | lime `--primary`, ink `--primary-foreground`, 1px `--primary-border` (light) | `--primary-hover`     | `--primary-active` + translate-y-px | 2px `--focus-ring` + 2px offset | `--disabled-background`, `--disabled-foreground` |
| Secondary   | `--surface-secondary` + `--text-primary`                                     | `--interactive-hover` | `--interactive-active`              | ring                            | disabled tokens                                  |
| Outline     | transparent + `--border-strong`                                              | `--interactive-hover` | `--interactive-active`              | ring                            | disabled tokens                                  |
| Ghost       | transparent + `--text-secondary`                                             | `--interactive-hover` | `--interactive-active`              | ring                            | disabled tokens                                  |
| Destructive | `--danger-subtle` + `--danger`                                               | `--danger` 16%        | `--danger` 24%                      | danger ring                     | disabled tokens                                  |
| Link        | `--primary-text` underline offset 4                                          | underline             | same                                | ring                            | disabled text                                    |

One primary button per view. Do not use lime for every action on a page.

### 4.2 Inputs and form controls

| State              | Rule                                                                    |
| ------------------ | ----------------------------------------------------------------------- |
| Default            | `--surface` (or transparent) + 1px `--border-strong` + `--text-primary` |
| Placeholder        | `--text-muted`                                                          |
| Hover              | border `--text-muted`                                                   |
| Focus              | border `--focus-ring`, 2px ring at 30%, no layout shift                 |
| Invalid            | border `--danger`, ring `--danger` 20%, error text `--danger`           |
| Disabled           | `--disabled-background`, `--disabled-foreground`, no pointer            |
| Selects/checkboxes | `color-scheme` per theme; accent `--primary-text`                       |

### 4.3 Cards and panels

- Default: `--surface` + 1px `--border-subtle`, radius 14px, no shadow.
- Interactive/hover: `--interactive-hover`, border `--border`.
- Selected: `--primary-subtle` + 1px `--primary-border`.
- Hero/statement cards may use `--surface-secondary` for one level of contrast; do not stack border + shadow + gradient.
- Remove `shadow-sm` from static cards; reserve shadows for overlays.

### 4.4 Tables / data grids

| Element           | Rule                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| Container         | `--surface`, 1px `--border`, radius 12px                                           |
| Header            | `--surface-secondary`, `--text-muted`, 11px uppercase, sticky                      |
| Row               | 44px height desktop / 48px touch, `--border-subtle` bottom only                    |
| Hover             | `--interactive-hover`                                                              |
| Selected          | `--primary-subtle` + 2px left `--primary` marker                                   |
| Numeric cells     | right aligned, `tabular-nums`, `--text-primary`; secondary metadata `--text-muted` |
| Identifier column | sticky left, `--surface`, 1px right border                                         |
| Status            | dot + text label; never color-only                                                 |
| PnL               | `--financial-positive` / `--financial-negative` + sign                             |

### 4.5 Navigation and sidebar

- Sidebar background `--surface` or `--background`; 1px `--border-subtle` right edge.
- Active item: `--primary-subtle` + `--primary-text` + 3px left indicator (lime).
- Hover: `--interactive-hover`; focus ring `--focus-ring`.
- Section labels 11px uppercase `--text-muted`.
- Header: `--background` with bottom `--border`; no heavy shadow.

### 4.6 Tabs

- Container: `--surface-secondary` or transparent with bottom `--border`.
- Tab default: `--text-muted`; hover `--text-primary` + `--interactive-hover`.
- Active: `--primary-text` with 2px lime underline (not a filled lime pill everywhere).
- Selected filter/segment controls may use lime fill when they represent a primary mode; otherwise neutral.
- Focus ring inside, 2px offset.

### 4.7 Dropdowns, popovers, modals, sheets

| Element           | Rule                                                      |
| ----------------- | --------------------------------------------------------- |
| Surface           | `--elevated`, 1px `--border`, radius 12–18px, `shadow-lg` |
| Scrim             | `--overlay` + 2px blur (light mode 0–2px)                 |
| Focus             | `--focus-ring` ring, trapped in modal                     |
| Destructive items | `--danger` text, `--danger-subtle` focus                  |
| Sheet             | `--elevated`, left/right border `--border`, overlay token |
| Tooltip           | `--elevated` + `--border` + `--text-primary`, 12px        |

### 4.8 Badges, alerts, toasts

| Type          | Default                                          | Notes                             |
| ------------- | ------------------------------------------------ | --------------------------------- |
| Neutral badge | `--surface-tertiary` + `--text-secondary`        | counts, venues                    |
| Brand badge   | `--primary-subtle` + `--primary-text`            | plan/selected                     |
| Success       | `--success-subtle` + `--success`                 | ready, live                       |
| Warning       | `--warning-subtle` + `--warning`                 | stale, near-limit                 |
| Danger        | `--danger-subtle` + `--danger`                   | error, offline                    |
| Info          | `--info-subtle` + `--info`                       | syncing                           |
| Alert banner  | subtle background + 1px 30% border + icon + text | replace five amber copies         |
| Toast         | `--elevated` + left 3px status bar + icon        | auto-dismiss; no lime for success |

### 4.9 Empty, loading, error, disabled

- Empty: `--text-muted` copy + one outline action; no illustration requirement.
- Loading: skeleton `--surface-tertiary` pulse; `role="status"` + label.
- Error: `--danger-subtle` panel + `--danger` text + retry outline button.
- Disabled: `--disabled-background` + `--disabled-foreground`; never reduce opacity below 0.5 on text.
- Partial/stale: `--warning` badge + "partial" label; keep data visible.

---

## 5. Visual hierarchy redesign (not just hex replacement)

1. **One hero number per page.** Wallet detail already has a 40px account value (`wallet-statement-header.tsx:253`). Keep it; move labels to 13px `--text-secondary`, secondary metrics to 20px. Group overview should promote account value / PnL above table.
2. **Scanner toolbar is a control bar, not a card.** Keep it sticky (`scanner-toolbar.tsx:81`) but use `--background` + bottom `--border-subtle`; remove the border around the whole bar. Period/venue/filters controls become neutral segments; only the active period uses lime fill.
3. **Tables: hierarchy through alignment and weight, not borders.** Use `--surface-secondary` header, 44px rows, horizontal dividers only, bold first column, bold PnL, muted metadata. Remove shadows from sticky columns; use `border-subtle`.
4. **Reduce border noise.** Replace paired `border` + `shadow-sm` on `bg-card` cards (`overview-card.tsx:111`, `bucket-positioning-chart.tsx:193`, `bucket-stat-bars.tsx:32`, `activity-feed.tsx:78`, `wallet-statement-header.tsx:170`) with `--surface` + `--border-subtle`; interactive cards get hover only.
5. **Status is a dot + text, not a colored pill everywhere.** `trader-table.tsx` status dot is good; standardize sizes and use `--success/--info/--warning/--danger`.
6. **Chart hierarchy.** One headline value (2xl) + one range selector; axes 11px muted; series 2px; grid 1px at 16% opacity; no legends when only one series. Replace `text-[10px]` axis labels with 11px.
7. **Density.** Keep dense rows but raise minimum text size: no `text-[8px]` or `text-[9px]` for meaningful data. Treemap labels may drop below 10px only for non-essential decoration; symbol/PnL minimum 11px.
8. **Surfaces.** Four-step dark elevation (`background` → `surface` → `surface-secondary` → `elevated`), two-and-a-half steps in light. Light mode gets definition from borders, not shadows.
9. **Typography.** General Sans for UI; `tabular-nums` for all numbers; Geist Mono reserved for addresses, IDs, code. Do not use mono for PnL (it makes dense tables feel like logs).
10. **Consistent page rhythm.** Keep `p-4 lg:p-6`, `gap-4`; section headings 18px semibold; card titles 14px; metadata 12px. Avoid one-off `p-3`/`p-4`/`p-5` mixes.

---

## 6. Accessibility (WCAG 2.2 AA targets)

Computed contrast (sRGB, WCAG formula):

| Pair                                                | Ratio     | Verdict                                             |
| --------------------------------------------------- | --------- | --------------------------------------------------- |
| Dark text-primary `#F0F3EB` / background `#101210`  | **16.78** | AAA                                                 |
| Dark text-muted `#929A8D` / background              | **6.48**  | AA+                                                 |
| Dark text-muted / surface `#191D19`                 | **5.87**  | AA                                                  |
| Dark primary-text `#C1F36B` / background            | **14.61** | AAA                                                 |
| Dark ink `#101210` / lime `#C1F36B`                 | **14.61** | AAA                                                 |
| Dark success `#6DCE91` / surface                    | **8.84**  | AAA                                                 |
| Dark danger `#F07878` / surface                     | **6.22**  | AA+                                                 |
| Dark warning `#E8C15A` / surface                    | **9.92**  | AAA                                                 |
| Dark info `#7FB3D9` / surface                       | **7.60**  | AAA                                                 |
| Dark border-strong `#66755E` / surface              | **3.47**  | Non-text AA                                         |
| Light text-primary `#141812` / background `#F3F5EF` | **16.35** | AAA                                                 |
| Light text-secondary `#3D453A` / surface            | **9.57**  | AAA                                                 |
| Light text-muted `#5E685A` / background             | **5.31**  | AA                                                  |
| Light primary-text `#4F6B12` / background           | **5.55**  | AA                                                  |
| Light ink / lime `#B7E85A`                          | **13.17** | AAA                                                 |
| Light success `#177A4D` / surface                   | **5.15**  | AA                                                  |
| Light danger `#C43D3D` / surface                    | **4.95**  | AA                                                  |
| Light warning `#8A6A12` / surface                   | **4.87**  | AA                                                  |
| Light info `#2F6FA3` / surface                      | **5.15**  | AA                                                  |
| Light input border `#828D76` / background           | **3.18**  | Non-text AA                                         |
| Light border-strong `#828D76` / surface             | **3.36**  | Non-text AA                                         |
| Light lime fill `#B7E85A` / background              | **1.30**  | **Fails alone** → use `#5F7D18` border (4.31 vs bg) |
| Light primary-text on primary-subtle `#EDF6D6`      | **5.45**  | AA                                                  |
| Dark primary-text on primary-subtle `#2A331F`       | **10.24** | AAA                                                 |
| Light text on selection `#E3F2C4`                   | **15.19** | AAA                                                 |

**Required fixes**

- Do not use lime as text on light backgrounds; use `--primary-text` `#4F6B12`.
- Do not use `--success` `#6DCE91` as light-mode text; use `#177A4D` (5.15:1).
- Replace `text-amber-200` banners with `--warning` text (`#8A6A12` light, `#E8C15A` dark).
- Add `--border-strong` for inputs; default `--border` is decorative only.
- Focus ring: 2px `--focus-ring` + 2px offset, not 50% opacity.
- Charts: all series ≥3:1 vs surface; test with deuteranopia/protanopia.
- Never rely on color alone: PnL uses `+`/`−`; long/short uses labels; status uses dot + label; alerts use icons.

---

## 7. Theme mechanics (proposal)

- Theme store: Zustand + `persist` in localStorage key `hyperscan.theme`; `mode: 'light' | 'dark' | 'system'`; resolve system via `matchMedia`.
- Inline head script sets `document.documentElement.classList.toggle('dark', resolved === 'dark')` and `style.colorScheme` before paint.
- `<html suppressHydrationWarning>`; no `theme` cookie required because preference is FE-only.
- `globals.css`: `:root` = light tokens, `.dark` = dark tokens; `@theme inline` bridges both.
- Landing page uses the same tokens; if the brand requires a dark landing in light mode, scope it with a `data-surface="brand-dark"` wrapper and keep tokens inside that wrapper.

---

## 8. What not to do

- Do not make lime the dominant color of cards, tables, or large backgrounds.
- Do not invert the dark palette to create light mode.
- Do not use green/red for non-financial decoration.
- Do not add neon glows, glassmorphism, or gradient text as hierarchy devices.
- Do not keep five different amber banner implementations.
- Do not ship `text-[8px]`/`text-[9px]` for essential data.

---

## 03 — Component & Page Impact Analysis

Mapping of the proposed Graphite & Acid Lime system to actual files. Risk is relative to visual regression and implementation effort.

> Path shorthand: `.../` = `src/app/[locale]/(protected)`. All other paths are complete relative to the repo root.

## Priority legend

| Priority | Meaning                                           |
| -------- | ------------------------------------------------- |
| **P0**   | Foundation or shared component; blocks other work |
| **P1**   | High-visibility trading/financial surface         |
| **P2**   | Feature surface with moderate reuse               |
| **P3**   | Marketing/settings/low-risk surface               |

---

## 1. Foundation and shared primitives

| Component/Page      | File                                   | Current design                                                             | Problem                                                                  | Proposed change                                                                                                  | Tokens involved                                                | Risk   | Dependencies               |
| ------------------- | -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------ | -------------------------- |
| Root layout / theme | `src/app/layout.tsx`                   | `className="dark"` hardcoded; Geist fonts loaded; metadata "Arbitrage"     | No light theme, no theme class control, stale product metadata           | Add theme script, `suppressHydrationWarning`, token classes; keep fonts; update metadata to HyperScan AI         | `background`, `foreground`, `primary-text`                     | High   | Theme store, globals.css   |
| Global tokens       | `src/app/globals.css`                  | single dark `:root`; landing tokens duplicated; scrollbars rgba; base 17px | No light tokens; duplicated palette; hardcoded scrollbar                 | Replace with light `:root` + `.dark`; add semantic/financial/chart tokens; tokenize scrollbar; decide base size  | all                                                            | High   | Tailwind v4, shadcn        |
| Theme store (new)   | `src/lib/stores/theme.ts` (new)        | none                                                                       | No persisted choice/system mode                                          | Zustand persist `light/dark/system`; `matchMedia` listener                                                       | —                                                              | Medium | Zustand                    |
| Providers           | `src/components/shared/providers.tsx`  | Wagmi + React Query + session context                                      | Theme not initialized                                                    | Mount theme sync component; no business change                                                                   | —                                                              | Low    | Theme store                |
| Buttons             | `src/components/ui/button.tsx`         | lime primary, outline with `dark:` input rules, destructive subtle         | Primary/positive ambiguity; hover `bg-primary/80`; dark-specific classes | Lime primary with `primary-border` in light; neutral secondary; destructive danger tokens; focus ring 2px opaque | `primary*`, `secondary`, `danger`, `focus-ring`, `disabled-*`  | Medium | Tokens, all pages          |
| Inputs              | `src/components/ui/input.tsx`          | transparent + `dark:bg-input/30`; border-input                             | Light theme undefined; input border <3:1; dark-only rules                | `surface` + `border-strong`; focus ring; disabled tokens; checkboxes `accent-primary-text`                       | `surface`, `border-strong`, `focus-ring`, `disabled-*`         | Medium | Forms across app           |
| Labels              | `src/components/ui/label.tsx`          | minimal                                                                    | No disabled/invalid treatment                                            | Use `text-secondary`; `peer-disabled` tokens                                                                     | `text-secondary`, `disabled-*`                                 | Low    | Inputs                     |
| Tables              | `src/components/ui/table.tsx`          | header border-b; row hover `bg-muted/50`; footer muted                     | Border-heavy; selected uses muted; no header surface                     | Header `surface-secondary`; rows `border-subtle`; selected `primary-subtle`; remove vertical borders             | `surface-*`, `border-*`, `primary-subtle`, `interactive-hover` | Medium | All tables                 |
| Dialog              | `src/components/ui/dialog.tsx`         | `bg-black/10` overlay; `bg-popover`; ring                                  | Overlay too light; no theme-aware scrim                                  | `--overlay` + blur; `elevated`; `border`; shadow-lg                                                              | `overlay`, `elevated`, `border`                                | Medium | Groups, settings, scanner  |
| Sheet               | `src/components/ui/sheet.tsx`          | `bg-black/10` overlay; `bg-popover`                                        | Same as dialog; mobile sidebar/filter sheet                              | `--overlay`; `elevated`; `border`                                                                                | `overlay`, `elevated`, `border`                                | Medium | Sidebar, filter sheet      |
| Dropdown menu       | `src/components/ui/dropdown-menu.tsx`  | `bg-popover`; `focus:bg-accent`                                            | Accent green is a brand color, not neutral focus                         | `elevated` + `interactive-hover`; destructive danger tokens                                                      | `elevated`, `interactive-*`, `danger`                          | Low    | Toolbar, language switcher |
| Popover             | `src/components/ui/popover.tsx`        | `bg-card` + shadow                                                         | Surface mismatch with dialogs                                            | `elevated` + border + shadow                                                                                     | `elevated`, `border`                                           | Low    | Date picker                |
| Tooltip             | `src/components/ui/tooltip.tsx`        | muted content                                                              | Low contrast in light                                                    | `elevated` + `border` + `text-primary`                                                                           | `elevated`, `text-primary`                                     | Low    | Charts, market snapshot    |
| Skeleton            | `src/components/ui/skeleton.tsx`       | `bg-muted`                                                                 | Fine; check light contrast                                               | `surface-tertiary`                                                                                               | `surface-tertiary`                                             | Low    | All loading states         |
| Logo                | `src/components/shared/brand/logo.tsx` | SVG fills with `--primary` fallback; white/black variants                  | Fallback hex duplicates brand; variant names assume dark                 | Keep currentColor + `primary-text`; remove hex fallbacks; theme variants map to text tokens                      | `primary-text`, `text-inverse`                                 | Low    | Header, sidebar, footer    |
| Asset icon          | `src/components/shared/asset-icon.tsx` | `bg-muted` circle                                                          | Fine                                                                     | `surface-tertiary` + `text-muted`                                                                                | `surface-tertiary`                                             | Low    | Tables, charts             |

---

## 2. Layout and navigation

| Component/Page        | File                                           | Current design                                      | Problem                                                                   | Proposed change                                                                       | Tokens involved                                   | Risk   | Dependencies    |
| --------------------- | ---------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- | ------ | --------------- |
| App shell             | `src/components/shared/layout/app-layout.tsx`  | sidebar + header + main; amber session banner       | Amber banner unreadable in light                                          | Use `warning-subtle`/`warning` banner component; main background token                | `background`, `warning-*`                         | Medium | Header, sidebar |
| Header                | `.../layout/header/index.tsx`                  | `bg-background`, bottom border, mobile logo, wallet | No theme toggle                                                           | Add ThemeToggle (light/dark/system); keep height 64px                                 | `background`, `border`, `text-*`                  | Medium | Theme store     |
| Sidebar               | `.../layout/sidebar/index.tsx`                 | `bg-background`, border-r                           | Active nav uses `bg-primary/10 text-primary`; lime text in light not safe | `surface`, `border-subtle`; active `primary-subtle` + `primary-text` + left indicator | `surface`, `primary-subtle`, `primary-text`       | Medium | Sidebar nav     |
| Sidebar nav           | `.../sidebar/sidebar-nav.tsx`                  | mint active pill                                    | Same; no left marker                                                      | Active state per system; hover `interactive-hover`                                    | `primary-*`, `interactive-*`                      | Low    | Sidebar         |
| Sidebar header/footer | `.../sidebar-header.tsx`, `sidebar-footer.tsx` | brand square + app name; mobile wallet              | Brand square uses lime fill                                               | Keep lime square + `primary-foreground`; footer surface                               | `primary`, `primary-foreground`                   | Low    | Logo            |
| Language switcher     | `.../language-switcher.tsx`                    | ghost buttons                                       | No selected state token                                                   | Selected `primary-subtle` + `primary-text`; focus ring                                | `primary-*`, `focus-ring`                         | Low    | Header          |
| Pagination            | `.../pagination.tsx`                           | outline buttons; active default (lime)              | Page numbers use primary fill for current page; too much lime             | Current page `primary-subtle` + `primary-text` + border; others outline               | `primary-subtle`, `primary-text`, `border-strong` | Low    | Tables          |
| Date range picker     | `.../date-range-picker.tsx`                    | popover + calendar; selected `bg-primary`           | Calendar selection lime; light contrast                                   | Selected `primary` + `primary-foreground` + border; in-range `primary-subtle`         | `primary*`, `surface`, `border`                   | Medium | Popover, inputs |
| Add-to-group modal    | `.../traders/add-to-trader-group-modal.tsx`    | dialog + list                                       | Dialog overlay/surface; status colors                                     | Use dialog tokens; success/error states semantic                                      | `elevated`, `overlay`, `success`, `danger`        | Medium | Dialog, groups  |

---

## 3. Scanner and tables

| Component/Page               | File                                                | Current design                                                            | Problem                                                  | Proposed change                                                                                                                      | Tokens involved                                         | Risk   | Dependencies                  |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------ | ----------------------------- |
| Scanner page                 | `.../traders/page.tsx`                              | sticky toolbar, chips, table, selection bar, docked/sheet filters         | Layout shift when filters open; mixed color usage        | Keep behavior; use new surfaces; modal filter change is a separate approved task                                                     | `background`, `surface`, `border`                       | High   | Toolbar, table, filters       |
| Scanner page header          | `.../traders/_components/scanner-page-header.tsx`   | title + last updated                                                      | Metadata contrast                                        | `text-primary` title 24px; `text-muted` meta 12px                                                                                    | `text-primary`, `text-muted`                            | Low    | —                             |
| Scanner toolbar              | `.../traders/_components/scanner-toolbar.tsx`       | sticky bg-background; period segment uses lime fill; filters badge lime   | Too much lime; border bar                                | Active period lime (one control), filters neutral with count badge `primary-subtle`; result text muted                               | `primary`, `primary-subtle`, `border-subtle`            | Medium | Buttons, dropdown             |
| Scanner command bar          | `.../traders/_components/scanner-command-bar.tsx`   | command/input row                                                         | Uses default input/button tokens                         | Inherit new input/button; no new colors                                                                                              | `surface`, `border-strong`                              | Low    | Inputs                        |
| Scanner bottom bar           | `.../traders/_components/scanner-bottom-bar.tsx`    | pagination bar                                                            | No unique colors                                         | Inherit pagination                                                                                                                   | `border`, `text-muted`                                  | Low    | Pagination                    |
| Filter chips                 | `.../traders/_components/filter-chips.tsx`          | `bg-muted/40` pills                                                       | Low contrast in light; borders compete                   | `surface-tertiary` + `border-subtle`; remove button `text-muted` → `text-primary` on hover                                           | `surface-tertiary`, `border-subtle`                     | Low    | Toolbar                       |
| Filters panel (docked/sheet) | `.../traders/_components/scanner-filters-panel.tsx` | form with fieldsets, presets lime, sheet overlay                          | Lime presets everywhere; sheet overlay `bg-black/10`     | Neutral segmented presets; active preset `primary-subtle` + `primary-text`; sheet overlay token                                      | `primary-*`, `surface-*`, `overlay`                     | High   | Sheet, inputs, saved searches |
| Legacy filter sheet          | `.../traders/_components/filter-sheet.tsx`          | older variant of filters                                                  | Duplicated implementation                                | Consolidate or keep parity during migration                                                                                          | same as above                                           | Medium | Scanner filters               |
| Trader table                 | `.../traders/trader-table.tsx`                      | sticky header/card cells; avatar gradient; PnL `text-primary`; status dot | Gradient/white hardcoded; PnL uses brand; short bar blue | Neutral avatar (`surface-tertiary` + `text-primary`); PnL `financial-positive/negative`; status dot semantic; sticky cells `surface` | `surface`, `financial-*`, `success/info/warning/danger` | High   | Table, long/short bar         |
| Long/short bar               | `.../traders/long-short-bar.tsx`                    | long `bg-primary`, short `bg-blue-500`                                    | Inconsistent short color; lime means long not brand      | Long `direction-long`, short `direction-short`; track `surface-tertiary`; add labels                                                 | `direction-long`, `direction-short`                     | Medium | Trader table, overview        |
| Copy address                 | `.../traders/copy-address.tsx`                      | muted text + copy icon                                                    | No hover/focus token                                     | `text-muted` → `text-primary` hover; focus ring                                                                                      | `text-muted`, `primary-text`, `focus-ring`              | Low    | Tables                        |
| Saved searches               | `.../traders/saved-searches.tsx`                    | list + apply buttons                                                      | Uses table/dropdown defaults                             | Use `surface-secondary` panel; primary-text apply                                                                                    | `surface-*`, `primary-text`                             | Low    | Filters panel                 |

---

## 4. Wallet detail

| Component/Page          | File                                                       | Current design                                                | Problem                                                           | Proposed change                                                                                           | Tokens involved                              | Risk   | Dependencies        |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------ | ------------------- |
| Client detail page      | `.../traders/[address]/_components/client-detail-page.tsx` | shell + tabs + panels                                         | Mixed card borders; no theme                                      | Page background; sections use surface/border-subtle                                                       | `background`, `surface`, `border-subtle`     | High   | All wallet sections |
| Wallet statement header | `.../wallet-statement-header.tsx`                          | large account value; PnL `text-primary`; margin bar amber >70 | PnL brand color; amber in light; 40px value                       | PnL `financial-*`; margin `primary` → `warning` at threshold; keep 40px hero                              | `financial-*`, `primary`, `warning`          | High   | Charts, summary     |
| Wallet tabs             | `.../wallet-tabs.tsx`                                      | tablist with aria; active lime pill                           | Lime pill on every tab; accessible but loud                       | Active `primary-subtle` + `primary-text` + underline; keep roles                                          | `primary-*`                                  | Medium | Tabs                |
| Positions section       | `.../positions-section.tsx`                                | table; PnL primary/destructive; sortable headers              | PnL brand; long/short badge primary/destructive                   | PnL `financial-*`; side badge `direction-long/short`; sort active `text-primary`                          | `financial-*`, `direction-*`, `primary-text` | Medium | Table               |
| Balances section        | `.../balances-section.tsx`                                 | tables/cards                                                  | Need light surface and borders                                    | `surface`, `border-subtle`; values tabular                                                                | `surface`, `border`                          | Medium | Table               |
| Orders section          | `.../orders-section.tsx`                                   | orders table + status chips                                   | Status chips use primary/destructive                              | `info/success/warning/danger` tokens; buy/sell direction tokens                                           | status tokens                                | Medium | Table               |
| Fills section           | `.../fills-section.tsx`                                    | fills table; pnl colors                                       | PnL brand/destructive                                             | `financial-*`; mono for tid/oid                                                                           | `financial-*`, `text-muted`                  | Medium | Table               |
| Trades section          | `.../trades-section.tsx`                                   | trades table; win/loss chips; PnL                             | Chips may use primary; dense                                      | `success-subtle` / `danger-subtle` chips; PnL `financial-*`                                               | `success-*`, `danger-*`, `financial-*`       | Medium | Table               |
| Transfers section       | `.../transfers-section.tsx`                                | transfers table                                               | Amount direction color unclear                                    | Deposit `financial-positive`; withdrawal `financial-negative` + labels                                    | `financial-*`                                | Low    | Table               |
| Performance section     | `.../performance-section.tsx`                              | wraps portfolio chart                                         | No own colors                                                     | Inherit chart tokens                                                                                      | chart tokens                                 | Low    | Portfolio chart     |
| Portfolio chart         | `.../portfolio-chart.tsx`                                  | SVG line/area; pnl primary/destructive; grid border           | PnL brand; no tooltip; grid low contrast                          | PnL `financial-positive/negative`; grid `chart-grid`; axis `chart-axis`; add tooltip/crosshair            | `financial-*`, `chart-*`                     | High   | Chart system        |
| Activity feed           | `.../activity-feed.tsx`                                    | card list; icons primary/destructive; LIVE badge primary      | Primary used for every activity tone; no info/warning distinction | `success` for fills/closed, `primary` only for live badge? Use `info` for live; direction tokens for side | `success`, `info`, `direction-*`, `surface`  | Medium | Status tokens       |
| Performance strip       | `.../wallet-performance-strip.tsx`                         | compact metrics                                               | Uses muted/secondary text                                         | `text-muted`; `financial-*` for PnL                                                                       | `text-muted`, `financial-*`                  | Low    | —                   |
| Placeholder tab         | `.../placeholder-tab.tsx`                                  | coming soon                                                   | Fine                                                              | `text-muted`; no lime                                                                                     | `text-muted`                                 | Low    | —                   |

---

## 5. Overview, buckets, market

| Component/Page         | File                                                         | Current design                                                    | Problem                                                                        | Proposed change                                                                            | Tokens involved                                        | Risk   | Dependencies      |
| ---------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------ | ----------------- |
| Overview page/tab      | `.../traders/overview/page.tsx`, `overview-tab.tsx`          | card grid                                                         | Mixed card borders/shadows                                                     | Surface + border-subtle; hover only on interactive cards                                   | `surface`, `border-subtle`                             | Medium | Overview card     |
| Overview card          | `.../overview/_components/overview-card.tsx`                 | sentiment emerald/rose; split bar emerald; icon primary           | Tailwind colors lack light variants; split bar only long                       | Sentiment `success/danger` subtle; split bar `direction-long/short`; icon `primary-text`   | `success-*`, `danger-*`, `direction-*`, `primary-text` | Medium | Long/short system |
| Sparkline              | `.../overview/_components/overview-sparkline.tsx`            | currentColor polyline                                             | Color depends on parent; can be lime everywhere                                | Accept `tone` prop → `financial-positive/negative/neutral`; keep currentColor fallback     | `financial-*`                                          | Low    | Overview card     |
| Bucket page/header     | `.../overview/[kind]/[bucket]/page.tsx`, `bucket-header.tsx` | sentiment badges emerald/rose                                     | Dark-only classes                                                              | Semantic success/danger subtle; heading hierarchy                                          | `success-*`, `danger-*`, `text-*`                      | Medium | Bucket components |
| Positioning chart      | `.../bucket-positioning-chart.tsx`                           | long/short emerald/rose; grid border/20; custom tooltip           | Colors hardcoded; tooltip uses `fill-background`; axis `fill-muted-foreground` | `direction-long/short`; `chart-grid`, `chart-axis`; tooltip `chart-tooltip-*`              | `direction-*`, `chart-*`                               | High   | Chart tokens      |
| Stat bars              | `.../bucket-stat-bars.tsx`                                   | profit/loss and long/short both emerald/rose                      | Profit and long share green; no label distinction                              | Profit/loss `financial-*`; long/short `direction-*`; add labels                            | `financial-*`, `direction-*`                           | Medium | Bucket detail     |
| Bucket tables          | `.../bucket-tables.tsx`                                      | PnL `emerald-600 dark:emerald-400` etc.; `text-[8px]` badges      | Light classes absent; tiny text                                                | `financial-*`; minimum 11px; badges `surface-tertiary`                                     | `financial-*`, `text-muted`                            | Medium | Tables            |
| Treemap                | `.../bucket-treemap.tsx`                                     | tile tone emerald/rose/neutral; `text-emerald-100`; 8–11px labels | Dark-only text colors; sub-10px data                                           | Tone classes from financial subtle; text `text-primary`/`text-inverse`; min 11px essential | `financial-*`, `text-*`                                | High   | Layout sizing     |
| Market page/header     | `.../markets/[market]/page.tsx`, `market-header.tsx`         | amber HL badge                                                    | Amber-600 on amber-500/15 light contrast                                       | `warning-subtle` + `warning`                                                               | `warning-*`                                            | Low    | —                 |
| Market snapshot ribbon | `.../market-snapshot-ribbon.tsx`                             | long/short emerald/rose; tooltip muted                            | Inconsistent direction colors                                                  | `direction-*`; tooltip tokens; labels                                                      | `direction-*`, `chart-*`                               | Medium | Tooltip           |
| Market wallet table    | `.../market-wallet-table.tsx`                                | wallet table                                                      | Inherit table colors                                                           | Table tokens; PnL financial                                                                | `financial-*`, `surface`                               | Medium | Table             |

---

## 6. Groups and settings

| Component/Page          | File                                                           | Current design                                              | Problem                                       | Proposed change                                                                      | Tokens involved                               | Risk   | Dependencies   |
| ----------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- | ------ | -------------- |
| Groups page             | `.../groups/page.tsx`                                          | stats + table + dialogs; amber error banner                 | Amber banner; table borders                   | Warning banner tokens; table + surface tokens                                        | `warning-*`, `surface`, `border`              | Medium | Groups table   |
| Groups table            | `.../groups/_components/groups-table.tsx`                      | favorite amber; PnL `text-emerald-400`                      | Light contrast; no row hover                  | Favorite `warning`; PnL `financial-*`; row hover `interactive-hover`                 | `warning`, `financial-*`, `interactive-hover` | Medium | Table          |
| Groups overview stats   | `.../groups/_components/groups-overview-stats.tsx`             | PnL primary/destructive                                     | PnL brand                                     | `financial-*`; labels `text-muted`                                                   | `financial-*`                                 | Low    | —              |
| Group form              | `.../groups/_components/group-form.tsx`                        | dialog inputs                                               | Dialog/input tokens                           | Inherit new dialog/input                                                             | `elevated`, `border-strong`                   | Low    | Dialog, input  |
| Delete group dialog     | `.../groups/_components/delete-group-dialog.tsx`               | destructive button                                          | Destructive uses subtle bg                    | `danger-subtle` + `danger`; confirm button `danger` fill? Keep outline + danger text | `danger-*`                                    | Low    | Dialog, button |
| Compare page            | `.../groups/compare/page.tsx`                                  | 10 hardcoded series colors; best emerald-400; amber warning | Series palette outside tokens; light contrast | `chart-1..8`; best `financial-positive`; warning tokens                              | `chart-*`, `financial-*`, `warning-*`         | High   | Chart system   |
| Group detail page       | `.../groups/[groupId]/page.tsx`                                | tabs as buttons (now roles); amber banners; positions table | Mixed table styles; amber                     | Tab component tokens; banner tokens; table tokens                                    | `primary-*`, `warning-*`, `surface`           | High   | Tabs, table    |
| Group activity timeline | `.../groups/[groupId]/_components/group-activity-timeline.tsx` | cards; event type chips muted                               | No status colors; partial uses muted          | Event chip neutral; partial `warning`; source line muted                             | `warning`, `surface-tertiary`                 | Low    | —              |
| Alerts panel            | `.../groups/[groupId]/_components/group-alerts-panel.tsx`      | table + history; no severity colors                         | Alert severity not visual                     | Severity badges `alert-*`; enabled toggle `success`/`muted`                          | `alert-*`, `success`                          | Medium | Alerts form    |
| Alert form dialog       | `.../groups/[groupId]/_components/group-alert-form-dialog.tsx` | form + selects                                              | Input/dialog tokens                           | Inherit new form system                                                              | `elevated`, `border-strong`                   | Low    | Dialog, input  |
| Group performance chart | `.../groups/[groupId]/_components/group-performance-chart.tsx` | SVG line `stroke-primary`; last `text-emerald-400`          | Brand line; no axes                           | `chart-1` line; last `financial-*`; grid/axis tokens                                 | `chart-*`, `financial-*`                      | Medium | Chart system   |
| Settings page           | `.../settings/page.tsx`                                        | bordered card; destructive disconnect                       | Plain card; dialog tokens                     | `surface` + `border-subtle`; danger tokens                                           | `surface`, `danger-*`                         | Low    | Dialog, button |

---

## 7. Marketing and public pages

| Component/Page    | File                                              | Current design                                      | Problem                                               | Proposed change                                                                  | Tokens involved                                    | Risk   | Dependencies   |
| ----------------- | ------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- | ------ | -------------- |
| Marketing layout  | `src/app/[locale]/(marketing)/layout.tsx`         | token header/footer; sticky blur                    | Uses app tokens but landing content uses local tokens | Keep structure; migrate to app tokens or scope brand-dark                        | `background`, `surface`, `border`                  | Medium | Landing tokens |
| Landing page view | `.../marketing/_components/landing-page-view.tsx` | hardcoded landing palette; ticker; demo table       | Separate dark-only system                             | Replace with app tokens; if brand-dark only, wrap in `data-surface="brand-dark"` | `surface`, `primary-text`, `financial-*`, `border` | High   | Landing tokens |
| Open Graph image  | `.../marketing/opengraph-image.tsx`               | static dark colors                                  | Cannot theme; brand image                             | Keep static but update hex to new brand; document as brand asset                 | —                                                  | Low    | Brand          |
| Funding page      | `.../public/funding-arbitrage/page.tsx`           | basic controls; select/button default               | No header hierarchy; input tokens                     | Toolbar per scanner; select `border-strong`                                      | `surface`, `border-strong`                         | Low    | Inputs         |
| Funding table     | `.../funding-arbitrage/funding-table.tsx`         | long/short emerald/rose; spread primary/destructive | Inconsistent direction colors; light fails            | `direction-*`; spread `financial-*`; mono only for IDs                           | `direction-*`, `financial-*`                       | Medium | Table          |
| Venue selector    | `.../funding-arbitrage/venue-selector.tsx`        | checkboxes/buttons                                  | Default tokens                                        | `primary-subtle` selected + `primary-text`                                       | `primary-*`                                        | Low    | Buttons        |
| Public layout     | `src/app/[locale]/(public)/layout.tsx`            | uses `AppLayout`                                    | Same as protected                                     | Inherit app shell                                                                | —                                                  | Low    | AppLayout      |

---

## 8. Test and documentation impact

| Asset                | File                                                                                                                                    | Impact                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Visual snapshots     | `tests/e2e/visual.spec.ts`, `tests/e2e/visual.spec.ts-snapshots/*.png`                                                                  | Dark baselines change; add light-mode baselines                    |
| Accessibility checks | `tests/e2e/accessibility.spec.ts`                                                                                                       | Run in both themes; add contrast regressions                       |
| Scanner unit tests   | `tests/unit/components/scanner-*.test.tsx`, `filter-sheet.test.tsx`                                                                     | Class/role assertions may change                                   |
| Table tests          | `tests/unit/components/trader-table.test.tsx`, `groups-table` tests                                                                     | Color class assertions, if any, need token updates                 |
| Chart tests          | `tests/unit/components/portfolio-chart.test.tsx`, `bucket-positioning-chart.test.tsx`, `long-short-bar.test.tsx`, `overview-*.test.tsx` | SVG class/color assertions likely                                  |
| Docs                 | `docs/test-cases.md`                                                                                                                    | Update behavior/test cases for theme switching and semantic colors |

---

## 9. Highest-risk files

1. `src/app/globals.css` — every token, both themes.
2. `src/app/layout.tsx` — theme class, FOUC script.
3. `src/components/ui/button.tsx` — used by every page.
4. `src/components/shared/traders/trader-table.tsx` — dense financial data, sticky cells.
5. `src/app/[locale]/(protected)/traders/[address]/_components/portfolio-chart.tsx` — PnL clipping and chart colors.
6. `src/app/[locale]/(protected)/groups/compare/page.tsx` — hardcoded 10-color series.
7. `src/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-treemap.tsx` — tone text on variable tile sizes.
8. `src/app/[locale]/(marketing)/_components/landing-page-view.tsx` — separate token family.

---

## 04 — Migration Plan

**Rules**

- No business logic, API behavior, contract, or data shape changes.
- No new dependencies. Use the existing Zustand persist, Tailwind v4, Base UI, and testing stack.
- One phase per PR; do not merge a later phase before its foundation is green.
- Keep the app usable at every phase. Temporary mixed surfaces are acceptable only inside a phase branch.
- Update `docs/test-cases.md` for behavior changes (theme switching, filter/table states).
- Never commit or push without explicit human approval.

---

## Phase 1 — Foundation

**Goal:** make both themes real and centralized before touching feature components.

**Scope**

- Theme store, theme script, light/dark token blocks, semantic/financial/chart tokens.
- Remove duplicated landing token family (or scope it to a brand-dark surface).
- Set `color-scheme` and tokenized scrollbars.

**Files likely to change**

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/lib/stores/theme.ts` (new)
- `src/components/shared/providers.tsx` (theme sync mount)
- `src/components/shared/theme/theme-script.tsx` (new, or inline in root layout)
- `src/components/shared/theme/theme-toggle.tsx` (new; can land at end of phase 2 if preferred)
- `src/messages/en.json`, `src/messages/vi.json` (theme labels)

**Dependencies:** none. Blocks all later phases.

**Implementation steps**

1. Add `mode: 'light' | 'dark' | 'system'` to a persisted Zustand store (`localStorage` key `hyperscan.theme`).
2. Add an inline head script that resolves `system` via `matchMedia` and sets `.dark` + `style.colorScheme` before paint. Add `suppressHydrationWarning` to `<html>`.
3. Convert `:root` to light tokens and add `.dark` tokens from `DESIGN-SYSTEM.md (section 02)`.
4. Keep shadcn aliases (`--background`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--sidebar-*`) mapped to the new tokens so existing utilities keep compiling.
5. Add `--text-*`, `--surface-*`, `--financial-*`, `--direction-*`, `--chart-*`, `--overlay`, `--focus-ring`, `--selection`, `--disabled-*` and bridge them in `@theme inline`.
6. Replace scrollbar rgba values with tokenized colors.
7. De-duplicate landing tokens: either map them to app tokens or wrap the landing page in `data-surface="brand-dark"` with local values.
8. Add theme toggle UI (sun/moon/monitor) in header; add i18n keys.

**Risks**

- Removing the hardcoded `dark` class exposes missing light styles in `button/input/dropdown/dialog/sheet`.
- SSR hydration mismatch if the script runs late.
- Existing uncommitted UI changes (17px base) may conflict.

**Acceptance criteria**

- App starts in dark by default, honors persisted choice, and follows system when `system`.
- No flash of wrong theme on reload (hard reload and client navigation).
- All existing pages render in both themes with no unstyled white/black flashes.
- `--chart-*` and financial tokens exist and are resolvable in DevTools.
- No hardcoded hex/rgba remains in `globals.css` except brand-document values and overlay alpha definitions.

**Tests**

- Unit: theme store (default, set, persist, system resolution; `matchMedia` mock).
- Unit: theme script/toggle render and `aria-pressed`/selected state.
- E2E: toggle light → reload → still light; toggle system with emulated color scheme → follows.
- E2E: axe on scanner + wallet detail in light and dark.
- Visual: dark snapshots will change; generate new baselines intentionally.

---

## Phase 2 — Shared components

**Goal:** every primitive uses semantic tokens and consistent states.

**Scope**

- Buttons, inputs, labels, tables, dialogs, sheets, dropdowns, popovers, tooltips, skeletons, badges, banners.
- Sidebar/header/navigation.
- Theme toggle placement.

**Files likely to change**

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/shared/layout/header/index.tsx`
- `src/components/shared/layout/sidebar/*`
- `src/components/shared/layout/app-layout.tsx`
- `src/components/shared/language-switcher.tsx`
- `src/components/shared/pagination.tsx`
- `src/components/shared/traders/long-short-bar.tsx`
- `src/components/shared/traders/copy-address.tsx`

**Dependencies:** Phase 1.

**Implementation steps**

1. Button: map variants to new tokens; primary uses lime + `primary-border` in light; remove `bg-primary/80` hover; focus ring 2px opaque; destructive uses `danger-subtle`.
2. Input/label: `surface` + `border-strong`; focus ring; disabled tokens; remove dark-only background rules.
3. Table: header `surface-secondary`; row hover `interactive-hover`; selected `primary-subtle`; `border-subtle` only.
4. Dialog/sheet: `overlay` token, `elevated`, `border`, overlay blur; destructive item tokens.
5. Dropdown/popover/tooltip: `elevated` + `interactive-hover`; no `accent` (green) as menu focus.
6. Sidebar/header: surface tokens; active nav `primary-subtle` + `primary-text` + left indicator; add ThemeToggle.
7. Create a shared `StatusBadge` and `Banner` component if duplication remains (five amber copies → one component).

**Risks**

- High blast radius: every page uses Button/Input/Table.
- Unit tests may assert old classes or roles.
- Focus rings and border changes can shift layout if not `outline`/inset.

**Acceptance criteria**

- All shared-state combinations defined: default/hover/active/focus/disabled/selected.
- No lime text on light backgrounds; no lime PnL.
- Input borders ≥3:1 vs adjacent background in both themes.
- One primary button per view; destructive actions use danger tokens.
- Amber banners replaced by warning tokens.

**Tests**

- Unit per primitive: variant class/token snapshot, disabled, focus.
- Unit: StatusBadge/Banner severity → token.
- E2E: keyboard tab through scanner, dialogs, dropdowns in both themes; axe passes.
- Visual: component gallery or existing pages in both themes.

---

## Phase 3 — Feature surfaces

**Goal:** migrate pages and feature components that do not own charts.

**Scope**

- Scanner, wallet detail sections, overview cards, group pages, settings, funding, auth, marketing.
- Tables and badges inside feature components.

**Files likely to change**

- `src/app/[locale]/(protected)/traders/page.tsx`
- `src/app/[locale]/(protected)/traders/_components/*`
- `src/app/[locale]/(protected)/traders/[address]/_components/*` (excluding chart files)
- `src/app/[locale]/(protected)/traders/overview/**/*.tsx` (excluding charts/treemap)
- `src/app/[locale]/(protected)/traders/markets/**/*.tsx`
- `src/app/[locale]/(protected)/groups/**/*.tsx`
- `src/app/[locale]/(protected)/settings/page.tsx`
- `src/app/[locale]/(public)/funding-arbitrage/*`
- `src/components/shared/auth/*`
- `src/app/[locale]/(marketing)/**/*.tsx` (landing migration)
- `src/components/shared/traders/trader-table.tsx`
- `src/components/shared/traders/add-to-trader-group-modal.tsx`

**Dependencies:** Phases 1–2.

**Implementation steps**

1. Replace `text-emerald-*`, `text-rose-*`, `text-amber-*`, `bg-*-500`, `from-indigo-*`, `to-purple-*` with semantic/financial/direction tokens.
2. Replace `text-primary` where it means PnL/status/positive with `financial-positive` or status tokens.
3. Normalize cards: `surface` + `border-subtle`, remove `shadow-sm` from static cards.
4. Normalize banners: warning/success/danger/info tokens + icon.
5. Normalize table cells: `tabular-nums`, right alignment, 44px rows, sticky identifier on `surface`.
6. Landing: migrate `--landing-*` to app tokens; if brand-dark, scope via `data-surface="brand-dark"`.
7. Replace avatar gradient with neutral surface + initials.
8. Replace `text-[8px]`–`text-[10px]` in essential data with 11px minimum.

**Risks**

- Wide diff across many pages; visual regressions.
- Financial semantics misapplied (profit vs long vs success).
- Landing visual identity dilution if token migration is too aggressive.

**Acceptance criteria**

- No raw emerald/rose/amber/indigo/purple/green classes in migrated files.
- Financial values use `financial-positive/negative` plus sign/label.
- Long/short uses `direction-long/short` everywhere.
- No amber banner remains.
- Both themes readable at desktop and mobile.

**Tests**

- Unit: updated component tests for tables, cards, banners, groups, funding.
- Integration: page-level tests with mocked API for scanner/wallet/groups.
- E2E: screenshot + axe for scanner, wallet detail, groups, funding, settings in both themes.
- Visual: regenerate dark baselines; add light baselines for key pages.

---

## Phase 4 — Charts and data visualization

**Goal:** one chart color system driven by tokens, readable in both themes.

**Scope**

- Portfolio chart, group performance chart, bucket positioning chart, bucket stat bars, overview sparkline, long/short bars, market snapshot ribbon, treemap, compare chart.

**Files likely to change**

- `src/app/[locale]/(protected)/traders/[address]/_components/portfolio-chart.tsx`
- `src/app/[locale]/(protected)/traders/[address]/_components/activity-feed.tsx` (bar/tone parts)
- `src/app/[locale]/(protected)/groups/[groupId]/_components/group-performance-chart.tsx`
- `src/app/[locale]/(protected)/groups/compare/page.tsx`
- `src/app/[locale]/(protected)/traders/overview/_components/overview-sparkline.tsx`
- `src/app/[locale]/(protected)/traders/overview/_components/overview-card.tsx`
- `src/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-positioning-chart.tsx`
- `src/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-stat-bars.tsx`
- `src/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-treemap.tsx`
- `src/app/[locale]/(protected)/traders/markets/[market]/_components/market-snapshot-ribbon.tsx`
- `src/components/shared/traders/long-short-bar.tsx`

**Dependencies:** Phases 1–3 (especially financial/direction tokens and shared components).

**Implementation steps**

1. Define chart tokens (`--chart-1..8`, grid/axis/tooltip/inactive/selected/volume).
2. PnL charts: positive vs negative region clipping uses `financial-positive/negative` and `chart-positive/negative-area`.
3. Multi-series: apply chart palette in order; add selected/inactive legend states; no duplicate hues.
4. Axes/grid: `chart-grid`, `chart-axis`, 11px labels; zero line dashed.
5. Tooltips: elevated surface + border + text tokens; show date, series values, and sign.
6. Bars: direction tokens for long/short, financial tokens for profit/loss.
7. Treemap: tone classes from financial subtle; text uses `text-primary`/`text-inverse`; ensure ≥11px essential labels.
8. Verify colorblind distinctness with a simulator.

**Risks**

- Chart color collisions; light-mode line visibility; tooltip contrast.
- Tests assert SVG classes/fills (`bucket-positioning-chart`, `long-short-bar`, `portfolio-chart`).
- Treemap text contrast varies with tile size/color.

**Acceptance criteria**

- All chart series use `--chart-*`; no hardcoded hex except the compare palette if explicitly approved.
- PnL never uses lime.
- Every series ≥3:1 vs its theme surface.
- Axis, grid, tooltip, inactive, selected, hover states defined in both themes.
- Color is never the only cue for direction/outcome.

**Tests**

- Unit: chart token mapping, series color assignment, sign formatting.
- Unit: long/short bar and stat bars use direction tokens.
- E2E: open performance, compare, bucket detail in both themes; screenshots.
- Visual: chart baselines dark + light; colorblind spot-check (manual or simulated).

---

## Phase 5 — Visual hierarchy refinement

**Goal:** improve scanning and hierarchy without changing behavior.

**Scope**

- Typography scale, row heights, card padding, border reduction, surface elevation, emphasis rules.
- Scanner toolbar, wallet statement header, tables, group overview, bucket detail.

**Files likely to change**

- `src/app/globals.css` (type/density tokens if needed)
- Shared table/card/badge components
- `scanner-page-header.tsx`, `scanner-toolbar.tsx`, `wallet-statement-header.tsx`, `groups-overview-stats.tsx`, `overview-card.tsx`, `bucket-header.tsx`
- Table components in wallet/groups/market pages

**Dependencies:** Phases 1–4.

**Implementation steps**

1. Define type roles: page title 24px/600, section 18px/600, card title 14px/600, body 14px, metadata 12px, table header 11px/500 uppercase.
2. Set table row heights 44px desktop / 48px touch; sticky header; sticky identifier column.
3. Reduce borders: use `border-subtle` for static separation; stronger borders only for inputs/interactive boundaries.
4. Apply two-tier financial emphasis (hero values 600, repeated cells 500/88%).
5. Normalize page rhythm and card padding; remove one-off `p-3`/`p-5` unless justified.
6. Review base font size decision (17px vs 16px) before finalizing density.

**Risks**

- Layout shifts in dense tables; overflow on mobile.
- Snapshot churn.

**Acceptance criteria**

- One clear hero metric per page.
- Consistent row height and alignment across tables.
- No static card uses both border and shadow for hierarchy.
- No essential text below 11px.
- Desktop and mobile layouts remain stable.

**Tests**

- Unit: class/token assertions for typography roles (if a role component is introduced).
- E2E: responsive screenshots at 1440, 1024, 640, 375 in both themes.
- Visual: updated baselines.

---

## Phase 6 — Visual QA and rollout

**Goal:** prove the system is complete and safe.

**Scope**

- Full app, both themes, responsive breakpoints, accessibility, visual regression, regression of business behavior.

**Dependencies:** Phases 1–5.

**Implementation steps**

1. Run `pnpm type-check`, `pnpm lint`, targeted `vitest`, full `pnpm test` per tier, targeted Playwright, full `pnpm test:e2e` when environment allows.
2. Run axe in both themes on scanner, wallet detail, groups, settings, funding, dialogs, filter panel.
3. Compare dark/light screenshots at 1440, 1024, 640, 375.
4. Verify no hardcoded legacy colors in migrated files (`rg` patterns in acceptance criteria).
5. Verify no API/business diffs (`git diff` review).
6. Update `docs/test-cases.md`; add a design-system QA checklist.
7. Human approval → commit/push per repo (workers never commit).

**Risks**

- Environment-dependent tests (BE `:8080`, FE `:3000`/`3001`, Postgres `:5433`).
- Snapshot noise from dev overlay; use the existing `settle`/`SHOT` helpers.

**Acceptance criteria**

- All criteria in `DESIGN-SYSTEM.md (section 05)` pass.
- No unresolved P0/P1 visual or accessibility issue.
- Rollback plan documented (revert phase commits; tokens are additive until Phase 5).

---

## Test matrix (summary)

| Layer               | Tooling                               | Required in phases |
| ------------------- | ------------------------------------- | ------------------ |
| Unit                | Vitest + Testing Library              | 1–5                |
| Integration (page)  | Vitest with mocked services           | 3–5                |
| E2E                 | Playwright (`tests/e2e`)              | 1–6                |
| Accessibility       | `@axe-core/playwright`                | 1–6                |
| Visual regression   | Playwright screenshots, dark + light  | 2–6                |
| Contrast audit      | WCAG formula + manual check           | 1, 4, 6            |
| Business regression | Existing BE/FE suites, no API changes | 6                  |

## Rollout strategy

1. Land Phase 1 behind the default theme = dark; no visual change for users until the toggle is enabled.
2. Land Phase 2 with dark using new tokens mapped to near-identical values; verify no regression.
3. Enable light toggle after Phases 2–3 pass axe.
4. Ship charts in Phase 4 only after light/dark chart baselines exist.
5. Keep a revert point per phase; do not rewrite history.

---

## 05 — Risk Assessment & Acceptance Criteria

## 1. Risk matrix

| #   | Risk                                                          | Likelihood | Impact | Mitigation                                                                                                                  |
| --- | ------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| R1  | Breaking theme switching or causing FOUC                      | Medium     | High   | Inline pre-paint script; persisted store + `matchMedia`; test hard reload and client navigation; `suppressHydrationWarning` |
| R2  | Components depend on hardcoded colors                         | High       | Medium | Inventory in `01` §3; migrate phase 3; add CI grep gate                                                                     |
| R3  | Third-party/base-ui theme limits                              | Medium     | Medium | Base UI/shadcn already token-driven; override only documented tokens; no dependency changes                                 |
| R4  | SVG icon visibility                                           | Medium     | Low    | Icons inherit `currentColor`; verify on both surfaces; no fixed white/black                                                 |
| R5  | Chart readability in light mode                               | High       | High   | Dedicated chart palette; test ≥3:1; no lime line on light; baselines both themes                                            |
| R6  | Financial color confusion (lime vs positive; long vs success) | High       | High   | Separate `primary` and `financial-*`; always add sign/label; audit `text-primary`                                           |
| R7  | Accessibility regressions                                     | Medium     | High   | Axe + computed contrast; min 4.5:1 text, 3:1 UI; focus ring 2px opaque                                                      |
| R8  | Inconsistent styles across pages                              | High       | Medium | Shared primitives first; one banner/badge component; phase gate per area                                                    |
| R9  | Responsive layout regressions                                 | Medium     | Medium | 1440/1024/640/375 screenshots; sticky columns; overflow tests                                                               |
| R10 | CSS specificity conflicts                                     | Low        | Medium | Keep tokens in `globals.css`; avoid `!important`; scope brand-dark landing                                                  |
| R11 | Tailwind dynamic class generation                             | Low        | Medium | Use static token classes; never construct class names dynamically; map variants explicitly                                  |
| R12 | Tests/snapshots fail noisily                                  | High       | Low    | Intentional baseline regeneration; existing `settle`/`SHOT` helpers; run targeted first                                     |
| R13 | Base font size decision (17px vs 16px)                        | Medium     | Medium | Decide before Phase 5; if changed, re-run all visual baselines                                                              |
| R14 | Landing identity dilution                                     | Medium     | Medium | Option A: brand-dark surface in both themes; Option B: full light migration; approve before Phase 3                         |
| R15 | Mixed surfaces during migration                               | High       | Low    | Phase per PR; keep app usable; no partial token removal                                                                     |
| R16 | Long-running branch conflicts with wallet-groups work         | Medium     | Medium | Start from current `dev`; rebase before each phase; do not touch unrelated business files                                   |
| R17 | Chart test assertions tied to classes                         | High       | Low    | Update tests with token behavior, not raw class names where possible                                                        |
| R18 | Overlay/focus contrast                                        | Medium     | Medium | Tokenized overlay; focus ring 2px `--focus-ring` with offset; test keyboard + axe                                           |

## 2. Rollback plan

- Every phase is a separate commit series; revert that phase without touching earlier tokens.
- Phase 1 is additive except for `globals.css` token replacement; keep a copy of the old token block in the PR description.
- Phase 2–3 class migrations are mechanical; revert the component files.
- Phase 4 chart changes are file-local; revert chart components.
- No database, API, or contract changes; no data migration.

## 3. Measurable acceptance criteria

### AC1 — Semantic tokens everywhere

- In migrated files, no raw palette classes remain:
  - `text|bg|border|fill|stroke-(emerald|rose|amber|blue|indigo|purple|green|red)-`
  - `text-white`, `text-black`, `bg-white`, `bg-black` (except overlays if tokenized)
- CI grep example:
  ```powershell
  Get-ChildItem src -Recurse -Include *.tsx,*.ts |
    Select-String -Pattern '(text|bg|border|fill|stroke)-(emerald|rose|amber|blue|indigo|purple|green|red)-[0-9]{2,3}'
  ```
  Expected: 0 matches in migrated scope.

### AC2 — Complete Dark and Light themes

- `:root` defines light; `.dark` defines dark.
- Every token in `02` exists in both blocks.
- `color-scheme` is set per theme.
- Toggling and reloading preserves the choice; `system` follows OS changes.
- No page has an unstyled white/black flash on hard reload.

### AC3 — No unintended legacy colors

- `#55d396`, `#169a50`, `#040605`, `#121714`, `#2a302d`, `#8a9b93`, `#e0a94a`, `#272c2a`, `#080b09` (and other old tokens) do not appear in `src/` except:
  - brand assets (`opengraph-image.tsx`, if approved as static brand)
  - documented fallbacks
  - migration notes.
- `bg-black/10` overlays replaced by `--overlay`.

### AC4 — Financial semantics consistent

- Positive PnL: `financial-positive`; negative: `financial-negative`; neutral: `financial-neutral`.
- Long/short: `direction-long`/`direction-short` in every bar/table/chart.
- Buy/sell: `trade-buy`/`trade-sell`.
- Funding: `funding-positive`/`funding-negative`.
- Every financial value includes `+`/`−` where signed; long/short and status include text labels.
- `text-primary` is not used for PnL or status.

### AC5 — Charts readable in both themes

- Every series ≥3:1 against its surface.
- Grid/axis/tooltip/crosshair tokens defined in both themes.
- Inactive/selected series visually distinct.
- PnL charts use financial colors, not lime.
- Multi-series compare chart has no duplicate hues and a legend with active/inactive state.
- Manual check with deuteranopia/protanopia simulation passes (series still distinguishable by hue/position/labels).

### AC6 — Interactive states defined consistently

- Button: default/hover/active/focus/disabled.
- Input: default/hover/focus/invalid/disabled.
- Table row: default/hover/selected/focus.
- Tabs/segments: default/hover/active/focus.
- Dialog/dropdown: open/closed/focus/destructive.
- Focus ring: ≥3:1, 2px, offset.

### AC7 — No business or API changes

- `git diff` contains no changes under:
  - `src/services/**`
  - `src/hooks/**` (except purely visual hooks if approved)
  - `src/lib/api-client*`, `src/lib/token*`, `src/types/**`
  - BE repo.
- Network calls, request/response shapes, and test IDs used by behavior remain unchanged.

### AC8 — No major visual regressions

- Desktop 1440, laptop 1024, tablet 640, mobile 375 in both themes.
- No horizontal overflow beyond intended table scrollers.
- Sticky headers/columns work; dialogs/sheets fit.
- Visual snapshots: only intentional diffs; no unexplained >2% pixel changes.

### AC9 — Accessibility

- Axe (`wcag2a`, `wcag2aa`) passes on:
  - scanner default/results/error
  - wallet detail
  - groups list + create dialog
  - add-to-group modal
  - filter sheet (mobile, en/vi)
  - settings
  - funding
  - compare page
  - bucket detail
- Text: normal 4.5:1, large 3:1; UI boundaries 3:1.
- Keyboard: theme toggle, tabs, dialogs, dropdowns, tables, filter panel.
- No color-only meaning for PnL, direction, status, or alerts.

### AC10 — Functionality intact

- Existing unit suites pass per tier.
- Targeted integration/e2e pass (scanner, wallet tabs, groups, funding, settings, theme).
- No change to auth, wallet connect, WebSocket, polling, pagination, filters, sorting, or API contracts.
- No new dependencies in `package.json`.

## 4. Evidence to collect before approval

| Evidence          | Command / artifact                                                                |
| ----------------- | --------------------------------------------------------------------------------- |
| Token files       | `src/app/globals.css` diff with both theme blocks                                 |
| Theme behavior    | Video or Playwright trace: toggle → reload → persist → system                     |
| Contrast report   | Table in `02` §6 replicated for final hexes                                       |
| Axe results       | Playwright accessibility report, dark + light                                     |
| Visual diffs      | `playwright-report` for both themes at 4 widths                                   |
| Legacy color grep | 0 matches in migrated scope                                                       |
| Financial audit   | Search `text-primary` in financial files; expect 0 PnL/status uses                |
| Chart audit       | Search `emerald                                                                   | rose | indigo | purple | blue` in chart files; expect 0 |
| Business diff     | `git status`/`git diff` review: no services/types/auth changes                    |
| Tests             | `pnpm type-check`, `pnpm lint`, `pnpm vitest run`, targeted `npx playwright test` |

## 5. Open decisions (require human approval)

1. **Light primary:** lime fill + dark ink + `#5F7D18` border (recommended) vs dark olive fill + white ink.
2. **Base size:** keep `html { font-size: 17px }` or return to 16px before Phase 5.
3. **Long/short:** green/red (industry standard; recommended) vs teal/coral to avoid PnL collision.
4. **Landing:** dark brand surface in both themes vs true light theme.
5. **Compare chart:** approve `--chart-1..8` palette and series order.
6. **Scope:** full app in one release vs phase-by-phase releases.
7. **Avatar:** neutral initials vs keeping a gradient; if gradient, tokenize it.
8. **Chart tooltips:** add crosshair/tooltip to portfolio and group charts (recommended) or keep static charts.

---
