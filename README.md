# fx-weather

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-single--file-blue)](weather.html)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-black)](https://vercel.com)

A single-file PWA that turns FX rates into a **pay-abroad playbook** — when to swap, which card hides the smallest fee, and what the local price actually feels like.

## How It Works

```
  Inputs                          Resolvers                       Output Surface
 ┌──────────────┐         ┌───────────────────────┐         ┌──────────────────┐
 │ amount + ccy │  user   │  exchangerate-api     │  cost   │  hero amount +   │
 │ pair (RPN    │────────▶│  frankfurter (30d)    │────────▶│  payment routes  │
 │ keypad)      │         │  /api/geo  (city)     │         │  + Tax-Free      │
 │              │         │  /api/search (3 px)   │         │    Radar +       │
 │              │         │  /api/intel  (5 tips) │         │  visceral PPP    │
 └──────────────┘         └───────────┬───────────┘         └────────┬─────────┘
                                      │                              │
                                      └─────── live recompute ───────┘
```

## Surface Overview

| Surface | Trigger | Purpose | Output |
|---------|---------|---------|--------|
| **Hero amount** | tap → ghost numpad | RPN expression entry, 4-op | base + target amount, live |
| **Routes** | always rendered | Compare Zero-FX / card / ATM | cheapest highlighted, delta vs best |
| **Tax-Free Radar** | spend ≥ threshold | Refund eligibility + Lumina Flip | post-refund hero (-N% off) |
| **Anchors** | local + Mistral search | Reality-check large amounts | `≈ 32× Big Mac (Shanghai)` |
| **Geo banner** | Vercel edge IP | Auto-seed local anchors | `📍 Detected Osaka — anchors ready` |
| **Live Intel** | Guide tab visit | 5 country-specific tips per (country, lang) | AI-tagged cards, 24h cached |
| **Zen Checkout** | tap zen icon / swipe right | Strip everything for the cashier | pitch-black two-number screen |

## Quick Start

### One-click deploy (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcatinblue%2Ftaux-de-change&env=MISTRAL_API_KEY)

The Vercel flow asks for `MISTRAL_API_KEY` before the first build.

### Manual deploy

```bash
git clone https://github.com/catinblue/taux-de-change.git
cd taux-de-change
vercel link
vercel env add MISTRAL_API_KEY
vercel deploy --prod
```

### Local frontend only

```bash
python -m http.server 8765
# open http://localhost:8765/weather.html
# /api/* will 404 — geo banner and Mistral search stay disabled
```

---

## Hero Calculator

Custom RPN evaluator parses BODMAS expressions in the keypad without `eval()` or `Function()`. Tokenizer regex-gates input, shunting-yard handles precedence, unary minus is glued to the next number.

| Expression | Result | Note |
|------------|--------|------|
| `15+4.5*2` | `24` | precedence |
| `-5+10` | `5` | leading unary |
| `5*-3` | `-15` | post-op unary |
| `100/0` | `NaN` | UI reverts |

### Layout

```
   1   2   3
   4   5   6
   7   8   9
   .   0   ⌫
[ + ] [ − ] [ × ] [ ÷ ]
[  C  ]  [   Done   ]
```

3×4 ghost grid plus accent-green op row plus utility row.

## Tax-Free Radar

Three-state micro-interaction below the target amount, driven by a hardcoded `VAT_RULES` table.

| Spend vs threshold | State | Action |
|--------------------|-------|--------|
| Below | gap line: `add 500 JPY more to qualify` | counts down live |
| At/above, off | green pill: `🏷️ TAX-FREE UNLOCKED · REFUND ~10%` | tap to apply |
| At/above, on | active pill + DCC reminder strip | tap to revert |
| Target = GBP | red box: `🛑 UK abolished tourist refunds in 2020` | informational |

### Country rules

| Target | Threshold | Refund |
|--------|-----------|--------|
| `JPY` | 5 000 | 10% |
| `AUD` | 300 | 10% |
| `SGD` | 100 | 9% |
| `KRW` | 30 000 | 10% |
| `CHF` | 300 | 7.7% |
| `EUR` (geo `FR`) | 100 | 12% |
| `EUR` (geo `DE`) | 50 | 11% |
| `EUR` (other) | 100 | 11% |
| `GBP` | — | UK exception |
| `USD` `CNY` `HKD` `CAD` | — | not applicable |

### Lumina Flip

Toggling the active pill runs a 0.55s keyframe on `#hero-amount-text` and `#hero-target-amount`. Text content swaps mid-flight at the 220ms mark; `.savings-on` class adds an accent-green tint that persists until untoggled.

## Live Intel (Mistral)

Three universal iron rules render at the top of the Guide tab. Five country-specific tips are fetched on demand from `/api/intel`, cached in `localStorage` per `(country, lang)` for 24h.

| Tier | Source | Content |
|------|--------|---------|
| Iron rules | hardcoded i18n | DCC vampire, ATM monster, weekend markup |
| Live intel | Mistral `mistral-small-latest` | local payment rails, brand arbitrage, regulatory quirks, timing traps |

### Endpoint shape

```
POST /api/intel
{ "country": "JP", "currency": "JPY", "lang": "en" }

→ { "items": [
     { "emoji": "🍣", "title": "...", "body": "..." },
     ... × 5
   ] }
```

System prompt explicitly excludes the 3 iron rules so live tips never duplicate them. Each card carries an `AI` badge plus a footer disclaimer.

## The Travel Cycle

```
       ┌──────────────────────────────────┐
       │   1. Land in foreign country     │
       │      (open the PWA)              │
       └─────────────┬────────────────────┘
                     │  /api/geo → seed anchors
                     ▼
       ┌──────────────────────────────────┐
       │   2. Set base + target ccy       │◀──────────┐
       └─────────────┬────────────────────┘           │
                     │                                 │
                     ▼                                 │
       ┌──────────────────────────────────┐           │
       │   3. Type bill → live RPN        │           │
       │      Routes / radar / anchors    │           │
       │      / intel update              │           │
       └─────────────┬────────────────────┘           │
                     │                                 │
                     ▼                                 │
       ┌──────────────────────────────────┐           │
       │   4. Zen at the cashier          │           │
       └─────────────┬────────────────────┘           │
                     │                                 │
                     ▼                                 │
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
| Service Worker | cache-first shell, network-first FX rates, passthrough `/api/*` |
| Serverless | Vercel Functions, Node 20+, CommonJS |
| LLM | Mistral `mistral-small-latest` |
| Geo | Vercel edge `x-vercel-ip-*` |
| FX rates | exchangerate-api (current) + frankfurter.dev (30-day) |
| State | `localStorage` only |

## Requirements

- A modern browser (`100dvh`, `backdrop-filter`)
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
