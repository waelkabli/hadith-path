# Phases: Manual Correction Editor — Drag/Click to Fix the Isnad/Matn Split

> Source spec: .specs/manual-correction-editor/spec.md

## Architectural Decisions

- **Split representation**: character offset (`splitAt`) into the original raw text. The editor never splits or copies the text — it only moves the offset.
- **Word-boundary snapping**: on mount, the full text is pre-processed into a `wordBoundaries: number[]` array (character offsets at the start of each whitespace-delimited token). The active `splitAt` always snaps to the nearest entry. Arabic-specific: no morphological decomposition — whitespace-delimited tokens only.
- **In-progress draft**: the editor maintains a `draftSplitAt` in hook state while the editor is open. Confirm writes it to `hadith-parse-result.splitAt` and sets `corrected: true`. Cancel discards the draft. Reset-to-original sets the draft back to `llmSplitAt` without persisting.
- **localStorage**: writes to the same `hadith-parse-result` key owned by Feature 2. Only `splitAt` and `corrected` are updated — `llmSplitAt` is never overwritten.
- **Editor open/close**: the parent route holds `isEditing: boolean`. "Edit split" sets it true; Confirm and Cancel set it false. The split result view and correction editor are mutually exclusive.

---

## Phase 1: Edit Split Button + Editor Shell with Static Highlighting

**User stories**: #1, #2, #3, #11
**Depends on**: Feature 2 Phase 2

### What to build

An "Edit split" button appears in the split result view (alongside the "السند" / "المتن" labels). Clicking it replaces the split result view with the correction editor. The editor renders the full hadith text as a single block: the isnad portion (characters 0 to `splitAt`) on a distinct background color, the matn portion on a neutral background. The divider between them is rendered as a static visual marker at the current split position. No dragging yet. A Cancel button closes the editor and returns to the split result view with no change. After a confirmed correction (in later phases), the split result view shows a "تم التعديل يدوياً" badge.

### Acceptance criteria

- [ ] An "Edit split" button is visible in the split result view after a successful parse
- [ ] Clicking it replaces the split view with the correction editor (no navigation)
- [ ] The correction editor renders the full hadith text in a single block with isnad and matn visually distinguished by background color
- [ ] A static divider marker is positioned at the current `splitAt` boundary
- [ ] A Cancel button closes the editor and returns to the split view unchanged
- [ ] The split view shows a "تم التعديل يدوياً" badge when `corrected: true` (set in a later phase, but the badge rendering logic is in place)

### Manual QA plan

1. **Open editor**: After a successful parse, click "Edit split". **Expected**: the isnad/matn sections are replaced by a single continuous text block; the isnad portion has a tinted background, the matn portion is neutral; a divider marker is visible at the boundary.
2. **Cancel closes editor**: Click Cancel. **Expected**: the original split result view returns; no change to the split position.
3. **Badge absent initially**: Inspect the split view before any correction. **Expected**: no "تم التعديل يدوياً" badge is shown.
4. **RTL layout**: Verify the text block reads right-to-left; the isnad starts at the right.

---

## Phase 2: Draggable Divider + Word-Boundary Snapping + Live Preview

**User stories**: #4, #5, #6
**Depends on**: Phase 1

### What to build

The static divider marker becomes a draggable handle. On pointer down + move, the raw cursor X position is mapped to a character offset in the text. The offset is snapped to the nearest entry in the pre-computed `wordBoundaries` array (so the divider never lands mid-word). As the user drags, `draftSplitAt` updates and the highlight regions repaint in real-time — the isnad background expands or contracts to the new boundary. The `useSplitCorrection` hook encapsulates the `wordBoundaries` computation, drag state, and `draftSplitAt` management.

### Acceptance criteria

- [ ] The divider handle can be dragged horizontally within the text block
- [ ] Dragging updates the isnad/matn highlight regions in real-time
- [ ] The divider always snaps to a word boundary — it never rests in the middle of an Arabic word
- [ ] `wordBoundaries` is computed from the text on editor mount and covers all whitespace-delimited token starts
- [ ] The drag works with pointer events (mouse and touch)

### Manual QA plan

1. **Drag right and left**: In the editor, click and drag the divider handle. **Expected**: the tinted isnad region expands and contracts smoothly as you drag; the highlight always aligns to the start of a word, never mid-character.
2. **Snap check**: Drag slowly and watch the divider position. **Expected**: it jumps between word starts, never resting between letters.
3. **Touch drag**: On a touch device (or DevTools touch emulation), drag the divider with a finger. **Expected**: same snapping behavior as mouse.
4. **Long hadith**: Use a long hadith with many narrators. **Expected**: the divider is draggable across the full width; no performance lag on repaint.

---

## Phase 3: Confirm, Reset-to-Original, Cancel + Persistence + Corrected Badge

**User stories**: #7, #8, #9, #10, #11
**Depends on**: Phase 2

### What to build

Add Confirm, Reset, and Cancel buttons to the editor. Confirm writes `draftSplitAt` to `hadith-parse-result.splitAt` and sets `corrected: true` in localStorage, then closes the editor. The split result view re-renders with the updated boundary and displays the "تم التعديل يدوياً" badge. Reset-within-editor sets `draftSplitAt` back to `llmSplitAt` (in draft state only — Confirm is still required to persist). Cancel discards the draft and closes the editor with no localStorage change. On page load, if `corrected: true`, the corrected split and badge are restored.

### Acceptance criteria

- [ ] Confirm writes `splitAt = draftSplitAt` and `corrected: true` to `hadith-parse-result` in localStorage
- [ ] After Confirm, the split result view shows the corrected boundary and the "تم التعديل يدوياً" badge
- [ ] Reset-within-editor moves the divider back to `llmSplitAt` without persisting; Confirm is still required to save
- [ ] Cancel closes the editor; `hadith-parse-result.splitAt` is unchanged
- [ ] Refreshing the page after a confirmed correction restores the corrected `splitAt` and shows the badge

### Manual QA plan

1. **Confirm correction**: Drag the divider to a new word boundary, click Confirm. **Expected**: editor closes; split view shows the new boundary; "تم التعديل يدوياً" badge appears.
2. **Persist across reload**: Confirm a correction, refresh the page. **Expected**: the corrected split and badge are restored without re-calling the LLM.
3. **Reset-to-original**: Open the editor, drag to a new position, click Reset. **Expected**: the divider returns to the LLM's original position (not the user's drag position); the boundary has not changed in the split view.
4. **Reset then Confirm**: After Reset, click Confirm. **Expected**: the LLM's original `llmSplitAt` is now the stored `splitAt`; `corrected: true` is set (user explicitly confirmed the original as correct).
5. **Cancel discards**: Open editor, drag divider, click Cancel. **Expected**: split view unchanged; localStorage unchanged; no badge if not previously corrected.
6. **Inspect localStorage**: After Confirm, inspect `hadith-parse-result`. **Expected**: `splitAt` matches the dragged position; `corrected: true`; `llmSplitAt` is unchanged.
