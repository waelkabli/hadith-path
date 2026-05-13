# Spec: Manual Correction Editor — Drag/Click to Fix the Isnad/Matn Split

## Problem Statement

The LLM boundary detection (Feature 2) is not always accurate. Hadiths vary enormously in structure — some have multiple narration clauses, ambiguous transition phrases, or unusual chains — and automated detection fails on edge cases. Without a way to correct the split, the user is stuck with a wrong result and the rest of the analysis (narrator extraction, chain visualization) is built on a bad foundation.

## Solution

After viewing the parsed split, the user can click an "Edit split" button to open an inline correction editor. The editor displays the full hadith text as a single continuous block, with the current isnad highlighted in one color and the matn in another. A draggable divider between them lets the user move the boundary word by word. The highlight regions update in real-time as the user drags. The user confirms with a button to apply the correction, resets to the LLM's original, or cancels without saving any change.

## User Stories

1. As a researcher, I want to see an "Edit split" button after parsing, so I can correct the boundary if the LLM got it wrong.
2. As a researcher, I want the correction editor to appear inline on the same screen (without navigation), so the correction feels lightweight and immediate.
3. As a researcher, I want the isnad and matn sections visually distinguished by color when the editor opens, so I can immediately see where the current split sits.
4. As a researcher, I want to drag a divider handle to move the boundary between the isnad and matn regions, so I can position it at the correct word.
5. As a researcher, I want the highlight regions to update in real-time as I drag, so I can preview my correction before committing.
6. As a researcher, I want the divider to snap to word boundaries rather than arbitrary character positions, so I never split a word in half.
7. As a researcher, I want a Confirm button to apply my correction and close the editor, so I control when the change takes effect.
8. As a researcher, I want a Reset button that restores the LLM's original split, so I can start the correction over if I went too far in the wrong direction.
9. As a researcher, I want a Cancel button that closes the editor without changing anything, so I can exit if I decide the LLM was right after all.
10. As a researcher, I want my confirmed correction to persist after a page refresh, so I do not lose my manual work.
11. As a researcher, I want a visual indicator on the split result view that tells me I have applied a manual correction, so I can distinguish a corrected split from the raw LLM output.

## Acceptance Criteria

- [ ] An "Edit split" button is visible on the split result view at all times after a successful parse
- [ ] Clicking "Edit split" opens the correction editor inline, replacing the split result view without navigating away
- [ ] The editor renders the full hadith text as a single block, with isnad text on a distinct background color and matn text on a neutral background
- [ ] A draggable divider handle is rendered at the current split position
- [ ] Dragging the divider updates the highlight regions in real-time
- [ ] The divider snaps to word boundaries (cannot land in the middle of a word)
- [ ] A Confirm button applies the correction: closes the editor, updates `splitAt` in state and localStorage, sets `corrected: true`
- [ ] A Reset button within the editor sets the divider back to `llmSplitAt` (the original LLM value); Confirm is still required to persist it
- [ ] A Cancel button closes the editor and restores the split view with the previously active `splitAt` unchanged
- [ ] After a confirmed correction, the split result view shows a subtle "corrected" badge or indicator
- [ ] The corrected `splitAt` is stored in `hadith-parse-result.splitAt` in localStorage; `llmSplitAt` is never overwritten
- [ ] On page load with a stored result where `corrected: true`, the corrected split is displayed and the indicator is shown

## Implementation Decisions

### Architecture & Schema

The correction editor works entirely against the same `hadith-parse-result` localStorage object defined in Feature 2:

```
hadith-parse-result: {
  inputHash: string,
  llmSplitAt: number,   // original LLM result — never overwritten
  splitAt: number,      // active split — updated on Confirm
  corrected: boolean,   // true after any confirmed manual correction
}
```

`llmSplitAt` is written once (by Feature 2) and never touched again by this feature. On Confirm, only `splitAt` and `corrected` are updated. This means the Reset action is available even after a page refresh, without re-calling the LLM.

The editor operates on **word-boundary snapping**. Before mounting, the full text is pre-processed into a `wordBoundaries` array: a list of character offsets at the start of each word. The active `splitAt` is always rounded to the nearest entry in this array. For RTL Arabic text, "words" are whitespace-delimited tokens; attached prepositions (e.g., `وعن`) are treated as single tokens.

### Interfaces & Contracts

**`useSplitCorrection(text, llmSplitAt, currentSplitAt)` hook:**
```
{
  draftSplitAt: number,          // in-progress split position (updates during drag)
  isDragging: boolean,
  onDrag: (offset: number) => void,   // called by the drag handler with raw cursor offset
  confirm: () => void,           // applies draftSplitAt → persists to localStorage
  reset: () => void,             // sets draftSplitAt back to llmSplitAt (does not persist)
  cancel: () => void,            // closes editor with no changes (signals parent)
  wordBoundaries: number[],      // precomputed from text on mount
}
```

The hook accepts an `onConfirm: (splitAt: number) => void` callback and an `onCancel: () => void` callback, both owned by the parent. On `confirm()`, the hook writes to localStorage and calls `onConfirm`. On `cancel()`, it calls `onCancel` with no state changes.

**`SplitCorrectionEditor` component:** Receives `{ text, draftSplitAt, wordBoundaries, isDragging, onDrag, onConfirm, onCancel, onReset }`. Renders the text as two color-coded spans with an absolutely-positioned draggable handle between them. The component owns no state — all state is in the hook.

**`HadithSplitView` component (updated from Feature 2):** Gains an "Edit split" button. When clicked, it passes control to the `SplitCorrectionEditor`. When the editor confirms or cancels, the split view re-renders with the updated (or unchanged) `splitAt`.

### Behavior & Interactions

**Editor open/close:**

The split result view and the correction editor are mutually exclusive. The parent route holds an `isEditing: boolean` flag. "Edit split" sets it to `true`; Confirm and Cancel both set it back to `false`.

**Drag mechanics:**

The text block has an `onPointerMove` listener (not `onMouseMove` — for touch compatibility). The raw pointer X position is mapped to a character offset using the text node's character position data. The offset is then snapped to the nearest entry in `wordBoundaries`. `draftSplitAt` updates on every pointer move while the pointer is down.

The divider handle is a vertically-centered pill/bar rendered between the last character of the isnad and the first character of the matn. Since the text is RTL, "left of the handle" is matn and "right of the handle" is isnad — the visual direction mirrors the reading direction.

**State flow:**

```
Split view visible
  → user clicks "Edit split"
      → correction editor opens with draftSplitAt = current splitAt

  Editor open:
    → drag → draftSplitAt updates in real-time → highlights repaint
    → Reset → draftSplitAt = llmSplitAt (no persist)
    → Confirm → localStorage updated, corrected = true → editor closes, split view shows corrected indicator
    → Cancel → draftSplitAt discarded → editor closes, splitAt unchanged
```

**"Corrected" indicator:**

A small Arabic label — "تم التعديل يدوياً" — appears as a muted badge adjacent to the section labels in the split view when `corrected: true`. It does not block or warn; it is purely informational.

---

## Testing Decisions

**`useSplitCorrection` — unit tests:**
- `draftSplitAt` initializes to `currentSplitAt`
- `onDrag(offset)` snaps the offset to the nearest word boundary and updates `draftSplitAt`
- `reset()` sets `draftSplitAt` to `llmSplitAt`; `confirm()` is required to persist
- `confirm()` writes `splitAt = draftSplitAt` and `corrected: true` to localStorage, calls `onConfirm`
- `cancel()` calls `onCancel` and does not write to localStorage
- `wordBoundaries` is derived from the text on mount and contains correct offsets for a sample Arabic string

**`SplitCorrectionEditor` — component tests:**
- Renders two color-coded spans whose character ranges match `draftSplitAt`
- Confirm button calls `confirm()` from the hook
- Reset button calls `reset()` from the hook
- Cancel button calls `cancel()` from the hook

No end-to-end tests for this feature in isolation — E2E coverage belongs to the full parse + correction flow.

## Out of Scope

- **Click-on-a-word to set split:** Deferred in favor of drag-only for v1. Drag is more discoverable for a range selection; word-click can be added as an enhancement.
- **Undo/redo history beyond Reset-to-original:** One level of undo (LLM original) is sufficient for v1. Multi-step undo is deferred.
- **Touch/mobile drag optimization:** The pointer event model handles basic touch. A fully optimized mobile drag (momentum, larger touch targets) is deferred.
- **Keyboard accessibility for the divider:** Arrow key nudging of the divider is deferred for v1.

## Open Questions

- Should the "Edit split" button be disabled (with a tooltip) when `corrected: true` to indicate a correction is already active, or should it always be clickable to allow further adjustment?
- For very long hadiths that overflow the viewport, should the editor scroll to the divider on open, or always show from the top?

## Further Notes

The correction editor does not re-call the LLM. It is a pure local state manipulation. The `llmSplitAt` value stored by Feature 2 is the permanent reference point; this feature only writes to `splitAt` and `corrected`.

RTL word boundary detection must handle Arabic-specific token shapes. The pre-processing step should split on Unicode whitespace (`\s+`) and record offsets. It must not attempt morphological segmentation — attached prepositions are intentionally treated as unsplittable units.
