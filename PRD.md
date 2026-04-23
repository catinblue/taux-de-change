# FX Weather — Product Requirements Document

**Version:** v4.2 (ATM Slider)
**Build target:** `weather.html` · Service Worker `fx-weather-v25` · Manifest `FX Weather`
**Status:** v4.0 / v4.0.1 / v4.1 shipped. v4.2 (ATM Slider) shipped in this sprint. v4.3-v4.4 pending.
**Scope history:** v3.0 engine → v4.0 glassmorphism shell → v4.1 Custom PPP Anchors → v4.2 ATM amortization slider.

---

## 0. Open sign-off items (blocking code sprint)

Before implementation begins, PM must resolve:

### 0.1 Slogan (pick one)

| # | EN | ZH | FR (draft) |
|---|---|---|---|
| A | Make your money travel smarter. | 让你的钱出国不被宰。 | Faites voyager votre argent plus intelligemment. |
| B | Your pay-abroad pocket copilot. | 出境刷卡的口袋小参谋。 | Votre copilote de paiement à l'étranger. |
| C | A friendlier way to pay abroad. | 出国花钱,友好一点。 | Payer à l'étranger, en toute simplicité. |
| D | Keep your wallet from tourist tax. | 别让汇率把你当游客宰。 | Ne laissez pas le taux de change vous arnaquer. |

v3.0 slogan (`Decode Volatility, End Hidden Costs. / 洞悉汇率波动,终结隐形成本。`) remains available if the playful pivot doesn't land. **Pick one, or write a fourth — PM decision.**

### 0.2 v3.0 Trends tab disposition

v4.0 blueprint lists three tabs only (`Weather / Guide / Backpack`). Implicitly retires the v3.0 Trends tab. Three options:

- **(a) Full retirement** [recommended for playful MVP] — Nomads at checkout do not care about 30-day bar charts. `calcWeather()` still used for background gradient; Time Machine + HIGH/AVG/LOW + bar chart + Recent Settlements all removed. Smallest v4.0.
- **(b) Fold Time Machine into Weather tab** — a small "今天取 1000 {BASE} 比上周多/少 Y {TARGET}" card below the 3 routing cards. Keep HIGH/AVG/LOW / bar chart / recent settlements retired.
- **(c) Retain Trends as a 4th tab** — least disruptive, but stretches the app away from "playful" intent.

### 0.3 Guide tab three-card content

Per §4 decision (extreme-minimal mode), each card = 1 title + 1 anti-scam one-liner. PM writes EN/ZH/FR directly. PRD reserves three slots (§5.2). Ship is blocked until content arrives.

---

## 1. Product positioning

FX Weather v4.0 is a **single-purpose playful companion** for frequent overseas travelers (Digital Nomads). It replaces the v3.0 industrial aesthetic with a **dynamic weather-gradient background + glassmorphism cards + emoji-rich voice**. Core decision logic is inherited verbatim from v3.0's Payment Routing Engine; only the skin and tone change.

### 1.1 Brand (locked)

| Surface | String |
|---|---|
| Global name | `FX Weather` |
| PWA install name (manifest) | `FX Weather` |
| Browser title | `FX Weather` (across all three languages) |
| Header logo | `FX Weather` |
| Cloudflare subdomain target | `fx-weather.pages.dev` |
| Slogan | **[PM SIGN-OFF §0.1]** |

Previous brand `FX Terminal` (v2.0, v3.0) is retired. `换汇天气` (pre-v2.0) is not revived — brand stays English-anchored across all three languages.

### 1.2 Positioning statement

At a foreign POS, ATM, or bill, FX Weather answers in under 3 seconds:
1. **What will this actually cost me?** — computed per transaction with three transparent methods.
2. **What do I say when the POS asks about currency?** — Anti-DCC Shield, always visible.
3. **Why is my card / ATM screwing me?** — educational flashcards on Guide tab.

### 1.3 Project stance (reaffirmed from v3.0)

v4.0 is built as a **zero-configuration playful demo**, not a usage-tested MVP. Default rate parameters (Wise 0.35%, Traditional 1.5%, ATM 3.0 in base) remain tagged `[推论]` and user-configurable. After v4.0 ships to Cloudflare, a real 7-day dogfooding freeze begins — no further design iterations until actual Nomad feedback arrives.

---

## 2. v3.0 → v4.0 migration summary

### 2.1 Preserved engineering (intact)

- Single-file PWA architecture
- `service-worker.js` strategy
- `api.exchangerate-api.com/v4` live-rate client
- `api.frankfurter.dev/v1` 30-day history client (powers `calcWeather()` for gradient selection)
- `calcRouting(amount)` algorithm — returns sorted `[{id, cost, delta, isBest}]`
- `calcWeather()` algorithm — same ±0.3%/±0.8% bands on 7-day MA; returns null when data insufficient
- Haptic engine with localStorage toggle
- iOS / mobile hardening (safe-area, 44px targets, caret fix, zoom prevention)
- DCC Shield logic (correct directional advice: always choose BASE)
- Wallet Rates configurability (`fx_rate_zero`, `fx_rate_card`, `fx_fee_atm`)
- First-run banner dismissal triggers
- `fx_banner_dismissed` state

### 2.2 Removed

| Removed | Reason |
|---|---|
| `fx_theme` localStorage key + toggle | Replaced by `fx_contrast_mode` (binary: weather vs solid) |
| Dark-mode `:root.dark` CSS palette | Replaced by High Contrast Mode (respects system `prefers-color-scheme`) |
| Flat `--bg: #FFFFFF` background | Replaced by dynamic weather gradient |
| Trends tab (depending on §0.2 sign-off) | Surfacing dependent on PM choice among (a)(b)(c) |
| Logo "FX Terminal" string | Brand flip to "FX Weather" |

### 2.3 Added

| Added | Purpose |
|---|---|
| Dynamic Weather Gradient background | 5 gradient pairs driven by `calcWeather()` output; null-fallback to Stable |
| Glassmorphism card system | Semi-transparent cards with `backdrop-filter: blur` over gradient |
| Trilingual engine (EN / ZH / FR) | Third language adds FR; existing I18N structure scales |
| 📚 Guide tab | New tab for playful educational flashcards |
| 🎒 Backpack tab (renames Setup) | Playful rebrand of same functionality + High Contrast Mode toggle |
| High Contrast Mode | Accessibility escape hatch; respects `prefers-color-scheme` |
| `fx_contrast_mode` localStorage key | `'weather'` (default) or `'solid'` |
| Weather forecast phrase on Weather tab | e.g. "今日汇率极佳!放心刷卡吧 ☀️" — surfaces calcWeather qualitatively |
| Emoji-rich voice across UI | Crown 👑 on best card, 😅 on worst, 🛡️ on DCC shield, 🧛‍♂️/🏧/🎓 on Guide cards |
| Country flag emoji on pair selector | 🇪🇺 EUR / 🇨🇳 CNY style |

---

## 3. Global visual system

### 3.1 Dynamic Weather Gradient

Background is a fullscreen `linear-gradient(135deg, c1, c2)` driven by `calcWeather()` output.

| Weather band | Gradient hex pair | Mood |
|---|---|---|
| ☀️ Great (`delta ≥ +0.8%`) | `#4facfe` → `#00f2fe` | Clear sky blue |
| 🌤️ Good (`delta ≥ +0.3%`) | `#43e97b` → `#38f9d7` | Mint green |
| ☁️ Stable (`−0.3% < delta < +0.3%`) | `#e0c3fc` → `#8ec5fc` | Pastel overcast |
| 🌧️ Poor (`−0.8% < delta ≤ −0.3%`) | `#f6d365` → `#fda085` | Sunset amber |
| ⛈️ Storm (`delta ≤ −0.8%`) | `#667eea` → `#764ba2` | Stormy indigo |

**Null fallback:** when `calcWeather()` returns `null` (history data insufficient), background uses the **Stable** gradient. Rationale: honest "no signal yet" state; does not fake a positive or negative forecast.

**Scope:** gradient applies globally (Weather + Guide + Backpack). Glass cards use opaque-enough backgrounds so text remains legible on all five gradients.

### 3.2 Glassmorphism cards

All content modules (routing cards, flashcards, settings rows) wrap in:

```css
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-radius: 20px;
```

Dark High Contrast variant: `rgba(0, 0, 0, 0.6)`.

### 3.3 High Contrast Mode (accessibility escape)

Toggle in Backpack tab. When enabled (`fx_contrast_mode = 'solid'`):
- Background gradient → flat solid
- `backdrop-filter: blur` → removed
- Colors respect system `prefers-color-scheme`:
  - Light: bg `#FFFFFF`, text `#000`, surface `#F2F2F7`
  - Dark: bg `#000`, text `#FFF`, surface `#1C1C1E`
- Emoji retained but gradient/glass stripped

Default: `fx_contrast_mode = 'weather'` (on first install).

### 3.4 Emoji-rich voice (tone guide)

- Anti-DCC Shield: 🛡️
- Weather gradient states: ☀️ 🌤️ ☁️ 🌧️ ⛈️
- Payment routing cards: 👑 (best) · 💳 (traditional) · 😅 or 💵 (ATM worst-case)
- Guide cards: 🧛‍♂️ (DCC vampire) · 🏧 (ATM monster) · 🎓 (tuition season)
- Backpack icon: 🎒
- Currency codes adjacent to flag emoji where natural: 🇪🇺 EUR / 🇨🇳 CNY

Emoji are a communication layer, not decoration — every one must carry a semantic role.

---

## 4. Trilingual engine (EN / ZH / FR)

### 4.1 Structure

```js
I18N = {
    en: { ... },  // ~80 keys
    zh: { ... },  // ~80 keys
    fr: { ... }   // ~80 keys, drafted by AI, QA'd by PM (trilingual)
}
```

### 4.2 Language toggle

- `🌍` button in header, replaces v3.0's `EN ⇄ 中` button
- Tap cycles: EN → ZH → FR → EN
- Persisted in `localStorage.fx_lang`
- Initial detection: `localStorage.fx_lang` > `navigator.language.startsWith('zh')` > `navigator.language.startsWith('fr')` > `'en'`
- On switch: updates `<html lang>`, title, re-renders active tab

### 4.3 Voice guidelines

- Casual, second-person, POS-counter urgency
- Avoid financial jargon (no "spread", no "FX markup" in English UI copy; use "手续费" / "点差" sparingly in ZH; use "frais" / "marge" in FR)
- Hedging words required where facts are [推论] (e.g., "usually", "typically", "通常", "souvent")
- FR note: PM must QA because AI draft quality is not guaranteed for idiomatic Nomad-conversational French

### 4.4 Translation responsibility (per PM decision)

- **EN master copy**: AI drafts, PM QA
- **ZH master copy**: AI drafts, PM QA
- **FR master copy**: AI drafts, **PM owns final QA** (PM is trilingual CN/FR/EN)
- **Guide flashcard content (EN/ZH/FR)**: **PM writes directly** per §0.3

---

## 5. Screen 1: 🌤️ Weather (replaces v3.0 Checkout)

### 5.1 Layout (top to bottom)

```
┌──────────────────────────────────────┐
│ Header: 🌤️ FX Weather · 🌍 · 🎒      │
├──────────────────────────────────────┤
│ 🇪🇺 EUR  /  🇨🇳 CNY  (pair selector) │
├──────────────────────────────────────┤
│ "今日汇率极佳!放心刷卡吧 ☀️"          │  ← calcWeather phrase
├──────────────────────────────────────┤
│ 🛡️ DCC Shield (permanent)            │
├──────────────────────────────────────┤
│ [First-run banner, if not dismissed] │
├──────────────────────────────────────┤
│ 💰 "这笔账单多少钱?"                 │
│ [ hero input ]                       │
├──────────────────────────────────────┤
│ 👑 Best glass card (sorted #1)      │
│ 💳 Second glass card                 │
│ 😅 Third glass card                  │
└──────────────────────────────────────┘
Dock: 🌤️ Weather · 📚 Guide · 🎒 Backpack
```

### 5.2 Weather forecast phrase

Short qualitative line derived from `calcWeather()` band:

| Band | EN | ZH | FR (draft) |
|---|---|---|---|
| Great | Rate is great today — tap away! ☀️ | 今日汇率极佳!放心刷卡吧 ☀️ | Taux au top aujourd'hui ☀️ |
| Good | Decent rate today 🌤️ | 今天汇率不错 🌤️ | Taux plutôt bon 🌤️ |
| Stable | Pretty flat today ☁️ | 今天汇率平平 ☁️ | Taux stable ☁️ |
| Poor | Rate's a bit off today 🌧️ | 今天汇率不太好 🌧️ | Taux un peu défavorable 🌧️ |
| Storm | Rough day for FX ⛈️ | 今天汇率偏差 ⛈️ | Taux très défavorable ⛈️ |
| null | Waiting for data … | 数据加载中 … | Chargement des données … |

### 5.3 Anti-DCC Shield (permanent, cannot dismiss)

Visual: amber-tinted glass card, 🛡️ icon, strong contrast with body copy.

Copy (with live `{BASE}` / `{TARGET}` interpolation):
- **EN:** `🛡️ When the cashier asks, always pay in {BASE} — reject the {TARGET} option (DCC). It's hidden 3–7% extra.`
- **ZH:** `🛡️ 收银员问货币?大声说:选 {BASE}!拒绝 {TARGET} 结算(DCC 会多扣 3–7%)。`
- **FR (draft):** `🛡️ Quand on vous demande, payez toujours en {BASE} — refusez l'option {TARGET} (DCC, 3–7% en plus).`

### 5.4 First-run default-rate banner

Preserved from v3.0. Same three dismissal triggers:
1. Tap banner body → navigate to Backpack + `fx_banner_dismissed = 'true'`
2. Tap ✕ → dismiss only
3. Edit any wallet rate in Backpack → auto-dismiss

Visual: softer glass tint than DCC Shield.

### 5.5 Hero amount input

- Copy:
  - **EN:** `How much is this bill?`
  - **ZH:** `这笔账单多少钱?`
  - **FR (draft):** `Montant de l'addition ?`
- `font-size: clamp(3rem, 14vw, 5rem)`, fluid
- `inputmode="decimal"`, `slice(0, 10)` length cap
- Base currency displayed on the right (code, no flag here)

### 5.6 Payment Routing cards (v3.0 engine, v4.0 skin)

Three glass cards below the input. Logic from v3.0 `calcRouting()` unchanged.

**Card anatomy:**
```
┌─────────────────────────────────┐
│ 👑 BEST FOR THIS AMOUNT         │  ← only on first card
│                                 │
│ 💳 Zero-FX Card                 │  ← method name
│                                 │
│ 780.50                  CNY     │  ← hero cost
│                                 │
│ Wise · Revolut · fee-waived     │  ← hint / origin
└─────────────────────────────────┘
```

**Emoji markers:**
- First place: `👑` crown
- Third (worst) place with ATM: `😅` sweat face
- All other cases: method-native emoji (`💳` / `💵`)

**Copy (EN/ZH/FR):**

| Method | EN name | ZH name | FR name |
|---|---|---|---|
| Zero-FX | `💳 Zero-FX Card` | `💳 免手续费卡` | `💳 Carte sans frais FX` |
| Traditional | `💳 Traditional Card` | `💳 传统信用卡` | `💳 Carte classique` |
| ATM | `💵 ATM Cash` | `💵 ATM 取现` | `💵 Retrait DAB` |

**Dynamic sorting** preserved from v3.0 — `Best for this amount` label follows the top card of the sort, not a fixed card.

### 5.7 Degraded states

| Condition | Behavior |
|---|---|
| Live-rate API fails (`S.cr === 0`) | Cards show `—` cost, no sort, DCC Shield + Weather phrase still visible |
| History API fails (`S.hist === []`) | Weather phrase falls back to "Waiting for data"; background uses Stable gradient |
| Amount empty / 0 | Cards show `—` placeholder |

---

## 6. Screen 2: 📚 Guide (new)

### 6.1 Structure

Vertical list of glass **flashcards**. Each card = collapsed header (emoji + title) → tap to expand → one-line anti-scam maxim underneath.

First release: **3 cards**. Content authored by PM (see §0.3).

### 6.2 Card anatomy (PRD placeholder — PM fills)

```
┌─────────────────────────────────┐
│ 🧛‍♂️ [Card 1 title]              │  ← tap to expand
├─────────────────────────────────┤
│ [One-line anti-scam maxim]      │  ← shows when expanded
└─────────────────────────────────┘
```

**Card 1: DCC vampire**
- Title (EN/ZH/FR): `[PM WRITES]`
- Maxim: `[PM WRITES]`

**Card 2: ATM hidden monster**
- Title: `[PM WRITES]`
- Maxim: `[PM WRITES]`

**Card 3: Tuition timing** (a tuition-scheduling one-liner, retained since it's a genuinely useful meta-rule even within the Nomad focus)
- Title: `[PM WRITES]`
- Maxim: `[PM WRITES]`

### 6.3 Interaction

- Tap card header → expand inline (accordion pattern, not modal)
- Only one card expanded at a time (tapping a new one collapses the previous)
- Haptic on tap

### 6.4 v4.1 backlog for Guide

- Add 4th card: operator surcharge in SE Asia (needs real data)
- Add 5th card: exchange kiosks vs banks in Europe
- Localization-only additions per region (country-specific tips)

---

## 7. Screen 3: 🎒 Backpack (renames v3.0 Setup)

### 7.1 Rows (all as glass cards)

| # | Row | Control | State | Storage |
|---|---|---|---|---|
| 1 | 🌈 High Contrast Mode | Tap toggles | `ON` / `OFF` | `fx_contrast_mode` (`solid` / `weather`) |
| 2 | 📳 Haptic Engine | Tap toggles | `ON` / `OFF` | `fx_haptic` |
| 3 | 💳 Zero-FX markup | Edit inline | `%` value | `fx_rate_zero` |
| 4 | 💳 Traditional card markup | Edit inline | `%` value | `fx_rate_card` |
| 5 | 💵 ATM fixed fee | Edit inline | `{BASE}` value | `fx_fee_atm` |
| 6 | 🗑️ Clear my backpack | Tap → `localStorage.clear()` + reload | — | — |

Wallet rate rows include the `[推论]` origin note from v3.0 unchanged:
- Zero-FX: "Wise EUR-corridor reference · actual 0.4–0.65%"
- Traditional: "Visa network baseline · issuer may add 0–3%"
- ATM: "Flat-fee model · operator surcharge not modeled"

### 7.2 Row labels (EN/ZH/FR)

| Row | EN | ZH | FR (draft) |
|---|---|---|---|
| High Contrast | `Plain mode (hide weather)` | `纯色模式(关掉天气)` | `Mode simple (sans météo)` |
| Haptic | `Vibration` | `震动反馈` | `Vibration` |
| Zero-FX rate | `My fee-waived card fee` | `我的免手续费卡扣多少` | `Ma carte sans frais` |
| Traditional rate | `My credit card fee` | `我的普通卡扣多少` | `Ma carte classique` |
| ATM fee | `My local ATM per-withdrawal fee` | `本地 ATM 每次扣多少` | `Frais de DAB local` |
| Clear | `Empty my backpack` | `清空背包` | `Vider mon sac` |

### 7.3 Footer

- Slogan (per §0.1 sign-off)
- `v4.0` version tag in `--text2` weak contrast

---

## 8. State engine — localStorage keys

| Key | Default | Purpose |
|---|---|---|
| `fx_base` | `'EUR'` | Base (local / bill) currency |
| `fx_target` | `'CNY'` | Target (home / card) currency |
| `fx_lang` | auto-detect (EN/ZH/FR) | Language |
| `fx_haptic` | effectively on | `'off'` to silence |
| `fx_rate_zero` | `'0.0035'` | Zero-FX markup (fraction) |
| `fx_rate_card` | `'0.015'` | Traditional card markup (fraction) |
| `fx_fee_atm` | `'3.0'` | ATM fixed fee (BASE units) |
| `fx_banner_dismissed` | not set | `'true'` suppresses first-run banner |
| `fx_contrast_mode` | not set (→ weather) | `'solid'` or `'weather'` |

**Removed from v3.0:** `fx_theme`. Any orphan value ignored.

---

## 9. Dock

Three tabs:

| ID | Emoji | EN | ZH | FR |
|---|---|---|---|---|
| `weather` | 🌤️ | `Weather` | `天气` | `Météo` |
| `guide` | 📚 | `Guide` | `攻略` | `Guide` |
| `backpack` | 🎒 | `Backpack` | `背包` | `Sac à dos` |

Tab IDs change: v3.0 `checkout` → v4.0 `weather`; v3.0 `trends` → **removed** (pending §0.2); v3.0 `settings` → v4.0 `backpack`.

Haptic on tab switch preserved.

---

## 10. Data sources (unchanged from v3.0)

| Concern | Endpoint | SW strategy |
|---|---|---|
| App shell | `weather.html`, `manifest.json`, `icon.svg` | Cache-first |
| Live rate | `api.exchangerate-api.com/v4/latest/{base}` | Network-first, SW cache fallback |
| 30-day history | `api.frankfurter.dev/v1/{start}..{end}?from={base}` | Pass-through |

History drives BOTH the weather gradient background AND (if §0.2 choice = b) Time Machine. Without history, background falls back to Stable gradient.

---

## 11. Non-functional

- Single HTML target: under **45 KB** (adds ~12 KB over v3.0's 33.8 KB for FR dict + Guide tab + gradient CSS)
- No build step, no bundler, no runtime deps
- First paint blocked only by synchronous contrast-mode detection script
- No tracking, no analytics, no cookies
- Two outbound endpoints, no auth

---

## 12. Deployment

- Cloudflare Pages via Git push
- Cloudflare project name: `fx-weather` → subdomain `fx-weather.pages.dev`
- Cache bump to `fx-weather-v22` on ship
- No env vars, no secrets

**Dogfooding freeze** begins the day of first public deploy. See `memory/project_v4_final_commitment.md`.

---

## 13. Roadmap — v4.x Portfolio phases

Scope revised 2026-04-22 per `memory/project_v4_final_commitment.md`: MVP/dogfooding discipline swapped for multi-phase Portfolio iteration. Phases shipped atomically one at a time.

### ✅ v4.1 — Custom PPP Anchors (shipped)

User-entered reference prices ("my daily coffee", "home bowl of noodles"). On Weather tab, an inline glass strip below the 3 routing cards shows `🍜 22 · 🍔 16 · ☕ 12.5` style conversions. Backpack gains an editable list (max 5) with emoji / label / price / currency per row. Zero API calls; anchors whose currency doesn't match current pair are silently hidden (no triangulation per PM decision).

**State added:** `localStorage.fx_anchors` = JSON array of `{emoji, label, price, currency}`.
**CSS refactor:** extracted 9 glass elements into consolidated multi-selector rules (`.glass-card` pattern).
**i18n:** 6 new keys × 3 languages (anchorsTitle, anchorsHint, anchorsWeatherPrefix, anchorAdd, anchorEmojiPh, anchorLabelPh, pickerTitleAnchor).

### ✅ v4.2 — ATM Slider (shipped)

Progressive-disclosure slider embedded in the ATM route card on Weather tab. Tap `📊 See withdrawal curve` → the card expands (max-height CSS transition ~280ms) revealing a native `<input type="range">` whose track is a `red → amber → green` gradient. Dragging shows `Withdraw X {BASE} → Y.Y% 🟡 Meh` in real-time.

**Mapping:** exponential `minA = max(2 × fee, 1)` to `maxA = max(1000, 50 × fee)` for fine-grained low-end (high-loss) control.

**Tier thresholds `[产品决策]`:** `≥ 5%` Extreme 🩸 (red) / `≥ 1.5%` Meh 🟡 (amber) / `< 1.5%` Reasonable 🟢 (green). Three tiers = stop / caution / go.

**Default position:** on open, slider seeds to match current bill amount via `amountToSliderVal()` inverse log mapping (clamped to bounds). Keeps pedagogical link between bill in focus and ATM scenario.

**Fee source:** read-only from `fx_fee_atm` in Backpack. `edit →` link in hint jumps to Backpack for one-tap reconfig. No temp override (stateless discipline preserved).

**Ephemeral state:** `S.atmOpen` (panel visibility), `S.atmSliderVal` (0–100). Not persisted to localStorage.

**Guards:** if `fx_fee_atm <= 0` or `S.cr === 0`, expand trigger hidden (no meaningful story).

### ⏳ v4.3 — VAT Refund Shield (pending)

Second always-visible warning (pattern identical to DCC Shield) for the airport VAT-refund desk. Same directional advice: always choose `{BASE}` (local currency refund), never `{TARGET}` (home-currency DCC'd refund). Copy authored by PM before coding.

### ⏳ v4.4 — AA Splitter (pending)

Inline ephemeral expense-split modal. Input bill total + number of people + each person's card fee. Output per-person fair share. No persistence — close = forget. Opens from a small button on the Weather tab routing panel.

### ❌ Rejected

- Geo-arbitrage subscription tracker — requires multi-session persistence, violates stateless discipline
- Dynamic PPP APIs (Numbeo / Expatistan) — cost, data quality, scraping TOS
- Any additional full-visual redesign — locked per memory until external evidence

---

## 14. Sprint execution log

### v4.0 (2026-04-22) — glassmorphism redesign
Brand flip `FX Terminal` → `FX Weather`. Dynamic weather gradient replaces dark/light toggle. 3 tabs: Weather / Guide / Backpack. Trilingual EN/ZH/FR. Modal bottom-sheet currency picker. High Contrast escape hatch. `fx-weather-v22`.

### v4.0.1 (2026-04-22) — glass bottom sheet picker
Native `<select>` replaced with custom glass bottom-sheet modal after the original broke the glassmorphism aesthetic. i18n-correct titles, solid-dark-mode active-state color fix, body scroll lock. `fx-weather-v23`.

### v4.1 (2026-04-22) — Custom PPP Anchors
- `.glass-card` CSS consolidation: 9 classes' glass properties merged into two multi-selector rules (base + solid override)
- New state helpers: `getAnchors`, `setAnchors`, `updateAnchor`, `addAnchor`, `removeAnchor`, `calcAnchors`
- `renderAnchorStrip()` on Weather tab below routing cards; only renders when ≥1 anchor matches `S.base` or `S.target`
- Backpack gains `MY PRICE ANCHORS` section with editable rows + `+ Add anchor` button (max 5)
- Currency picker modal extended to handle `anchor:N` type
- 6 new i18n keys × 3 languages
- SW cache bumped to `fx-weather-v24`

### v4.2 (2026-04-23) — ATM amortization slider
- HTML patch in `renderRouting()` → ATM card only gets `📊 expand` button
- New functions: `calcAtmTier`, `amountToSliderVal`, `atmBounds`, `toggleAtmPanel`, `updateAtmSlider`, `renderAtmPanelControls`, `goToBackpack`
- State additions: `S.atmOpen`, `S.atmSliderVal` (ephemeral, no localStorage)
- CSS: native range-input styled with `linear-gradient(90deg, red, amber, green)` track + cross-browser thumb rules; `.atm-slider-panel` with `max-height` transition for smooth open/close
- i18n: 8 new keys × 3 languages (atmSliderOpen / Close / Withdraw / Hint / HintEdit, atmTierExtreme / Meh / Good)
- SW cache bumped to `fx-weather-v25`
- Targeted DOM update on slider drag: patches only `#atm-amount` / `#atm-loss` / `#atm-tier`, slider focus preserved; `toggleAtmPanel` avoids `renderContent` so CSS transition fires

### Pending

- Cloudflare Pages project creation (manual, user-side)
- v4.3 VAT Refund Shield (awaiting PM copy)
- v4.4 AA Splitter modal
