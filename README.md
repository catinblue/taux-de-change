# FX Weather

A zero-dependency browser app that tells you whether today is a good day to exchange currency — using weather metaphors anyone can understand.

## Quick Start

```
Open weather-en.html (English) or weather-zh.html (Chinese) in any modern browser.
```

No server, no install, no API key, no build step.

## Features

### Core
- **Weather-based exchange indicator** — sunny/cloudy/rainy metaphor for rate favorability
- **Multi-currency mini dashboard** — 5 pairs at a glance with weather icons
- **Purchasing power translator** — "1000 EUR = 200 coffees in China vs 38 in Paris"
- **What-if slider** — drag to simulate rate changes (±8%) and see impact instantly
- **Quick converter** with live rates from ExchangeRate-API

### Analysis
- **30-day thermometer** — where today's rate sits in the monthly range
- **Regret index** — "if you exchanged yesterday/last week/last month..."
- **Rate time machine** — pick any date in 90 days, see what you would have gotten
- **30-day heatmap calendar** — color-coded daily rate quality
- **Rate event timeline** — recent macro events affecting exchange rates

### Banks
- **10-bank ranking** — best rate comparison across 5 French + 5 Chinese banks
- **Hidden cost calculator** — shows how much the bank's spread actually costs you
- **Batch exchange simulator** — lump sum vs DCA comparison with historical backtest

### Tools
- **Life scenario calculator** — tuition, travel, rent presets with monthly comparison
- **Exchange goal tracker** — set target amount, track progress, what-if scenarios
- **Annual cost report** — yearly spread cost + optimization potential in Starbucks coffees
- **Exchange diary** — log entries with average rate stats
- **Rate bookmarks** — save any day's rate, auto-compare vs today
- **Rate alerts** — set target price, get browser notification

### Learning
- **Quiz bank** — 33 curated + ~45 daily auto-generated questions (from live rates)
- **Dynamic question compiler** — generates calculation/comparison/trend/scenario questions using real-time data, 100% accurate (no LLM, deterministic templates)
- **Forex knowledge base** — 8 core concepts (spread, bid/ask, carry trade, PPP...) with 4 progressive quizzes each, reset & retry
- **Daily prediction game** — guess tomorrow's direction, track accuracy, streak counter
- **Level system** — earn points from quizzes, progress through 4 ranks
- **Currency encyclopedia** — 6 currencies with history, design facts, global ranking

### Share
- **Canvas card generator** — downloadable PNG weather card
- **One-tap text summary** — clipboard-ready share text

## Usage

### Apps

| File | Description |
|------|-------------|
| `weather-en.html` | FX Weather — main app (English) |
| `weather-zh.html` | FX Weather — main app (Chinese) |
| `index.html` | Legacy FX Monitor — professional trading dashboard (English) |
| `index-zh.html` | Legacy FX Monitor — professional trading dashboard (Chinese) |

### Layout

Desktop: sidebar tabs + content area. Mobile: horizontal tab bar + scrollable content.

6 tabs: Today | Banks | Trends | Tools | Learning | Settings

### Data Flow

```
ExchangeRate-API (free, no key)
       ↓ fetch on load
  Current USD-based rates
       ↓ cross-rate calculation
  Any pair (EUR/CNY, GBP/JPY, etc.)
       ↓ seeded random walk
  90-day simulated history
       ↓ bank spread modifiers
  Per-bank buy/sell rates
       ↓ template compiler
  Dynamic quiz questions (daily, deterministic)
```

## Technical Details

### Architecture

```
weather-en.html    # Standalone single-file app (EN) ~90KB
weather-zh.html    # Standalone single-file app (ZH) ~90KB
index.html         # Legacy dashboard (EN)
index-zh.html      # Legacy dashboard (ZH)
app.js             # Legacy dashboard logic
styles.css         # Legacy dashboard styles
```

Each `weather-*.html` is fully self-contained: HTML + CSS + JS in one file. No external dependencies except Google Fonts CDN and ExchangeRate-API.

### Stack

- HTML5 / CSS3 / Vanilla JS (ES6+)
- ExchangeRate-API (free tier, no key)
- Chart.js 4.4.1 (legacy dashboard only)
- CSS Grid + Flexbox responsive layout
- localStorage for persistence (diary, alerts, quiz progress, predictions)
- Canvas API for share card generation
- Notification API for rate alerts

### Quiz Compiler Architecture

```
Verified fact store (hardcoded, human-reviewed)
  + Question templates (15 types × parameterized)
  + Live exchange rates (API)
  + Date-seeded randomization (stable within day)
  = ~45 unique accurate questions daily (no LLM, zero hallucination)
```

### Performance

- Zero build step, zero server
- Single HTTP request (exchange rate API)
- ~90KB per HTML file (all-inclusive)
- 30-second micro-fluctuation interval
- localStorage-only persistence (no backend)

### Browser Support

Chrome 90+ | Firefox 88+ | Safari 14+ | Edge 90+
