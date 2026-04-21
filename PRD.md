# FX Terminal — Product Requirements Document

**Version:** v2.0
**Build:** `weather.html` · Service Worker `fx-weather-v19` · Manifest `FX Terminal`
**Last verified against code:** 2026-04-21
**Document status:** Strictly aligned with shipped code. Items previously treated as shipped but unimplemented have been explicitly moved to the v2.1 Roadmap (§7).

---

## 1. Product overview and brand

FX Terminal is a single-file, offline-capable Progressive Web App. No backend. It renders live FX rates, 30-day volatility analytics, a hidden-cost radar, and a persona-tailored Smart Verdict, inside an industrial-noir terminal aesthetic.

### 1.1 Brand unification (enforced in v2.0)

| Surface | String |
|---|---|
| Global brand name | `FX Terminal` |
| PWA install name (manifest `name` / `short_name`) | `FX Terminal` |
| Browser title (both EN and ZH) | `FX Terminal` |
| Header logo | `FX Terminal` (no version suffix — version lives in Setup footer only) |
| Slogan (EN) | `Decode Volatility, End Hidden Costs.` |
| Slogan (ZH) | `洞悉汇率波动,终结隐形成本。` |
| Manifest description | Slogan as bilingual pair: `Decode Volatility, End Hidden Costs. · 洞悉汇率波动,终结隐形成本。` |

The previous ZH brand `换汇天气` is fully retired in v2.0.

### 1.2 Personas

| ID | Label | Focus |
|---|---|---|
| `student` | 🎓 Student / 留学生 | Large tuition-remit windows, long-term MA sensitivity |
| `nomad` | 💻 Nomad / 数字游民 | High-frequency local spend, ATM fees, card conversion loss |
| `seller` | 📦 Seller / 跨境卖家 | B2B batch settlement, spread-sensitive, margin-driven |

**v2.0 scope:** persona drives **only** the Smart Verdict copy on the Terminal tab. Algorithm parameters are not yet persona-conditioned.

---

## 2. System architecture

### 2.1 File topology (zero-build, pure frontend)

```
taux-de-change/
├── weather.html        # Entire app (HTML + CSS + JS inline)
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline caching strategy
├── icon.svg            # Vector icon
├── index.html          # Redirect → weather.html
└── PRD.md              # This document
```

### 2.2 Data sources and Service Worker strategy

| Concern | Endpoint | SW strategy |
|---|---|---|
| App shell (same-origin) | `weather.html`, `manifest.json`, `icon.svg` | Cache-first |
| Live rate | `api.exchangerate-api.com/v4/latest/{base}` | Network-first, fall back to SW cache only. **No localStorage rate snapshot in v2.0** (see §7.2). |
| 30-day history | `api.frankfurter.app/{start}..{end}?from={base}` | Pass-through (not intercepted). v2.1 target (see §7.3). |

---

## 3. Global features

### 3.1 Theme (dark / light)
- Two `:root` palettes via CSS variables. `localStorage.fx_theme` persists.
- Synchronous `<head>` script pre-applies `.dark` before first paint to eliminate FOUC.
- Additional synchronous hook after the theme button sets the icon with zero flash.

### 3.2 Language (EN / ZH)
- Single-file dictionary `I18N = { en: {...}, zh: {...} }`, accessed via `t()`.
- Toggle via `EN ⇄ 中` button. Persisted in `localStorage.fx_lang`.
- Initial language: `localStorage.fx_lang` → else `navigator.language.startsWith('zh')` → else `'en'`.
- On switch: updates `<html lang>`, re-renders active tab. `document.title` remains `FX Terminal` across both languages per brand unification.

### 3.3 Haptic engine
- Thin wrapper around `navigator.vibrate(10)` (Android only; iOS Safari has no Vibration API).
- Respects `localStorage.fx_haptic`. Default: enabled (any value other than `'off'`).
- Fires on: theme toggle, language toggle, persona switch, currency `<select>` change, dock tab switch, cache reset.
- **Never** fires on amount `oninput` — avoids the rattling-keyboard anti-pattern.
- Togglable via Setup tab.

### 3.4 iOS / mobile hardening
| Concern | Fix |
|---|---|
| Address-bar resize jitter | `min-height: 100dvh` |
| Home-indicator overlap | `padding-bottom: env(safe-area-inset-bottom)` on dock + content |
| Keyboard auto-zoom on focus | `font-size: 16px` on `<select>` overlay and amount input |
| Touch target size | `min-height: 44px` on interactive elements |
| Number spinner | `-webkit-appearance: none` + `-moz-appearance: textfield` |
| Tap highlight | `-webkit-tap-highlight-color: transparent` |
| Huge-input caret | `line-height: 1; caret-color: var(--accent)` |

---

## 4. Screen: Terminal (default tab)

### 4.1 Market Signal — weather algorithm (rewritten in v2.0)

The v1 heuristic (`Math.floor(S.cr % 5)`) is **removed**. The v2.0 algorithm derives the badge from real 7-day historical data.

**Function:** `calcWeather()`
**Inputs:** `S.cr` (live rate), `S.hist` (frankfurter 30-day array)
**Algorithm:**
1. If `!S.cr` or `S.hist.length < 7`, return `null`.
2. Take `S.hist.slice(-7)`.
3. `MA = arithmetic mean of last 7 rates`.
4. `delta = (S.cr − MA) / MA × 100`.

**Threshold bands (product-defined magic numbers):**

| Condition on delta | Band | Color |
|---|---|---|
| `≥ +0.8%` | Great | `#34C759` |
| `≥ +0.3%` | Good | `#32D74B` |
| `∈ (−0.3%, +0.3%)` | Stable | `#8E8E93` |
| `∈ (−0.8%, −0.3%]` | Poor | `#FF9F0A` |
| `≤ −0.8%` | Storm | `#FF3B30` |

**Fallback when `calcWeather()` returns `null`:** the `<div class="badge">` is **not rendered at all**. No `Stable` default, no `—` placeholder, no empty pill. An absent badge is more honest than a fabricated neutral one.

### 4.2 Delta vs previous close

Independent of the weather algorithm. Computed from the last `S.hist` entry vs `S.cr`. Rendered as `▲` / `▼` (green / red), with `|pct|.toFixed(2)%` and label `vs prev close` / `较上一交易日`.

### 4.3 Smart Verdict (spec)

**Trigger:** persona switch re-renders Terminal, refreshing the copy.
**Data structure:** `I18N.{lang}.verdict.{persona}` — renamed from `tips` in v2.0 to align with the UI label ("Verdict" carries more weight than "Tips").
**Compliance boundary:** This module must NOT emit claims about current market conditions. Copy is static, generic strategy/risk education tailored to the persona (e.g., "Nomads: in-network ATMs typically beat airport kiosks"). Language uses hedging words (`typically`, `often`, `usually`).

### 4.4 Settlement engine

- Amount `<input type="number" inputmode="decimal">`, length-capped with `slice(0, 10)` on input.
- Result updates via `updateResult(val)` patching only `.t-res` — preserves input focus.
- Overflow guard: `max-width: 75%; overflow: hidden; text-overflow: ellipsis;`.
- Fallback when `S.cr === 0`: result shows `—`.

### 4.5 Hidden Cost Radar

- Formula: `amount × cr × 2.5%` (code constant `MARKUP_RATE = 0.025`).
- UI transparency: parenthetical `(assumes 2.5% spread)` / `(按 2.5% 点差估算)` always adjacent to the label.

---

## 5. Screen: Trends

### 5.1 Empty state
When `S.hist.length === 0`: hero displays `Awaiting history endpoint` / `等待历史数据接口`.

### 5.2 Stat grid
Three boxes, all computed from real `S.hist`:
- `30D HIGH` (green) — `Math.max`
- `30D AVG` (gray) — arithmetic mean
- `30D LOW` (red) — `Math.min`

### 5.3 Bar chart
Thirty bars, one per day. Height normalized: `max(5%, (rate − min) / range × 100%)`.
- Green when `rates[i] ≥ rates[i−1]`, red otherwise. First bar defaults to green.

### 5.4 Recent Settlements
Last 5 days, reversed (newest on top). `YYYY-MM-DD · rate.toFixed(4)`.

---

## 6. Screen: Setup

### 6.1 Rows (v2.0 final set)

| Row | Interaction | State display | Persistence |
|---|---|---|---|
| Dark Mode Interface | Tap toggles | `ON` / `OFF` | `fx_theme` |
| Haptic Engine | Tap toggles | `ON` / `OFF` | `fx_haptic` |
| Reset Terminal Cache | Tap → `localStorage.clear()` + reload | ⚠ icon, red label | — |

**Removed in v2.0:** the `Volatility Alerts: Unconfigured` row. Moved to §7.4. No placeholder is rendered.

### 6.2 Brand & version footer

Below all rows, above the dock area:
- Slogan (current language)
- Version number `v2.0`
- Styling: `color: var(--text2)`, 11px, centered, ~50px top padding, weak contrast.

---

## 7. v2.1 Roadmap (deferred from v2.0)

Items below had clear value but non-trivial integration cost. Explicitly deferred for individual review.

### 7.1 Swap button (currency reversal)
- **Value:** high-frequency direction flip (EUR→CNY ↔ CNY→EUR).
- **Open questions:** placement in the pair-selector grid without breaking alignment; tap vs long-press behavior; animation.

### 7.2 Rate offline fallback (localStorage double-write)
- **Value:** avoid `0` rate on cold offline open.
- **Open questions:** SW network-first already covers repeat-visit offline. Is the marginal win from also writing to localStorage worth the state duplication?

### 7.3 Frankfurter SW caching
- **Value:** enable Trends page on cold offline.
- **Open questions:** Cache-first or stale-while-revalidate? Cache TTL? Size management for multiple base/target pairs?

### 7.4 Volatility Alerts (real push)
- **Value:** transform the app from active-query to passive-notification tool.
- **Open questions:** Pure PWA cannot monitor in background. Requires Cloudflare Workers (or equivalent) cron + Web Push API + VAPID keys. Until that backend exists, **no placeholder UI is shown**.

---

## 8. State engine — localStorage keys

| Key | Type | Default | Purpose |
|---|---|---|---|
| `fx_base` | string | `'EUR'` | Base currency code |
| `fx_target` | string | `'CNY'` | Target currency code |
| `fx_theme` | string | — (follows system) | `'dark'` / `'light'` |
| `fx_lang` | string | auto from `navigator.language` | `'en'` / `'zh'` |
| `fx_persona` | string | `'student'` | Active persona |
| `fx_haptic` | string | effectively on | `'off'` to silence |

> `fx_alerts` is **not** in v2.0 scope (introduced only when §7.4 ships).

---

## 9. Non-functional requirements

### 9.1 Performance
- Single HTML payload under 20 KB.
- No build step, no bundler, no runtime dependencies.
- First paint blocked only by the synchronous theme-class detection script.

### 9.2 Accessibility / compatibility
- `<html lang>` updates on language switch.
- All interactive elements meet the 44-px touch target.
- Custom picker overlays a real `<select>` so VoiceOver / TalkBack announce it correctly.

### 9.3 Privacy
- No analytics, no tracking, no cookies.
- All state local to the browser.
- Two outbound requests (exchangerate-api, frankfurter), no auth, no user identifier.

---

## 10. Deployment

- Any static host works (Cloudflare Pages, GitHub Pages, Netlify, Vercel static, S3 + CloudFront).
- Required files: everything in §2.1.
- No environment variables, no secrets.
- Bump `CACHE` in `service-worker.js` on every deploy so returning users pick up the new shell.

---

## 11. v2.0 Sprint execution log

Shipped atomically in this sprint (documented-then-coded):

1. **Brand unification** — logo text in both languages, `document.title`, manifest `name` / `short_name`, manifest `description` (bilingual).
2. **`calcWeather()`** — 7-day MA algorithm replacing `S.cr % 5`. Returns `null` when data insufficient → badge suppressed.
3. **Dictionary rename** — `tips` → `verdict` in both `I18N.en` and `I18N.zh` (and references in `vToday`). Unused keys `volatilityAlerts` / `unconfigured` removed.
4. **Setup cleanup** — `Volatility Alerts` row deleted. Deferred to §7.4.
5. **Setup footer** — slogan + `v2.0` in `--text2` weak contrast, below all rows.
6. **Service Worker cache** — bumped to `fx-weather-v19`.
7. **Manifest** — name and description updated to unified brand + bilingual slogan.
8. **PRD** — this document updated in the same sprint.
