# FIGMA_MAP — Spec → Design → Screen → Code

Figma file key: `YEoHvVaOWzsHF9EYUvltmZ`  
Base URL: `https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ`  
Deep link pattern: append `?node-id=<ID>` using **hyphens** (`110-17`); IDs in code/API use **colons** (`110:17`).

Spec document: [`FIGMA_SCREENS.md`](./FIGMA_SCREENS.md)

---

## Page series

Three series exist in the file. **Only edit the `110:x` series.**

| Series | IDs | Purpose |
|--------|-----|---------|
| `0:1` | single page | Component Library — all reusable Figma components |
| `2:x` | 2:2 – 2:20 | Original pages — read-only reference, do not edit |
| `110:x` | 110:17 – 110:35 | **Working pages — primary sync target** |
| `136:x` | 136:17 – 136:19 | Extra screens — future features, not yet in code |

---

## Screen → Code map

All screens live under the `/dashboard` route (`apps/web/src/routes/dashboard.tsx`) except Screen 00.  
`header.tsx` (C16 NavHeader) renders on every screen and is not repeated below.

| Screen | Figma page ID | Figma link | Route | Primary code file(s) | Sync |
|--------|--------------|------------|-------|----------------------|------|
| S00 Landing Page | `110:17` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-17) | `/` | `routes/index.tsx` | ✓ |
| S01 Empty Input | `110:18` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-18) | `/dashboard` | `components/hadith-input.tsx` | ✓ |
| S02 Parsing (loading) | `110:19` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-19) | `/dashboard` | `components/hadith-input.tsx` (loading state) | ✓ |
| S03 Split Result | `110:20` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-20) | `/dashboard` | `components/hadith-split-view.tsx` | ✓ |
| S04 Narrator List (clean) | `110:21` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-21) | `/dashboard` | `components/narrator-chain-view.tsx` | ✓ |
| S05 Narrator List (banner) | `110:22` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-22) | `/dashboard` | `components/narrator-chain-view.tsx` | ✓ |
| S06 Disambiguation Candidates | `110:23` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-23) | `/dashboard` | `components/narrator-disambiguation-panel.tsx` | ✓ |
| S07 Add Custom Narrator | `110:24` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-24) | `/dashboard` | `components/narrator-disambiguation-panel.tsx`<br>`components/custom-narrator-manager.tsx` | ✓ |
| S08 Split Correction Editor | `110:25` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-25) | `/dashboard` | `components/split-correction-editor.tsx` | ✓ |
| S09 Chain Viz — Single | `110:26` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-26) | `/dashboard` | `components/isnad-chain-view.tsx` | ✓ |
| S10 Chain Viz — Multi-Variant | `110:27` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-27) | `/dashboard` | `components/variant-chain-view.tsx` | ✓ |
| S11 Narrator Bio Drawer | `110:28` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-28) | `/dashboard` | `components/narrator-bio-card.tsx` | ✓ |
| S12 Variant Input Panel | `110:29` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-29) | `/dashboard` | `components/variant-input-panel.tsx` | ✓ |
| S13 Diff View — Inline | `110:30` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-30) | `/dashboard` | `components/diff-view.tsx` (unified mode) | ✓ |
| S14 Diff View — Side-by-Side | `110:31` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-31) | `/dashboard` | `components/diff-view.tsx` (split mode) | ~ |
| S15 Export Toolbar | `110:32` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-32) | `/dashboard` | `components/export-toolbar.tsx` | ✓ |
| S16 Import Confirmation Modal | `110:33` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-33) | `/dashboard` | `components/export-toolbar.tsx` (`ImportConfirmDialog`) | ✓ |
| S17 Settings Panel | `110:34` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-34) | modal overlay | `components/api-key-settings.tsx` | ✓ |
| S18 Error & Edge State Gallery | `110:35` | [↗](https://www.figma.com/design/YEoHvVaOWzsHF9EYUvltmZ?node-id=110-35) | N/A | multiple (reference only) | ✓ |

**Sync legend:** ✓ = code matches design · ~ = known acceptable divergence · ✗ = needs fix

### Known divergences
- **S14** (`110:31`): Figma shows full-width columns; code uses 720 px card with horizontal scroll. Intentional — acceptable for current scope.

### Extra screens — not yet implemented in code

| Screen | Figma page ID | Description |
|--------|--------------|-------------|
| S06b Guided Disambiguation | `136:17` | Step-through review flow |
| S08b Split Correction Drag | `136:18` | Two-panel drag-active editor |
| S05b Stale Extraction | `136:19` | Side-panel re-extract prompt |

---

## Component → Code map

Figma component library lives in page `0:1`.  
Component IDs below reference that page; prefix full link with `?node-id=`.

| Figma component (FIGMA_SCREENS §22) | React implementation | Code file | Notes |
|--------------------------------------|----------------------|-----------|-------|
| C01 PrimaryButton | `.btn-primary` CSS class | `packages/ui/src/styles/globals.css` | Gold-400 fill |
| C02 SecondaryButton | `.btn-secondary` CSS class | `packages/ui/src/styles/globals.css` | Gold-300 border |
| C03 GhostButton | `.btn-ghost` CSS class | `packages/ui/src/styles/globals.css` | Transparent |
| C04 IconButton | inline style per usage | `components/header.tsx` | Settings gear |
| C05 ExportButton | `ExportButton` component | `components/export-toolbar.tsx` | |
| C06 ReliabilityBadge | `ReliabilityBadge` | `components/narrator-chain-view.tsx` | |
| C07 ConfidenceBadge | `ConfidenceBadge` | `components/narrator-chain-view.tsx` | |
| C08 GradeColorDot | inline style | `components/variant-chain-view.tsx` | Legend dots |
| C09 NarratorChainNode | `NarratorNodeComponent` | `components/isnad-chain-view.tsx` | ReactFlow custom node |
| C09 (variant graph) | `NarratorNodeComponent` | `components/variant-chain-view.tsx` | Same shape, variant coloring |
| C10 ChainConnector | ReactFlow edge style | `components/isnad-chain-view.tsx` | Smoothstep + arrowhead |
| C11 NarratorRow | `<li>` in narrator list | `components/narrator-chain-view.tsx` | |
| C12 CandidateRow | candidate item | `components/narrator-disambiguation-panel.tsx` | |
| C13 TabButton | tab `<button>` | `routes/dashboard.tsx` | السلسلة / المقارنة |
| C14 DiffViewToggle | `ViewToggle` | `components/diff-view.tsx` | unified/split switch |
| C15 NarratorTreeChip | — | — | Not implemented |
| C16 NavHeader | `Header` | `components/header.tsx` | Used on every screen |

---

## Logic layer — no Figma equivalent

These files drive behavior but have no design counterpart.

| File | Feeds into |
|------|-----------|
| `lib/parse-hadith.ts` | S02 loading, S03 split result |
| `lib/extract-narrators.ts` | S04/S05 narrator list |
| `lib/match-narrators.ts` | S06 candidate list |
| `lib/chain-graph.ts` | S09 single chain |
| `lib/variant-graph.ts` | S10 multi-variant chain |
| `lib/compute-diff.ts` | S13/S14 diff views |
| `lib/export-functions.ts` | S15 export toolbar |
| `lib/narrator-database.ts` | all narrator lookup |
| `hooks/use-variants.ts` | S10, S12 variant panel |
| `hooks/use-hadith-parser.ts` | S01–S03 input flow |
| `hooks/use-narrator-extraction.ts` | S04/S05 list |
| `hooks/use-split-correction.ts` | S08 editor |
| `hooks/use-export.ts` | S15/S16 export/import |
| `hooks/use-api-key.ts` | S17 settings panel |
| `hooks/use-custom-narrators.ts` | S07 custom form |

---

## How to use this map

**Figma → Code:** find the screen row, open the code file(s) listed.  
**Code → Figma:** each code file has a `// figma:` comment on line 1 with the page ID. Or search this table.  
**Spec → Design:** read FIGMA_SCREENS.md section for the screen, then open the Figma page linked above.  
**Design → Spec:** every Figma page name matches a section heading in FIGMA_SCREENS.md.

---

## Figma MCP change log

Changes made directly to the Figma file via the `use_figma` Plugin API. Each entry records what changed, in which page, and the Figma node ID(s) affected. Code changes made to *match* Figma are listed separately below.

### Session — initial sync (working pages 110:x created)

| Page | Node ID | What changed |
|------|---------|-------------|
| `110:17–110:35` | (all) | Duplicate page set created from `2:x` originals to serve as the editable working pages |

### Session — text and structure fixes

| Page | Node ID | Before | After | Reason |
|------|---------|--------|-------|--------|
| `110:20` S03 Split Result | `I114:34;18:16` | `إلغاء` | `بدء من جديد` | Code uses "start over", Figma had wrong label |
| `110:34` S17 Settings | `129:33` (provider tabs group) | visible | hidden | Code has single Claude provider only |
| `110:34` S17 Settings | `129:40` (Gemini hint text) | visible | removed | No Gemini option in current code |
| `110:34` S17 Settings | `129:42` (API key label) | `مفتاح API` | `مفتاح Claude API` | Matches code label exactly |
| `110:34` S17 Settings | `129:46` (input placeholder) | `AIza… / sk-…` | `sk-ant-...` | Matches code placeholder exactly |
| `110:34` S17 Settings | `129:49` (save button) | `تحليل بمفتاح هذا API` | `حفظ` | Code has terse "حفظ" label |
| `110:34` S17 Settings | (new frame) | — | حفظ + إلغاء button row | Added to match code button layout |
| `110:31` S14 Diff S×S | (NavHeader) | simple placeholder header | Full C16/NavHeader (cloned from S03) | NavHeader was missing Hadith Path branding |
| `110:31` S14 Diff S×S | (TabBar) | 4-tab bar | 2-tab bar: السلسلة + المقارنة | Code only has 2 tabs |
| `110:32` S15 Export Toolbar | (NavHeader + TabBar) | same old placeholder | same C16/NavHeader + 2-tab bar | Same fix as S14 |

### Code changes made to match Figma (Figma was authoritative)

| Screen | Code file | What changed |
|--------|-----------|-------------|
| S00 `110:17` | `routes/index.tsx` | Full rewrite: replaced boilerplate with Arabic hero, CTA buttons, footer hint to match Figma landing page |
| S16 `110:33` | `components/export-toolbar.tsx` | Added "تأكيد الاستيراد" title row + orange `!` warning icon to `ImportConfirmDialog` |

---

## 100% design match loop

The canonical process for verifying and fixing any screen. Run this loop per screen whenever code or design changes.

### Tools

| Side | Tool | How to invoke |
|------|------|--------------|
| **Design (Figma)** | `get_screenshot` MCP tool | Pass `fileKey` + `nodeId` (the page ID, e.g. `110:26`) |
| **Browser (live app)** | Chrome headless | `google-chrome --headless --screenshot=browser.png --window-size=1440,900 http://localhost:3001/...` |
| **Pixel diff** | ImageMagick `compare` | `magick compare -metric RMSE figma.png browser.png diff.png` |
| **Visual review** | Claude multimodal | Pass both PNGs to Claude; it identifies layout/color/text differences |

Install deps if missing:
```bash
sudo apt-get install -y imagemagick chromium-browser   # WSL/Debian
brew install imagemagick                               # macOS
```

### Per-screen loop

```
for each screen S:
  1. FIGMA SCREENSHOT
     → use get_screenshot MCP, nodeId = page ID from FIGMA_MAP
     → save as screenshots/figma-SXX.png

  2. BROWSER SCREENSHOT
     → start dev server:  bun run --cwd apps/web dev   (port 3001)
     → navigate to the screen state (see "how to reach" column below)
     → take screenshot:
         chromium-browser --headless --disable-gpu \
           --screenshot=screenshots/browser-SXX.png \
           --window-size=1440,900 \
           "http://localhost:3001/<path>"

  3. PIXEL DIFF
     → magick compare -metric RMSE \
         screenshots/figma-SXX.png \
         screenshots/browser-SXX.png \
         screenshots/diff-SXX.png
     → prints RMSE score; 0.00 = perfect, >5.00 = noticeable

  4. REVIEW
     → open diff-SXX.png  (red pixels = discrepancies)
     → Claude visually compares figma-SXX.png vs browser-SXX.png
       and describes: font mismatch / spacing / color / missing element

  5. FIX
     → if diff is in CODE  → edit component file, re-run dev server
     → if diff is in FIGMA → use use_figma MCP to fix node, log in change log above
     → if divergence is intentional → mark sync column as ~, document in "Known divergences"

  6. REPEAT from step 1 until RMSE < 2.0 (or visual inspection passes)
```

### How to reach each screen state

Some screens require app state that can't be navigated to with a plain URL. Set these up before taking the browser screenshot.

| Screen | URL | Setup needed |
|--------|-----|-------------|
| S00 Landing | `http://localhost:3001/` | none |
| S01 Empty Input | `http://localhost:3001/dashboard` | none |
| S02 Parsing | `http://localhost:3001/dashboard` | paste text, click "تحليل الحديث" before it resolves |
| S03 Split Result | `http://localhost:3001/dashboard` | paste example hadith, wait for split |
| S04 Narrator List | same as S03 | wait for narrator extraction |
| S05 Banner | same as S04 | needs ≥1 low-confidence narrator in data |
| S06 Candidates | same as S04 | click a narrator row |
| S07 Add Custom | same as S06 | click "إضافة راوٍ جديد" in panel footer |
| S08 Correction Editor | same as S03 | click "تعديل نقطة الفصل" |
| S09 Chain Viz | same as S04 | click "السلسلة" tab |
| S10 Multi-Variant | same as S09 | add ≥1 variant in S12, then السلسلة tab |
| S11 Bio Drawer | same as S09 | click a chain node |
| S12 Variant Panel | same as S04 | click "+ إضافة نسخة" |
| S13 Diff Inline | same as S12 | click "المقارنة" tab (default unified) |
| S14 Diff S×S | same as S13 | click "Split" toggle in diff toolbar |
| S15 Export Toolbar | same as S04 | toolbar renders when analysis is complete |
| S16 Import Modal | same as S15 | click "استيراد JSON" |
| S17 Settings | any screen | click gear icon in NavHeader |

### Batch diff script

Save as `scripts/diff-screen.sh` and run per screen:

```bash
#!/usr/bin/env bash
# Usage: ./scripts/diff-screen.sh <screen-id> <figma-node-id> <url>
# Example: ./scripts/diff-screen.sh S09 110-26 "http://localhost:3001/dashboard"
# Requires: imagemagick, chromium-browser, screenshots/ directory

set -e
SCREEN=$1
NODE=$2
URL=$3
DIR="screenshots"
mkdir -p "$DIR"

echo "→ Taking browser screenshot of $SCREEN at $URL"
chromium-browser --headless --disable-gpu \
  --screenshot="$DIR/browser-$SCREEN.png" \
  --window-size=1440,900 "$URL"

echo "→ Diffing against $DIR/figma-$SCREEN.png"
if [ ! -f "$DIR/figma-$SCREEN.png" ]; then
  echo "  [!] Missing $DIR/figma-$SCREEN.png — take it via get_screenshot MCP first (nodeId=$NODE)"
  exit 1
fi

RMSE=$(magick compare -metric RMSE \
  "$DIR/figma-$SCREEN.png" \
  "$DIR/browser-$SCREEN.png" \
  "$DIR/diff-$SCREEN.png" 2>&1 | awk '{print $1}')

echo "→ RMSE: $RMSE  (diff saved to $DIR/diff-$SCREEN.png)"
if (( $(echo "$RMSE < 2.0" | bc -l) )); then
  echo "   ✓ PASS"
else
  echo "   ✗ FAIL — open $DIR/diff-$SCREEN.png to see discrepancies"
fi
```

### Agent invocation pattern

When running the loop as a Claude Code agent session:

```
1. Call get_screenshot with fileKey=YEoHvVaOWzsHF9EYUvltmZ, nodeId=<page-id>
   → Claude receives Figma PNG inline

2. Run browser screenshot via Bash tool:
   chromium-browser --headless ... http://localhost:3001/<path>

3. Read the browser PNG (Read tool on the saved file)
   → Claude now holds both images

4. Claude visually compares and lists discrepancies (font, spacing, color, copy)

5. Fix code (Edit tool) or fix Figma (use_figma MCP)

6. Re-run browser screenshot, re-call get_screenshot, repeat until clean
```

ImageMagick diff gives a quantitative signal; Claude's visual comparison names *what* is wrong. Use both.
