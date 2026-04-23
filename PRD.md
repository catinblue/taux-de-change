# FX Weather — Product Requirements Document

**Version:** v6.0 (Lumina — Morandi Forest + Extreme Black)
**Build target:** `weather.html` · Service Worker `fx-weather-v30` · Manifest `FX Weather`
**Status:** v5.0 Editorial → v5.0.1 Interaction polish → v6.0 Lumina visual reskin. Zero JS / business-logic changes; pure CSS + minor HTML/i18n layer.
**Scope arc:** v2.0 bilingual PWA → v3.0 Nomad routing → v4.0 glassmorphism + trilingual → v4.1 Custom Anchors → v4.2 ATM Slider → v4.3 VAT Refund card → v4.4 AA Splitter → **v5.0 Editorial Fintech reskin + PPP seeding**.

---

## 1. Product positioning (reaffirmed)

FX Weather stays a zero-backend, single-file PWA serving the Nomad persona. The **functional brief is unchanged**; v5.0 is **visual / tone / first-run-experience** work only. Every payment-routing, DCC, ATM, Time Machine, AA Splitter, and Guide feature from v4.x survives intact. Glassmorphism is retired in favor of an Editorial Fintech visual register that signals precision over playfulness.

---

## 2. What changes vs v4.4

### 2.1 Removed (explicitly)

| Removed | Reason |
|---|---|
| Dynamic weather gradient background | Replaced by static coral + white + light-gray palette |
| Glassmorphism (`backdrop-filter: blur(...)`) across all surfaces | Retired per PM aesthetic pivot |
| High Contrast Mode toggle + `fx_contrast_mode` localStorage key | Entire app is now default high-contrast; toggle no longer meaningful |
| `:root.solid` CSS variant | No more gradient to escape from |
| Ambient emojis (90% of decorative glyphs) | Editorial register; emojis only retained where they carry semantic weight (see §4.4) |
| `fx_theme` localStorage key references that lingered in FOUC script | Replaced by single-palette static CSS |
| `GRADIENTS` color table | No longer driven by `calcWeather` |
| `applyWeatherGradient()` call path (except badge labels) | `calcWeather` still runs — its output now surfaces as a compact text label, not a whole-page gradient |

### 2.2 Preserved (functional — zero regression)

All of the following continue to work exactly as before:

- Trilingual EN / ZH / FR engine + language cycle
- `exchangerate-api.com/v4` live rate + `frankfurter.dev/v1` 30-day history
- `calcRouting()` 3-method payment comparison + dynamic sort
- `calcWeather()` 7-day MA band computation (now used only for a compact label, not background)
- DCC Shield (directional: pay in BASE)
- First-run banner + 3 dismissal triggers
- Amount input with 10-digit clamp + ellipsis overflow
- `calcAnchors()` filtering + weather-tab inline strip
- Anchor editing in Backpack
- ATM expand-slider with exponential mapping
- Time Machine (1,000 BASE vs last trading week)
- VAT Refund Trap (4th flashcard in Guide, with `{BASE}/{TARGET}` interpolation)
- AA Splitter modal with stepper + segmented payer
- Haptic engine (all existing trigger points)
- iOS / mobile hardening (safe-area, 44px touch target, caret fix, no-zoom)
- Service Worker cache-first strategy
- `t()` i18n accessor + all existing keys

### 2.3 Added

| Added | Description |
|---|---|
| Editorial color system | `#FFFFFF` bg / `#F5F5F7` surface / `#FF5A5F` coral accent / `#000000` text / `#86868B` muted text |
| Hero section coral block | Full-width top band in coral, rounded bottom-right, containing currency picker + hero amount input |
| White transitional PPP bar | Fixed-position inline strip between hero and routes, shows anchor conversions ("≈ 24 Big Macs in Paris") |
| Light gray routes section | Background `#F5F5F7` to visually separate "what you pay" from "how much" |
| Static `PPP_DB` seed | First-launch population of `fx_anchors` with Big Mac + Coffee entries per currency, tagged with city default |
| Weather label (downgraded from gradient) | `calcWeather` result rendered as small text badge ("+ 0.4% · Good") in hero, not a whole-page color |
| Editorial typography | SF Pro Display / Inter; hero amount `clamp(64px, 18vw, 96px)`; section labels 11px uppercase tracking |
| Monochrome SVG icons (dock + methods) | Replace dock emojis (🌤️📚🎒) and method emojis (💳💵) with inline SVG strokes |

---

## 3. Visual system spec

### 3.1 Palette

```css
:root {
    --bg: #FFFFFF;
    --surface: #F5F5F7;
    --accent: #FF5A5F;        /* coral */
    --text: #000000;
    --text2: #86868B;
    --line: #E5E5E7;
    --green: #2EB67D;          /* optimal route */
    --red: #D93025;            /* danger (delta, worst ATM tier) */
    --amber: #E8A33D;          /* mid ATM tier */
    --safe-b: env(safe-area-inset-bottom);
}
```

**No `:root.solid` variant.** Palette is singular. No `@media (prefers-color-scheme: dark)` override either — v5.0 ships light-only. If PM later asks for dark, it's a separate sprint.

### 3.2 Typography scale

| Use | Size | Weight | Letter-spacing |
|---|---|---|---|
| Hero amount input | `clamp(64px, 18vw, 96px)` | 700 | `-0.04em` |
| Currency picker label | 24px | 700 | `-0.02em` |
| Section label (uppercase) | 11px | 800 | `1.2px` |
| Route method name | 12px | 800 uppercase | `1px` |
| Route cost | 28px | 700 | `-0.02em` |
| Body / hints | 13-14px | 600 | `0` |
| Muted footnotes | 10-11px | 600 | `0.2px` |

### 3.3 Layout stack (Weather tab)

```
┌─────────────────────────────────────┐
│  HERO (coral, rounded bottom-right) │
│                                     │
│  FX WEATHER             EN·ZH·FR   │
│                                     │
│  EUR → CNY      (currency picker)   │
│                                     │
│  ENTER AMOUNT                       │
│  100              ← hero 80px       │
│                                     │
│  + 0.4% · Good                      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐  ← white, rounded top-left
│  ≈ 17 Big Macs in Paris             │
│  ≈ 22 Coffees in Paris              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐  ← light gray
│                                     │
│  🛡 DCC Shield (coral border-left)   │
│                                     │
│  PAYMENT ROUTES                     │
│  ┌───────────────────────────────┐  │
│  │ Zero-FX         [OPTIMAL]     │  │
│  │ 780.50 CNY                    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Classic                       │  │
│  │ 795.00 CNY       + 14.50 vs  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ ATM              [📊 Curve]  │  │
│  │ 820.15 CNY       + 39.65 vs  │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Split this bill →]                │
│                                     │
│  ⏰ Time Machine …                  │
│                                     │
└─────────────────────────────────────┘
Dock: Weather · Guide · Backpack (text + tiny SVG)
```

### 3.4 Emoji retention policy

**Keep (semantic anchor):**
- ATM tier feedback: 🩸 / 🟡 / 🟢 (color-coded feedback, essential)
- Guide flashcard hero emojis: 🧛‍♂️ / 🏧 / 🎓 / 💸 (editorial illustration, not decoration)
- DCC Shield: 🛡 (warning icon)
- Weather label in hero: no emoji, text-only

**Replace with monochrome inline SVG:**
- Dock items (was 🌤️📚🎒): `home`, `book`, `bag` glyphs
- Payment method icons (was 💳💳💵): `card`, `card`, `cash` glyphs
- ATM expand trigger (was 📊): text only `See curve`
- Split trigger (was 🧾): text only `Split this bill`
- Language cycle (was 🌍): text `EN · ZH · FR` showing all three, current in solid black
- Anchor strip prefix (was 🧮): text `≈`
- Footer slogan: no decorative emoji

**Drop entirely:**
- Hero-header emoji prefix (📚 / 🎒 on Guide / Backpack titles)
- Trash icon on clear cache (was 🗑️): replace with text `Reset`
- Crown on best route tag (was 👑): replace with text pill `[OPTIMAL]`
- ⏰ on Time Machine: replace with text label

### 3.5 Cards and elevation

- Route cards: white fill, 20px radius, 1px solid `--line`, no shadow by default
- Best route: 2px solid `--text` (black border, denotes primacy without coral competition)
- Modals (currency picker + split): keep bottom-sheet behavior; white fill, 28px top-radius, subtle shadow `0 -8px 24px rgba(0,0,0,0.08)`
- Flashcards in Guide: white fill, 20px radius, 1px `--line`, same accordion behavior

No `backdrop-filter`. No gradient borders. No `rgba` card backgrounds.

---

## 4. `PPP_DB` seeding mechanism

### 4.1 Data source + epistemic tagging

```js
// [推论] Big Mac values: The Economist Big Mac Index July 2024 (publicly published semiannually)
// [推论 · PM estimate] Coffee values: PM-authored reference prices for typical coffee in the city named
// City defaults are reasonable anchors but user-editable per anchor
const PPP_DB = {
    EUR: { bigMac: 5.80, coffee: 4.20, city: 'Paris' },
    USD: { bigMac: 5.69, coffee: 5.00, city: 'New York' },
    GBP: { bigMac: 4.89, coffee: 3.50, city: 'London' },
    CNY: { bigMac: 25.0, coffee: 22.0, city: 'Shanghai' },
    JPY: { bigMac: 480,  coffee: 450,  city: 'Tokyo' },
    CHF: { bigMac: 6.70, coffee: 5.20, city: 'Zurich' },
    AUD: { bigMac: 7.70, coffee: 5.50, city: 'Sydney' },
    CAD: { bigMac: 7.00, coffee: 4.80, city: 'Toronto' },
    SGD: { bigMac: 5.90, coffee: 5.00, city: 'Singapore' },
    HKD: { bigMac: 23.5, coffee: 45.0, city: 'Hong Kong' }
};
```

Big Mac values are cross-checkable against Big Mac Index. Coffee values are openly flagged as PM estimates. This is the same `[推论]` honesty bar we held in v4.x: assumptions displayed transparently, user can override.

### 4.2 Seeding trigger (one-shot on first launch)

```js
function seedAnchorsIfEmpty() {
    if (localStorage.getItem('fx_anchors_seeded') === 'true') return;
    const existing = getAnchors();
    if (existing.length > 0) {  // user already has something — never overwrite
        localStorage.setItem('fx_anchors_seeded', 'true');
        return;
    }
    const baseData = PPP_DB[S.base];
    const targetData = PPP_DB[S.target];
    const seeded = [];
    if (baseData) {
        seeded.push({ emoji: '🍔', label: `Big Mac (${baseData.city})`, price: baseData.bigMac, currency: S.base });
        seeded.push({ emoji: '☕', label: `Coffee (${baseData.city})`, price: baseData.coffee, currency: S.base });
    }
    if (targetData && S.target !== S.base) {
        seeded.push({ emoji: '🍔', label: `Big Mac (${targetData.city})`, price: targetData.bigMac, currency: S.target });
    }
    if (seeded.length) setAnchors(seeded);
    localStorage.setItem('fx_anchors_seeded', 'true');
}
```

Called once inside `init()` before `renderContent()`. Never re-seeds. User can delete all anchors and the app stays at zero (their choice is respected).

### 4.3 City is user-editable per anchor

The `label` field stores `"Big Mac (Paris)"`. User can rename it to `"Big Mac (Madrid)"` in Backpack and change the price to a number they know personally. This is identical to the v4.1 anchor editing UX, just with sensible defaults on first open.

### 4.4 Weather-tab anchor strip visual (Editorial treatment)

Replaces the v4.1 single-line `🧮 相当于 🍜 22 · 🍔 16` into a cleaner stacked list:

```
≈ 24 Big Macs in Paris
≈ 22 Coffees in Paris
```

One line per anchor. Prefix `≈`. Body: count + label. Right-aligned or left-aligned (PM pick).

---

## 5. Tab-by-tab Editorial treatment

### 5.1 Weather tab

As per §3.3 layout. PPP bar is the new element between hero and routes; everything else is existing content re-skinned.

### 5.2 Guide tab

Same 4 flashcards (DCC / ATM / Tuition / VAT). White cards, 1px border, black title, muted grey body. Hero title `Pocket Guide` without decorative prefix. Flashcard emoji (🧛‍♂️ / 🏧 / 🎓 / 💸) retained per §3.4.

### 5.3 Backpack tab

Same rows as v4.4, with:
- **Removed:** High Contrast Mode toggle (deprecated)
- **Retained:** Haptic toggle, Wallet Rates section, Anchors section (with seeded content on first open), Reset cache
- **Visual:** white cards with 1px border, no coral accent except on interactive primary actions

---

## 6. i18n additions

~6 new keys × 3 languages. Additions only — existing v4.x keys are fully reused.

| Key | EN | ZH | FR |
|---|---|---|---|
| `heroAmountLabel` | ENTER AMOUNT | 输入金额 | MONTANT |
| `weatherLabelDelta` | vs 7-day avg | 较 7 日均值 | vs moy. 7j |
| `pppEqualsPrefix` | ≈ | ≈ | ≈ |
| `pppInCity` | in {city} | 在 {city} | à {city} |
| `pppItemBigMac` | Big Mac | 巨无霸 | Big Mac |
| `pppItemCoffee` | Coffee | 咖啡 | Café |
| `routesSection` | PAYMENT ROUTES | 支付方案 | MOYENS DE PAIEMENT |
| `bestPill` | OPTIMAL | 最优 | OPTIMAL |

Removed keys (High Contrast row no longer exists): `highContrastLabel`.

---

## 7. Non-functional requirements

- Single HTML payload: target under **85 KB** (v4.4 was 72.5 KB; adds ~8 KB for Editorial CSS rewrite + PPP_DB + seeding logic; removes ~2 KB of gradient / dark-palette / high-contrast code)
- No build step, no bundler, no frameworks
- First paint unblocked (FOUC script removed since no theme detection needed)
- Single palette (light-only); users wanting dark can invoke browser-level dark reader
- Real APIs preserved; offline SW cache-first still applies

---

## 8. Sprint execution plan (atomic v5.0 commit)

Changes to ship v5.0 as a single atomic commit:

1. **CSS full rewrite** — drop all v4.x theming (gradient vars, `:root.solid`, `@media prefers-color-scheme`, `backdrop-filter`). Install new Editorial palette + layout stack. ~250 new lines, ~200 lines deleted.
2. **HTML structure edit** — restructure `.layout` to use the three-segment stack (hero / ppp-bar / main gray). `#currency-modal` and `#split-modal` retained unchanged. Header now shows `EN · ZH · FR` inline picker instead of `🌍`.
3. **Add `PPP_DB` constant** — 10 currencies, Big Mac + Coffee + city. Inline comment tags `[推论]`.
4. **Add `seedAnchorsIfEmpty()`** + call in `init()` before first `renderContent()`. Uses `fx_anchors_seeded` latch.
5. **Refactor `renderAnchorStrip()`** — stacked list format (multi-line) instead of single-line inline.
6. **Remove** `toggleContrastMode()`, `fx_contrast_mode`, all `:root.solid` selectors, `applyWeatherGradient`, `GRADIENTS` table.
7. **Preserve** `calcWeather` but downgrade its consumer: render band label as small text in hero (not gradient on background).
8. **Replace emoji glyphs** per §3.4 retention policy. Inline SVG for dock icons (~6 SVGs, ~1.5KB total).
9. **Add i18n keys** per §6 × 3 languages; remove deprecated `highContrastLabel`.
10. **Service Worker cache bump** to `fx-weather-v28`.
11. **PRD.md** updated (this document).
12. **Commit** as single atomic `FX Weather v5.0: Editorial Fintech reskin + PPP seeding`.

No push until PM Checkpoint 2 approval.

---

## 9. Locked decisions (PM sign-off 2026-04-23)

- **9.1 Dock icons:** (a) — hand-picked inline SVG (1.6px stroke). `compass` / `book` / `briefcase` glyphs for Weather / Guide / Backpack respectively.
- **9.2 Language switcher:** (a) — inline `EN · ZH · FR` with current state in bold black, others in muted gray. Direct click-to-set (no cycling).
- **9.3 Weather label in hero:** (a) — full `+ 0.42% · Good` format. Delta with sign + band name (i18n `weatherBand` dict per language).
- **9.4 PPP label format:** (a) — `"Big Mac (Paris)"` parenthetical city format. User can rename anchor entirely in Backpack (e.g., change to `"Big Mac (Madrid)"` + new price).
- **9.5 Coral accent touch points:** (b) — three beats only: (1) hero background, (2) OPTIMAL pill on best route, (3) Split CTA pill. Everything else is black/gray/white. Split modal result number stays black for extra restraint.

---

## 10. Sprint execution log (v5.0)

Shipped atomically as a single commit. Delta vs v4.4:

- **HTML:** restructured from flat layout to three-segment stack (hero / ppp-bar / routes-section) on Weather tab; `tab-header` + `tab-body` on Guide / Backpack. Pair-selector moved from global into Weather hero (other tabs don't show it). Language cycle button `🌍` replaced with inline `EN · ZH · FR` picker in site-header.
- **CSS:** Complete rewrite. Dropped ~900 lines of glassmorphism / dark-palette / `:root.solid` / `@media prefers-color-scheme` / weather-gradient rules. Added ~450 lines of Editorial layout (coral hero, white PPP bar, gray routes section, tab-header, flat card variants, black/coral/green accents).
- **Removed:** `toggleContrastMode()`, `applyWeatherGradient()`, `GRADIENTS` table, `fx_contrast_mode` localStorage writes, `:root.solid` CSS, `@media (prefers-color-scheme: dark)` variants, `weatherPhrase` dict, `highContrastLabel` i18n key, FOUC head script, High Contrast toggle row, emoji decorations on dock items / method cards / `🌍` button / `📚` and `🎒` title prefixes / `🎒` trash / `👑` crown / `🧮` anchor prefix / `⏰` time machine prefix.
- **Added:** `PPP_DB` constant with 10 currencies × `bigMac` / `coffee` / `city`; `seedAnchorsIfEmpty()` one-shot seeder; `renderHeroWeatherLabel()` for the `+ 0.42% · Good` hero label; `renderLangSwitch()` + `setLang()` direct-pick; `renderPPPContent()` replacing v4.x `renderAnchorStrip()` with stacked format; `ICONS` constant with 5 inline SVG strokes (compass / book / briefcase / card / cash); new i18n keys: `weatherBand` dict × 3 langs, `weatherDeltaVsAvg`, `heroAmountLabel`, `routesSection`, `bestPill`, `pppPrefix`.
- **Method copy simplified:** emoji-laden `"💳 Zero-FX Card"` → clean `"Zero-FX"` with inline SVG card/cash icon.
- **Seeded anchor labels:** `"Big Mac (Paris)"` / `"Coffee (Paris)"` / etc., editable by user.
- **Coral accent footprint:** hero background, best-route pill, Split trigger CTA. Nothing else.
- **Service Worker cache:** `fx-weather-v27` → `fx-weather-v28`.

## 10.1 v5.0.1 Interaction polish (shipped)

Added on top of v5.0 without touching any business logic. All changes are visual/interaction layer.

- **Spring physics:** modal bezier overshoot raised `(0.175, 0.885, 0.32, 1.1)` → `(0.175, 0.885, 0.32, 1.275)` for jelly bottom-sheet entry. Duration 0.35s → 0.42s.
- **Universal button press:** `scale(0.97)` on `:active` for every interactive element (buttons, cards, pickers, toggles, flashcards). 0.12s ease-out transition.
- **OPTIMAL pill fade-in:** new `pillFadeIn` keyframe (opacity + tiny translateX) animates when the best-route tag appears after a sort change.
- **ATM color morphing:** `transition: color 0.35s ease` on `#atm-loss` and `#atm-tier`. Smooth interpolation between red/amber/green tiers as the user drags the slider.
- **Staggered card entry:** new `cardFadeUp` keyframe driven by `--stagger` CSS var. Route cards (rank 1-3) and Guide flashcards (index 1-4) enter with 50ms increments.
- **Tab content horizontal slide:** `tabSlideIn` keyframe on direct children of `#content` with per-section 40ms increments — eliminates the instant-switch flash between Weather/Guide/Backpack.
- **Ticking numbers:**
  - `tickNumber(el, from, to, duration, formatter)` helper with `requestAnimationFrame` + easeOutCubic. Formatter parameter preserves per-caller formatting (locale string vs rounded int vs currency suffix).
  - Three tick consumers: route costs (per-method prev cache), PPP counts (per-anchor-index cache), Split per-share result (single global cache).
  - 380ms default duration, cancellable on rapid re-invocation via `WeakMap<el, RAF>`.
  - `resetCostCaches()` called on currency pair change to prevent incorrect prev-value interpolation.
- **PPP inline editing:** tap any `.ppp-line` on Weather tab → inline form with price + label inputs + ✓ save button. Enter-key saves. Save writes to `fx_anchors` anchor at index, invalidates the per-anchor tick cache, re-renders `#ppp-slot` with tick. Outer onclick self-disables via `editing` class check so double-tap doesn't re-enter edit mode.
- **Split per-share color:** `color: var(--text)` → `color: var(--accent)` per PM extension of §9.5 (coral footprint grows from 3 touch points to 4).

Sprint size: ~250 lines of code (CSS + JS).
weather.html: 71,556 → 81,166 bytes (+9.6 KB).
Service Worker: `v28` → `v29`.

## 10.2 v6.0 Lumina reskin (shipped)

Visual pivot from Editorial Fintech (coral on white) to Lumina (Morandi forest green + extreme black). PM directive: CSS + minor HTML/i18n only; **JS business logic frozen** (calcRouting / calcAnchors / I18N engine / AA Splitter / ATM Slider / localStorage scheme all untouched).

**Palette (Lumina):**
- `--black-base: #0D1213` — hero + dock (extreme night black)
- `--forest-dark: #2D3934` — currency picker pill, deprecated "warning" color
- `--sage-light: #D2DCD5` — page background, modal items, split result
- `--sage-mid: #BECCC2` — secondary text, borders, inactive lang/dock
- `--accent-green: #5A9374` — CTAs, optimal pill, dock active, amount text (THE color)
- `--card-bg: #FFFFFF` — all content cards

**Compat aliases retained** so existing JS that references `var(--red)` / `var(--amber)` / `var(--green)` / `var(--accent)` still evaluates without JS changes. `var(--red)` now resolves to `--forest-dark` (muted "bad"), `var(--amber)` to `--sage-mid` (soft caution). No red alerts anywhere in the UI — the "severity" language lives only in the retained ATM tier emoji 🩸 🟡 🟢 which carry semantic weight without chrome color.

**Inverted space architecture (black · green · white · black):**
1. Top — site-header merges into hero; black bg; border-bottom-left-radius 36px; drop shadow onto body.
2. Hero contents — forest-dark pill currency picker; hero amount in accent-green 80px weight 600; `CURRENT AMOUNT` label beneath.
3. PPP bar — white card floating across hero's bottom edge via `margin-top: -28px`; soft forest-dark shadow; anchor counts in accent-green.
4. Routes section — sage-light (body) bg; white cards with 1px `rgba(13,18,19,0.1)` border; OPTIMAL card gets 2px accent-green border + coral-replacement pill.
5. Dock — black bg, both top corners rounded 32px; SVG icons in sage-mid (inactive) / accent-green (active).

**Editorial copy tweak:**
- Hero amount label moved BELOW input (was above in v5.0) and re-labeled "Current amount" / "当前金额" / "Montant actuel" (was "Enter amount").

**Layer cleanups:**
- `backdrop-filter: blur` removed from every surface (zero remaining).
- Coral footprint (v5.0.1 had 4 touch points) mapped onto accent-green, repositioned per PM spec.
- `theme-color` meta flipped `#FF5A5F` → `#0D1213` to match status-bar expectation.
- Service Worker cache bump `v29` → `v30`.

**File size:** 81,166 → 82,968 bytes (+1.8 KB net; no JS diff).

## 11. v5.0 final state — preserved disciplines

- **Trilingual EN / ZH / FR.** All strings i18n'd.
- **No fake-precise data.** Big Mac values sourced from The Economist Index (comment tagged `[推论]`). Coffee values tagged `[推论 · PM estimate]`. All user-editable.
- **Real APIs.** `exchangerate-api.com/v4` + `frankfurter.dev/v1`.
- **Stateless for ephemeral UI.** Split modal / ATM slider / openCard all in-memory only.
- **Zero regression** — every v3.0 / v4.x feature works identically. Only skin + first-run experience changed.
