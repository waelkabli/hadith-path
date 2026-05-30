# Hadith Path — Figma Screen-Building Instructions

> This document is the single authoritative brief for building every Figma screen and component for Hadith Path. It is derived from three sources — the implemented React/ReactFlow components (README.md), the visual system (DESIGN_GUIDE.md), and the product decisions (RESEARCH.md) — and resolves any conflict between them. Every measurement, color, and typography value references the design token system in DESIGN_GUIDE.md §12. When this document contradicts an older version, **this version wins**.

---

## 0. Figma File Setup — Do This Before Drawing Any Frame

### 0.1 Variable Collection: `Tokens`

Create a local variable collection named **Tokens**. Build three groups inside it.

**Group: color** (Variable type = Color)

Foundation:
```
canvas                 #FAF9F6
surface                #FFFFFF
surface-raised         #FEFEFE
surface-sunken         #F3F2EF
surface-overlay        rgba(28,26,23,0.50)
```

Borders:
```
border-subtle          #ECEAE4
border-default         #D8D5CE
border-strong          #B5B1A8
```

Text:
```
text-primary           #1C1A17
text-secondary         #625E56
text-tertiary          #9C9890
text-inverse           #FFFFFF
text-link              #9A6F1A
```

Gold (primary brand):
```
gold-50                #FDF8EC
gold-100               #F8EDCC
gold-200               #F0D88D
gold-300               #E2BC50
gold-400               #D4A017
gold-500               #B8892A
gold-600               #9A6F1A
gold-700               #7A5512
```

Teal (secondary brand):
```
teal-50                #EEF9F8
teal-100               #D2F0ED
teal-200               #9FDDD8
teal-400               #2DA89C
teal-500               #1D8A80
teal-600               #176F67
teal-700               #125650
```

Status:
```
success-bg             #EDFAF4
success-border         #7FD4B0
success-text           #1A6B4A
success-solid          #2AA57A
warning-bg             #FEF6E6
warning-border         #F0C060
warning-text           #8A5A00
warning-solid          #D4900A
error-bg               #FEF0F0
error-border           #F0A0A0
error-text             #8A1515
error-solid            #CC2828
info-bg                #EEF6FE
info-border            #93C8F5
info-text              #1A4E7A
info-solid             #2878C8
```

Narrator reliability grades:
```
grade-thiqah-bg        #EEF9F8
grade-thiqah-border    #9FDDD8
grade-thiqah-text      #1D8A80
grade-sadooq-bg        #EEF6FE
grade-sadooq-border    #93C8F5
grade-sadooq-text      #1A4E7A
grade-daif-bg          #FEF6E6
grade-daif-border      #F0C060
grade-daif-text        #8A5A00
grade-matrook-bg       #FEF0F0
grade-matrook-border   #F0A0A0
grade-matrook-text     #8A1515
grade-unknown-bg       #F3F2EF
grade-unknown-border   #D8D5CE
grade-unknown-text     #625E56
```

Diff:
```
diff-add-bg            #EDFAF4
diff-add-border        #7FD4B0
diff-add-text          #1A6B4A
diff-add-char          #B5F0D4
diff-remove-bg         #FEF0F0
diff-remove-border     #F0A0A0
diff-remove-text       #8A1515
diff-remove-char       #FFD0D0
diff-neutral           #F3F2EF
```

Syntax:
```
syntax-narrator        #1D8A80
syntax-connector       #9A6F1A
syntax-year            #9C3AE5
syntax-bracket         #625E56
syntax-unknown         #9C9890
```

Variant colors (reserved exclusively for variant identity — never reuse for grades or status):
```
variant-1              #16A34A
variant-2              #2563EB
variant-3              #D97706
variant-4              #DC2626
variant-5              #9C3AE5
```

---

**Group: spacing** (Variable type = Number)
```
space-1    4
space-2    8
space-3    12
space-4    16
space-5    20
space-6    24
space-8    32
space-10   40
space-12   48
space-16   64
space-20   80
space-24   96
```

**Group: radius** (Variable type = Number)
```
radius-sm    4
radius-md    6
radius-lg    10
radius-xl    16
radius-2xl   24
radius-full  9999
```

---

### 0.2 Text Styles

Create each style exactly as named here. The hierarchy uses slashes for Figma's style panel grouping.

| Style Name | Font Family | Weight | Size (px) | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| `arabic/display/2xl` | ThmanyahSerifDisplay (fallback: Amiri) | Bold 700 | 32 | 125% | -2% |
| `arabic/display/xl` | ThmanyahSerifDisplay | Bold 700 | 24 | 135% | -2% |
| `arabic/display/lg` | ThmanyahSerifDisplay | SemiBold 600 | 20 | 140% | -1% |
| `arabic/display/base` | ThmanyahSerifDisplay | Regular 400 | 16 | 180% | 0 |
| `arabic/display/sm` | ThmanyahSerifDisplay | Regular 400 | 15 | 175% | 0 |
| `arabic/body/base` | ThmanyahSerifText (fallback: ThmanyahSerifDisplay) | Regular 400 | 16 | 185% | 0 |
| `arabic/body/sm` | ThmanyahSerifText | Regular 400 | 15 | 180% | 0 |
| `arabic/ui/lg` | ThmanyahSans (fallback: Cairo) | SemiBold 600 | 20 | 140% | 0 |
| `arabic/ui/md` | ThmanyahSans | SemiBold 600 | 17 | 155% | 0 |
| `arabic/ui/base` | ThmanyahSans | Medium 500 | 16 | 160% | 0 |
| `arabic/ui/sm` | ThmanyahSans | Regular 400 | 15 | 155% | 0 |
| `arabic/ui/xs` | ThmanyahSans | Medium 500 | 13 | 150% | 3% |
| `arabic/ui/2xs` | ThmanyahSans | Medium 500 | 11 | 145% | 6% |
| `latin/ui/xl` | Inter | SemiBold 600 | 24 | 135% | -2% |
| `latin/ui/lg` | Inter | SemiBold 600 | 20 | 140% | -1% |
| `latin/ui/md` | Inter | Medium 500 | 17 | 155% | 0 |
| `latin/ui/sm` | Inter | Regular 400 | 15 | 155% | 0 |
| `latin/ui/xs` | Inter | Regular 400 | 13 | 150% | 0 |
| `latin/ui/2xs` | Inter | Regular 400 | 11 | 145% | 6% |
| `mono/base` | IBM Plex Mono | Regular 400 | 16 | 160% | 0 |
| `mono/sm` | IBM Plex Mono | Regular 400 | 15 | 155% | 0 |
| `mono/xs` | IBM Plex Mono | Regular 400 | 13 | 150% | 0 |
| `mono/2xs` | IBM Plex Mono | Regular 400 | 11 | 145% | 0 |

> **Arabic line-height rule:** All Arabic text styles use line heights 15–20% taller than their Latin equivalents at the same size. Arabic glyphs extend further above/below baseline.

---

### 0.3 Canvas and Frame Settings

- **Page background fill**: `canvas` (#FAF9F6) on every page
- **Desktop frame size**: 1440 × 900px — the tool container max-width
- **Frame background**: `canvas` (#FAF9F6) unless a screen uses `surface` (#FFFFFF)
- **Clip content**: ON for all frames that are cards/panels; OFF for full-viewport frames
- **Auto layout**: every container described in this document uses Figma auto-layout. Non-auto-layout elements are called out explicitly.

---

### 0.4 Figma Page and Frame Naming

Create one Figma **page** per group below:

```
Page 0  — Component Library
Page 1  — Screen 00: Landing Page
Page 2  — Screen 01: Empty Input
Page 3  — Screen 02: Parsing (loading)
Page 4  — Screen 03: Split Result
Page 5  — Screen 04: Narrator List (clean)
Page 6  — Screen 05: Narrator List (disambiguation banner)
Page 7  — Screen 06: Disambiguation Panel — Candidates
Page 8  — Screen 07: Disambiguation Panel — Add Custom
Page 9  — Screen 08: Split Correction Editor
Page 10 — Screen 09: Chain Visualization — Single
Page 11 — Screen 10: Chain Visualization — Multi-Variant
Page 12 — Screen 11: Narrator Bio Drawer (open)
Page 13 — Screen 12: Variant Input Panel
Page 14 — Screen 13: Diff View — Inline
Page 15 — Screen 14: Diff View — Side-by-Side
Page 16 — Screen 15: Export Toolbar
Page 17 — Screen 16: Import Confirmation Modal
Page 18 — Screen 17: Settings Panel
Page 19 — Screen 18: Error & Edge State Gallery
```

On each page, name the root frame using the pattern above and add a second frame labeled `[name] — Annotations` for red-line specs.

---

## 1. Global Chrome — Navigation Header

**Appears on every screen. Build as a component `C-NavHeader` and reuse.**

### Dimensions

- Width: 1440px (fills frame)
- Height: 56px (3.5rem)

### Auto-layout

- Direction: horizontal
- Padding: 0 24px (left and right, `space-6`)
- Align items: center
- Justify content: space-between
- Gap: 0 (children justify themselves)

### Fill and border

- Fill: `surface` (#FFFFFF)
- Bottom border: 1px stroke, `border-subtle` (#ECEAE4)
- Backdrop blur: 8px (Figma: use Background Blur effect)

### Logo group (right side — RTL leading position)

Auto-layout: horizontal, gap 8px, align center.

- **Arabic mark**: text `مسار الحديث` — style `arabic/display/lg`, fill `gold-500` (#B8892A). The Arabic mark is always visible.
- **Latin name**: text `Hadith Path` — style `latin/ui/md`, fill `text-primary`.
- These two sit side-by-side with a 8px gap. Arabic is first (rightmost in RTL context).

### Nav links group (left side — RTL trailing position)

Auto-layout: horizontal, gap 4px, align center.

Two ghost text links. Each link frame:
- Auto-layout: horizontal, padding 8px 12px
- Radius: `radius-md` (6px)
- Fill: transparent by default
- Text: style `latin/ui/sm`, fill `text-secondary`

**States for nav link:**
| State | Fill | Text color |
|---|---|---|
| Default | transparent | `text-secondary` |
| Hover | `surface-sunken` | `text-primary` |
| Active page | `gold-50` | `gold-600` |

### Nav actions group

Auto-layout: horizontal, gap 8px, align center.
- Contains: Settings icon-button (`C-IconButton`)

---

## 2. Screen 00 — Landing Page

**The only page with a hero section. All other screens are the tool viewport.**

### Hero section

Frame: 1440 × 640px, fill `canvas`, auto-layout vertical, align center, justify center, padding 96px 0 (`space-24`).

**Inner container**: max-width 720px (`container-prose`), auto-layout vertical, gap 24px, align center.

**Headline** (Arabic):
- Text: `مسار الحديث` — style `arabic/display/2xl`, fill `text-primary`
- Text align: center, direction RTL

**Subhead** (Latin):
- Text: `Paste a hadith. Trace its chain. Compare its variants.`
- Style `latin/ui/xl`, fill `text-secondary`
- Text align: center

**Description** (1–2 sentences):
- ThmanyahSans Regular 17px (`arabic/ui/base`), fill `text-secondary`, line-height 1.7, text align center, max-width 560px

**CTA button row**: auto-layout horizontal, gap 12px, justify center.
- Primary button: `تحليل الحديث` — `C-PrimaryButton` (see Component Library)
- Ghost link: `اقرأ عن المشروع` — `C-GhostButton`

**Note**: The hero is the only area with 96px vertical padding. Tool sections use 48px max.

---

## 3. Core Tool Layout

**All Screens 01–18 share this wrapper. Build it once as a component or as a shared frame structure.**

The tool occupies the viewport below the nav. Height: `calc(100vh − 56px)` = 844px at 900px viewport.

```
1440 × 844  Tool Viewport Frame
├── NavHeader (56px, fixed at top — include in each screen)
└── Tool Body  (1440 × 844, below nav)
    └── Content card  (max-width 720px, centered horizontally)
        └── All screen content stacks vertically here
```

The tool layout is a **single scrollable column** centered at 720px max-width (`container-prose`). It is NOT the sidebar+panel layout described in DESIGN_GUIDE.md §4 — that layout is reserved for future v2 panel expansion. The content card sits on the `canvas` background.

**Content card** (the centered card all inputs and outputs render inside):
- Width: 720px
- Background: `surface` (#FFFFFF)
- Border: 1px `border-default` (#D8D5CE)
- Radius: `radius-lg` (10px)
- Shadow: `shadow-sm` (0 1px 3px rgba(28,26,23,0.08))
- Auto-layout: vertical, gap 0 (sections are separated by border-top hairlines)
- Horizontal margin: auto (centered)
- Vertical margin-top: 32px from nav bottom

---

## 4. Screen 01 — Empty Input

**First thing the user sees after landing or clicking "Start over".**

### Card content (inside the 720px content card)

Single section, padding 20px (`space-5`).

**Textarea — hadith input**:
- Frame size: fill-parent width, min-height 200px
- Fill: `surface-sunken` (#F3F2EF)
- Border: 1px `border-default`, radius `radius-lg` (10px)
- Padding: 16px (`space-4`) all sides
- Text style: `arabic/display/lg` (ThmanyahSerifDisplay 20px), fill `text-primary`
- Line height: 195% (the Arabic-adjusted value for display font at this size)
- Direction: RTL, text-align: right
- Resize handle: visible at bottom-right corner (standard textarea behavior)
- **Placeholder text**: `الصق نص الحديث هنا…`
  - Style: `arabic/ui/base` (ThmanyahSans 16px), fill `text-tertiary`, direction RTL

**Button row** (below textarea):
- Auto-layout: horizontal, gap 12px, align center
- Direction: RTL (primary button on the right, which is the leading side in RTL)
- Margin-top: 12px from textarea

Buttons:
- **Primary "تحليل الحديث"**: `C-PrimaryButton` (md size)
- **Ghost "مثال"**: `C-GhostButton` (sm size), fill `text-secondary` — loads a sample hadith text

**Error state variant** (create as a separate Figma variant on the card):
- Textarea border: `error-border` (#F0A0A0)
- Textarea shadow: `0 0 0 3px rgba(204,40,40,0.20)`
- Error message below: style `arabic/ui/xs`, fill `error-text` (#8A1515)
  - Example text: `الرجاء إدخال نص الحديث`

---

## 5. Screen 02 — Parsing / Loading State

**While the LLM API call is in progress.**

All elements same as Screen 01, with these changes:

**Textarea**: opacity 50%. Not editable (show as disabled).

**Primary button — loading variant**:
- Fill: `surface-sunken`, border: `border-default`, text: `text-tertiary`
- Spinner icon (Lucide Loader2, 16px, stroke 1.75) placed to the left of the button text (RTL: appears on the left side of the label)
- In Figma: render as a static arc, 270° stroke, `text-tertiary`

**Loading indicator row** (below button row):
- Auto-layout: horizontal, gap 8px, align center, direction RTL
- Spinner 14px + text "جارٍ التحليل…" — style `arabic/ui/xs`, fill `text-secondary`

---

## 6. Screen 03 — Isnad/Matn Split Result

**After parsing succeeds. Textarea collapses to a compact bar. Split sections appear below.**

### Compact hadith bar (replaces textarea)

Frame: fill-parent width, height 48px.
Auto-layout: horizontal, padding 12px 20px, align center, justify space-between.
Border-bottom: 1px `border-subtle`.

- **Preview text** (truncated to ~80 chars + ellipsis): `arabic/display/sm`, fill `text-secondary`, flex 1, overflow ellipsis, direction RTL
- **"بدء من جديد"** ghost small button: border 1px `gold-300`, fill `surface`, color `gold-600`, padding 8px 12px, style `arabic/ui/xs`, radius `radius-md`

### Split actions bar

Frame: fill-parent, height 44px.
Auto-layout: horizontal, padding 8px 20px, align center, justify space-between.
Fill: `surface-sunken`, border-bottom: 1px `border-subtle`.

Right side (RTL leading):
- **"تعديل نقطة الفصل"** ghost button: border 1px `border-default`, fill transparent, color `text-secondary`, padding 4px 12px, style `arabic/ui/xs`, radius `radius-md`

Left side (RTL trailing):
- **"تم التعديل يدوياً" badge** (only when correction was made):
  - Fill: `warning-bg`, border 1px `warning-border`, radius `radius-sm` (4px)
  - Padding: 4px 8px
  - Style: `arabic/ui/xs` Medium, fill `warning-text`

### Isnad section

Auto-layout: vertical, gap 8px, padding 16px 20px.
Border-bottom: 1px `border-subtle`.

- **Section label**: text `السند` — style `arabic/ui/2xs`, fill `text-tertiary`, letter-spacing 7%, direction RTL
- **Isnad text block**:
  - Fill: `surface-sunken`, border 1px `border-default`, radius `radius-lg`
  - Padding: 16px
  - Text style: `arabic/display/lg` (ThmanyahSerifDisplay 20px), fill `text-primary`, line-height 195%, direction RTL, text-align right
  - Content: The isnad text from the parser

### Matn section

Same structure as isnad section, label `المتن`, no bottom border.

---

## 7. Screen 04 — Narrator List (Auto-Resolved)

**Appears below the split result when narrator extraction completes with no disambiguation issues.**

### Section header bar

Frame: fill-parent, height 44px.
Auto-layout: horizontal, padding 8px 20px, align center, justify space-between.
Border-top: 1px `border-subtle`.

- Right: label `الرواة` — style `arabic/ui/2xs`, fill `text-tertiary`, letter-spacing 7%
- Left: narrator count, e.g. `٦ رواة` — style `arabic/ui/xs`, fill `text-tertiary`

### Narrator list

Auto-layout: vertical, padding 8px 20px 20px, gap 6px.

**Each narrator row** — `C-NarratorRow` component:
- Auto-layout: horizontal, gap 12px, align center
- Fill: `surface-sunken` (#F3F2EF)
- Border: 1px `border-default`, radius `radius-md` (6px)
- Padding: 8px 12px
- Direction: RTL

Contents (right to left in RTL reading order):

1. **Position number**: `1` `2` `3` … — style `mono/2xs`, fill `text-tertiary`, width 18px, text-align center, direction LTR, flex-shrink 0
2. **Arabic name** (flex 1): style `arabic/display/base` (ThmanyahSerifDisplay 16px), fill `text-primary`, line-height 170%, direction RTL
3. **Reliability badge** `C-ReliabilityBadge`: see component spec
4. **Confidence badge** `C-ConfidenceBadge`: see component spec
5. **State icon** (16px, rightmost, flex-shrink 0):
   - Confirmed: Lucide Check, stroke `success-text`, stroke-width 2
   - Flagged: Lucide AlertTriangle, stroke `warning-solid`, stroke-width 1.75
   - Unknown: text `؟`, style `arabic/ui/xs`, fill `text-tertiary`

**Row state variants:**

| State | Border color | Fill |
|---|---|---|
| Default | `border-default` | `surface-sunken` |
| Selected | `#2563EB` | `#EFF6FF` |
| Confirmed | `success-solid` | `surface-sunken` |
| Flagged | `warning-solid` | `surface-sunken` |
| Unknown | `border-strong` | `surface-sunken` |

---

## 8. Screen 05 — Narrator List with Disambiguation Banner

**Same as Screen 04 but 1+ narrators flagged.**

### Disambiguation banner

Frame: fill-parent width.
Auto-layout: horizontal, padding 12px 16px, align center, justify space-between.
Fill: `#FEF9C3` (amber-100), border 1px `#FDE047`, radius `radius-md`, margin: 0 20px 8px.

- Right: count text — e.g. `١ راوٍ غير محدد` — style `arabic/ui/sm`, fill `#92400E`
- Left: "راجع الآن" button — fill `#FDE047`, no border, radius `radius-md`, style `arabic/ui/xs` Medium, fill `#92400E`, padding 4px 12px

### Stale state (when the isnad/matn split was corrected after extraction ran)

- Narrator list container: opacity 60%
- Section label adds suffix ` · قديم` in fill `#9CA3AF`
- "إعادة الاستخراج" button appears in the header row: border 1px `border-default`, radius `radius-md`, style `arabic/ui/xs`, fill `text-link` (#9A6F1A)

---

## 9. Screen 06 — Disambiguation Panel (Candidate List)

**Opens inline below the clicked narrator row. Part of the same content card, pushes content down.**

### Panel frame

Auto-layout: vertical, gap 0.
Border-top: 1px `border-subtle`.
Fill: `surface-sunken`.

### Panel header

Auto-layout: horizontal, padding 16px 20px, align flex-start, justify space-between.
Border-bottom: 1px `border-subtle`.

Left side (RTL trailing):
- **Auto-layout vertical**, gap 2px:
  - Extracted name: style `arabic/display/base` Medium, fill `text-primary`, direction RTL
  - Subtitle: text `تحديد الراوي` — style `arabic/ui/xs`, fill `text-tertiary`

Right side (RTL leading):
- **Close button**: 24×24px, Lucide X 14px icon, fill `text-tertiary`, no bg/border

### Candidate list

Auto-layout: vertical, padding 12px 20px, gap 8px.

**Each candidate row** — `C-CandidateRow` component:
- Auto-layout: vertical (to accommodate collapsed/expanded states)
- Border: 1px `border-default`, radius `radius-md`
- Fill: `surface`
- Overflow: hidden (clip content ON)

**Selected candidate variant**: border `success-solid`, fill `#F0FDF4`

**Main row inside candidate** (always visible):
- Auto-layout: horizontal, padding 8px 12px, gap 12px, align center

Sub-contents (right to left in RTL):
1. **Names column** (auto-layout vertical, gap 2px, flex 1):
   - Arabic name: `arabic/display/base` Medium, fill `text-primary`, direction RTL
   - Latin name + death year: `latin/ui/xs`, fill `text-tertiary`, direction LTR — e.g. `al-Bukhari · d. 256 AH`
2. **Badges column** (auto-layout horizontal, gap 6px, flex-shrink 0):
   - Generation badge: style `arabic/ui/xs`, fill `#6B7280`, bg `#F3F4F6`, radius-full, padding 1px 6px — e.g. `تابعي`
   - Reliability badge: `C-ReliabilityBadge`
   - Similarity score: style `latin/ui/xs`, fill `text-tertiary` — e.g. `87%`
3. **"▾ تفاصيل"** text button: style `arabic/ui/xs`, fill `#2563EB`, no bg/border, flex-shrink 0
4. **"تأكيد"** confirm button (flex-shrink 0):
   - Unconfirmed: fill `#2563EB`, no border, radius `radius-md`, style `arabic/ui/xs` white, padding 8px 12px
   - Already confirmed: fill `success-solid`, same padding

**Expanded details section** (conditional — visible when ▾ is clicked):
- Auto-layout: vertical, padding 12px, gap 8px
- Border-top: 1px `border-subtle`, fill `surface-sunken`
- Bio note: style `latin/ui/xs`, fill `text-secondary`, direction LTR
- Teacher list: label `المشايخ:` + names — same style
- Student list: label `التلاميذ:` + names
- Collections: label `المصادر:` + comma list

### Panel footer — action buttons

Auto-layout: horizontal, padding 12px 20px, gap 8px, align center.
Border-top: 1px `border-subtle`.

1. **"راوٍ غير معروف"**: border 1px `#D1D5DB`, fill transparent, radius `radius-md`, style `arabic/ui/sm`, fill `#6B7280`, padding 8px 16px
2. **"إضافة راوٍ جديد"**: border 1px `border-default`, fill transparent, radius `radius-md`, style `arabic/ui/sm`, fill `text-link`, padding 8px 16px

### Guided mode footer (optional — visible in step-through review mode)

Auto-layout: horizontal, padding 8px 20px, gap 8px, justify space-between.
Border-top: 1px `border-subtle`, fill `surface`.

- Right (RTL leading): "السابق" ghost button — border 1px `border-default`
- Left (RTL trailing): "التالي" primary blue button — fill `#2563EB`, white text; OR "إنهاء المراجعة" success button — fill `success-solid` (on last narrator)

---

## 10. Screen 07 — Add Custom Narrator Form

**Replaces the candidate list inside the disambiguation panel.**

### Form container

Auto-layout: vertical, padding 16px 20px, gap 12px.
Direction: RTL.

### Form field pattern (repeat for each field)

Auto-layout: vertical, gap 6px, fill-parent width.

- **Label**: style `arabic/ui/xs` Medium, fill `text-tertiary`, direction RTL. Required marker: red asterisk `*` appended inline, fill `error-text`.
- **Input frame**: fill `surface-sunken`, border 1px `border-default`, radius `radius-md`, padding 8px 12px, height 40px
  - Text: style `arabic/ui/sm`, fill `text-primary`
  - Arabic inputs: direction RTL. Latin/number inputs: direction LTR.

**Fields in order (top to bottom):**

| # | Label | Input direction | Type |
|---|---|---|---|
| 1 | `الاسم العربي *` | RTL | text |
| 2 | `الاسم اللاتيني *` | LTR | text |
| 3 | `سنة الوفاة (هـ)` | LTR | number |
| 4 | `الطبقة *` | RTL | select: صحابي / تابعي / تابع التابعين / متأخر |
| 5 | `الحكم *` | RTL | select: ثقة / ثقة ثبت / صدوق / لا بأس به / صالح / ضعيف / متروك / مجهول |

**Error state for each field**:
- Border: `error-border` (#F0A0A0)
- Error text below: style `arabic/ui/xs`, fill `error-text`

### Button row

Auto-layout: horizontal, padding-top 8px, gap 8px, justify flex-end.

- **"إلغاء"**: border 1px `border-default`, fill transparent, radius `radius-md`, style `arabic/ui/sm`, fill `text-secondary`, padding 8px 16px
- **"حفظ"**: fill `#2563EB`, no border, radius `radius-md`, style `arabic/ui/sm` white, padding 8px 16px

---

## 11. Screen 08 — Split Correction Editor

**Activated by "تعديل نقطة الفصل". Replaces the split result section inside the card.**

### Section container

Auto-layout: vertical, gap 0.
Border-top: 1px `border-subtle`.

### Editor header

Auto-layout: horizontal, padding 12px 20px, align center, justify space-between.
Fill: `surface`.

- Right (RTL leading): label `تعديل نقطة الفصل` — style `arabic/ui/2xs`, fill `text-tertiary`, letter-spacing 7%
- Left (RTL trailing): hint text `انقر أو اسحب لتحريك نقطة الفصل` — style `arabic/ui/xs`, fill `text-tertiary`

### Interactive text block

This is the centerpiece. It shows the full hadith text with a moveable divider handle.

Frame: fill-parent, auto-layout horizontal (text flows RTL).
Padding: 16px 20px.
Fill: `surface-sunken`, border: 1px `border-default` at rest → `teal-400` when dragging.
Radius: `radius-lg`.
Direction: RTL.
Cursor annotation: `pointer` at rest, `col-resize` when dragging.

**Isnad span** (the portion to the right of the handle):
- Inline span style: background `rgba(45,168,156,0.12)` (teal tint), border-radius 2px, padding 1px 0
- Text style: `arabic/display/lg` (ThmanyahSerifDisplay 20px), line-height 195%

**Divider handle** (the draggable boundary marker):
- Rectangle: 2px wide × 1.1em (≈22px) tall
- Fill: `teal-400` (#2DA89C)
- Vertical-align: -0.1em (slight descend below baseline)
- Margin: 0 2px (tight spacing between last isnad word and first matn word)
- In Figma: draw as a 2×22 rectangle, fill `teal-400`, placed inline between the two text spans

**Matn span** (the portion to the left of the handle):
- Plain text, no background highlight
- Same text style as isnad span

### Color legend

Auto-layout: horizontal, gap 16px, padding 0 20px 12px.
Direction: RTL.

- Isnad: 12×12 swatch (fill `rgba(45,168,156,0.2)`, border 1px `teal-400`, radius 2px) + label `السند` in `arabic/ui/xs` `text-tertiary`
- Matn: 12×12 swatch (fill `surface-sunken`, border 1px `border-default`, radius 2px) + label `المتن`

### Action buttons

Auto-layout: horizontal, padding 12px 20px, gap 8px, align center.
Border-top: 1px `border-subtle`, fill `surface`.

1. **"تأكيد"** (`C-PrimaryButton` md): bg `gold-400`, border `gold-500`, text `text-primary`
2. **"إعادة تعيين"** (`C-SecondaryButton` md): bg `surface`, border `border-default`, text `text-primary`
3. **"إلغاء"** (`C-GhostButton`): transparent, no border, text `text-secondary`

---

## 12. Screen 09 — Chain Visualization (Single Hadith)

**The "السلسلة" tab. Rendered by ReactFlow with an RTL dagre layout.**

### Tab bar

Auto-layout: horizontal, padding 0 20px, gap 0.
Border-top: 1px `border-subtle`.

Two tab buttons `C-TabButton` side by side (no gap, no separator):
- `السلسلة` (chain)
- `المقارنة` (diff/compare)

Each tab:
- Padding: 12px 20px, height 44px
- Text: `arabic/ui/sm`, direction RTL
- Inactive: fill transparent, text `text-tertiary`, bottom border 2px solid transparent
- Active: fill transparent, text `text-primary`, bottom border 2px solid `gold-400` (#D4A017)

### Graph canvas area

Frame: fill-parent × 320px.
Fill: `surface` with a dot-grid pattern:
- Dot color: `#F3F4F6`, dot size: 2px, grid spacing: 16px
- Implement in Figma as a Frame with a repeated Grid background or a pattern fill

ReactFlow control buttons (standard +/−/fit): bottom-left corner, 28px apart.

### Narrator chain — horizontal RTL flow

The chain flows right-to-left. The Prophet ﷺ (or earliest transmitter) is the rightmost node; the compiler/author is the leftmost. DOM/layout order mirrors reading order in RTL.

**Chain wrapper**: auto-layout horizontal, direction RTL, align center, gap 0, overflow-x auto, padding 32px 24px.

Each unit in the chain repeats: **[NarratorNode] [ChainConnector]** … until the last node (no connector after it).

#### C-NarratorChainNode (chain node)

This is the most important component to get right. It departs significantly from a generic card.

Frame: min-width 140px, max-width 180px, auto-layout vertical, align center, gap 8px, padding 16px 20px.
Fill: `surface` (#FFFFFF).
Border: 1.5px `border-default`, radius **`radius-2xl` = 24px** (pill shape — not 6px or 8px).
Shadow: `shadow-sm` (0 1px 3px rgba(28,26,23,0.08)).

**Border-top grade stripe** (3px overrides the default 1.5px on the top edge only):
| Grade | Top border color |
|---|---|
| ثقة (thiqah) | `teal-500` (#1D8A80) |
| صدوق (sadooq) | `info-solid` (#2878C8) |
| ضعيف (daif) | `warning-solid` (#D4900A) |
| متروك (matrook) | `error-solid` (#CC2828) |
| مجهول (unknown) | `border-strong` (#B5B1A8) |

**Hover state**: shadow `shadow-lg`, transform translateY(-2px) — annotate with Smart Animate prototype.

**Contents (top to bottom, all centered):**

1. **Arabic name**: style `arabic/ui/md` SemiBold 17px, fill `text-primary`, text-align center, direction RTL, max-width 140px, overflow ellipsis
2. **Latin transliteration**: style `latin/ui/xs` 13px, fill `text-secondary`, text-align center, direction LTR — always present below the Arabic name
3. **Death year**: style `mono/2xs` 11px, fill `text-tertiary`, text-align center, direction LTR — format: `ت. 256 هـ`
4. **Grade badge** `C-ReliabilityBadge`: auto-layout horizontal, padding 2px 8px, border-radius `radius-sm` (4px), fill = grade-bg token, border 1px grade-border token, text style `arabic/ui/2xs` Medium, fill = grade-text token

**State icon overlay** (14×14px, absolute-positioned at top-right corner of the card, 6px from edges):
- Confirmed: Lucide Check circle, stroke `success-solid`
- Flagged: Lucide AlertTriangle, stroke `warning-solid`
- No icon for default and unknown states

#### Terminal nodes — Prophet ﷺ and compiler

Apply to the rightmost and leftmost nodes:
- Border: 1.5px `gold-300` (#E2BC50) all sides (overrides default border)
- Fill: `gold-50` (#FDF8EC)
- Arabic name text fill: `gold-700` (#7A5512)

For the Prophet ﷺ node specifically, the Arabic name should be `النبي ﷺ` with the ﷺ character (U+FDFA) rendered inline.

#### C-ChainConnector (connector between nodes)

Frame: 48px × auto (tall enough to contain label + line), auto-layout vertical, align center.
Do NOT scale with the node height. Center the line at the vertical midpoint of the node cards.

Contents (top to bottom):
1. **Transmission phrase label**: text — e.g. `عن` / `حدثنا` / `قال` — style `arabic/ui/2xs`, fill `syntax-connector` (#9A6F1A), text-align center, direction RTL. Margin-bottom 4px.
2. **Connector line**: frame 48px wide × 1.5px tall, fill `border-default`. On the trailing (right in LTR, left in RTL) end: 6×6 filled circle, fill `border-strong`, radius-full. This is the small dot that anchors the edge to the node.

**In ReactFlow Figma representation**: draw the line as a straight horizontal path. The arrowhead is a small closed triangle at the leading end (pointing toward the earlier narrator/source, i.e. pointing right in RTL).

---

## 13. Screen 10 — Chain Visualization (Multi-Variant)

**2–5 variants loaded. VariantChainView overlays multiple chains on a shared DAG.**

### Differences from Screen 09

- Same 320px canvas height, same dot-grid background
- Shared nodes (narrators appearing in all variants) render as `C-NarratorChainNode` with default styling
- **Edges are color-coded per variant** using `variant-1` through `variant-5` colors
- Multiple edges between the same pair of nodes render with small lateral offsets so they remain visually distinct (stagger by 2px vertically)
- Node borders change based on which variants include this narrator:
  - Shared by all: default border
  - Unique to one variant: 1.5px solid border in that variant's color

### Variant legend overlay

Position: absolute top-right corner of graph canvas, 12px from edges.

Frame: auto-layout vertical, padding 8px 12px, gap 4px.
Fill: `rgba(255,255,255,0.92)`, border 1px `border-subtle`, radius `radius-sm` (4px).
Direction: RTL.

Each row: auto-layout horizontal, gap 6px, align center.
- Color square: 8×8px, radius 2px, fill = variant color
- Label text: `نسخة ١` / `نسخة ٢` … — style `arabic/ui/xs`, fill `text-secondary`

---

## 14. Screen 11 — Narrator Bio Drawer

**Slides in from the right (inline-end) edge of the chain canvas when a node is clicked.**

### Overlay (behind drawer)

Full viewport frame, fixed inset 0.
Fill: `surface-overlay` (rgba(28,26,23,0.50)).
Z-index annotation: 200.

### Drawer frame

Position: fixed, anchored to right/top, full viewport height minus nav.
Width: **400px** (not 280px — the DESIGN_GUIDE specifies 400px).
Fill: `surface`.
Border-left: 1px `border-default`.
Shadow: `shadow-xl`.
Auto-layout: vertical, gap 0.
Clip content: ON.
Direction: RTL.

**Enter animation annotation**: translateX(−100%) → translateX(0), 280ms, ease-out-expo. Mark in prototype.

### Drawer header

Auto-layout: horizontal, padding 20px 24px, align flex-start, justify space-between.
Border-bottom: 1px `border-subtle`.

Left side (RTL trailing):
- **Close button**: 28×28px, Lucide X 16px, fill `text-tertiary`, no bg/border, radius `radius-md`

Right side (RTL leading):
- Auto-layout vertical, gap 4px:
  - Arabic name: style `arabic/display/xl` (ThmanyahSerifDisplay 24px Bold), fill `text-primary`, direction RTL
  - Latin transliteration: style `latin/ui/sm`, fill `text-secondary`, direction LTR, margin-top 4px

### Drawer body (scrollable)

Auto-layout: vertical, padding 20px 24px, gap 20px.
Overflow-y: scroll.

**Unknown narrator state**:
- Single centered text: `لا توجد بيانات لهذا الراوي` — style `arabic/ui/sm`, fill `text-secondary`, padding 40px 0

**Known narrator content — 5 sections:**

**Section 1 — Metadata grid**:
Auto-layout: 2-column grid (implement as two parallel auto-layout columns), gap 12px.

Each meta item: auto-layout vertical, gap 4px.
- Label: style `arabic/ui/2xs`, fill `text-tertiary`, direction RTL
- Value: style `arabic/body/sm` (ThmanyahSerifText 15px), fill `text-primary`, direction RTL

Items: وفاة (death year, format: `256 هـ`), طبقة (generation), حكم (reliability — use `C-ReliabilityBadge` here as the value)

**Section 2 — Teachers (المشايخ)**:
Label: style `arabic/ui/xs` Medium, fill `text-tertiary`. 
Bullet list of Arabic names: style `arabic/body/sm`, fill `text-primary`, direction RTL, gap 4px.

**Section 3 — Students (التلاميذ)**:
Same structure as Section 2.

**Section 4 — Collections (المصادر)**:
Comma-separated list, style `latin/ui/xs`, fill `text-secondary`, direction LTR.

**Section 5 — Biography (ترجمة)**:
Paragraph, style `latin/ui/xs` (or `arabic/body/base` if bio is in Arabic), fill `text-secondary`, line-height 160%.

---

## 15. Screen 12 — Variant Input Panel

**Each additional variant (up to 4 extra, 5 total) is added via this panel below the primary card content.**

### "Add variant" row

Appears after primary narrator extraction succeeds.

Frame: fill-parent, height 48px.
Auto-layout: horizontal, padding 12px 20px, align center, justify flex-end.
Border-top: 1px `border-subtle`.

- **"+ إضافة نسخة"** `C-SecondaryButton` sm: border 1px `gold-300`, fill `surface`, color `gold-600`, style `arabic/ui/xs`, padding 8px 12px, radius `radius-md`

### Per-variant input panel

Auto-layout: vertical, gap 0.
Border-top: 1px `border-subtle`.

**Variant header** (colored accent bar):
Auto-layout: horizontal, padding 12px 20px, align center, justify space-between.
Fill: `surface-sunken`.

- Left (RTL trailing): "✕ حذف" ghost button — style `arabic/ui/xs`, fill `text-tertiary`
- Right (RTL leading): auto-layout horizontal, gap 8px, align center:
  - Color dot: 10×10px, fill = variant color (from variant color scheme), radius-full
  - Label `نسخة ٢` / `نسخة ٣` … — style `arabic/ui/sm` Medium, fill `text-secondary`

**Variant textarea**:
Same specs as main textarea but:
- min-height 160px
- Focus border: variant color instead of `gold-500`
- Focus shadow: `0 0 0 3px` variant color at 30% opacity

**Variant action row**:
- "تحليل هذه النسخة" small button: border 1px in variant color, fill transparent, text = variant color, style `arabic/ui/xs`, padding 6px 12px, radius `radius-md`
- Margin: 0 20px 16px, aligned right (RTL leading)

---

## 16. Screen 13 — Export Toolbar

**Appears after analysis is complete, above the tab bar.**

### Toolbar frame

Auto-layout: horizontal, padding 10px 20px, align center, wrap, gap 8px.
Fill: `surface-sunken`.
Border-top: 1px `border-subtle`.

Contents (right to left in RTL):
- Label `تصدير:` — style `arabic/ui/xs` Medium, fill `text-tertiary`
- **"JSON"** — `C-ExportButton` (ghost sm)
- **"استيراد JSON"** — `C-ExportButton`
- **"JPG"** — `C-ExportButton`
- **"PDF"** — `C-ExportButton`

**Loading overlay** (when an export is processing):
- Position: absolute inset 0, z-index 10
- Fill: `rgba(255,255,255,0.75)`
- Centered content: Loader spinner 14px + text `جارٍ التصدير…` style `arabic/ui/sm`, fill `text-secondary`

**Error row** (when export fails):
- Frame: fill-parent, auto-layout horizontal, padding 8px 12px, gap 8px, align center
- Fill: `error-bg`, border 1px `error-border`, radius `radius-sm`
- Error text: style `arabic/ui/sm`, fill `error-text`, flex 1
- "إغلاق" dismiss link button: style `arabic/ui/xs`, fill `error-text`, text-decoration underline, on left side (RTL trailing)

---

## 17. Screen 14 — Diff View (Inline / Unified)

**The "المقارنة" tab content, default layout.**

### DiffView container

Auto-layout: vertical, padding 20px, gap 16px.

**Empty state** (< 2 variants with content):
Centered frame, padding 40px 20px.
Text: `أضف نسخة ثانية للمقارنة بين المتون` — style `arabic/ui/sm`, fill `text-tertiary`, text-align center.

**Diff toolbar** (when 2+ variants):
Auto-layout: horizontal, padding 8px 12px, align center, justify space-between.
Fill: `surface`, border 1px `border-subtle`, radius `radius-lg` top-only corners, border-bottom none.
Direction: LTR (the toolbar has Latin controls).

Left side: layout toggle `C-DiffViewToggle` (see below)
Right side: variant legend inline — color dots + labels

### C-DiffViewToggle

Auto-layout: horizontal, fill `surface-sunken`, border 1px `border-default`, radius `radius-md`, overflow hidden.

Two buttons side-by-side (no gap, no separator):
- "Unified" and "Split" (or Arabic equivalents)
- Inactive: fill transparent, style `latin/ui/xs`, fill `text-secondary`, padding 8px 12px
- Active: fill `surface`, style `latin/ui/xs` Medium, fill `text-primary`, padding 8px 12px, shadow `shadow-xs`

### Unified diff text area

Frame: fill-parent.
Fill: `surface`, border 1px `border-default`, radius `radius-lg` bottom corners + `radius-none` top corners (connects to toolbar).
Padding: 24px.
Direction: RTL, font `arabic/display/lg` (ThmanyahSerifDisplay 20px), line-height 240%.

**Word types in inline unified view:**

Each word is a separate inline frame or text span:
- Word gap: 0.3em margin between words (in Figma: use text with spacer frames)

**Matched word**: plain text, no background, inherits base color.

**Changed word** — a vertical stack frame inline:
- Auto-layout: vertical, align center, gap 2px
- **Base word box**: auto-layout horizontal, padding 0 4px, border-radius `radius-sm`, fill `warning-bg`, border 1px `warning-border`, text style `arabic/display/lg`, fill `warning-text`
- **Variant annotation chips** (one per variant that differs): auto-layout horizontal, padding 0 3px, font-size ≈12px (0.7em relative), radius `radius-sm`
  - Fill: variant color at 9% opacity
  - Border: 1px variant color at 25% opacity
  - Text: style `arabic/ui/2xs`, fill = variant color
  - Content format: `نسخة ٢: [word]` or `نسخة ٢: —` if deleted

---

## 18. Screen 15 — Diff View (Side-by-Side)

**The "المقارنة" tab content, split layout. Only shown at ≥1024px width.**

### Container

Auto-layout: horizontal, gap 0, fill `border-subtle` (creates visible 1px gap between columns).
Radius: `radius-lg`, overflow hidden (clip content ON).

**Per-variant column:**
Auto-layout: vertical, flex 1, min-width 180px, fill `surface`.

**Column header:**
Auto-layout: horizontal, padding 8px 12px, gap 8px, align center.
Fill: `surface-sunken`, border-bottom: 1px `border-subtle`.

- Color dot: 10×10px, fill = variant color, radius-full
- Label: `arabic/ui/xs` Medium, fill `text-secondary`, direction RTL

**Column body:**
Padding: 12px.
Direction: RTL.
Font: `arabic/display/base` (ThmanyahSerifDisplay 16px), line-height 220%.
Word gap: 0.35em.

**Word states in each column:**

| State | Treatment |
|---|---|
| Match (all agree) | plain text, base fill |
| Deleted (absent here) | `—` italic, `text-tertiary`, strikethrough |
| Substituted/added | bg = variant color at 12%, text = variant color, border-radius `radius-sm`, padding 0 2px |

---

## 19. Screen 16 — Import Confirmation Modal

**Triggered when user clicks "استيراد JSON" and selects a file.**

### Overlay

Fixed inset 0, fill `rgba(0,0,0,0.4)`, z-index 200.
Centers the dialog (flex align center, justify center).

### Dialog

Auto-layout: vertical, padding 24px, gap 16px.
Max-width: 400px, width: 90%.
Fill: `surface`, border 1px `border-default`, radius `radius-lg`.
Shadow: `shadow-xl`.
Direction: RTL.

**Body text:**
`استيراد هذا الملف سيستبدل جلسة العمل الحالية. هل تريد المتابعة؟`
Style `arabic/ui/base` (16px), fill `text-primary`, line-height 160%.

**Button row:**
Auto-layout: horizontal, gap 8px, justify flex-end.
- "إلغاء" ghost: border 1px `border-default`, fill transparent, fill `text-secondary`
- "متابعة" primary: fill `gold-400`, border `gold-500`, text `text-primary`

---

## 20. Screen 17 — Settings Panel

**Not yet in any prior version of this document. Required — it is where users enter their Anthropic API key.**

The settings panel opens as a slide-in drawer from the right (same animation pattern as the bio drawer, same 400px width). It can be triggered from the nav header settings icon.

### Drawer frame

Same shell as the Bio Drawer (Screen 11). Width: 400px. Direction: RTL.

### Drawer header

Auto-layout: horizontal, padding 20px 24px, align center, justify space-between.
Border-bottom: 1px `border-subtle`.

- Right: title `الإعدادات` — style `arabic/ui/lg` (ThmanyahSans SemiBold 20px), fill `text-primary`
- Left: Close button (Lucide X 16px, 28×28px)

### Drawer body

Auto-layout: vertical, padding 20px 24px, gap 24px.

**Section 1 — API Configuration**

Section label: `مفتاح API` — style `arabic/ui/xs` Medium, fill `text-tertiary`, letter-spacing 7%.
Below: 8px gap.

**Provider selector** (radio or segmented control):
Three options: `Gemini` | `OpenAI` | `Anthropic`
- Auto-layout: horizontal, border 1px `border-default`, radius `radius-md`, overflow hidden
- Each option: padding 8px 16px, style `latin/ui/sm`
  - Inactive: fill transparent, text `text-secondary`
  - Active: fill `surface-sunken`, text `text-primary`, weight 500
- Note annotation: "`Gemini` recommended — Google AI Studio free tier"

**API key input field:**
Auto-layout: vertical, gap 6px.
- Label: `مفتاح API` + provider name — style `latin/ui/xs` Medium, fill `text-secondary`
- Input: fill `surface-sunken`, border `border-default`, radius `radius-md`, padding 10px 12px, height 40px
  - Text: `mono/sm` (IBM Plex Mono 15px), fill `text-primary`, direction LTR
  - Type: password (show/hide toggle icon on left — Lucide Eye / EyeOff 16px, fill `text-tertiary`)
  - Placeholder: `sk-ant-…` or `AIza…` depending on provider — style `mono/sm`, fill `text-tertiary`
- Hint text: `يُخزَّن محلياً فقط — لا يُرسَل إلى أي خادم` — style `arabic/ui/xs`, fill `text-tertiary`

**"حفظ" save button:**
`C-PrimaryButton` full-width, fill `gold-400`, text `تحليل بمفتاح هذا API`.

**Section 2 — Data Management**

Section label: `البيانات` — style `arabic/ui/xs` Medium, fill `text-tertiary`, letter-spacing 7%.

- "مسح الرواة المخصصين" — `C-GhostButton` sm, text fill `error-text` on hover only
- "مسح جميع البيانات" — `C-GhostButton` sm, text fill `error-text` always, border 1px `error-border`

Each action has a short description below: style `arabic/ui/xs`, fill `text-tertiary`.

---

## 21. Screen 18 — Error & Edge State Gallery

**Build this as a reference page, not a user-facing screen. Contains all error and edge states in one frame.**

### States to include (each as a labeled artboard within the gallery):

1. **DB load error banner**: full-width strip at top of narrator section
   - Fill: `#FEF9C3`, border implied by context, no separate border
   - Text: `تعذّر تحميل قاعدة بيانات الرواة — المطابقة تعمل على السجلات المخصصة فقط`
   - Style `arabic/ui/sm`, fill `#92400E`

2. **Narrator extraction spinner**: inside narrator list section while extraction runs
   - Lucide Loader2 14px, fill `text-secondary` + text `جارٍ استخراج الرواة…` style `arabic/ui/sm`
   - Centered in the list area, padding 24px 0

3. **Extraction error state**: extraction failed
   - Text in `error-text` + underlined "إعادة المحاولة" link button same color

4. **Stale narrator list** (split corrected, extraction not re-run):
   - Narrator rows at 60% opacity
   - Section header shows stale indicator (see Screen 05)

5. **Unknown narrator bio card**: node has no DB record
   - Drawer open, body shows "راوٍ غير معروف" as name header (in `text-tertiary`)
   - Body centered text "لا توجد بيانات لهذا الراوي" — style `arabic/ui/sm`, fill `text-secondary`

6. **Empty diff** (before second variant is added):
   - Full-width centered text with 40px padding (see Screen 14)

7. **Export loading overlay** (see Screen 15)

8. **Max variants reached** (5 variants already loaded):
   - "إضافة نسخة" button: disabled state — fill `surface-sunken`, text `text-tertiary`, cursor not-allowed

---

## 22. Component Library (Page 0)

Build all components here first. Each component gets its own named frame with all variants laid out in a single row.

### C01 — PrimaryButton

Variants: `state=[default|hover|loading|disabled]` × `size=[sm|md]`

**md size** (default):
- Auto-layout: horizontal, gap 8px, align center, padding 12px 20px
- Fill: `gold-400`, border 1px `gold-500`, radius `radius-md`
- Text: `arabic/ui/md` Medium (Arabic labels) or `latin/ui/md` (Latin labels), fill `text-primary`
- Hover: fill `gold-600`, border `gold-700`
- Loading: fill `surface-sunken`, border `border-default`, text `text-tertiary` + Loader spinner 16px
- Disabled: fill `surface-sunken`, border `border-default`, text `text-tertiary`, cursor not-allowed

**sm size**: padding 8px 12px, text `arabic/ui/xs` / `latin/ui/xs`

---

### C02 — SecondaryButton

Variants: `state=[default|hover|disabled]` × `size=[sm|md]`

- Auto-layout: horizontal, gap 8px, align center, padding 12px 20px
- Fill: `surface`, border 1px `gold-300`, radius `radius-md`
- Text fill: `gold-600`
- Hover: fill `gold-50`, border `gold-500`
- Focus: shadow `shadow-focus-gold`

---

### C03 — GhostButton

Variant: `state=[default|hover]` × `size=[sm|md]`

- Auto-layout: horizontal, gap 8px, align center, padding 12px 16px
- Fill: transparent, border 1px transparent, radius `radius-md`
- Text: `text-secondary`
- Hover: fill `surface-sunken`, text `text-primary`

---

### C04 — IconButton

Variants: `state=[default|hover]` × `size=[sm|md]`

- Frame: 36×36px (md) or 28×28px (sm)
- Fill: transparent, border 1px transparent, radius `radius-md`
- Icon: Lucide, 16px, stroke-width 1.75, fill `text-secondary`
- Hover: fill `surface-sunken`, icon fill `text-primary`

---

### C05 — ExportButton (small ghost)

Single variant per label (JSON, JPG, PDF, Import JSON).

- Auto-layout: horizontal, padding 4px 12px, align center
- Fill: transparent, border 1px `border-default`, radius `radius-md`
- Text: `latin/ui/xs` (or `arabic/ui/xs` for Arabic labels), fill `text-secondary`
- Hover: fill `surface-sunken`, text `text-primary`

---

### C06 — ReliabilityBadge

Variants: `grade=[thiqah|sadooq|daif|matrook|unknown]`

- Auto-layout: horizontal, padding 2px 8px, align center
- Radius: `radius-sm` (4px)
- Text: `arabic/ui/2xs` Medium

Each grade maps to:
| Grade | Fill | Border | Text |
|---|---|---|---|
| ثقة | `grade-thiqah-bg` | `grade-thiqah-border` | `grade-thiqah-text` |
| صدوق | `grade-sadooq-bg` | `grade-sadooq-border` | `grade-sadooq-text` |
| ضعيف | `grade-daif-bg` | `grade-daif-border` | `grade-daif-text` |
| متروك | `grade-matrook-bg` | `grade-matrook-border` | `grade-matrook-text` |
| مجهول | `grade-unknown-bg` | `grade-unknown-border` | `grade-unknown-text` |

---

### C07 — ConfidenceBadge

Variants: `level=[high|medium|low]`

- Auto-layout: horizontal, padding 1px 8px, radius-full
- Text: `arabic/ui/xs` Medium

| Level | Fill | Text fill | Label |
|---|---|---|---|
| high | `#DCFCE7` | `#15803D` | عالية |
| medium | `#FEF9C3` | `#A16207` | متوسطة |
| low | `#FEE2E2` | `#B91C1C` | منخفضة |

---

### C08 — GradeColorDot

Variants: `grade=[thiqah|sadooq|daif|matrook|unknown]`

- Frame: 8×8px, radius-full
- Fill colors: ثقة = `#16A34A`, صدوق = `#84CC16`, ضعيف = `#F97316`, متروك = `#DC2626`, unknown = `#9CA3AF`

---

### C09 — NarratorChainNode

Variants: `state=[default|confirmed|flagged|unknown|terminal]`

Exact spec: see Section 12 (Screen 09) above. Key reminders:
- min-width 140px, max-width 180px
- Radius: **24px** (radius-2xl) — the pill shape is mandatory
- Always contains: Arabic name + Latin name + death year + grade badge
- Grade stripe is always present as top border (3px)
- Terminal variant: gold-300 border, gold-50 fill

---

### C10 — ChainConnector

Variants: `label=[ʿan|haddathana|qala|other]` (pick the transmission phrase)

Exact spec: see Section 12 above.
- Width: 48px
- Label text above the line, fill `syntax-connector`
- Line: 1.5px, fill `border-default`
- Dot: 6×6px on trailing end (the source side), fill `border-strong`

---

### C11 — NarratorRow

Variants: `state=[default|selected|confirmed|flagged|unknown]` × `confidence=[high|medium|low]`

Exact spec: see Section 7 (Screen 04) above.

---

### C12 — CandidateRow

Variants: `selected=[true|false]` × `expanded=[true|false]`

Exact spec: see Section 9 (Screen 06).

---

### C13 — TabButton

Variants: `state=[active|inactive]`

- Padding: 12px 20px, height 44px
- Text: `arabic/ui/sm`, fill `text-tertiary` (inactive) / `text-primary` (active), direction RTL
- Active: bottom border 2px solid `gold-400`
- Inactive: bottom border 2px solid transparent

---

### C14 — DiffViewToggle

Variants: `active=[unified|split]`

See Section 17 (Screen 14) for exact spec.

---

### C15 — NarratorTreeChip (inline in tree)

Used in the collapsible tree view when parsed narrators are shown as inline chips.

- Auto-layout: horizontal, gap 4px, padding 1px 8px
- Fill: `teal-50`, border 1px `teal-200`, radius `radius-sm`
- Text: `arabic/ui/xs`, fill `teal-600`, direction RTL
- Hover: fill `teal-100`

---

### C16 — NavHeader

Single component. Spec in Section 1 above.

---

## 23. Interaction Annotations (Prototype Mode)

| Trigger | Source → Target | Transition | Duration | Easing |
|---|---|---|---|---|
| Click "تحليل الحديث" | Screen 01 → Screen 02 | Smart Animate | 200ms | ease-standard |
| Parsing complete | Screen 02 → Screen 03 | Smart Animate | 200ms | ease-standard |
| Extraction complete | Screen 03 → Screen 04 | Smart Animate | 200ms | ease-standard |
| Extraction flags narrators | Screen 04 → Screen 05 | Smart Animate | 200ms | ease-standard |
| Click narrator row | Screen 04 → Screen 06 | Slide in (down) | 200ms | ease-out |
| Click "تعديل نقطة الفصل" | Screen 03 → Screen 08 | Smart Animate | 280ms | ease-out-expo |
| Click "تأكيد" in editor | Screen 08 → Screen 03 | Smart Animate | 200ms | ease-standard |
| Click chain node | Screen 09 → Screen 11 | Slide in from right | 280ms | ease-out-expo |
| Click "المقارنة" tab | Screen 09 → Screen 14 | Smart Animate | 200ms | ease-standard |
| Click split toggle | Screen 14 → Screen 15 | Smart Animate | 200ms | ease-standard |
| Click "استيراد JSON" | Any → Screen 16 | Fade in overlay | 200ms | ease-standard |
| Click settings icon in nav | Any → Screen 17 | Slide in from right | 280ms | ease-out-expo |
| Click close in drawer | Screen 11/17 → prev | Slide out right | 280ms | ease-in-out-quad |

---

## 24. RTL Checklist (run on every screen before marking complete)

- [ ] All Arabic text is right-aligned by default; no explicit left-align on Arabic text anywhere
- [ ] Narrator list position numbers (1, 2, 3…) are LTR inside an RTL row — they should use `mono/2xs`, direction LTR, placed on the far right (leading) side
- [ ] The isnad chain graph flows right-to-left — Prophet ﷺ node is the rightmost node, compiler is leftmost
- [ ] Latin transliteration always appears below the Arabic name at smaller size, left-aligned relative to its column
- [ ] Death/birth years use `mono/2xs` even inline within Arabic text
- [ ] The bio drawer and settings drawer both open from the right edge (inline-end)
- [ ] Horizontal scrollable chain: scrollbar at bottom, not obscuring text
- [ ] All inline diff annotations (variant chips) stack below the base word, center-aligned
- [ ] Variant legend in multi-variant chain is top-right of canvas (not relative to DOM order)
- [ ] Arabic name inputs use direction RTL; Latin name inputs use direction LTR
- [ ] The divider handle in the split correction editor does not break Arabic word shaping (handle should sit between words, not inside a word)
- [ ] Chain connector transmission phrases (عن، حدثنا، قال) appear above the connecting line, not below
- [ ] All buttons containing Arabic labels use ThmanyahSans (`arabic/ui/*` styles), never ThmanyahSerifDisplay

---

## 25. Variant Color Scheme (reserved colors — do not reuse)

These five colors appear on chain edges, diff word chips, side-by-side column headers, variant dots in legend, and variant input panel accents. They must never appear as grade colors or status indicators.

| Variant index | Color hex | Label |
|---|---|---|
| 1 (primary) | `#16A34A` | نسخة ١ |
| 2 | `#2563EB` | نسخة ٢ |
| 3 | `#D97706` | نسخة ٣ |
| 4 | `#DC2626` | نسخة ٤ |
| 5 | `#9C3AE5` | نسخة ٥ |

---

## 26. Typography Shorthand Reference

This table is a quick reference for when you're in Figma and need to pick a font without re-reading the full style list.

| Context | Font | Style to use |
|---|---|---|
| Main hadith textarea (input) | ThmanyahSerifDisplay | `arabic/display/lg` |
| Isnad/matn text blocks (output) | ThmanyahSerifDisplay | `arabic/display/lg` |
| Narrator names in chain nodes | ThmanyahSans | `arabic/ui/md` |
| Narrator names in list rows | ThmanyahSerifDisplay | `arabic/display/base` |
| Bio text / long prose | ThmanyahSerifText | `arabic/body/base` |
| Latin transliterations | Inter | `latin/ui/xs` |
| Death/birth years | IBM Plex Mono | `mono/2xs` |
| All UI buttons and labels | ThmanyahSans (Arabic) / Inter (Latin) | `arabic/ui/*` / `latin/ui/*` |
| Grade badges, confidence badges | ThmanyahSans | `arabic/ui/2xs` |
| Overline section labels | ThmanyahSans | `arabic/ui/2xs` + 7% letter-spacing |
| API key input field | IBM Plex Mono | `mono/sm` |
| JSON export panel | IBM Plex Mono | `mono/xs` |

---

## 27. Do Not Errors (Things a Designer Will Get Wrong Without This List)

1. **Chain node radius is 24px (pill), not 6px or 8px.** The `.narrator-node-card` in code uses `border-radius: var(--radius-2xl)` = 24px. An 8px radius makes it look like a generic card. The 24px pill is intentional — it distinguishes content nodes from controls.

2. **Narrator drawer is 400px wide, not 280px.** This matches the DESIGN_GUIDE.md `.narrator-drawer { width: 400px }` spec. A 280px drawer is too narrow for the 2-column metadata grid and bio text.

3. **The bio drawer slides in from the right edge of the viewport, not from inside the chain canvas.** It is a full-viewport overlay drawer, not an inline panel within the chain area.

4. **Terminal nodes (Prophet ﷺ, compiler) have gold styling.** Border `gold-300`, fill `gold-50`, name text `gold-700`. This is the highest-priority visual signal in the chain. Do not give them the same appearance as regular narrator nodes.

5. **Chain connectors always have a transmission phrase label above the line.** The label (عن, حدثنا, قال) is as important as the arrow. Do not draw the chain as just arrows without labels.

6. **Every narrator node shows all four data points: Arabic name, Latin transliteration, death year, and grade badge.** Omitting any one of these breaks the scholarly function of the tool.

7. **Do not use gold-400 on more than one interactive element per viewport at a time.** Gold is the primary CTA signal. Toolbar export buttons, secondary buttons, and labels should not use gold-400 fill.

8. **The diff toolbar controls (layout toggle) are direction LTR even though the text content is RTL.** Mixing them requires explicit directional overrides; annotate this in your Figma frame properties.

9. **Never use ThmanyahSerifDisplay (the display font) for UI chrome.** Buttons, labels, nav items, badges — all use ThmanyahSans even when the text is in Arabic. ThmanyahSerifDisplay is reserved for hadith content being read and analyzed.

10. **Grade colors and variant colors are two completely separate systems.** Grade colors (teal, blue, amber, red, gray) encode narrator reliability (ثقة/صدوق/ضعيف/متروك/مجهول). Variant colors (green, blue, amber, red, purple at different hex values) encode which version a word belongs to. They look similar but must never be mixed or reused across the two systems.
