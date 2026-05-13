# Spec: Multi-Variant Tree/Graph — Branching Visualization When Multiple Versions Are Loaded

## Problem Statement

Scholars frequently study multiple versions of the same hadith — different collectors recording the same report through different chains, or the same chain with variant wording. When only one chain is visible, divergences between versions are invisible. The tool needs to show where chains share narrators and where they branch, so the user can understand the transmission history structurally rather than by manual comparison.

## Solution

After analyzing at least one hadith, an "Add variant" button lets the user paste and analyze additional hadith versions through the same pipeline (Features 1–5). When two or more variants exist, the single-chain linear view (Feature 7) is replaced by a merged tree/graph that overlays all chains. Narrators that appear in multiple chains with the same resolved database ID are merged into a single shared node. Branching points show where chains diverge. Edges are color-coded by variant. Clicking any node opens the same read-only biography panel from Feature 7.

## User Stories

1. As a researcher, I want an "Add variant" button to appear after analyzing my first hadith, so I can load a second version without starting over.
2. As a researcher, I want to paste a second hadith text and have it analyzed through the same parse and narrator extraction pipeline, so each variant is treated consistently.
3. As a researcher, I want the visualization to automatically switch from a linear chain to a merged tree when I add a second variant, so I see the shared and divergent parts of the chains immediately.
4. As a researcher, I want narrators that appear in multiple chains with the same identification to be shown as a single shared node, so the common ancestry is visually clear.
5. As a researcher, I want edges to be color-coded by variant, so I can trace each individual chain through the merged graph.
6. As a researcher, I want a legend showing which color corresponds to which variant, so I can read the graph without ambiguity.
7. As a researcher, I want to add up to five variants, so I can compare across all major collections where the same hadith appears.
8. As a researcher, I want to remove a variant from the comparison, so I can clean up the graph if I added a wrong version.
9. As a researcher, I want to click any node in the merged graph to open the narrator's biography panel, so the detail view works the same as in the single-chain view.
10. As a researcher, I want each variant to be labeled (e.g., "النسخة 1", "النسخة 2") in the input area and the legend, so I can track which version is which.

## Acceptance Criteria

- [ ] An "Add variant" button appears below the analysis view after a successful parse of at least one variant
- [ ] Clicking "Add variant" opens a second hadith input area running the full F1–F5 pipeline independently
- [ ] The maximum number of simultaneously loaded variants is 5
- [ ] When ≥ 2 variants are analyzed, `IsnadChainView` is replaced by `VariantChainView`
- [ ] Narrators with the same non-null `selectedId` across variants are merged into a single node
- [ ] Unresolved narrators (null `selectedId`) are never merged, even if their extracted names are similar
- [ ] Edges are color-coded by variant (up to 5 distinct colors)
- [ ] A legend maps each color to its variant label
- [ ] Clicking any node opens the `NarratorBioCard` panel (same as Feature 7)
- [ ] A "Remove variant" action removes the variant and re-renders the graph; if only one variant remains, the view reverts to `IsnadChainView`
- [ ] The graph supports pan and zoom (same reactflow controls as Feature 7)
- [ ] Layout is RTL — chains flow right to left

## Implementation Decisions

### Architecture & Schema

Same rendering engine as Feature 7: **reactflow** with dagre layout (`rankdir: 'RL'`).

**Variant state:**

Each variant is an independent analysis session:
```
Variant {
  id: string              // "variant-1", "variant-2", etc.
  label: string           // "النسخة 1", "النسخة 2", etc.
  rawText: string
  splitAt: number
  narrators: NarratorMatch[]
  color: string           // hex color assigned to this variant
}
```

Up to 5 variants. Stored in the parent route's state and persisted in localStorage under `hadith-variants` as an array.

**Merged graph construction:**

`buildVariantGraph(variants, records): { nodes, edges }` — pure function.

Algorithm:
1. For each variant, extract the narrator sequence as `(selectedId | null, position)` pairs.
2. Build a set of unique node IDs: a narrator is represented by a single node if its `selectedId` is non-null and appears in at least one variant. Null-selectedId narrators each get a unique node ID scoped to their variant and position (`unknown-<variantId>-<position>`).
3. For each consecutive pair within each variant's chain, emit a `ChainEdge` with the variant's color as metadata.
4. Node `matchState` is derived from the union of all variants' match states for that narrator ID — if any variant marks it as flagged, the merged node is flagged.

**Color palette:** Five pre-defined colors chosen for contrast on a light background and accessibility (avoiding red-green confusion for common color blindness patterns): teal, amber, violet, rose, sky blue. Assigned to variants in order of addition.

### Interfaces & Contracts

**`buildVariantGraph(variants: Variant[], records: NarratorRecord[]): { nodes: ChainNode[], edges: VariantChainEdge[] }`** — pure function. Returns the same `ChainNode` shape as F7 plus:

```
VariantChainEdge extends ChainEdge {
  variantId: string
  color: string
}
```

**`VariantChainView` component:**
```
{
  variants: Variant[],
  records: NarratorRecord[],
  onNodeClick: (narratorId: string | null) => void,
  onRemoveVariant: (variantId: string) => void,
}
```
Internally calls `buildVariantGraph`, applies dagre layout, renders the reactflow graph. Renders the legend as an overlay within the graph panel. Does not manage the bio panel.

**`VariantInputPanel` component:** Renders the input area for a single variant — wraps Feature 1's `HadithInput` with a variant label and a "Remove" button. The parent route manages the list of `VariantInputPanel` instances.

**`useVariants` hook:**
```
{
  variants: Variant[],
  addVariant: () => void,         // creates a new empty variant slot (max 5)
  removeVariant: (id: string) => void,
  updateVariant: (id: string, data: Partial<Variant>) => void,
  canAddMore: boolean,            // false when variants.length === 5
}
```
Persists `hadith-variants` to localStorage on every change.

### Behavior & Interactions

**Adding a variant:**

"Add variant" button calls `useVariants.addVariant()`, which appends a new empty `Variant` to the list. A new `VariantInputPanel` appears below the existing analysis. It runs the full F1–F5 pipeline independently — its own `useHadithParser`, `useNarratorExtraction`, etc. When its analysis completes, `updateVariant` stores the results. The merged graph re-renders automatically.

**Removing a variant:**

`removeVariant(id)` removes the variant from state and localStorage. If only one variant remains, `VariantChainView` unmounts and `IsnadChainView` renders the remaining variant's chain.

**Merging logic for ambiguous cases:**

If two variants both have narrator at position N with `selectedId: "narrator-123"` and a third variant has position N with `selectedId: null` (unresolved), the merged graph shows two nodes at that position: the shared node for "narrator-123" (edges from variants 1 and 2) and a separate unknown node (edge from variant 3).

**Legend:**

Rendered as a fixed overlay in the top-left corner of the reactflow canvas. Shows a colored line segment + variant label per variant. Clicking a legend item is a no-op in v1 (filtering by variant is deferred).

---

## Testing Decisions

**`buildVariantGraph` — unit tests (pure function):**
- Two variants with one shared narrator (same `selectedId`) produce one merged node, not two
- Two variants with unknown narrators at the same position produce two separate nodes
- Edges carry the correct variant color
- Single variant produces the same output as `buildChainGraph` from F7
- Five variants with fully distinct chains produce N×M nodes (no merging)
- Narrator that is flagged in any variant makes the merged node flagged

**`useVariants` — unit tests:**
- `addVariant()` appends a new variant; `canAddMore` becomes false at 5
- `removeVariant(id)` removes the correct variant; state is persisted
- `updateVariant(id, data)` updates only the specified variant; others are unchanged

## Out of Scope

- **Legend filtering (click to isolate one variant's chain):** Deferred. v1 shows all variants simultaneously.
- **Automatic variant fetching from Sunnah.com or other databases:** Variants are always user-pasted. No external lookup.
- **More than 5 variants:** Practical limit for v1. The five-color palette is the binding constraint.
- **Variant reordering:** The order variants are added is fixed. Drag-to-reorder is deferred.
- **Diff view integration from the graph:** Clicking a branching point to jump directly to the diff view is deferred. Navigation between F8 and F9 is via the main tab/section controls.

## Open Questions

- Should the variant labels ("النسخة 1", etc.) be user-editable (e.g., replaced with the collection name — "رواية البخاري")? This would improve readability of the legend for scholarly use.

## Further Notes

`VariantChainView` and `IsnadChainView` share the same `NarratorBioCard` component and the same reactflow configuration. The parent route conditionally renders one or the other based on `variants.length`. The transition from linear to branching view is not animated — it is a full unmount/remount of the reactflow instance.

The `buildVariantGraph` function is the canonical place where multi-variant merging logic lives. It must remain a pure function so it is fully testable without reactflow or React.
