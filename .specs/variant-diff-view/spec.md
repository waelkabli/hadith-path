# Spec: Variant Diff View — Word-Level Diff, Inline/Side-by-Side Toggle

## Problem Statement

When multiple hadith variants are loaded, the matn (body text) of each version may differ — additions, deletions, substitutions of words or phrases. Reading each version separately and spotting differences manually is slow and error-prone. Scholars need to see exactly where versions agree and where they diverge, at the word level, in a single view.

## Solution

A diff view renders all loaded variants' matn texts simultaneously with word-level differences highlighted. Variant 1 is the reference base; all other variants are diff'd against it. Words present in all variants are shown in neutral text. Words that differ — added, deleted, or substituted relative to the base — are color-coded by variant. The user can toggle between an inline (unified) view that overlays all variants in a single text block, and a side-by-side view that shows each variant in its own column. Diacritics are stripped for comparison but displayed in full in the output.

## User Stories

1. As a researcher, I want to see all variant matn texts compared in a single view, so I can identify differences without reading each version separately.
2. As a researcher, I want word-level differences highlighted in each variant's color, so I can immediately see which version adds, removes, or changes a word.
3. As a researcher, I want the comparison to ignore diacritical marks (tashkeel), so inconsistent vocalization between sources does not create false positives.
4. As a researcher, I want the full diacritized text displayed even though comparison is done on the normalized form, so the original text is preserved.
5. As a researcher, I want to toggle between inline and side-by-side layouts, so I can choose the view that works best for the length and structure of the matn.
6. As a researcher, I want variant 1 to be the reference base, so differences in all other variants are expressed relative to it.
7. As a researcher, I want words that are identical across all variants to appear in neutral text, so my attention is drawn only to the differences.
8. As a researcher, I want deleted words (present in base, absent in a variant) to be visually indicated in the side-by-side column for that variant, so omissions are not invisible.
9. As a researcher, I want the diff view to update automatically when a variant's matn changes (e.g., after a Feature 3 boundary correction), so the comparison is always current.
10. As a researcher, I want the diff view to show a message when fewer than two variants are loaded, so I understand why the view is empty.

## Acceptance Criteria

- [ ] The diff view is accessible as a tab or section alongside the chain visualization when ≥ 2 variants are loaded
- [ ] When fewer than 2 variants exist, the diff view shows an explanatory message instead
- [ ] Variant 1 is always the reference base for all comparisons
- [ ] Diff is computed on diacritic-normalized text (`normalizeArabic` from Feature 6); the original diacritized text is displayed
- [ ] Words identical across all variants render in neutral text (no highlight)
- [ ] Words added in a non-base variant (not in base) are highlighted in that variant's color
- [ ] Words deleted in a non-base variant (in base but not in that variant) are shown struck-through in the base reference or indicated in the variant's column
- [ ] Words substituted (different word at the same position) are highlighted in the non-base variant's color
- [ ] A toggle switches between inline and side-by-side layout; selection persists for the session
- [ ] In side-by-side: each variant occupies a column; columns scroll together horizontally; deletions shown as a blank/dash in the variant column
- [ ] In inline: a single text block with color-coded change markers for all variants overlaid
- [ ] The diff updates automatically when the active `splitAt` for any variant changes
- [ ] All text is RTL; columns in side-by-side are RTL-aligned

## Implementation Decisions

### Architecture & Schema

**`computeDiff(variants: string[]): DiffResult`** — pure function, no side effects. The core of this feature.

Input: array of matn strings (raw, with diacritics), one per variant. Variant at index 0 is always the base.

Algorithm:
1. Normalize each variant: call `normalizeArabic(text)` to strip tashkeel and tatweel; split on whitespace to produce token arrays.
2. For each non-base variant (index 1..N), run an LCS-based word diff against the base token array, producing a sequence of `DiffOp`.
3. Merge all per-variant `DiffOp` sequences into a unified `DiffToken[]`.

```
DiffOp {
  type: 'match' | 'added' | 'deleted' | 'substituted'
  baseIndex: number | null      // position in the base token array; null for 'added'
  variantText: string | null    // null for 'deleted'
}
```

```
DiffToken {
  baseText: string | null       // original (diacritized) base word; null if only in a variant
  allMatch: boolean             // true = same in all variants → render neutral
  variants: Array<{
    text: string | null         // original (diacritized) word in this variant; null = deleted
    status: 'match' | 'added' | 'deleted' | 'substituted'
  }>
}
```

`DiffResult` is `DiffToken[]` — the full sequence of tokens with per-variant status.

The diff algorithm uses LCS (Longest Common Subsequence) on normalized tokens. The implementation may use the `diff-match-patch` library (word-level mode) or a custom LCS function — this is an internal detail of `computeDiff`.

**`normalizeArabic(text: string): string`** — already established in Feature 6 as a shared utility. Strips tashkeel (U+064B–U+065F), tatweel (U+0640), normalizes whitespace. `computeDiff` uses it internally; callers pass raw text.

**Layout toggle:** Stored in sessionStorage under `hadith-diff-layout` as `'inline' | 'sidebyside'`. Defaults to `'inline'`.

### Interfaces & Contracts

**`computeDiff(variants: string[]): DiffToken[]`** — pure function. Takes raw matn strings. Returns the unified token sequence. Throws if `variants.length < 2`.

**`DiffView` component:**
```
{
  variants: Variant[],          // from useVariants (Feature 8) — provides rawText, splitAt, color, label
}
```
Derives the matn text for each variant as `variant.rawText.slice(variant.splitAt)`. Calls `computeDiff` with the derived matns. Renders the appropriate layout based on the toggle state. If `variants.length < 2`, renders the explanatory message.

**`InlineDiffView` sub-component:** Renders `DiffToken[]` as a single RTL paragraph. For each token:
- `allMatch: true` → plain text (base word)
- Any variant differs → renders the base word in neutral + small colored superscript markers per variant showing their version (or strike-through for deleted)

**`SideBySideDiffView` sub-component:** Renders one column per variant. Each column renders the variant's own token sequence. Deleted tokens render as an em-dash or blank space with a light struck-through indicator so column alignment is preserved. Columns are horizontally scrollable as a unit.

### Behavior & Interactions

**Accessing the diff view:**

A tab bar (or section toggle) above the visualization area switches between "السند" (chain graph) and "المقارنة" (diff view). Both tabs are always present when ≥ 2 variants are loaded. The diff view tab shows a badge with the variant count.

**Inline layout:**

The merged token stream is rendered as continuous Arabic text. For each non-matching token, the base word is shown in neutral, followed by small inline annotations per variant (e.g., a colored word chip showing the variant's version of that token, or a colored strikethrough if deleted). The exact visual treatment is a design decision left to the implementation, guided by DESIGN_GUIDE typography constraints.

**Side-by-side layout:**

Columns are equal-width. The column for variant 1 (base) shows the full base text with no highlights — it is the reference. Variant columns show their text with highlighting: added words in variant color, deleted positions as blank markers, substituted words in variant color. Column headers show the variant label and color swatch.

**Synchronization:**

The `DiffView` component derives matn text reactively from the `variants` prop. If Feature 3 (boundary correction) changes `splitAt` for any variant, the parent re-renders `DiffView` with the updated `Variant` object and `computeDiff` is re-run automatically.

**Empty state:**

When fewer than 2 variants are loaded, the diff view tab is visible but shows: "أضف نسخة ثانية للمقارنة بين المتون" with a link/button to trigger "Add variant".

---

## Testing Decisions

**`computeDiff` — unit tests (pure function, highest priority):**
- Two identical strings produce all `allMatch: true` tokens
- A word present in base but absent in variant 2 produces a `deleted` status for variant 2 at that position
- A word present in variant 2 but absent in base produces an `added` status for variant 2
- A different word at the same position produces `substituted`
- Diacritical differences only (same word, different tashkeel) produce `allMatch: true` (normalization works)
- Three variants: base matches v2, v3 differs — only v3's token is marked; `allMatch` is false
- Input with < 2 variants throws

**`DiffView` — component tests:**
- Renders the explanatory message when `variants.length < 2`
- Toggle between inline and side-by-side changes the rendered layout
- Layout choice is written to sessionStorage

**`InlineDiffView` and `SideBySideDiffView` — component tests:**
- Matched tokens render without highlight class
- Added/deleted/substituted tokens render with the correct variant color class
- Side-by-side renders one column per variant

## Out of Scope

- **Character-level diff within words:** Dropped. Word-level only, as clarified during the spec interview.
- **Selecting which variants to diff (pair selection):** All loaded variants are always shown simultaneously. Pair selection is deferred.
- **Isnad diff (comparing chains, not just matn):** The diff view covers matn text only. Isnad comparison is visual via the branching graph (Feature 8), not text-diff.
- **Copy-to-clipboard of the diff output:** Deferred.
- **Printing the diff view independently:** Covered by Feature 10's PDF export.

## Open Questions

- In inline mode, when a word is deleted in a non-base variant, should the base word still appear (struck-through in that variant's color), or should there be no visual indicator at the deletion position (since the inline view is based on the base sequence)?

## Further Notes

`computeDiff` is the only module in this feature that contains logic. All other modules are rendering concerns. Because `computeDiff` is a pure function with no external dependencies, it can be unit-tested exhaustively with a small Arabic word fixture. This is the highest-value test in this feature.

The diff operates on matn text only — `variant.rawText.slice(variant.splitAt)`. The isnad portion is never passed to `computeDiff`. If `splitAt` is 0 (no boundary detected), the diff falls back to the full raw text for that variant with a warning label in the column header.
