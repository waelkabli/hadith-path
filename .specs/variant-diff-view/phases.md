# Phases: Variant Diff View — Word-Level Diff, Inline/Side-by-Side Toggle

> Source spec: .specs/variant-diff-view/spec.md

## Architectural Decisions

- **`computeDiff` is pure**: takes raw matn strings, normalizes internally via `normalizeArabic`, tokenizes on whitespace, runs LCS-based diff of each variant against variant 1 (base), returns `DiffToken[]`. No side effects.
- **N-way**: variant 1 is always the base. Each subsequent variant is diff'd against it independently. Results are merged into the unified `DiffToken[]` with per-variant status.
- **Display text**: original diacritized text is shown; normalization is internal to comparison only.
- **Layout toggle**: persisted in sessionStorage under `hadith-diff-layout` as `'inline' | 'sidebyside'`. Default: `'inline'`.
- **Matn derivation**: `variant.rawText.slice(variant.splitAt)` is the matn for each variant. Falls back to the full `rawText` if `splitAt` is 0, with a warning label.
- **Tab placement**: a tab bar switches between the chain view (F7/F8) and the diff view. Diff tab visible when ≥ 2 variants are loaded; shows an explanatory message otherwise.

---

## Phase 1: `computeDiff` + Inline Diff Display

**User stories**: #1, #2, #3, #4, #6, #7, #10
**Depends on**: Feature 8 Phase 1

### What to build

Implement `computeDiff(variants: string[]): DiffToken[]`. The function normalizes each matn, tokenizes on whitespace, diffs each variant against the base using LCS, and merges into a `DiffToken[]` where each token carries `baseText`, `allMatch`, and a per-variant `{ text, status }` array. Implement the `InlineDiffView` sub-component that renders the token stream as a continuous RTL paragraph: matched tokens in neutral text, differing tokens showing the base word with colored annotations indicating each variant's version (added/deleted/substituted). The `DiffView` parent component derives matns from the `variants` prop, calls `computeDiff`, and renders `InlineDiffView`. When fewer than 2 variants are loaded the diff tab shows "أضف نسخة ثانية للمقارنة بين المتون".

### Acceptance criteria

- [ ] A "المقارنة" tab is visible when ≥ 2 variants are loaded; clicking it shows the diff view
- [ ] When fewer than 2 variants exist, the tab shows the explanatory message with a link to add a variant
- [ ] `computeDiff` correctly identifies matched, added, deleted, and substituted tokens across all variants
- [ ] Diacritical differences only produce `allMatch: true` (normalization is correct)
- [ ] Matched tokens render in neutral text
- [ ] Differing tokens are annotated with each non-base variant's color
- [ ] The diff updates automatically when any variant's `splitAt` changes (e.g., after a Feature 3 correction)

### Manual QA plan

1. **Tab visibility**: Load two variants. **Expected**: "المقارنة" tab appears in the tab bar.
2. **Empty state**: View the diff tab with only one variant. **Expected**: message "أضف نسخة ثانية للمقارنة بين المتون" is shown.
3. **Identical matns**: Load two variants with identical matn text. **Expected**: entire text renders in neutral (no highlights).
4. **One-word difference**: Load two variants differing by one word. **Expected**: that word shows a color annotation for variant 2; all other words are neutral.
5. **Diacritics ignored**: Load two variants identical except for tashkeel on one word. **Expected**: that word renders as matched (no annotation).
6. **Added word**: Variant 2 has an extra word not in variant 1. **Expected**: the added word is visually indicated with variant 2's color.
7. **Auto-update**: Apply a Feature 3 boundary correction to one variant. **Expected**: the diff view re-renders using the new `splitAt` without requiring a page reload.

---

## Phase 2: Side-by-Side Layout + Deletion Display + Layout Toggle

**User stories**: #5, #8, #9
**Depends on**: Phase 1

### What to build

Implement `SideBySideDiffView`. The view renders one column per variant, each showing that variant's matn text with its changes highlighted against the base. Deleted tokens (present in base, absent in the variant) render as an em-dash or a struck-through ghost in the variant's column to preserve column alignment. Column headers show the variant label and color swatch. A layout toggle button switches between "متحد" (inline) and "جنباً إلى جنب" (side-by-side). The selected layout is written to sessionStorage and restored on mount. Columns scroll together horizontally as a unit. All text and columns are RTL.

### Acceptance criteria

- [ ] A layout toggle button switches between inline and side-by-side views
- [ ] The selected layout is persisted in sessionStorage and restored on page load
- [ ] Side-by-side renders one column per variant with headers showing variant label and color
- [ ] Added words are highlighted in the variant's color in that column
- [ ] Deleted positions (present in base, absent in variant) show a visual placeholder (em-dash or ghost) to preserve column alignment
- [ ] Substituted words are highlighted in the variant's color
- [ ] The base (variant 1) column shows neutral text with no highlights
- [ ] Columns scroll horizontally together for long matns

### Manual QA plan

1. **Toggle**: Click the layout toggle. **Expected**: view switches between inline and side-by-side smoothly.
2. **Persist toggle**: Switch to side-by-side, refresh. **Expected**: side-by-side view is restored.
3. **Column headers**: In side-by-side, verify each column shows its variant label ("النسخة 1", etc.) with the correct color swatch.
4. **Base column neutral**: Verify variant 1's column has no color highlights — it is the reference.
5. **Deletion placeholder**: Use two variants where variant 2 is missing a word from the base. **Expected**: at the deleted position in variant 2's column, a placeholder (em-dash or ghosted struck-through text) is shown, keeping other words aligned with the base column.
6. **Horizontal scroll**: Use a long matn that overflows the viewport. **Expected**: columns scroll together; header labels stay visible (sticky if applicable).
7. **RTL columns**: Verify columns are right-aligned and text reads right-to-left.
