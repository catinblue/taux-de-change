# FX Weather — Product Requirements Document

**Version:** v7.1 (Tab-moods + four-op calculator + Geo-IP mock + Playbook 8)
**Build target:** `weather.html` · Service Worker `fx-weather-v32` · Manifest `FX Weather`
**Status:** v5.0 Editorial → v5.0.1 Interaction polish → v6.0 Lumina reskin → v6.1 De-cardification → v6.3 Lumina Elite (feature release). Atomic CSS + HTML + JS additions; `calcRouting` / `calcAnchors` / `calcSplit` / business-logic untouched.
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

## 10.3 v6.1 De-cardification (shipped)

Second-pass visual correction on v6.0 Lumina. The earlier "cards on sage" still read as a generic white-tile list; this pass strips all surface chrome so information sits naked on the global background and layout is organized purely by typography, spacing, and hairline dividers.

**What was stripped (backgrounds, borders, shadows removed):**
- `.route-card` — was white card with border; now a vertical row with a single `1px rgba(13,18,19,0.1)` top hairline separating methods
- `.flashcard` (Guide) — same treatment
- `.setting-card` (Backpack rates, anchors, toggles, danger row) — same treatment
- `.time-machine` — naked, prefaced with hairline
- `.dcc-shield` — kept only the 3px accent-green left stroke as chrome; no background, no border
- `.first-run-banner` — fully naked, separated by top hairline
- `.ppp-bar` — white-card + negative overlay removed; lines sit directly on sage-light body
- `.best-pill` — was coral pill; now text-only `OPTIMAL` label in accent-green uppercase, same position

**New layout logic:**
- First-in-group rows get `border-top: 0` via `:first-of-type` / `:first-child` selectors so stacks don't start with a stray hairline
- Non-optimal route cards get `opacity: 0.52` to fade into secondary; the best route reads in full accent-green on all key elements (method name, cost, icon, OPTIMAL label). No chrome highlight — **color and opacity are the only hierarchy cues**
- Guide flashcards reveal their body with indented `padding-left: 36px` when open, giving an editorial blockquote feel instead of the prior card-frame padding

**What was preserved (per spec):**
- Modal sheets (`#currency-modal`, `#split-modal`) keep white `card-bg` background — spec allows white chrome ONLY on bottom-anchored active interaction panels
- Split modal internals (stepper buttons, segment buttons, input chrome) keep their existing styling — part of the modal's "active panel" surface
- Split trigger CTA stays as accent-green pill button — it's a primary action, not scrolling content
- Hero (black) and dock (black, top-rounded) unchanged — structural framing, not content
- ATM slider thumb + track — interactive control, chrome is intentional
- PPP edit-mode inputs — need minimal chrome for editability affordance

**What remained chromeless but PRESERVED from v6.0:**
- Semantic emoji (🩸🟡🟢 tier labels, 🧛‍♂️🏧🎓💸 flashcard illustrations) — carry meaning, not decoration
- All interaction physics (spring bezier, ticking numbers, pill fade-in, stagger entry, tab slide-in)
- All JS business logic

**File:** 82,968 → 83,967 bytes (+1 KB; mostly added `:first-of-type` / `:first-child` resets and dimming rules).
**Service Worker cache:** `v30` → `v31`.

## 10.4 v6.3 Lumina Elite (shipped)

Three-pillar feature release on top of v6.1 de-cardified Lumina.

### Pillar 1 — Dynamic weather gradients on hero

Replaces flat `--black-base` hero with a `linear-gradient(135deg, ...)` driven by the existing `calcWeatherBand()` output (no new math). Site-header shares the gradient's starting color for visual continuity. 1.2s CSS transition smooths band changes.

**Bands → hex pair:**
| Band | c1 | c2 | Intent |
|---|---|---|---|
| great | `#0F2D3D` | `#1E4A5F` | deep space blue |
| good | `#182E25` | `#264A3B` | deep forest green |
| stable | `#0D1213` | `#1F2726` | default near-black (neutral) |
| poor | `#2E1F16` | `#4A2F24` | burnt umber |
| storm | `#2E1319` | `#4A2030` | burgundy dark red |

New helper `applyHeroGradient()` called at end of `fetchR()` — reads `calcWeatherBand()` and sets two CSS vars (`--hero-grad-1`, `--hero-grad-2`) on `document.documentElement`. Pure visual, no business-logic change.

### Pillar 2 — Lumina Calculatrice (custom numeric keypad)

Native OS keyboard is suppressed via `readonly` + `inputmode="none"` on the hero input. Tap → bottom sheet rises with custom keypad.

**Keypad layout (4-col grid):**
```
1  2  3  ⌫
4  5  6  +
7  8  9  .
C  0  [Done · · spans 2]
```

**Expression engine:**
- State: module-level `_keypadExpr` string (e.g., `"12+5+3"`)
- Each press appends / validates / strips via `updateKeypad(char)`
- Live evaluation via `safeEval(expr)` — pure split-and-sum, no `eval()`. Regex guard: `/^[\d+.]*$/`; trailing `+.` stripped before parse. Only `+` operator supported in v6.3.
- Display: the keypad shows the raw expression; the hero amount input shows the **live evaluated result** formatted via `toLocaleString()`
- On result change, `S.amount` updates + `renderRoutes()` / `renderPPPContent()` re-run + ticks fire

**Edge cases handled:**
- Can't start expression with `+`
- Can't have `++` (consecutive operators)
- Only one `.` per term (split on `+`, check last term)
- 15-char length cap
- Leading-zero suppression (typing `0` then `5` becomes `5`, not `05`)
- `C` clears all, `⌫` backspaces one char

**Why it matters:** no iOS keyboard pushes hero off-screen; thumb reach preserved; ability to sum restaurant tabs (`12.50+8+3`) inline.

### Pillar 3 — Smart Discovery PPP

Replaces the `+ Add an anchor` button (empty row) with `+ Browse price anchors` → opens a bottom-sheet discovery panel.

**GLOBAL_PPP_DB schema:** 11 currencies × 4 categories (`food` / `grocery` / `tech` / `shopping`) × 3 items each = **132 price points**. All prices are tagged in-code as `[推论 · PM baseline 2026]` with an inline disclaimer in the modal: "Reference values — actuals vary. Edit after adding."

**Categories (i18n EN / ZH / FR):**
- food · 餐饮 · Restauration
- grocery · 超市 · Épicerie
- tech · 数码 · Tech
- shopping · 消费 · Loisirs

**Interaction flow:**
1. User on any currency pair (say EUR→CNY) → taps `+ Browse price anchors` in Backpack
2. Modal opens, shows items from `GLOBAL_PPP_DB[S.base]` (current local currency, e.g. EUR → Paris items)
3. Category pills at top (default `food`); tap pill → list switches category
4. Each row: emoji, label, price in BASE, `+` button
5. Tap `+` → row pushed into `fx_anchors` with `label = "{item.label} ({city})"` and currency = `S.base`
6. Weather tab's PPP strip updates in-place; Backpack tab re-renders if active
7. Auto-close at MAX_ANCHORS (5)

**SWR infrastructure (stub):** `fetchSmartPPP()` is present as `async` function that logs `[fetchSmartPPP] v6.3 stub — remote endpoint planned for v7.x`. No remote wiring yet. Discovery uses bundled `GLOBAL_PPP_DB` baseline only. When the Edge Worker endpoint ships, this function will merge fresh JSON into the in-memory DB without blocking the UI.

### Seed anchors migration

`seedAnchorsIfEmpty()` was pointing to the old `PPP_DB.bigMac`/`coffee` fields. Now it reads `GLOBAL_PPP_DB[S.base].food.slice(0, 2)` (first two food items from user's base currency), preserving the exact seed behavior (Big Mac + Coffee for most currencies) with identical `"Label (City)"` format.

### Preserved (per PM directive — JS business logic frozen)

Zero changes to: `calcRouting`, `calcAnchors`, `calcSplit`, `calcAtmTier`, `calcTimeMachine`, `calcWeatherBand`, `tickNumber`, `fetchR`'s network code, `updateRouting`, `editPPPAnchor`, `savePPPEdit`, I18N engine structure, localStorage scheme.

### File size

- weather.html: 83,967 → **108,639 bytes** (+24.7 KB)
- Breakdown: GLOBAL_PPP_DB ~6.5 KB (132 price points), keypad HTML+CSS+JS ~4.5 KB, Discovery HTML+CSS+JS ~4 KB, HERO_GRADIENTS + applyHeroGradient ~1 KB, i18n additions across 3 langs ~1.2 KB, rest is comment and whitespace

Over 100 KB for a single-file PWA — still well within acceptable PWA shell size (mobile networks handle 100 KB in sub-second), zero external dependencies.

### Service Worker cache

`v31` → `v32`.

## 10.5 v6.4 Infinite Anchor Engine (shipped)

### Motivation

v6.3 Smart Discovery shipped a **closed** set: 11 currencies × 4 categories × 3 items = 132 hardcoded anchors. Useful as a first-run seed, useless the moment a user asks about an item we didn't pre-curate (PS5 in Japan, a croissant in Lisbon, a Shinkansen ticket). v6.4 replaces the closed pill-picker with an **open search bar** that round-trips to an LLM via a Cloudflare Edge Worker and caches the result directly into the user's `fx_anchors`.

Design intent: keep the app offline-first and instant for the calculator path; only hit the network on an explicit search. `calcRouting`, `calcWeatherBand`, `calcSplit`, and every anchor read/write stay untouched.

### Architecture

**Frontend (weather.html)**

- `openDiscovery()` now shows a text input + Go button + popular-in-city chip list (sourced from local `GLOBAL_PPP_DB`).
- `searchAnchor()` — `POST` to `LLM_SEARCH_ENDPOINT = 'https://api.ourdomain.com/search-ppp'` with `{query, currency: S.base}`. Expected response `{emoji, label, price, currency}` validated client-side; `price` must be a finite number, `currency` must match the request shape. Response appended to `getAnchors()` via `setAnchors(arr)`.
- `addSuggestedAnchor(cat, idx)` — zero-network fast-path: pulls the first item per category from `GLOBAL_PPP_DB[S.base]` and adds it to anchors. Used for the popular-in-city chip strip so users with `MAX_ANCHORS == 0` can still seed their wallet without burning an LLM call.
- Status UI: `searching…` while in-flight, red `searchError` copy on failure, non-blocking `maxAnchors` warning when `getAnchors().length >= 5`.

**Backend (worker.js — Cloudflare Worker, module format)**

- Endpoint: `POST /search-ppp`, CORS open (`*`), JSON only.
- Calls OpenAI `gpt-4o-mini` with `response_format: {type: 'json_object'}`, `temperature: 0.2`, `max_tokens: 120`. System prompt forces the 4-field schema + realistic city-inferred price in target currency.
- Server-side validation before returning: emoji length ≤4, label truncated to 64 chars, price coerced to finite non-negative number, currency matches `^[A-Z]{3}$` or falls back to the request currency.
- `env.OPENAI_API_KEY` read from Wrangler secrets — never shipped to the frontend.
- Query length capped at 200 chars to bound prompt cost.

### Epistemic discipline

- Disclaimer copy updated in all 3 langs: `"AI-estimated reference values — actuals vary. Edit after adding."` Anchors added by LLM are explicitly marked as estimates, not facts. User can edit any anchor post-add via the Backpack tab.
- Local `GLOBAL_PPP_DB` retained as a fallback seed + suggestion source. Its existing `[推论]` tagging in comments is unchanged.

### Removed (vs v6.3)

- Discovery category pills (`.discovery-pills`, `.discovery-pill`) and their click handler (`selectCategory`)
- `renderDiscoveryBody()`, `addAnchorFromPPP()`, `fetchSmartPPP()` stub
- `_discoveryCategory` state, `DISCOVERY_CATS` constant
- i18n keys: `pppCategory`, `pppNoData` across EN/ZH/FR

### Added (vs v6.3)

- i18n keys: `searchPlaceholder`, `searchSubmit`, `searching`, `searchError`, `maxAnchors`, `suggestionsLabel` × 3 langs
- CSS rules: `.search-bar`, `.search-input`, `.search-submit`, `.search-status`, `.suggestions-label`, `.suggestions-list`, `.suggestion-chip`, `.suggestion-emoji`, `.suggestion-label`, `.suggestion-price`
- JS: `LLM_SEARCH_ENDPOINT`, `LOCAL_CATS`, `renderSuggestions()`, `addSuggestedAnchor()`, `searchAnchor()`
- File: `worker.js` at project root (new)

### Deployment

`worker.js` will **404/CORS-fail** until it is actually deployed to a domain resolving at `api.ourdomain.com`. This is expected scaffolding state — the frontend is ready; the backend endpoint is PM's to provision.

Deploy flow:
1. `npm i -g wrangler && wrangler login`
2. `wrangler secret put OPENAI_API_KEY`
3. `wrangler deploy` (route `api.ourdomain.com/search-ppp` → this worker)

Until deployed, the search box fails gracefully: error status shown, no crash, no anchor added. The popular-chip fast-path works offline regardless.

### Service Worker cache

`v33` → `v34`. Same-origin assets still cache-first; `api.exchangerate-api.com` still network-first; cross-origin `api.ourdomain.com` is pass-through (no interception).

## 10.6 v7.0 True Lumina visual overhaul (shipped)

### Motivation

The v6.x "Lumina" line (sage-light background, forest-dark accents, de-cardified rows) missed the intended visual identity. v7.0 is a ground-up reskin toward a spatial, full-bleed dark gradient shell with a white bottom sheet and ultra-thin typography — emphasising hero contrast, geometric font (Outfit), and the numpad-as-ghost aesthetic.

### What changes (visual)

**Typography** — Outfit (Google Fonts, weights 200/300/400/600) replaces system fonts. Massive numbers render at `font-weight: 200` (ultra-thin). All utility labels are `font-size: 10px`, `font-weight: 600`, `letter-spacing: 1.5px`, `text-transform: uppercase`. The "rule of contrast" between hairline numbers and tiny uppercase captions is the core visual identity.

**Shell** — `body` is now `height: 100dvh; overflow: hidden` with a full-bleed `linear-gradient(160deg, var(--hero-grad-1), var(--hero-grad-2))`. The existing `HERO_GRADIENTS` table drives body color via `--hero-grad-1/--hero-grad-2` (set on `documentElement`), so weather bands still modulate the whole background, not just a rectangle.

**Hero (Weather tab)** — two floating currency blocks directly on the dark gradient:
- Block 1 (base): tiny uppercase label `${BASE} · ${full name}` → 80px weight-200 transparent input (right-aligned, white).
- Hairline divider (1px `rgba(255,255,255,0.12)`) with a swap icon button that calls the new `swapCurrencies()`.
- Block 2 (target): tiny uppercase label `${TARGET} · ${full name}` → 70px weight-200 converted amount at `color: rgba(255,255,255,0.82)`.
- Action pills row: glass chips (`backdrop-filter: blur(10px); background: rgba(0,0,0,0.22)`) hosting the weather-band label and a split trigger.

**Bottom sheet** — a `.bottom-sheet` div (pure white, `border-top-{left,right}-radius: 32px`, `box-shadow: 0 -10px 40px rgba(0,0,0,0.28)`) that `flex: 1` inside `#content`. It holds PPP anchors, DCC shield, first-run banner, route list, time machine. A 36×4 gray drag handle sits at the top. Internal content scrolls; padding-bottom reserves space for the dock.

Guide and Backpack tabs use `.bottom-sheet.full` — same white sheet, no hero above it.

**Ghost numpad** — restructured from 4×4 colored buttons to a strict 3×4 transparent grid. No backgrounds, no borders, just Outfit-300 numbers. `:active` paints a subtle `rgba(13,18,19,0.06)`. Secondary bar below the grid holds `C` / `+` / `Done`; Done stays the accent-green pill.

**Routes as minimalist list** — `.route-card` rows are black text on white, separated by `#F0F0F0` hairlines. The "best" route is rendered in bold `#5A9374` accent-green (weight 600 on both the method label and the 26px cost). Non-best rows use `weight: 300` (tabular-nums).

**Dock** — repositioned from black to pure white (matches the sheet), bordered top by `#F0F0F0`. Active = `--accent-green`, inactive = 40% black.

**Modals** — same transform-up behavior; internal surfaces restyled from `sage-light` to `#F5F5F7` for consistency with the new neutral palette.

### What stays (unchanged)

- All JS renderer class names preserved — `vWeather/vGuide/vBackpack` wrap content in `.bottom-sheet` but every inner class (`route-card`, `flashcard`, `setting-card`, `anchor-row-line`, etc.) still matches the JS outputs.
- All JS business logic untouched — `calcRouting`, `calcWeatherBand`, `calcSplit`, `calcAnchors`, `fetchR`, `safeEval`, i18n dicts, `LLM_SEARCH_ENDPOINT` proxy, keypad state machine.
- `HERO_GRADIENTS` table and `applyHeroGradient()` unchanged — now drives body instead of hero rectangle.
- Service Worker strategy unchanged.
- Epistemic rules, `[推论]` tagging, real APIs, trilingual EN/ZH/FR — all preserved.

### Added JS

- `CURS_NAMES` (EN/ZH/FR full currency names) + `currencyName(code)` lookup.
- `swapCurrencies()` — swaps `S.base ↔ S.target`, resets cost caches, re-fetches rate.
- `updateKeypad()` now also updates `#hero-target-amount` live on every digit.

### Removed

- `--forest-dark` as a visible surface color (still defined as a var for the `--red` alias compat, used internally by `calcAtmTier` only).
- `.pair-selector` pill chrome — the pair is now the two separate hero labels.
- `.split-trigger-btn` call-to-action strip inside the sheet — moved to the hero action-pills row for a higher-contrast entry.
- The Lumina 4×4 colored keypad — replaced by the 3×4 ghost grid + separate action row.

### Deployment

No new endpoint work. The `worker.js` + `LLM_SEARCH_ENDPOINT = 'https://api.ourdomain.com/search-ppp'` scaffolding from v6.4 is unchanged and still awaits real deployment.

### Service Worker cache

`v34` → `v35`. Asset hash changed substantially (CSS fully rewritten, DOM structure of Weather/Guide/Backpack tabs restructured, keypad HTML restructured).

### Caveats

- Browser testing from inside the authoring session was blocked (Playwright MCP failed to initialise). Full visual regression should be done manually on-device before any push to `origin/main`.

## 10.7 v7.1 Tab moods + Calculator + Geo-IP mock + Playbook 8 (shipped)

### 1. Tab-specific mood gradients

`applyHeroGradient()` → `applyTabGradient(tab)`. Weather still runs band-driven via `HERO_GRADIENTS`; Guide and Backpack are fixed:

- Guide → `linear-gradient(160deg, #0A1128, #162244)` (midnight blue, reading calm)
- Backpack → `linear-gradient(160deg, #150E17, #2D1B2E)` (deep blackberry, private vault)

`body { transition: background 0.5s ease }` (was 1.2s). `renderContent()` now calls `applyTabGradient(S.activeTab)` on every tab switch so the crossfade triggers. Weather's mood is still `calcWeatherBand()` output; Guide/Backpack ignore the weather band entirely.

Legacy `applyHeroGradient()` is kept as a shim delegating to `applyTabGradient(S.activeTab)` so existing callers (e.g. `fetchR`) still work.

### 2. Four-op calculator

`safeEval()` replaced with a shunting-yard tokeniser + RPN evaluator. No `eval()`, no `Function()`. Features:

- Full BODMAS: `15+4.5*2` = `24`, not `39`.
- Operator precedence table `{ '+':1, '-':1, '*':2, '/':2 }`.
- Tokeniser regex gate: `^[\d+\-*/.\s]*$` — anything else short-circuits to `NaN`.
- Trailing operator / dot stripped before evaluation so partial expressions preview a running total.
- Division by zero → `NaN` (not `Infinity`) so the UI reverts gracefully.
- Operator keys can replace a trailing operator (prevents `++` / `+*` junk); leading `-` treated as sign.

Keypad HTML restructured: a dedicated `.keypad-ops` row (`+ − × ÷`, accent-green text, ghost background) sits above the 3×4 digit grid. `.keypad-actions` row trimmed to `[C]` + `[Done]` only (2-col grid with Done spanning 2fr).

Display rendering: `formatKeypadExpr(e)` converts ASCII `*` `/` `-` `+` → `×` `÷` `−` `+` with single-space padding, so the working tape reads like a real calculator.

### 3. Blinking cursor + keypad hint

The amount field was a `readonly <input>` — now a `<div id="calc-in" role="button">` that contains `<span id="hero-amount-text">…</span><span class="hero-cursor"></span>`. The cursor is a 2 × 0.72em white bar blinking at 1 Hz (`@keyframes cursorBlink` with step-end timing for a crisp on/off). When the amount is empty, `#hero-amount-text:empty::before { content: '0'; opacity: 0.22 }` shows a ghost zero so the hero never looks blank.

Below the amount: `<div class="hero-keypad-hint">⌨️ Tap to calculate</div>` at 0.5 opacity, right-aligned, 10px uppercase 1.5px letter-spacing. Trilingual (`Tap to calculate` / `按此计算` / `Appuyez pour calculer`).

`updateKeypad()` now writes to `#hero-amount-text` textContent instead of the old `input.value`.

### 4. Zero-click Geo-IP PPP (MOCK)

PM accepted that `navigator.geolocation` cannot be silent — the browser always prompts. v7.1 ships the UI loop against a frontend mock of the IP-based endpoint so the demo stays seamless while the real Worker is still unwired.

Flow:

1. On first Weather-tab render, `maybeRenderGeoBanner()` runs → calls `autoDetectGeoPPP()`.
2. `autoDetectGeoPPP()` logs `[Mock] Geo-IP Fetch: Pretending to be in Osaka`, then `setTimeout(500ms)` returns a hardcoded Osaka payload (5 JPY items: Ichiran ramen 1050, takoyaki 650, Osaka Metro 240, kaiten-zushi 140, Starbucks tall latte 475).
3. Banner slides in at the top of `.bottom-sheet`: `📍 Detected Osaka — local price anchors ready. [Add] [✕]`.
4. `acceptGeoPPP()` — pushes up to `MAX_ANCHORS - current.length` items into `fx_anchors`, sets `localStorage.fx_geo_applied = 'true'`, re-renders.
5. `dismissGeoBanner()` — sets `localStorage.fx_geo_dismissed = 'true'`; both flags are one-shot per install.

Wiring it to the real Worker (future) requires only swapping the `setTimeout(500ms, mock)` with a `fetch('https://api.ourdomain.com/geo-ppp')` whose response matches the same `{city, country, currency, items[]}` shape. Worker side will read `request.cf.city` and `request.cf.country` for zero-click detection.

### 5. Playbook 8 — four new guide cards

On top of the existing 4 (DCC / ATM / timing / refund counter), v7.1 adds four `[推论]`-anchored hard-knowledge cards, trilingual:

- **Weekend Markup (🛑)** — FX markets close Fri night → Mon morning; Visa / Mastercard / Revolut add roughly 0.5–1% weekend spread. Settle big spend on weekdays.
- **Cash or Plastic? (💵)** — Germany and Japan remain cash-heavy; Sweden, UK and Nordics are effectively cashless. Rule of thumb, not a per-country matrix.
- **Tipping Culture (🪙)** — US 18–20% at sit-down restaurants; EU continental bakes service in; Japan tipping is mildly rude.
- **Local Payment Networks (📱)** — PromptPay (TH), PIX (BR), UPI (IN), iDEAL (NL), Alipay / WeChat Pay (CN). Rail-switching kills foreign-card surcharges.

Numbers are intentionally expressed as ranges or "roughly" language — no fake-precise percentages. The spirit carries over the v5.0 `[推论]` discipline without the inline code tag (flashcards are user-facing copy, not code comments).

### What stays

- `calcRouting` / `calcSplit` / `calcAnchors` / `calcWeatherBand` — unchanged.
- `safeEval` signature unchanged (still `(expr: string) => number`); only the parser body rewrote.
- Every JS-referenced DOM id and class from v7.0 still emitted by the renderers.
- `worker.js` unchanged in this release (real LLM search + geo endpoint still await deployment).

### Service Worker cache

`v35` → `v36`. CSS, JS, and HTML all touched.

### Known caveats

- Geo-IP detection is MOCKED. Hardcoded Osaka payload. Real Worker endpoint still unbuilt; flip-over is a one-line `fetch` swap when the Worker ships.
- Browser testing from the authoring session was again blocked (Playwright MCP did not initialise). Manual device check recommended before pushing.

## 11. v5.0 final state — preserved disciplines

- **Trilingual EN / ZH / FR.** All strings i18n'd.
- **No fake-precise data.** Big Mac values sourced from The Economist Index (comment tagged `[推论]`). Coffee values tagged `[推论 · PM estimate]`. All user-editable.
- **Real APIs.** `exchangerate-api.com/v4` + `frankfurter.dev/v1`.
- **Stateless for ephemeral UI.** Split modal / ATM slider / openCard all in-memory only.
- **Zero regression** — every v3.0 / v4.x feature works identically. Only skin + first-run experience changed.
