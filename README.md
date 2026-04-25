# fx-weather

[![License](https://img.shields.io/badge/license-undeclared-lightgrey.svg)](#license)
[![Type](https://img.shields.io/badge/PWA-single--file-blue.svg)](#tech-stack)
[![Backend](https://img.shields.io/badge/Vercel-Serverless-black.svg)](#environment-variables)
[![Build](https://img.shields.io/badge/build-none-green.svg)](#quick-start)

A single-file PWA that **turns FX rates into a pay-abroad playbook** — when to swap, which card hides the smallest fee, and what the local price actually feels like, all from one screen.

---

## How It Works

```
┌──────────────────┐
│  amount + base/  │
│  target currency │
└────────┬─────────┘
         │
   ┌─────┴────────────────────────┬─────────────────────┐
   │                              │                     │
   ▼                              ▼                     ▼
┌───────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ exchangerate-api.com  │  │ /api/geo         │  │ /api/search      │
│ frankfurter.dev (30d) │  │ x-vercel-ip-*    │  │ Mistral LLM      │
└──────────┬────────────┘  └────────┬─────────┘  └─────────┬────────┘
           │ rate + history          │ country + city       │ 3 anchors
           └──────────────┬──────────┴─────────────┬────────┘
                          ▼                        ▼
            ┌──────────────────────────────────────────────┐
            │  RPN calculator + cost router + VAT engine   │
            │  S.amount × S.cr × (1 + walletRate)          │
            │  → routes sorted, anchors keyed, radar lit   │
            └──────────────────┬───────────────────────────┘
                               │
   ┌────────────┬──────────────┼──────────────┬───────────────┐
   ▼            ▼              ▼              ▼               ▼
┌──────────┐┌────────────┐┌──────────────┐┌──────────────┐┌──────────┐
│  hero    ││  payment   ││  Tax-Free    ││  price       ││   Zen    │
│  amount  ││  routes    ││  Radar       ││  anchors     ││  mode    │
│  + tip   ││  + DCC     ││  (gap/flip/  ││  (≈ 32× Big  ││  pitch   │
│  strip   ││  shield    ││  UK)         ││  Mac)        ││  black   │
└──────────┘└────────────┘└──────────────┘└──────────────┘└──────────┘
```

---

## Feature Overview

| Feature | What it does | Lives in |
|---------|--------------|----------|
| **Hero amount** | Custom RPN calculator with 4-op support, ghost numpad, blinking cursor | `weather.html` `vWeather()` |
| **Payment routing** | Compares Zero-FX / card / ATM costs, highlights cheapest, live tickers | `calcRouting()` / `renderRoutes()` |
| **Weather indicator** | 7-day MA bands → tab gradient + label (great / good / stable / poor / storm) | `calcWeatherBand()` / `applyTabGradient()` |
| **Tax-Free Radar** | Live gap progress · Lumina Flip toggle · UK exception · DCC closure loop | `renderVatRadar()` / `toggleVatRefund()` |
| **Price anchors** | Currency-aware "≈ 32× Big Mac" reality check, top-2 visceral progress | `calcAnchors()` / `renderPPPProgressBar()` |
| **Zero-click PPP** | Vercel edge-IP geo seeds 3 default anchors from `GLOBAL_PPP_DB` | `/api/geo` + `autoDetectGeoPPP()` |
| **Smart Discovery** | Mistral 3-item compound search, user picks which anchor to keep | `/api/search` + `searchAnchor()` |
| **Pocket Guide** | 8 hardcore tips, trilingual EN/ZH/FR, dynamic-sorted by target currency | `vGuide()` + `GUIDE_TAGS` |
| **Zen Checkout** | Pitch-black single-screen for the cashier, tap-to-revert | `enterZen()` / `renderZenOverlay()` |
| **AA Splitter** | Bill-split with payer-method-aware actual cost | `calcSplit()` |
| **Rate tooltips** | ⓘ popovers on every wallet-rate row explaining 0.35% / 1.5% / ATM fee origins | `showRateInfo()` |
| **i18n engine** | EN / ZH / FR, switchable inline; numbers + currency code remain locale-aware | `I18N` dict |

## Quick Start

**Option 1 — Self-host on Vercel (recommended)**

```bash
git clone https://github.com/catinblue/taux-de-change.git
cd taux-de-change
npm install -g vercel
vercel login
vercel link
vercel env add MISTRAL_API_KEY    # paste your Mistral key when prompted
vercel deploy --prod
```

**Option 2 — Local frontend only (no `/api/*`)**

```bash
git clone https://github.com/catinblue/taux-de-change.git
cd taux-de-change
python -m http.server 8765
# open http://localhost:8765/weather.html
# /api/geo and /api/search will 404, banner stays hidden, rest works
```

**Option 3 — Local dev with serverless emulation**

```bash
cd taux-de-change
vercel dev
# serves the static PWA AND the api/* functions on http://localhost:3000
```

---

## RPN Calculator

A custom shunting-yard tokeniser plus an RPN evaluator parses expressions like `15+4.5*2` directly in the keypad. No `eval()`, no `Function()`, no library — every char is gated by `^[\d+\-*/.\s]*$` before parsing.

| Capability | Notes |
|------------|-------|
| Operator precedence | BODMAS — `15 + 4.5 × 2 = 24`, not 39 |
| Unary minus / plus | `-5+10 = 5` and `5*-3 = -15` both parse correctly |
| Live preview | Trailing operator stripped before each eval, so `15+` shows `15` while typing |
| Division by zero | Returns `NaN` — UI reverts to the last valid amount |
| Operator replacement | Tapping a second op in a row replaces the trailing one (no `++` junk) |
| Display formatting | ASCII `*` `/` `-` rendered as math glyphs (`× ÷ −`) on the keypad tape |

### Keypad layout

```
   1   2   3
   4   5   6
   7   8   9
   .   0   ⌫
[ + ] [ − ] [ × ] [ ÷ ]
[  C  ]  [   Done   ]
```

3×4 ghost grid for digits, separate accent-green ops row, two-button utility row at the bottom.

## Tax-Free Radar

A three-state micro-interaction sitting under the target hero amount. Uses a hardcoded `VAT_RULES` table — country-keyed where geo resolves, currency-keyed otherwise — and the global flag `S.vatRefundOn`.

| Spend vs. threshold | Visual state | User action |
|---------------------|--------------|-------------|
| Below threshold | Faint gray gap line: `Tax-free threshold — add 500 JPY more to qualify` | Counts down live as user types |
| At or above threshold, toggle off | Pulsing accent-green pill: `🏷️ TAX-FREE UNLOCKED · REFUND ~10%` | Tap to apply |
| At or above threshold, toggle on | Saturated green pill: `✓ REFUND APPLIED · 10% OFF · TAP TO REVERT` plus DCC reminder strip | Tap again to revert |
| Target = GBP, any spend | Red info box: `🛑 The UK abolished tourist VAT refunds in 2020 — what you see is the final price.` | Informational, no toggle |

### Lumina Flip

Toggling the active state runs `@keyframes luminaFlip 0.55s` on both `#hero-amount-text` and `#hero-target-amount`:

```
   0%    35%        41%             65%        100%
   │     │          │                │          │
   ▼     ▼          ▼                ▼          ▼
 ┌────┐ ╱─────╲   (text swap     ╱─────╲     ┌────┐
 │ 30 │ │fade │   mid-flight)    │  27 │     │ 27 │
 │EUR │ │down │                  │EUR  │     │EUR │
 └────┘ ╲─────╱                  ╲─────╱     └────┘
   raw  fade-out  text-swap +    fade-in     settled
        + slide   slide-up       + green     + green
        down     -14px            tint       tint
```

The text content is mutated at the 220 ms mark via `applyHeroAmountValues()`. Same span, single keyframe, mid-animation content swap.

### Country sub-rules

| Target | Threshold | Refund | Source |
|--------|-----------|--------|--------|
| `JPY` | 5 000 | 10% | Japan Tax-Free |
| `AUD` | 300 | 10% | TRS Refund |
| `SGD` | 100 | 9% | SG Tourist Refund |
| `KRW` | 30 000 | 10% | Korea Tax-Free |
| `CHF` | 300 | 7.7% | Swiss MWST |
| `EUR_FR` (geo = FR) | 100 | 12% | France Détaxe |
| `EUR_DE` (geo = DE) | 50 | 11% | Germany VAT |
| `EUR` (any other) | 100 | 11% | Generic Eurozone fallback |
| `GBP` | — | — | UK exception path |
| `USD`, `CNY`, `HKD`, `CAD` | — | — | No general tourist VAT |

All rates tagged `[推论 · v7.2 PM-curated 2026 baseline]` in source.

## Payment Routing

Three card-vs-cash methods are computed every keystroke and re-sorted by total cost. The cheapest gets the `OPTIMAL` badge and bold accent-green styling.

| Method | Math | Typical winner when... |
|--------|------|------------------------|
| `zero` | `amount × cr × (1 + 0.35%)` | Always for card-borne spend, unless ATM beats it on round trips |
| `card` | `amount × cr × (1 + 1.5%)` | Rarely — kept as a baseline so the user sees the gap |
| `atm` | `amount × cr × (1 + 1.5%) + flatFee × cr` | Only on big single withdrawals where the flat fee amortises |

A delta line under each non-best route shows `+ 9.21 CNY vs best` so the user instantly sees how much each suboptimal route costs.

## Smart Discovery (Mistral)

`POST /api/search` proxies a structured Mistral call. The system prompt forces a `{ items: [3] }` shape spanning a realistic budget / mid / premium spectrum.

```text
Request:  POST /api/search
          { "query": "Coffee in Paris", "currency": "EUR" }

Response: { "items": [
            { "emoji": "☕", "label": "Local cafe espresso (Paris)", "price": 2.50, "currency": "EUR" },
            { "emoji": "☕", "label": "Starbucks latte tall (Paris)", "price": 5.20, "currency": "EUR" },
            { "emoji": "🥤", "label": "Supermarket bottled coffee", "price": 1.80, "currency": "EUR" }
          ] }
```

Server-side `coerceItem()` validates each: emoji ≤ 4 chars or `🏷️` fallback, label sliced to 64, price coerced to finite ≥ 0, currency `^[A-Z]{3}$` or falls back to request currency. The frontend renders the three items as result cards under the search bar; the user taps `＋` on whichever they want to keep — never auto-shovelled into anchors.

## The Travel Cycle

```
       ┌──────────────────────────────────┐
       │  1. land in foreign country      │
       │     (open the PWA)               │
       └──────────────────┬───────────────┘
                          │  /api/geo resolves city
                          │  → seed up to 3 anchors
                          ▼
       ┌──────────────────────────────────┐
       │  2. set base + target currency   │
       │     (or accept the geo banner)   │
       └──────────────────┬───────────────┘
                          │
                          ▼
       ┌──────────────────────────────────┐
       │  3. type the bill amount         │
       │     RPN, routes, anchors, radar  │
       │     all update on each keystroke │
       └──────────────────┬───────────────┘
                          │
                          ▼
       ┌──────────────────────────────────┐
       │  4. enter Zen at the cashier     │
       │     pitch black, two numbers     │
       │     no distractions              │
       └──────────────────┬───────────────┘
                          │
                          ▼
       ┌──────────────────────────────────┐
       │  5. claim VAT refund at airport  │
       │     in TARGET (DCC reminder)     │
       └──────────────────┬───────────────┘
                          │
                          └────── feedback ──────▶ 1.
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MISTRAL_API_KEY` | yes (for `/api/search`) | — | Mistral API key. Set via `vercel env add MISTRAL_API_KEY` and select Production + Preview + Development scopes. Never commit. |

`/api/geo` reads Vercel edge headers (`x-vercel-ip-country`, `x-vercel-ip-city`) — no env var.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Single `weather.html` (~3600 lines), vanilla JS, Outfit (Google Fonts) |
| Service worker | Cache-first for app shell, network-first for `api.exchangerate-api.com`, passthrough for `/api/*` |
| Serverless | Vercel Functions, Node 20+, CommonJS |
| LLM | Mistral `mistral-small-latest` via `/api/search` |
| Geo | Vercel Edge Network IP headers via `/api/geo` |
| FX rates | `api.exchangerate-api.com/v4/latest` (current) + `api.frankfurter.dev/v1` (30d history) |
| State | `localStorage` only — no backend DB, no cookies |
| Hosting | Vercel |
| Build | None — no bundler, no transpiler, no framework |

## Requirements

- A modern browser supporting `100dvh`, CSS custom properties, and `backdrop-filter`
- Node 18+ (for the Vercel CLI; functions run on Vercel's Node 20 runtime)
- A Vercel account on the free Hobby tier (sufficient for personal use)
- A Mistral API account with at least one active key

## Repository Structure

```
taux-de-change/
├── weather.html          # The entire PWA (~3600 lines, CSS + HTML + JS + i18n)
├── index.html            # 14-line redirect to weather.html
├── service-worker.js     # cache strategy: app shell + FX API
├── manifest.json         # PWA manifest
├── icon.svg              # app icon (used in install + theme-color)
├── api/
│   ├── geo.js            # GET /api/geo  → { country, city } from edge headers
│   └── search.js         # POST /api/search → Mistral compound 3-item array
├── PRD.md                # version-by-version product spec and design log
├── docs/                 # gitignored — local audit logs and notes
└── README.md             # this file
```

## Uninstall / Teardown

```bash
# 1. Remove the Vercel deployment + project
vercel rm <your-project-name> --yes

# 2. If you bound a custom domain
vercel domains rm <your-domain> --yes

# 3. Revoke the Mistral API key
# Visit console.mistral.ai → API Keys → delete the one used here

# 4. Clear the local PWA install + state
# Browser settings → Site data for the deployed URL → Clear all

# 5. Remove the local clone
cd ..
rm -rf taux-de-change
```

## License

Not yet declared. Treat the contents of this repository as `All rights reserved` until a `LICENSE` file is added. Open an issue if you want to use, fork, or adapt the project.
