# fx-weather

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-single--file-blue)](weather.html)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-black)](https://vercel.com)
[![Mistral](https://img.shields.io/badge/LLM-Mistral-orange)](https://mistral.ai)

A single-file PWA that turns FX rates into a **pay-abroad playbook** — when to swap, which card hides the smallest fee, and what the local price actually feels like.

## How It Works

```
  Inputs                          Resolvers                      Output Surface
 ┌──────────────┐         ┌──────────────────────┐         ┌──────────────────┐
 │ amount + ccy │  user   │  exchangerate-api    │  cost   │  hero amount     │
 │ pair (RPN    │────────▶│  frankfurter (30d)   │────────▶│  payment routes  │
 │ keypad)      │         │  /api/geo  (city)    │         │  Tax-Free Radar  │
 │              │         │  /api/search (3 px)  │         │  visceral PPP    │
 │              │         │  /api/intel  (5 tips)│         │  Live Intel      │
 └──────────────┘         └──────────┬───────────┘         └────────┬─────────┘
                                     │                              │
                                     └──────── live recompute ──────┘
```

## Surface Overview

| Surface | Trigger | Purpose |
|---------|---------|---------|
| Hero amount | tap → ghost numpad | RPN expression entry, 4-op, live preview |
| Payment routes | always rendered | compare Zero-FX / card / ATM, mark cheapest |
| Tax-Free Radar | spend ≥ threshold | gap progress · Lumina Flip · UK exception |
| Price anchors | local seed + Mistral search | reality-check large amounts |
| Geo banner | Vercel edge IP | auto-seed local anchors on landing |
| Live Intel | Guide tab visit | 5 country-specific tips, 24h cached |
| Zen Checkout | tap zen icon · swipe right | pitch-black two-number screen |

## Quick Start

```bash
# Self-host on Vercel (recommended)
git clone https://github.com/catinblue/taux-de-change.git
cd taux-de-change
vercel link
vercel env add MISTRAL_API_KEY    # paste key when prompted
vercel deploy --prod
```

Local frontend-only (no `/api/*`):
```bash
python -m http.server 8765
# open http://localhost:8765/weather.html
```

Local dev with serverless emulation:
```bash
vercel dev   # serves static + api/* on localhost:3000
```

---

## RPN Calculator

Custom shunting-yard tokeniser plus an RPN evaluator parses BODMAS expressions in the keypad without `eval()` or `Function()`. Tokens are regex-gated by `^[\d+\-*/.\s]*$` before parsing; trailing operators are stripped so partial input previews a running total.

| Expression | Result | Note |
|------------|--------|------|
| `15+4.5*2` | `24` | precedence |
| `-5+10` | `5` | leading unary minus |
| `5*-3` | `-15` | unary after binary op |
| `100/0` | `NaN` | UI reverts to last valid amount |

Keypad layout:
```
   1   2   3
   4   5   6
   7   8   9
   .   0   ⌫
[ + ] [ − ] [ × ] [ ÷ ]
[  C  ]  [   Done   ]
```

## Tax-Free Radar

Three-state micro-interaction below the target amount, driven by a hardcoded `VAT_RULES` table keyed by country (geo-resolved) or currency.

| Spend vs threshold | State | Action |
|--------------------|-------|--------|
| Below | gap line: `add 500 JPY more to qualify` | counts down live |
| At/above, off | green pill: `🏷️ TAX-FREE UNLOCKED · REFUND ~10%` | tap to apply |
| At/above, on | active pill + DCC reminder strip | tap to revert |
| Target = GBP | red box: `🛑 UK abolished tourist refunds in 2020` | informational |

Country rules:

| Target | Threshold | Refund |
|--------|-----------|--------|
| `JPY` | 5 000 | 10 % |
| `AUD` | 300 | 10 % |
| `SGD` | 100 | 9 % |
| `KRW` | 30 000 | 10 % |
| `CHF` | 300 | 7.7 % |
| `EUR` (geo `FR`) | 100 | 12 % |
| `EUR` (geo `DE`) | 50 | 11 % |
| `EUR` (other) | 100 | 11 % |
| `GBP` | — | UK exception |
| `USD` `CNY` `HKD` `CAD` | — | not applicable |

## Smart Discovery (Mistral)

`POST /api/search` proxies a structured Mistral call. The system prompt forces a `{ items: [3] }` shape spanning budget / mid / premium. Each returned item is server-validated before the response leaves the function.

| Item field | Validation | Fallback |
|------------|------------|----------|
| `emoji` | ≤ 4 chars | `🏷️` |
| `label` | sliced to 64 chars | `Unknown` |
| `price` | finite ≥ 0 | item dropped |
| `currency` | `^[A-Z]{3}$` | request currency |

```
Request:  POST /api/search
          { "query": "Coffee in Paris", "currency": "EUR" }

Response: { "items": [
            { "emoji": "☕", "label": "Local cafe espresso (Paris)", "price": 2.50, "currency": "EUR" },
            { "emoji": "☕", "label": "Starbucks latte tall (Paris)",  "price": 5.20, "currency": "EUR" },
            { "emoji": "🥤", "label": "Supermarket bottled coffee",    "price": 1.80, "currency": "EUR" }
          ] }
```

## Live Intel (Mistral)

`POST /api/intel` generates 5 country-specific tips on demand, scoped to `(country, currency, lang)`. The system prompt explicitly excludes the 3 universal iron rules (DCC · ATM · weekend markup) so live tips never duplicate them. Frontend caches per `(country, lang)` for 24 h.

| Tier | Source | Content |
|------|--------|---------|
| Iron rules | hardcoded i18n | DCC vampire · ATM monster · weekend markup |
| Live intel | Mistral `mistral-small-latest` | local payment rails · regulatory quirks · brand arbitrage · timing traps |

```
Request:  POST /api/intel
          { "country": "JP", "currency": "JPY", "lang": "en" }

Response: { "items": [
            { "emoji": "🍣", "title": "...", "body": "..." },
            ... × 5
          ] }
```

Each card carries an inline `AI` badge and a footer disclaimer.

## The Travel Cycle

```
       ┌──────────────────────────────────┐
       │   1. Land in foreign country     │
       │      (open the PWA)              │
       └──────────────┬───────────────────┘
                      │  /api/geo → seed anchors
                      ▼
       ┌──────────────────────────────────┐
       │   2. Set base + target ccy       │◀──────────┐
       └──────────────┬───────────────────┘           │
                      │                               │
                      ▼                               │
       ┌──────────────────────────────────┐           │
       │   3. Type bill → live RPN        │           │
       │      Routes / radar / anchors    │           │
       │      / Live Intel update         │           │
       └──────────────┬───────────────────┘           │
                      │                               │
                      ▼                               │
       ┌──────────────────────────────────┐           │
       │   4. Zen at the cashier          │           │
       └──────────────┬───────────────────┘           │
                      │                               │
                      ▼                               │
       ┌──────────────────────────────────┐           │
       │   5. Claim VAT in TARGET ccy     │───────────┘
       │      (DCC reminder fires)        │
       └──────────────────────────────────┘
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MISTRAL_API_KEY` | yes | — | Powers `/api/search` and `/api/intel`. |

`/api/geo` reads Vercel edge headers; no env var.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | `weather.html` single file, vanilla JS, Outfit font |
| Service Worker | cache-first shell · network-first FX rates · passthrough `/api/*` |
| Serverless | Vercel Functions, Node 20+, CommonJS |
| LLM | Mistral `mistral-small-latest` |
| Geo | Vercel edge `x-vercel-ip-*` headers |
| FX rates | exchangerate-api (current) + frankfurter.dev (30-day) |
| State | `localStorage` only |

## Requirements

- A modern browser (`100dvh` · `backdrop-filter`)
- A Vercel account
- A Mistral API key

## Repository Structure

```
taux-de-change/
├── weather.html          # the entire PWA
├── index.html            # redirect to weather.html
├── service-worker.js     # cache strategy
├── manifest.json         # PWA manifest
├── icon.svg              # app icon
├── api/
│   ├── geo.js            # GET  /api/geo    → { country, city }
│   ├── search.js         # POST /api/search → { items: [3 prices] }
│   └── intel.js          # POST /api/intel  → { items: [5 tips] }
├── PRD.md                # versioned design log
├── README.md
└── LICENSE
```

## Uninstall

```bash
vercel rm <project-name> --yes
# revoke the Mistral key at console.mistral.ai
rm -rf taux-de-change
```

## License

[MIT](LICENSE)
