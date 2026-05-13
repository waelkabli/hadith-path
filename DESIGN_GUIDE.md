# Hadith Path — Design Guide

> This guide is the single source of truth for every visual and interactive decision in Hadith Path. All implementation agents, contributors, and design reviews must reference it. Deviation requires explicit approval and a corresponding update to this file.

---

## Font Setup

The project uses the **Thmanyah** type system — three Arabic typefaces (Serif Display, Serif Text, Sans) each covering a distinct role. The 8 selected files live at `/public/fonts/`. Vite serves that directory at the site root, so all `url('/fonts/...')` references resolve correctly in both dev and production.

**What was copied** (8 of 15 available files):

| File | Role |
|---|---|
| `thmanyahserifdisplay-Regular.woff2` | Hadith body text, main reading view |
| `thmanyahserifdisplay-Medium.woff2` | Emphasized display text |
| `thmanyahserifdisplay-Bold.woff2` | Large headings, isnad chain hero labels |
| `thmanyahsans-Regular.woff2` | Secondary Arabic UI text, captions |
| `thmanyahsans-Medium.woff2` | Buttons, labels, nav items |
| `thmanyahsans-Bold.woff2` | Strong UI labels, narrator names in compact lists |
| `thmanyahseriftext-Regular.woff2` | Narrator biographies, longer Arabic prose |
| `thmanyahseriftext-Medium.woff2` | Emphasized body prose |

**What was skipped and why:**
- `*-Light.woff2` — Light weight renders poorly on warm off-white backgrounds at tool-size text. No role in this design.
- `*-Black.woff2` — Black (900) is heavier than this design ever needs. Bold (700) is the ceiling.

**Paste this block at the top of your global CSS, before any other rules:**

```css
/* ── Thmanyah Serif Display ── hadith body text, large headings */
@font-face {
  font-family: 'ThmanyahSerifDisplay';
  src: url('/fonts/thmanyahserifdisplay-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'ThmanyahSerifDisplay';
  src: url('/fonts/thmanyahserifdisplay-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'ThmanyahSerifDisplay';
  src: url('/fonts/thmanyahserifdisplay-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* ── Thmanyah Sans ── Arabic UI chrome */
@font-face {
  font-family: 'ThmanyahSans';
  src: url('/fonts/thmanyahsans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'ThmanyahSans';
  src: url('/fonts/thmanyahsans-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'ThmanyahSans';
  src: url('/fonts/thmanyahsans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* ── Thmanyah Serif Text ── narrator bios, longer Arabic prose */
@font-face {
  font-family: 'ThmanyahSerifText';
  src: url('/fonts/thmanyahseriftext-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'ThmanyahSerifText';
  src: url('/fonts/thmanyahseriftext-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

---

## 1. Voice & Feel

### The Adjectives

**Arabic. Elegant. Bridging. Legible. Restrained.**

### Mood

Hadith Path sits at the intersection of a scholar's manuscript and a developer's terminal. The visual language should feel like an illuminated margin note — warm parchment tones ground the experience in Islamic manuscript tradition, while clean sans-serif Latin type and monospaced panels signal a precise, code-aware tool. Nothing is decorative for its own sake. Every gold stroke, every border, every shadow earns its presence by clarifying structure or reinforcing hierarchy. The tool should feel as authoritative as a reference book and as fluid as a modern web app — never kitschy, never clinical.

Arabic script is not a secondary consideration. It is the primary content. Display type renders in Mania at sizes that let the calligraphic forms breathe. UI chrome stays out of the way. When the isnad chain unfolds across the screen, it should feel like unrolling a scholarly scroll.

### Reference Sites — Rationale

| Site | What It Contributes |
|---|---|
| **jsonformat.org** | Layout density and tool-panel proportions. Input + output panels at equal weight, action buttons tightly clustered above the editor, no marketing fluff inside the tool viewport. |
| **skills.sh** | Light-mode palette philosophy: warm whites, near-black text, minimal accent use, tabular data clarity. The typographic restraint and generous inter-section spacing. |
| **hcodx.com/tools/code-diff** | Inline unified diff as the default view. Character-level highlighting inside changed words. The granularity controls (character / word / line) placed above the result, not buried in settings. |
| **diffchecker.dev** | Accept/reject per-change interaction model, toggle between unified and split views, CodeMirror-quality editor treatment for input areas. |
| **toptal.com/json-formatter** | Collapsible tree nodes with a clean expand/collapse affordance, indent guides, syntax color assignments for different value types, click-anywhere-on-the-row to toggle. |

---

## 2. Color

### Design Philosophy

The palette is built on three layers: a warm neutral foundation, a gold accent that references Islamic manuscript gilding, and a teal secondary that anchors the product in the digital/tech register. Semantic colors (diff, grades, status) are fully separate from brand colors and must never borrow brand values.

### Foundation Neutrals

| Token | Hex | Usage |
|---|---|---|
| `--color-canvas` | `#FAF9F6` | Page background. Warm off-white, not sterile pure white. |
| `--color-surface` | `#FFFFFF` | Cards, panels, modals, dropdowns. |
| `--color-surface-raised` | `#FEFEFE` | Tooltips, floating panels — barely distinguishable from surface. |
| `--color-surface-sunken` | `#F3F2EF` | Input fields, code areas, disabled states, the isnad/matn parser textarea. |
| `--color-surface-overlay` | `rgba(28, 26, 23, 0.50)` | Modal backdrop. |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-border-subtle` | `#ECEAE4` | Dividers, hairlines, row separators. |
| `--color-border-default` | `#D8D5CE` | Standard card borders, input idle state. |
| `--color-border-strong` | `#B5B1A8` | Emphasized borders, section dividers with weight. |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#1C1A17` | All primary body text, headings, narrator names in UI. |
| `--color-text-secondary` | `#625E56` | Labels, supporting copy, metadata. |
| `--color-text-tertiary` | `#9C9890` | Placeholders, timestamps, muted annotations. |
| `--color-text-inverse` | `#FFFFFF` | Text on dark or colored fills. |
| `--color-text-link` | `#9A6F1A` | Interactive text links, inline anchors. |

### Brand — Gold (Primary Accent)

Gold references Islamic manuscript gilding and is reserved for interactive primary elements, active states, and structural highlights. Do not use gold decoratively.

| Token | Hex | Usage |
|---|---|---|
| `--color-gold-50` | `#FDF8EC` | Tinted surfaces behind gold-accented content. |
| `--color-gold-100` | `#F8EDCC` | Subtle gold wash backgrounds. |
| `--color-gold-200` | `#F0D88D` | Borders for gold-tinted areas. |
| `--color-gold-300` | `#E2BC50` | Decorative strokes, active tab indicators. |
| `--color-gold-400` | `#D4A017` | Primary button fill. |
| `--color-gold-500` | `#B8892A` | Icons, badge fills, active indicator dots. |
| `--color-gold-600` | `#9A6F1A` | Gold text on light backgrounds. Hover state for gold buttons. |
| `--color-gold-700` | `#7A5512` | Deep gold for pressed states, active outlines. |

### Brand — Teal (Secondary)

Teal is the tech anchor. It signals parsing, computation, and data structure. Use it for tree node connectors, syntax highlighting of structural elements, and secondary CTAs.

| Token | Hex | Usage |
|---|---|---|
| `--color-teal-50` | `#EEF9F8` | Teal-tinted panel backgrounds. |
| `--color-teal-100` | `#D2F0ED` | Light teal surface. |
| `--color-teal-200` | `#9FDDD8` | Teal borders. |
| `--color-teal-400` | `#2DA89C` | Secondary button fill. |
| `--color-teal-500` | `#1D8A80` | Teal accent — syntax highlighting for narrator name tokens. |
| `--color-teal-600` | `#176F67` | Hover for teal elements. |
| `--color-teal-700` | `#125650` | Active/pressed teal. |

### Semantic — Status

| Token | Hex | Usage |
|---|---|---|
| `--color-success-bg` | `#EDFAF4` | |
| `--color-success-border` | `#7FD4B0` | |
| `--color-success-text` | `#1A6B4A` | |
| `--color-success-solid` | `#2AA57A` | |
| `--color-warning-bg` | `#FEF6E6` | |
| `--color-warning-border` | `#F0C060` | |
| `--color-warning-text` | `#8A5A00` | |
| `--color-warning-solid` | `#D4900A` | |
| `--color-error-bg` | `#FEF0F0` | |
| `--color-error-border` | `#F0A0A0` | |
| `--color-error-text` | `#8A1515` | |
| `--color-error-solid` | `#CC2828` | |
| `--color-info-bg` | `#EEF6FE` | |
| `--color-info-border` | `#93C8F5` | |
| `--color-info-text` | `#1A4E7A` | |
| `--color-info-solid` | `#2878C8` | |

### Semantic — Narrator Reliability Grades (Jarh wa Ta'dil)

These colors are the visual core of the tool's scholarly function. They must be immediately legible and consistently applied everywhere a narrator appears — in the chain, in the tree, in the profile card.

| Grade | Arabic | Token Prefix | Background | Border | Text |
|---|---|---|---|---|---|
| Trustworthy | ثقة | `--grade-thiqah` | `#EEF9F8` | `#9FDDD8` | `#1D8A80` |
| Honest | صدوق | `--grade-sadooq` | `#EEF6FE` | `#93C8F5` | `#1A4E7A` |
| Weak | ضعيف | `--grade-daif` | `#FEF6E6` | `#F0C060` | `#8A5A00` |
| Abandoned | متروك | `--grade-matrook` | `#FEF0F0` | `#F0A0A0` | `#8A1515` |
| Unknown | مجهول | `--grade-unknown` | `#F3F2EF` | `#D8D5CE` | `#625E56` |

### Semantic — Diff Colors

Inline diff must be legible in RTL Arabic text. Character-level highlights use a slightly intensified version of the line-level backgrounds.

| Token | Hex | Usage |
|---|---|---|
| `--color-diff-add-bg` | `#EDFAF4` | Full line added |
| `--color-diff-add-border` | `#7FD4B0` | Left border of added line |
| `--color-diff-add-text` | `#1A6B4A` | Added text color |
| `--color-diff-add-char` | `#B5F0D4` | Character-level add highlight |
| `--color-diff-remove-bg` | `#FEF0F0` | Full line removed |
| `--color-diff-remove-border` | `#F0A0A0` | Left border of removed line |
| `--color-diff-remove-text` | `#8A1515` | Removed text color |
| `--color-diff-remove-char` | `#FFD0D0` | Character-level remove highlight |
| `--color-diff-neutral` | `#F3F2EF` | Unchanged context lines |

### Syntax Highlighting (Tree View)

| Token | Hex | Usage |
|---|---|---|
| `--color-syntax-narrator` | `#1D8A80` | Narrator names in the isnad tree |
| `--color-syntax-matn` | `#1C1A17` | Matn text (default text color — no special highlight) |
| `--color-syntax-connector` | `#9A6F1A` | Transition phrases: `عن`, `حدثنا`, `قال` |
| `--color-syntax-year` | `#9C3AE5` | Death/birth year numbers |
| `--color-syntax-bracket` | `#625E56` | Structural punctuation, chain separators |
| `--color-syntax-unknown` | `#9C9890` | Unresolved/null narrator references |

### Color Rules

1. `--color-gold-400` and `--color-gold-600` are the only gold values that appear on interactive elements. `--color-gold-300` and below are structural only.
2. Brand colors (gold, teal) never mix with semantic colors in the same element.
3. The diff color system is fully self-contained — never borrow `--color-success-*` for additions or `--color-error-*` for deletions. The diff tokens exist to allow independent calibration.
4. Narrator grade colors use the same semantic hue families as status colors but are governed by separate tokens. They may evolve independently.
5. Text on `--color-gold-400` fill must be `--color-text-primary` (`#1C1A17`), not `--color-text-inverse`. This passes WCAG AA at that specific background.

---

## 3. Typography

### Font Families

The system uses five stacks with strictly defined roles. Three are Thmanyah Arabic variants; two are system/Latin.

| Stack Token | Families | Role |
|---|---|---|
| `--font-display-arabic` | `'ThmanyahSerifDisplay', 'Amiri', 'Scheherazade New', serif` | Hadith body text (matn), large Arabic headings, isnad text in the visualization hero area |
| `--font-body-arabic` | `'ThmanyahSerifText', 'ThmanyahSerifDisplay', 'Amiri', serif` | Narrator biography prose, longer Arabic reading content in the profile drawer |
| `--font-ui-arabic` | `'ThmanyahSans', 'Cairo', 'Noto Sans Arabic', sans-serif` | Arabic UI chrome: buttons, labels, nav items, tooltips, narrator names in compact/list view, grade badges |
| `--font-ui-latin` | `'Inter', 'Helvetica Neue', Arial, sans-serif` | All Latin UI: nav, buttons, labels, metadata, transliterations, death years in text |
| `--font-mono` | `'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace` | JSON export panels, raw API key field, death/birth year numerals, code snippets in settings |

**The Thmanyah role split:**
- `ThmanyahSerifDisplay` — content at display sizes. The hadith text is the product; this font is its primary vehicle.
- `ThmanyahSerifText` — content at reading sizes in secondary contexts (biography, notes). Optimized for density at smaller sizes where Display would feel too heavy.
- `ThmanyahSans` — all UI chrome in Arabic. Clean, geometric, subordinate to the serif content. Never used where the Arabic text is the subject of display.

### Type Scale

All sizes in `rem` with 16px browser base.

| Step | Size | Px | Weight | Line Height | Letter Spacing | Typical Use |
|---|---|---|---|---|---|---|
| `--text-2xs` | `0.6875rem` | 11px | 500 | 1.45 | `0.06em` | Badge text, overline labels |
| `--text-xs` | `0.8125rem` | 13px | 400/500 | 1.5 | `0.03em` | Caption, timestamp, muted metadata |
| `--text-sm` | `0.9375rem` | 15px | 400 | 1.55 | `0` | Secondary body, transliteration under Arabic names |
| `--text-base` | `1rem` | 16px | 400 | 1.6 | `0` | Primary body, narrator bio notes |
| `--text-md` | `1.0625rem` | 17px | 500 | 1.55 | `0` | Emphasized body, button text, input text |
| `--text-lg` | `1.25rem` | 20px | 600 | 1.4 | `-0.01em` | Section headings, panel titles |
| `--text-xl` | `1.5rem` | 24px | 600 | 1.35 | `-0.02em` | Page-level headings |
| `--text-2xl` | `2rem` | 32px | 700 | 1.25 | `-0.02em` | Hero heading (Latin) |
| `--text-3xl` | `2.5rem` | 40px | 700 | 1.2 | `-0.025em` | Large display (Latin) |
| `--text-4xl` | `3.25rem` | 52px | 700 | 1.15 | `-0.03em` | Hero Arabic display heading |

### Arabic-Specific Line Height Rule

Arabic glyphs extend further above and below the baseline than Latin glyphs. Add `0.15` to any line-height value when the text is in `--font-display-arabic` or `--font-ui-arabic`. The `--text-base` Arabic equivalent is `line-height: 1.8`, not `1.6`.

### Weight Usage

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | Body text, secondary labels, captions |
| Medium | 500 | Button labels, emphasized labels, the `text-md` step |
| Semibold | 600 | Section headings, panel titles, narrator names in compact list |
| Bold | 700 | Page headings, the isnad chain hero label, empty state callout heads |

### Typography Rules

1. `ThmanyahSerifDisplay` (`--font-display-arabic`) renders at `--text-lg` (20px) and above only. At `--text-sm` and below, switch to `ThmanyahSans` (`--font-ui-arabic`) — the display cuts are too pronounced at small sizes.
2. `ThmanyahSerifText` (`--font-body-arabic`) is used at `--text-base` and `--text-sm` for biographical prose. It is never used at `--text-lg` or above — that is `ThmanyahSerifDisplay`'s territory.
3. `ThmanyahSans` (`--font-ui-arabic`) is used for all Arabic UI chrome regardless of size. If an element is navigation, button, label, badge, or tooltip, it gets Sans — even at large sizes.
4. Transliterated Latin names always appear below the Arabic name at `--text-xs` in `--color-text-secondary`. They are never larger than the Arabic label above them.
5. Death/birth year numerals render in `--font-mono` at `--text-xs`. Arabic numerals in a serif font look inconsistent next to Hijri/Gregorian year notation.
6. No uppercase transformation on Arabic text ever.
7. Latin small caps (`font-variant: small-caps`) may be used for section overlines and category labels in the Latin UI only.

---

## 4. Spacing & Layout

### Base Unit

`4px` (`0.25rem`). Every spacing value is a multiple of 4.

### Spacing Scale

| Token | rem | px | Use |
|---|---|---|---|
| `--space-1` | `0.25rem` | 4px | Minimum gap, icon-to-label |
| `--space-2` | `0.5rem` | 8px | Tight internal padding (badge, tag) |
| `--space-3` | `0.75rem` | 12px | Compact element padding (small button) |
| `--space-4` | `1rem` | 16px | Standard element padding (button, input) |
| `--space-5` | `1.25rem` | 20px | Card internal padding |
| `--space-6` | `1.5rem` | 24px | Card padding on wider breakpoints; grid gutter |
| `--space-8` | `2rem` | 32px | Section internal spacing, between related elements |
| `--space-10` | `2.5rem` | 40px | Between unrelated elements within a section |
| `--space-12` | `3rem` | 48px | Section padding top/bottom (compact tool sections) |
| `--space-16` | `4rem` | 64px | Section padding on marketing/hero areas |
| `--space-20` | `5rem` | 80px | Large section separators |
| `--space-24` | `6rem` | 96px | Hero area vertical padding |

### Container Widths

| Token | Value | Usage |
|---|---|---|
| `--container-tool` | `1440px` | Maximum width for the tool viewport (diff panels need room) |
| `--container-content` | `1280px` | General content max width |
| `--container-prose` | `720px` | Reading content, bio panels, documentation |
| `--container-narrow` | `480px` | Settings panel, modals, single-column forms |

### Page Grid

12-column fluid grid. Gutter: `--space-6` (24px). Outer margin: `--space-6` at mobile, `--space-8` at md, `--space-12` at xl.

The main tool layout uses two columns:
- **Sidebar / controls:** fixed 260px, left (in LTR) / right (in RTL)
- **Main panel:** fluid, fills remaining width
- **Gutter between:** `--space-6`

### Density Verdict — Compact-Moderate

Modeled after jsonformat.org and skills.sh. Section padding is `--space-12` (48px) vertically inside the tool viewport, not the `--space-24` (96px) seen on marketing landing pages. Cards use `--space-5` (20px) internal padding. The tool is never airy — it respects that scholars are working, not browsing. The landing page hero section is the only area with generous `--space-24` vertical breathing room.

---

## 5. Radii, Shadows & Borders

### Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-none` | `0` | Hard-edged dividers, table rows |
| `--radius-sm` | `0.25rem` (4px) | Tags, inline code chips, badges |
| `--radius-md` | `0.375rem` (6px) | Inputs, buttons, dropdowns |
| `--radius-lg` | `0.625rem` (10px) | Cards, panels |
| `--radius-xl` | `1rem` (16px) | Large panels, the settings drawer |
| `--radius-2xl` | `1.5rem` (24px) | Narrator chain nodes (the pill-shaped cards in the isnad visualization) |
| `--radius-full` | `9999px` | Circular icon buttons, status dots, avatar initials |

### Corner Language Verdict — Softly Rounded

No sharp corners anywhere user-created content appears. No aggressive pill shapes in UI chrome. The `--radius-md` (6px) on inputs and buttons reads as modern-professional without trying. Narrator chain nodes get `--radius-2xl` because they are content objects, not controls, and the rounder shape improves legibility of the RTL flow. Modal corners get `--radius-xl`. Never mix sharp corners on adjacent surfaces — if a card is `--radius-lg`, its child image must match the top corners.

### Shadow Philosophy

Shadows are warm-tinted, not gray. The base color is `rgba(28, 26, 23, α)` (derived from `--color-text-primary`) so shadows feel like the surface is casting shade on warm paper, not floating in cold gray space.

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(28,26,23,0.06)` | Pressed state, subtle separation |
| `--shadow-sm` | `0 1px 3px rgba(28,26,23,0.08), 0 1px 2px rgba(28,26,23,0.05)` | Default card, narrator node resting |
| `--shadow-md` | `0 4px 12px rgba(28,26,23,0.08), 0 2px 4px rgba(28,26,23,0.05)` | Hovered card, profile drawer |
| `--shadow-lg` | `0 8px 24px rgba(28,26,23,0.10), 0 4px 8px rgba(28,26,23,0.06)` | Narrator node hovered, floating panel |
| `--shadow-xl` | `0 16px 40px rgba(28,26,23,0.12), 0 8px 16px rgba(28,26,23,0.06)` | Modal, command palette |
| `--shadow-focus-gold` | `0 0 0 3px rgba(212,160,23,0.30)` | Focus ring on primary interactive elements |
| `--shadow-focus-teal` | `0 0 0 3px rgba(45,168,156,0.30)` | Focus ring on secondary/tree elements |

### Border Conventions

- Default border: `1px solid var(--color-border-default)` — used on cards and inputs at rest.
- Hover border: upgrade to `--color-border-strong`.
- Focus border: upgrade to `--color-gold-500`, plus `--shadow-focus-gold` ring.
- Dividers (horizontal rules between list items, tree rows): `1px solid var(--color-border-subtle)`.
- No `2px` borders anywhere except the active indicator stripe on tabs.

---

## 6. Components

### Buttons

#### Primary Button

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-gold-400);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gold-500);
  border-radius: var(--radius-md);
  font-family: var(--font-ui-latin);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: 1;
  letter-spacing: 0;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}

.btn-primary:hover {
  background: var(--color-gold-600);
  border-color: var(--color-gold-700);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-gold);
}

.btn-primary:active {
  background: var(--color-gold-700);
  box-shadow: var(--shadow-xs);
}

.btn-primary:disabled {
  background: var(--color-surface-sunken);
  border-color: var(--color-border-default);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}
```

#### Secondary Button

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-surface);
  color: var(--color-gold-600);
  border: 1px solid var(--color-gold-300);
  border-radius: var(--radius-md);
  font-family: var(--font-ui-latin);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: 1;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
  white-space: nowrap;
  user-select: none;
}

.btn-secondary:hover {
  background: var(--color-gold-50);
  border-color: var(--color-gold-500);
}

.btn-secondary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-gold);
}

.btn-secondary:active {
  background: var(--color-gold-100);
  box-shadow: var(--shadow-xs);
}
```

#### Ghost Button

```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-ui-latin);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: 1;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard),
              color var(--duration-fast) var(--ease-standard);
  white-space: nowrap;
  user-select: none;
}

.btn-ghost:hover {
  background: var(--color-surface-sunken);
  color: var(--color-text-primary);
}

.btn-ghost:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-gold);
}
```

#### Icon Button

```css
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard),
              color var(--duration-fast) var(--ease-standard);
  flex-shrink: 0;
}

.btn-icon:hover {
  background: var(--color-surface-sunken);
  color: var(--color-text-primary);
}

.btn-icon:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-gold);
}

.btn-icon svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 1.75;
}
```

#### Small Button

```css
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  gap: var(--space-1);
}

.btn-sm svg {
  width: 0.875rem;
  height: 0.875rem;
}
```

---

### Navigation

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.5rem;
  padding: 0 var(--space-6);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  font-family: var(--font-ui-latin);
}

.nav-logo-arabic {
  font-family: var(--font-display-arabic);
  font-size: var(--text-lg);
  color: var(--color-gold-500);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-standard),
              background var(--duration-fast) var(--ease-standard);
}

.nav-link:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-sunken);
}

.nav-link[aria-current="page"] {
  color: var(--color-gold-600);
  background: var(--color-gold-50);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

---

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-standard) var(--ease-standard),
              border-color var(--duration-standard) var(--ease-standard);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.card-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--leading-snug);
  margin: 0;
}

.card-body {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.card-footer {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}
```

---

### Tool Section (Editor + Output Panels)

```css
.tool-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 1fr;
  height: calc(100vh - 3.5rem);
  gap: 0;
  background: var(--color-canvas);
}

.tool-sidebar {
  border-inline-end: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--space-5);
  gap: var(--space-4);
}

.tool-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tool-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

.tool-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-inline-end: 1px solid var(--color-border-subtle);
}

.tool-panel:last-child {
  border-inline-end: none;
}

.tool-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  flex-shrink: 0;
}

.tool-panel-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.tool-panel-body {
  flex: 1;
  overflow: auto;
  padding: var(--space-4);
  background: var(--color-surface-sunken);
}

.tool-actions-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}
```

---

### Inputs

```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  line-height: 1;
}

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  font-family: var(--font-ui-latin);
  font-size: var(--text-md);
  line-height: 1.5;
  transition: border-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
  appearance: none;
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:hover {
  border-color: var(--color-border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-gold-500);
  box-shadow: var(--shadow-focus-gold);
}

.input:disabled {
  background: var(--color-surface-sunken);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error-border);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(204, 40, 40, 0.20);
}

.input-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.input-error-msg {
  font-size: var(--text-xs);
  color: var(--color-error-text);
}

/* Textarea — main hadith input */
.textarea-hadith {
  width: 100%;
  min-height: 200px;
  padding: var(--space-4);
  background: var(--color-surface-sunken);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  font-family: var(--font-display-arabic);
  font-size: var(--text-lg);
  line-height: 1.95;
  direction: rtl;
  text-align: right;
  resize: vertical;
  transition: border-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
}

.textarea-hadith:focus {
  outline: none;
  border-color: var(--color-gold-500);
  box-shadow: var(--shadow-focus-gold);
  background: var(--color-surface);
}

.textarea-hadith::placeholder {
  font-family: var(--font-ui-arabic);
  font-size: var(--text-base);
  color: var(--color-text-tertiary);
  direction: rtl;
}
```

---

### Platform-Specific: Isnad Chain Visualization

The chain flows RTL. Prophet ﷺ is the rightmost terminal node; the direct narrator to the compiler is leftmost. In RTL layout (`dir="rtl"`), DOM order matches reading order naturally.

```css
.isnad-chain {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  padding: var(--space-8) var(--space-6);
  background: var(--color-canvas);
  direction: rtl;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.narrator-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
}

.narrator-node-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1.5px solid var(--color-border-default);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-sm);
  min-width: 140px;
  max-width: 180px;
  transition: box-shadow var(--duration-standard) var(--ease-out-expo),
              border-color var(--duration-standard) var(--ease-out-expo),
              transform var(--duration-standard) var(--ease-out-expo);
}

.narrator-node:hover .narrator-node-card {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Grade-based border stripe — applied as border-top color */
.narrator-node-card[data-grade="thiqah"] {
  border-top: 3px solid var(--color-teal-500);
}
.narrator-node-card[data-grade="sadooq"] {
  border-top: 3px solid var(--color-info-solid);
}
.narrator-node-card[data-grade="daif"] {
  border-top: 3px solid var(--color-warning-solid);
}
.narrator-node-card[data-grade="matrook"] {
  border-top: 3px solid var(--color-error-solid);
}
.narrator-node-card[data-grade="unknown"] {
  border-top: 3px solid var(--color-border-strong);
}

.narrator-name-arabic {
  font-family: var(--font-ui-arabic);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.6;
  text-align: center;
  direction: rtl;
}

.narrator-name-latin {
  font-family: var(--font-ui-latin);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-secondary);
  text-align: center;
  direction: ltr;
}

.narrator-year {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
  text-align: center;
}

.narrator-grade-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui-arabic);
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  margin-top: var(--space-1);
  direction: rtl;
}

.narrator-grade-badge[data-grade="thiqah"] {
  background: var(--grade-thiqah-bg);
  color: var(--grade-thiqah-text);
}
.narrator-grade-badge[data-grade="sadooq"] {
  background: var(--grade-sadooq-bg);
  color: var(--grade-sadooq-text);
}
.narrator-grade-badge[data-grade="daif"] {
  background: var(--grade-daif-bg);
  color: var(--grade-daif-text);
}
.narrator-grade-badge[data-grade="matrook"] {
  background: var(--grade-matrook-bg);
  color: var(--grade-matrook-text);
}
.narrator-grade-badge[data-grade="unknown"] {
  background: var(--grade-unknown-bg);
  color: var(--grade-unknown-text);
}

/* Connector arrows between nodes */
.chain-connector {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 48px;
  position: relative;
}

.chain-connector-line {
  width: 100%;
  height: 1.5px;
  background: var(--color-border-default);
  position: relative;
}

.chain-connector-line::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: var(--color-border-strong);
  border-radius: var(--radius-full);
}

.chain-connector-label {
  position: absolute;
  top: -1.25rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-ui-arabic);
  font-size: var(--text-2xs);
  color: var(--color-syntax-connector);
  white-space: nowrap;
  direction: rtl;
}

/* Terminal nodes (Prophet ﷺ and compiler) */
.narrator-node--terminal .narrator-node-card {
  border-color: var(--color-gold-300);
  background: var(--color-gold-50);
}

.narrator-node--terminal .narrator-name-arabic {
  color: var(--color-gold-700);
}
```

---

### Platform-Specific: Inline Diff View

The diff renders Arabic text RTL. The inline (unified) view is the default. Characters removed are struck through with a red background. Characters added have a green underline and background. The side-by-side panel uses the same component repeated.

```css
.diff-container {
  direction: rtl;
  font-family: var(--font-display-arabic);
  font-size: var(--text-lg);
  line-height: 2.0;
  color: var(--color-text-primary);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
}

.diff-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border-bottom: none;
  flex-wrap: wrap;
  gap: var(--space-2);
  direction: ltr;
}

.diff-view-toggle {
  display: inline-flex;
  background: var(--color-surface-sunken);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.diff-view-toggle button {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  font-family: var(--font-ui-latin);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard),
              color var(--duration-fast) var(--ease-standard);
}

.diff-view-toggle button[aria-pressed="true"] {
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-xs);
}

/* Unified diff lines */
.diff-line {
  display: block;
  padding: var(--space-1) var(--space-3);
  border-inline-start: 3px solid transparent;
  transition: background var(--duration-fast) var(--ease-standard);
}

.diff-line--add {
  background: var(--color-diff-add-bg);
  border-inline-start-color: var(--color-diff-add-border);
  color: var(--color-diff-add-text);
}

.diff-line--remove {
  background: var(--color-diff-remove-bg);
  border-inline-start-color: var(--color-diff-remove-border);
  color: var(--color-diff-remove-text);
  text-decoration: line-through;
  text-decoration-color: var(--color-error-solid);
  text-decoration-thickness: 1.5px;
}

.diff-line--neutral {
  background: var(--color-diff-neutral);
  border-inline-start-color: transparent;
  color: var(--color-text-secondary);
}

/* Character-level highlighting within a changed word */
.diff-char--add {
  background: var(--color-diff-add-char);
  border-radius: 2px;
  padding: 0 1px;
}

.diff-char--remove {
  background: var(--color-diff-remove-char);
  border-radius: 2px;
  padding: 0 1px;
  text-decoration: line-through;
  text-decoration-color: var(--color-error-solid);
}

/* Line gutter (optional: shows + / − markers) */
.diff-gutter {
  display: inline-block;
  width: 1.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  user-select: none;
  text-align: center;
  margin-inline-end: var(--space-3);
  flex-shrink: 0;
  direction: ltr;
}

.diff-line--add .diff-gutter { color: var(--color-diff-add-text); }
.diff-line--remove .diff-gutter { color: var(--color-diff-remove-text); }

/* Side-by-side layout */
.diff-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.diff-split-panel {
  overflow: hidden;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
}

.diff-split-panel-header {
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface-sunken);
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  text-align: center;
  font-family: var(--font-ui-latin);
  direction: ltr;
}
```

---

### Platform-Specific: Collapsible Tree (Isnad/Matn Separator)

Modeled on the JSON formatter tree — click anywhere on the row to expand/collapse.

```css
.tree {
  font-family: var(--font-ui-arabic);
  font-size: var(--text-base);
  line-height: 1.8;
  direction: rtl;
  padding: var(--space-4);
  background: var(--color-surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-default);
}

.tree-node {
  display: flex;
  flex-direction: column;
}

.tree-node-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-standard);
  user-select: none;
}

.tree-node-row:hover {
  background: var(--color-border-subtle);
}

.tree-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform var(--duration-expand) var(--ease-out-expo);
  margin-top: 0.25rem;
}

.tree-node--open > .tree-node-row > .tree-toggle {
  transform: rotate(90deg);
}

.tree-toggle svg {
  width: 0.75rem;
  height: 0.75rem;
  stroke-width: 2;
}

.tree-key {
  color: var(--color-syntax-narrator);
  font-weight: var(--weight-semibold);
}

.tree-value--string { color: var(--color-syntax-connector); }
.tree-value--number { color: var(--color-syntax-year); }
.tree-value--null   { color: var(--color-syntax-unknown); font-style: italic; }

.tree-children {
  padding-inline-start: var(--space-5);
  border-inline-start: 1.5px solid var(--color-border-subtle);
  margin-inline-start: var(--space-3);
  overflow: hidden;
}

/* Collapse animation */
.tree-children[data-state="open"] {
  animation: tree-expand var(--duration-expand) var(--ease-out-expo) forwards;
}

.tree-children[data-state="closed"] {
  animation: tree-collapse var(--duration-expand) var(--ease-in-out-quad) forwards;
}

@keyframes tree-expand {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes tree-collapse {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

/* Narrator inline chip within tree */
.tree-narrator-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 1px var(--space-2);
  background: var(--color-teal-50);
  border: 1px solid var(--color-teal-200);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-teal-600);
  cursor: pointer;
  direction: rtl;
  transition: background var(--duration-fast) var(--ease-standard);
}

.tree-narrator-chip:hover {
  background: var(--color-teal-100);
}
```

---

### Platform-Specific: Narrator Profile Card (Drawer)

Opens from the right (in RTL, it slides in from the inline-end edge).

```css
.narrator-drawer-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-surface-overlay);
  z-index: 200;
  animation: overlay-in var(--duration-standard) var(--ease-standard) forwards;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.narrator-drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  width: 400px;
  max-width: 90vw;
  background: var(--color-surface);
  border-inline-start: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-xl);
  z-index: 201;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  direction: rtl;
  animation: drawer-in var(--duration-expand) var(--ease-out-expo) forwards;
}

@keyframes drawer-in {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

.narrator-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.narrator-drawer-name {
  font-family: var(--font-display-arabic);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  line-height: 1.5;
  direction: rtl;
}

.narrator-drawer-name-latin {
  font-family: var(--font-ui-latin);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  direction: ltr;
  margin-top: var(--space-1);
}

.narrator-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.narrator-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.narrator-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.narrator-meta-label {
  font-family: var(--font-ui-arabic);   /* Sans — this is UI labeling */
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--weight-medium);
  direction: rtl;
}

.narrator-meta-value {
  font-family: var(--font-body-arabic);  /* SerifText — this is data content */
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  direction: rtl;
}

.narrator-bio {
  font-family: var(--font-body-arabic);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.85;
  direction: rtl;
}
```

---

## 7. Motion

### Personality Verdict — Smooth and Restrained

Based on behavioral analysis of the reference sites: jsonformat.org and skills.sh both exhibit **0-animation** hover transitions and instant panel reveals — developer tools that respect that the user came to work, not watch. hcodx.com's diff tool uses smooth state transitions for line reveals and panel switches but no bounce or overshoot. The design language here leans closest to skills.sh: restrained, purposeful, slightly warm. Microinteractions at 120ms feel crisp without feeling abrupt. Expanding/collapsing the isnad tree at 280ms with `ease-out-expo` feels authoritative — it finishes decisively. No spring animations except the narrator node hover lift (2px Y translate), which has a very subtle ease-out-expo rather than true spring.

### Easing Curves

| Token | Value | Personality |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | All-purpose, Material Design standard |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrance, expand, reveal — starts fast, eases gently to rest |
| `--ease-in-out-quad` | `cubic-bezier(0.45, 0, 0.55, 1)` | Exit, collapse, dismiss — symmetric, not harsh |
| `--ease-in-expo` | `cubic-bezier(0.7, 0, 0.84, 0)` | Accelerating exit (use sparingly) |

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | `80ms` | Hover background fills, focus ring appearance |
| `--duration-fast` | `120ms` | Button hover, link hover, border color changes |
| `--duration-standard` | `200ms` | Panel state changes, toggle switches, tab switches |
| `--duration-expand` | `280ms` | Tree node expand/collapse, narrator drawer slide |
| `--duration-page` | `350ms` | View transitions (if used) |

### Common Transitions

| Element | Property | Duration | Easing |
|---|---|---|---|
| Button hover | `background`, `border-color` | `--duration-fast` | `--ease-standard` |
| Card hover | `box-shadow`, `border-color`, `transform` | `--duration-standard` | `--ease-standard` |
| Narrator node hover | `box-shadow`, `transform` | `--duration-standard` | `--ease-out-expo` |
| Tree expand | opacity + translateY | `--duration-expand` | `--ease-out-expo` |
| Tree collapse | opacity + translateY | `--duration-expand` | `--ease-in-out-quad` |
| Tree toggle arrow | `transform: rotate` | `--duration-expand` | `--ease-out-expo` |
| Drawer slide in | `transform: translateX` | `--duration-expand` | `--ease-out-expo` |
| Overlay fade in | `opacity` | `--duration-standard` | `--ease-standard` |
| Focus ring | `box-shadow` | `--duration-instant` | `--ease-standard` |
| Input focus border | `border-color` | `--duration-fast` | `--ease-standard` |
| Diff line reveal | `opacity` | `--duration-fast` | `--ease-standard` |

### Scroll-Triggered Defaults

No scroll animations on tool panels — they are functional, not cinematic. The landing page hero may use a single `opacity: 0 → 1` fade at `--duration-page` with `--ease-out-expo` on page load only. No parallax. No stagger beyond two elements.

---

## 8. Imagery & Iconography

### Imagery Style Verdict — None (intentional)

The tool has no photography, no illustration, and no 3D. The only visual media are: (a) the isnad chain SVG visualization, (b) grade-color badges, and (c) Arabic calligraphic type from the Mania font. Empty states use centered typography and a single monochrome icon — no decorative illustrations. This decision is deliberate: the tool's primary canvas is Arabic manuscript text. Competing imagery would undermine it.

### Icon Library

**Lucide Icons** — consistent with the React + Tailwind stack, clean geometric style.

```
stroke-width: 1.75   ← default for all UI icons
stroke-width: 1.5    ← for 20px+ icon sizes (narrator chain controls)
stroke-width: 2      ← for 14px and below (badges, inline indicators)
```

Icon size defaults:
- Navigation icons: `16px`
- Button icons: `16px`
- Panel header icons: `16px`
- Narrator drawer icons: `20px`
- Empty state icons: `48px` (stroke-width 1.5)

**Rule:** Never use filled icons alongside stroked icons. Lucide is stroke-only — maintain that consistency throughout. The only exception is status dots (reliability grades) which are filled circles.

### Arabic Ornamental Characters

Use Unicode Arabic ornamental characters sparingly for structural markers in the display view:
- `﴾` / `﴿` (U+FD3E, U+FD3F) — Ornate parentheses for the Prophet's name context
- `ﷺ` (U+FDFA) — Salawat symbol inline with the Prophet's name

Never use geometric Islamic pattern decoration in the UI chrome.

---

## 9. Contrast Philosophy

### Verdict — Warm Punchy Text, Soft Semantic Surfaces

Text contrast is punchy and non-negotiable. `--color-text-primary` (`#1C1A17`) on `--color-canvas` (`#FAF9F6`) achieves a contrast ratio of approximately 17:1 — well above WCAG AAA. Secondary text (`#625E56` on `#FAF9F6`) sits near 6:1, comfortably AA. This high text contrast is essential because the primary content is dense Arabic hadith text in a display font — readers are parsing meaning, not glancing at marketing copy.

Background and surface contrasts are deliberately soft. `--color-canvas` to `--color-surface` is a nearly invisible step (warm off-white to white). Cards and panels emerge from the background through border and shadow, not through background-color contrast. This keeps the visual field calm so the text remains the primary figure.

Contrast is punctuated at three specific points:
1. **The active tab indicator / selected element** — a `2px` gold stripe or `--color-gold-400` fill that is the brightest element in the tool chrome
2. **Grade badges on narrator nodes** — the teal, blue, amber, and red fills are the only saturated colors in the visualization; they communicate reliability grade at a glance
3. **Diff line highlights** — green and red backgrounds in the diff view are the most chromatic surfaces in the tool; they concentrate user attention exactly where comparison meaning lives

---

## 10. Responsive Breakpoints

| Token | Width | Behavior |
|---|---|---|
| `sm` | `640px` | Single-column layout. Tool panels stack vertically. Chain visualization becomes vertical scroll. |
| `md` | `768px` | Two-column possible for tool panels. Sidebar becomes a bottom sheet or drawer. |
| `lg` | `1024px` | Full tool layout unlocks: sidebar + two panels side by side. |
| `xl` | `1280px` | Standard desktop experience. Grid fully expanded. |
| `2xl` | `1440px` | Maximum tool container width. Diff panels get more horizontal room. |

### Behavior Notes

- Below `lg` (`1024px`): the sidebar collapses into a top toolbar. The isnad chain switches from horizontal scroll to a vertical stacked list. The diff view forces unified (inline) mode — side-by-side is disabled on narrow viewports.
- Below `md` (`768px`): the tool panels stack. Input panel is full-width above the fold; output panel below. The narrator drawer becomes a bottom sheet (100vw, 70vh, `border-radius: --radius-xl --radius-xl 0 0`).
- Below `sm` (`640px`): the nav collapses to logo + hamburger. Section padding reduces to `--space-8`. The narrator chain uses a vertically stacked card list with connecting line on the inline-start edge.
- All breakpoints are `min-width` (mobile-first). The Tailwind config should reflect these exact pixel values.
- RTL is applied globally at `<html dir="rtl">`. All inline-start/inline-end properties must be used in place of left/right.

---

## 11. Do / Don't

### Do

1. **Use `dir="rtl"` globally on `<html>`.** The tool is Arabic-first. Every component must be authored in logical properties (`padding-inline-start`, not `padding-left`) and tested RTL before being called done.
2. **Render narrator names in both scripts simultaneously.** Arabic name in `--font-ui-arabic` at `--text-md`, Latin transliteration in `--font-ui-latin` at `--text-xs` directly below. Both are always present, never one without the other.
3. **Use reliability grade colors consistently.** Every appearance of a narrator — in the chain, in the tree, in the profile card, in search results — must carry the same grade color. The color is the grade. Never show the grade only in one view.
4. **Make the inline diff view the default.** Side-by-side is a toggle. The inline merged view is more appropriate for Arabic text because it preserves the continuous sentence context.
5. **Give the textarea the display Arabic font.** The input field for pasting hadith text uses `--font-display-arabic` at `--text-lg` with generous `line-height: 1.95`. Monospace or sans-serif in the input field breaks the experience.
6. **Treat character-level diff highlighting as mandatory.** Word-level diff is insufficient for Arabic hadith variants which often differ by a single vowel marker or particle. Character-level highlighting within changed words is a first-class feature.
7. **Keep the chain visualization horizontal and RTL by default.** The rightmost node is the Prophet ﷺ (or source). The leftmost is the compiler. This is how scholars draw isnads on paper.
8. **Strip diacritics for comparison only.** Display text always preserves tashkeel. The `normalizeArabic()` function is internal to the diff engine and never surfaces its output to the user.

### Don't

1. **Don't use dark mode.** The tool's reference aesthetic (skills.sh, jsonformat.org) and the manuscript-inspired palette are both light. A dark mode would require a fully separate color system and is out of scope for v1.
2. **Don't put decorative Islamic geometric patterns in the UI chrome.** The Mania font and the gold accent carry cultural identity. Pattern decoration reads as kitschy in a tool context.
3. **Don't use `--color-gold-400` for more than one element per viewport.** Gold is the signal that something is interactive and primary. If everything is gold, nothing is gold.
4. **Don't animate the chain connector lines.** The static SVG connectors are clean. Animated arrows or pulsing paths are distracting in a research tool.
5. **Don't mix `--font-display-arabic` and `--font-ui-arabic` in the same UI row.** Display font (Mania) is for the hadith reading context only. UI labels, even if in Arabic, use `--font-ui-arabic` (Cairo/Tajawal).
6. **Don't use box shadows to simulate borders.** Every bordered element uses a real `border` property. Shadows are for elevation only.
7. **Don't show the side-by-side diff layout on viewports below `lg`.** The columns are too narrow for Arabic text at useful font sizes. Force unified (inline) view below `1024px`.
8. **Don't invent reliability grades not present in the jarh wa ta'dil tradition.** The five grade bands (ثقة، صدوق، ضعيف، متروك، مجهول) cover the canonical classification system. Do not add custom "confidence" color bands that are not grounded in classical hadith science.

---

## 12. CSS Custom Properties

Paste this `:root` block into your global stylesheet. Every value in this guide maps to a token declared here.

```css
:root {
  /* ─── Foundation ─── */
  --color-canvas:              #FAF9F6;
  --color-surface:             #FFFFFF;
  --color-surface-raised:      #FEFEFE;
  --color-surface-sunken:      #F3F2EF;
  --color-surface-overlay:     rgba(28, 26, 23, 0.50);

  /* ─── Borders ─── */
  --color-border-subtle:       #ECEAE4;
  --color-border-default:      #D8D5CE;
  --color-border-strong:       #B5B1A8;

  /* ─── Text ─── */
  --color-text-primary:        #1C1A17;
  --color-text-secondary:      #625E56;
  --color-text-tertiary:       #9C9890;
  --color-text-inverse:        #FFFFFF;
  --color-text-link:           #9A6F1A;

  /* ─── Gold (Primary Brand) ─── */
  --color-gold-50:             #FDF8EC;
  --color-gold-100:            #F8EDCC;
  --color-gold-200:            #F0D88D;
  --color-gold-300:            #E2BC50;
  --color-gold-400:            #D4A017;
  --color-gold-500:            #B8892A;
  --color-gold-600:            #9A6F1A;
  --color-gold-700:            #7A5512;

  /* ─── Teal (Secondary Brand) ─── */
  --color-teal-50:             #EEF9F8;
  --color-teal-100:            #D2F0ED;
  --color-teal-200:            #9FDDD8;
  --color-teal-400:            #2DA89C;
  --color-teal-500:            #1D8A80;
  --color-teal-600:            #176F67;
  --color-teal-700:            #125650;

  /* ─── Status ─── */
  --color-success-bg:          #EDFAF4;
  --color-success-border:      #7FD4B0;
  --color-success-text:        #1A6B4A;
  --color-success-solid:       #2AA57A;
  --color-warning-bg:          #FEF6E6;
  --color-warning-border:      #F0C060;
  --color-warning-text:        #8A5A00;
  --color-warning-solid:       #D4900A;
  --color-error-bg:            #FEF0F0;
  --color-error-border:        #F0A0A0;
  --color-error-text:          #8A1515;
  --color-error-solid:         #CC2828;
  --color-info-bg:             #EEF6FE;
  --color-info-border:         #93C8F5;
  --color-info-text:           #1A4E7A;
  --color-info-solid:          #2878C8;

  /* ─── Narrator Reliability Grades ─── */
  --grade-thiqah-bg:           #EEF9F8;
  --grade-thiqah-border:       #9FDDD8;
  --grade-thiqah-text:         #1D8A80;
  --grade-sadooq-bg:           #EEF6FE;
  --grade-sadooq-border:       #93C8F5;
  --grade-sadooq-text:         #1A4E7A;
  --grade-daif-bg:             #FEF6E6;
  --grade-daif-border:         #F0C060;
  --grade-daif-text:           #8A5A00;
  --grade-matrook-bg:          #FEF0F0;
  --grade-matrook-border:      #F0A0A0;
  --grade-matrook-text:        #8A1515;
  --grade-unknown-bg:          #F3F2EF;
  --grade-unknown-border:      #D8D5CE;
  --grade-unknown-text:        #625E56;

  /* ─── Diff ─── */
  --color-diff-add-bg:         #EDFAF4;
  --color-diff-add-border:     #7FD4B0;
  --color-diff-add-text:       #1A6B4A;
  --color-diff-add-char:       #B5F0D4;
  --color-diff-remove-bg:      #FEF0F0;
  --color-diff-remove-border:  #F0A0A0;
  --color-diff-remove-text:    #8A1515;
  --color-diff-remove-char:    #FFD0D0;
  --color-diff-neutral:        #F3F2EF;

  /* ─── Syntax ─── */
  --color-syntax-narrator:     #1D8A80;
  --color-syntax-connector:    #9A6F1A;
  --color-syntax-year:         #9C3AE5;
  --color-syntax-bracket:      #625E56;
  --color-syntax-unknown:      #9C9890;

  /* ─── Typography ─── */
  --font-display-arabic:       'ThmanyahSerifDisplay', 'Amiri', 'Scheherazade New', serif;
  --font-body-arabic:          'ThmanyahSerifText', 'ThmanyahSerifDisplay', 'Amiri', serif;
  --font-ui-arabic:            'ThmanyahSans', 'Cairo', 'Noto Sans Arabic', sans-serif;
  --font-ui-latin:             'Inter', 'Helvetica Neue', Arial, sans-serif;
  --font-mono:                 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace;

  /* ─── Type Scale ─── */
  --text-2xs:                  0.6875rem;
  --text-xs:                   0.8125rem;
  --text-sm:                   0.9375rem;
  --text-base:                 1rem;
  --text-md:                   1.0625rem;
  --text-lg:                   1.25rem;
  --text-xl:                   1.5rem;
  --text-2xl:                  2rem;
  --text-3xl:                  2.5rem;
  --text-4xl:                  3.25rem;

  /* ─── Line Heights ─── */
  --leading-tight:             1.25;
  --leading-snug:              1.375;
  --leading-base:              1.5;
  --leading-relaxed:           1.65;
  --leading-loose:             1.8;

  /* ─── Font Weights ─── */
  --weight-regular:            400;
  --weight-medium:             500;
  --weight-semibold:           600;
  --weight-bold:               700;

  /* ─── Spacing ─── */
  --space-1:                   0.25rem;
  --space-2:                   0.5rem;
  --space-3:                   0.75rem;
  --space-4:                   1rem;
  --space-5:                   1.25rem;
  --space-6:                   1.5rem;
  --space-8:                   2rem;
  --space-10:                  2.5rem;
  --space-12:                  3rem;
  --space-16:                  4rem;
  --space-20:                  5rem;
  --space-24:                  6rem;
  --space-32:                  8rem;

  /* ─── Container Widths ─── */
  --container-tool:            1440px;
  --container-content:         1280px;
  --container-prose:           720px;
  --container-narrow:          480px;

  /* ─── Border Radius ─── */
  --radius-none:               0;
  --radius-sm:                 0.25rem;
  --radius-md:                 0.375rem;
  --radius-lg:                 0.625rem;
  --radius-xl:                 1rem;
  --radius-2xl:                1.5rem;
  --radius-full:               9999px;

  /* ─── Shadows ─── */
  --shadow-xs:    0 1px 2px rgba(28, 26, 23, 0.06);
  --shadow-sm:    0 1px 3px rgba(28, 26, 23, 0.08), 0 1px 2px rgba(28, 26, 23, 0.05);
  --shadow-md:    0 4px 12px rgba(28, 26, 23, 0.08), 0 2px 4px rgba(28, 26, 23, 0.05);
  --shadow-lg:    0 8px 24px rgba(28, 26, 23, 0.10), 0 4px 8px rgba(28, 26, 23, 0.06);
  --shadow-xl:    0 16px 40px rgba(28, 26, 23, 0.12), 0 8px 16px rgba(28, 26, 23, 0.06);
  --shadow-focus-gold: 0 0 0 3px rgba(212, 160, 23, 0.30);
  --shadow-focus-teal: 0 0 0 3px rgba(45, 168, 156, 0.30);

  /* ─── Motion ─── */
  --ease-standard:             cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out-expo:             cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quad:          cubic-bezier(0.45, 0, 0.55, 1);
  --ease-in-expo:              cubic-bezier(0.7, 0, 0.84, 0);

  --duration-instant:          80ms;
  --duration-fast:             120ms;
  --duration-standard:         200ms;
  --duration-expand:           280ms;
  --duration-page:             350ms;
}
```
