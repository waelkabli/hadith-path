# Phases: Multi-Variant Tree/Graph — Branching Visualization When Multiple Versions Are Loaded

> Source spec: .specs/multi-variant-graph/spec.md

## Architectural Decisions

- **Additive flow**: variants are added after the first analysis. "Add variant" triggers a new instance of the F1–F5 pipeline scoped to that variant. Each variant is independent.
- **Variant state**: `useVariants` hook holds `Variant[]` in state and `hadith-variants` in localStorage. Maximum 5 variants.
- **Merged graph**: `buildVariantGraph(variants, records)` is a pure function. Narrators with the same non-null `selectedId` across variants collapse to one node. Unknown (`selectedId: null`) narrators are never merged.
- **Color palette**: 5 pre-defined accessible colors (teal, amber, violet, rose, sky blue) assigned in order of variant addition.
- **Conditional render**: the parent route renders `IsnadChainView` when `variants.length === 1` and `VariantChainView` when `variants.length ≥ 2`. The transition is a full unmount/remount.
- **Bio card**: same `NarratorBioCard` from Feature 7, triggered by `onNodeClick`.

---

## Phase 1: Add Variant + Independent Analysis Pipeline

**User stories**: #1, #2, #7, #10
**Depends on**: Feature 4 Phase 2

### What to build

An "Add variant" button appears below the analysis view after the first variant is fully analyzed. Clicking it adds a new empty `Variant` entry via `useVariants.addVariant()` and renders a new `VariantInputPanel` — a labeled instance of Feature 1's `HadithInput` with the variant label ("النسخة 2") and a Remove button. Each variant panel runs the full F1–F5 pipeline independently (its own `useHadithParser`, `useNarratorExtraction`). When analysis completes, `useVariants.updateVariant()` stores the result. The "Add variant" button is hidden when `variants.length === 5`. `useVariants` persists the variant list to `hadith-variants` in localStorage.

### Acceptance criteria

- [ ] After a successful parse, an "Add variant" button appears below the analysis view
- [ ] Clicking it renders a new labeled input panel ("النسخة 2") running the full pipeline independently
- [ ] Each variant panel has a Remove button visible alongside its label
- [ ] The "Add variant" button is hidden when 5 variants are loaded
- [ ] Variant list is persisted in `hadith-variants` localStorage and restored on page load
- [ ] Removing a variant removes its panel and its entry from localStorage

### Manual QA plan

1. **Add variant button**: Complete an analysis. **Expected**: "Add variant" button appears below.
2. **Independent pipeline**: Add a variant, paste a different hadith, submit. **Expected**: the second variant goes through the full F1–F5 parse and extraction independently; both analyses are visible.
3. **Label**: Verify the second panel shows "النسخة 2", the third "النسخة 3", etc.
4. **Max limit**: Add 5 variants. **Expected**: the "Add variant" button disappears.
5. **Remove**: Click Remove on a variant. **Expected**: that panel and its analysis disappear; the button reappears if < 5 variants remain.
6. **Persist**: Add two variants, refresh. **Expected**: both variant analyses are restored from localStorage.

---

## Phase 2: Merged Tree Visualization + Edge Coloring + Legend

**User stories**: #3, #4, #5, #6, #9
**Depends on**: Phase 1, Feature 7 Phase 1

### What to build

Implement `buildVariantGraph(variants, records)` and `VariantChainView`. When `variants.length ≥ 2`, the parent route replaces `IsnadChainView` with `VariantChainView`. The merged graph collapses narrators with the same non-null `selectedId` across variants into a single node. Edges carry the variant color and are styled distinctly per variant (different stroke color). Unknown narrators produce separate nodes per variant (never merged). A legend overlay in the graph panel lists each variant's color swatch and label. Clicking a node fires `onNodeClick` and opens the same `NarratorBioCard` from Feature 7.

### Acceptance criteria

- [ ] When ≥ 2 variants are analyzed, `VariantChainView` replaces `IsnadChainView`
- [ ] Narrators with the same `selectedId` across variants are merged into a single node
- [ ] Unresolved (`selectedId: null`) narrators produce separate nodes per variant, even with similar extracted names
- [ ] Edges are color-coded by variant using the 5-color palette
- [ ] A legend in the graph shows each variant's color and label
- [ ] Clicking any node opens the `NarratorBioCard` panel (same as Feature 7)
- [ ] The graph layout is RTL (right-to-left)

### Manual QA plan

1. **Merged node**: Add two variants that share a well-known narrator (e.g., Anas ibn Malik in both chains). **Expected**: that narrator appears as a single node with edges from both variants' colors.
2. **Branching**: Use two variants with different narrators at some chain positions. **Expected**: the graph branches at the divergence point; each branch carries its variant's color.
3. **Unknown not merged**: Have one variant with an unresolved narrator at position N. **Expected**: a separate "?" node appears in that variant's branch; it is not merged with any other node.
4. **Edge colors**: Verify each variant's edges use a distinct color from the pre-defined palette.
5. **Legend**: Verify the legend shows all loaded variants with their colors and labels ("النسخة 1", etc.).
6. **Bio card from merged graph**: Click a shared (merged) narrator node. **Expected**: `NarratorBioCard` opens with the narrator's profile.
7. **Revert to single chain**: Remove a variant so only one remains. **Expected**: `IsnadChainView` (linear) replaces `VariantChainView`.
