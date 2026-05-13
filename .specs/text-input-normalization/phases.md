# Phases: Text Input

> Source spec: .specs/text-input-normalization/spec.md

## Architectural Decisions

- **State**: Entirely client-side. No backend calls. Single `localStorage` key `hadith-input-raw` stores the raw string; read on mount, written on every change.
- **Hook boundary**: `useHadithInput` is the sole interface between the UI and all input logic. The component owns no state directly.
- **Validation order**: Empty → non-Arabic (>50% non-Arabic chars heuristic) → word count (>3000). Stops at first failure.
- **State machine**: `idle ↔ error` (invalid submit), `idle → loading → locked` (valid submit), `locked → idle` (reset, value preserved).
- **onSubmit contract**: `onSubmit: (text: string) => Promise<void>`. The hook awaits the callback — `isLoading` stays true until the promise resolves or rejects. On rejection, the hook returns to idle and surfaces the error. This means Feature 2 (the LLM parse call) drives the loading duration; Feature 1 drives validation and lock/unlock.
- **Reset contract**: `reset()` calls an `onReset: () => void` callback owned by the route coordinator. From Feature 2 onward, the coordinator implements `onReset` to clear `hadith-parse-result`, `hadith-narrator-extraction`, and all downstream localStorage keys. In this feature alone, `onReset` is a no-op.
- **Layout**: All layout and text direction is RTL. Textarea styled per DESIGN_GUIDE `.textarea-hadith` — `--font-display-arabic` at `--text-lg`, `line-height: 1.95`, `direction: rtl`. Submit button uses `.btn-primary`. Error messages use `input-error-msg`.
- **Routes**: The `HadithInput` component is placed on the `/dashboard` route as the app's primary screen.

---

## Phase 1: Input Shell with Persistence

**User stories**: #1, #2, #9
**Depends on**: — (none)

### What to build

A thin vertical slice from hook to rendered UI: the `useHadithInput` hook exposes `value` and `onChange`, reads from `localStorage` (`hadith-input-raw`) on mount, and writes on every change. The `HadithInput` component renders a single Arabic textarea pre-filled with the example hadith as its initial value (not a placeholder). The layout is RTL, styled per DESIGN_GUIDE. A non-functional submit button is included to make the panel layout-complete and demoable, but it has no behavior yet.

The example hadith is sourced from a constants file (not hardcoded in the component) so it can be updated without touching component logic — resolves the open question in the spec.

### Acceptance criteria

- [ ] The textarea renders with the example hadith as its initial value on first load (localStorage empty)
- [ ] On subsequent loads, the textarea restores whatever the user previously typed from `localStorage`
- [ ] Every keystroke / paste writes the current value to `localStorage` under key `hadith-input-raw`
- [ ] Layout is RTL; textarea uses `--font-display-arabic` at `--text-lg` with `line-height: 1.95` per DESIGN_GUIDE
- [ ] A submit button is visible but does nothing when clicked
- [ ] `useHadithInput` exports `value` and `onChange` only at this phase; other fields are not yet wired

### Manual QA plan

1. **First load (empty localStorage)**: Open the app in a fresh private/incognito window and navigate to `/dashboard`. **Expected**: the textarea is pre-filled with the example Arabic hadith text; it is selectable and copyable.
2. **Paste and persist**: Clear the textarea, paste a short Arabic phrase, then close and reopen the tab. **Expected**: the pasted phrase is restored in the textarea; the example hadith is not shown.
3. **Keystroke persistence**: Type a few characters, open DevTools → Application → Local Storage, and inspect the `hadith-input-raw` key. **Expected**: the key updates with each keystroke.
4. **RTL layout**: Inspect the textarea. **Expected**: text aligns right, cursor starts at the right edge, the textarea uses the Thmanyah Serif Display font at the correct size and line height.
5. **Submit button visible**: Confirm the submit button renders below the textarea. **Expected**: clicking it has no visible effect (no error, no loading, no navigation).

---

## Phase 2: Validation, Submit, Loading Lock, and Reset

**User stories**: #3, #4, #5, #6, #7, #8, #10
**Depends on**: Phase 1

### What to build

Complete the `useHadithInput` hook with the full state machine. `submit()` runs the three-step validation chain; on failure it sets `error` and stays idle. On pass, it locks the textarea (`readOnly`), sets `isLoading: true`, and awaits `onSubmit(text)`. When the promise resolves, it sets `isSubmitted: true, isLoading: false`. When it rejects, it returns to idle with `isLoading: false`. `reset()` clears `isSubmitted`, `isLoading`, and `error`, preserves `value`, and calls the `onReset` callback (a no-op at this phase — wired to downstream cleanup in Feature 2).

The `HadithInput` component wires up all hook fields: inline Arabic error messages styled with `input-error-msg`, an animated loading indicator scoped to the submit button, the `readOnly` textarea attribute when locked, and a reset button visible only after submission.

### Acceptance criteria

- [ ] Submitting an empty textarea shows "الرجاء إدخال نص الحديث" and does not call `onSubmit`
- [ ] Submitting text where ≤50% of non-whitespace characters fall in U+0600–U+06FF shows "النص غير مدعوم — الأداة تقبل النصوص العربية فقط" and does not call `onSubmit`
- [ ] Submitting text exceeding 3000 words shows "النص يتجاوز الحد المسموح به (٣٠٠٠ كلمة)" and does not call `onSubmit`
- [ ] A valid Arabic submit calls `onSubmit(text)` with the raw string, sets `isLoading: true`, and makes the textarea `readOnly`
- [ ] While `isLoading` is true, an animated indicator is visible on or adjacent to the submit button
- [ ] After the loading state resolves, the textarea remains `readOnly` (`isSubmitted: true`)
- [ ] A reset button is visible when `isSubmitted` is true; clicking it returns the hook to idle, preserves `value`, and calls `onReset`
- [ ] Error messages are styled with `input-error-msg` per DESIGN_GUIDE

### Manual QA plan

1. **Empty submit**: Clear the textarea completely and click Submit. **Expected**: the inline error "الرجاء إدخال نص الحديث" appears; no loading indicator; textarea remains editable.
2. **Non-Arabic submit**: Type `hello world` and click Submit. **Expected**: the inline error "النص غير مدعوم — الأداة تقبل النصوص العربية فقط" appears; textarea stays editable.
3. **Word count submit**: Paste or generate a text block of more than 3000 Arabic words and click Submit. **Expected**: the inline error "النص يتجاوز الحد المسموح به (٣٠٠٠ كلمة)" appears; textarea stays editable.
4. **Valid submit — lock and loading**: Paste a short valid Arabic phrase (e.g., the pre-filled example) and click Submit. **Expected**: the textarea becomes read-only (cannot be edited), an animated loading indicator appears on the submit button, no error is shown.
5. **Error clears on valid retry**: Trigger the empty error, then type a valid Arabic phrase and submit. **Expected**: the previous error disappears before or on the new submission attempt.
6. **Reset action**: After a valid submit, click the reset button. **Expected**: the textarea is editable again, the previously entered text is still present, the loading indicator is gone, no error is shown.
7. **Error message styling**: Verify all three error messages use the `input-error-msg` style from DESIGN_GUIDE (correct color, size, placement).
8. **RTL error placement**: Confirm error messages align to the right edge of the textarea in RTL layout.
