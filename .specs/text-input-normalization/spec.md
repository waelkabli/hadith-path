# Spec: Text Input

## Problem Statement

There is no way to get hadith text into the tool. The app needs an entry point where a user pastes raw Arabic hadith text, validates it, and hands it off to the LLM parsing step.

## Solution

A focused input screen with a large Arabic textarea, an example hadith pre-loaded so the user understands the expected format, a submit button that validates and fires off the LLM parse, and a clear/reset action to start over. The raw text is persisted in localStorage so the user can return to where they left off.

## User Stories

1. As a researcher, I want to see an example hadith pre-filled in the input area, so that I understand what format to paste my text in.
2. As a researcher, I want to paste my own Arabic hadith text and replace the example, so that I can analyze my hadith.
3. As a researcher, I want to press a submit button to trigger parsing, so that I control when the analysis starts.
4. As a researcher, I want to see a validation error when I submit an empty textarea, so that I understand why nothing happened.
5. As a researcher, I want to see a "not supported" error when I submit non-Arabic text, so that I know the tool only accepts Arabic input.
6. As a researcher, I want to see a validation error when my text exceeds 3000 words, so that I know to shorten it before submitting.
7. As a researcher, I want the textarea to lock after I submit, so that I do not accidentally edit the text while the LLM is parsing.
8. As a researcher, I want to see an animated loading state after submitting, so that I know the tool is working.
9. As a researcher, I want my input text to persist after a page refresh, so that I do not lose my work if I close the tab.
10. As a researcher, I want a clear/reset action that unlocks the textarea and clears the parsed output, so that I can start a new analysis without losing the text I pasted.

## Acceptance Criteria

- [ ] An example Arabic hadith is visible in the textarea on first load (before the user types anything)
- [ ] Submitting an empty textarea shows an inline error message and blocks submission
- [ ] Submitting text that is not Arabic shows a "not supported" inline error and blocks submission
- [ ] Submitting text that exceeds 3000 words shows an inline error and blocks submission
- [ ] A valid submit locks the textarea (read-only) and shows an animated loading indicator
- [ ] The raw input text is written to localStorage on every change and restored on page load
- [ ] A clear/reset action exists that clears all downstream parsed state and unlocks the textarea for editing; the input text is preserved
- [ ] All layout and text direction is RTL

## Implementation Decisions

### Architecture & Schema

The feature is entirely client-side. No backend calls are made by this feature — the only side effect is a localStorage write.

localStorage key: `hadith-input-raw`. Value: the raw string as the user typed/pasted it. Written on every input change, read on mount.

There is no separate "normalized" copy stored anywhere. The raw text is passed directly to the LLM. Normalization (diacritics, tatweel, unicode, whitespace) is delegated to the LLM via prompt instructions, not handled in client code.

> **Deviation from RESEARCH.md:** The original design called for a client-side `normalizeArabic()` utility that strips diacritics and tatweel before passing text to the LLM. This was explicitly deferred in favor of simplicity — the LLM prompt will carry those instructions instead. This decision may be revisited if LLM output quality suffers from inconsistent input encoding.

### Interfaces & Contracts

`useHadithInput` hook — the single interface between the UI and all input logic:

```
{
  value: string,           // current textarea value
  error: string | null,    // validation error to display, or null
  isSubmitted: boolean,    // true after a valid submit — locks the textarea
  isLoading: boolean,      // true while LLM parse is in flight
  onChange: (text) => void,
  submit: () => void,      // runs validation; on pass, locks textarea, sets isLoading, calls onSubmit
  reset: () => void,       // clears isSubmitted, isLoading, error; preserves value
}
```

The hook accepts an `onSubmit: (text: string) => void` callback. The caller (feature 2 — LLM parsing) owns the actual API call; this hook only signals readiness and manages loading/locked state.

### Behavior & Interactions

**Validation order** (runs on submit, stops at first failure):
1. Empty check — error: "الرجاء إدخال نص الحديث" (or equivalent)
2. Arabic language check — lightweight client-side heuristic (e.g., check that >50% of non-whitespace characters fall in the Unicode Arabic block U+0600–U+06FF); error: "النص غير مدعوم — الأداة تقبل النصوص العربية فقط"
3. Word count check (> 3000 words) — error: "النص يتجاوز الحد المسموح به (٣٠٠٠ كلمة)"

**State machine:**

```
idle → (submit, valid) → loading → (LLM done) → submitted/locked
                ↓ (submit, invalid)
              error (stays idle, textarea remains editable)

submitted/locked → (reset) → idle (value preserved, downstream state cleared)
```

**Loading state:** An animated spinner or skeleton overlay on the submit button. The textarea itself shows `readOnly`. No full-page loading overlay — the loading state is scoped to the input panel.

**Example hadith:** Shown as the textarea's initial value (not as a placeholder attribute), so it is selectable and copyable. The user replaces it by selecting all and pasting.

---

## Testing Decisions

Both `HadithInput` (component) and `useHadithInput` (hook) are tested.

**`useHadithInput` — unit tests:**
- Empty string triggers empty error, does not call onSubmit
- Non-Arabic string triggers "not supported" error, does not call onSubmit
- String exceeding 3000 words triggers word count error, does not call onSubmit
- Valid Arabic string calls onSubmit with the raw text, sets isLoading and isSubmitted
- reset() clears isSubmitted and isLoading, preserves value
- Value is written to localStorage on change and restored on mount

**`HadithInput` — component tests (rendering + interaction):**
- Renders the example hadith as the initial textarea value
- Displays the correct error message for each validation failure
- Textarea has `readOnly` attribute when isSubmitted is true
- Loading indicator is visible when isLoading is true
- Reset button is visible after submission and triggers reset

No end-to-end tests for this feature in isolation — E2E coverage belongs to the full parse flow (features 1 + 2 together).

## Out of Scope

- **Client-side Arabic normalization (diacritics, tatweel, unicode, whitespace):** Delegated to the LLM prompt. May be revisited if LLM output quality requires cleaner input.
- **PDF / image / file upload input:** Text paste only in v1.
- **Multiple simultaneous hadith slots:** Single active hadith; variants are handled by the separate variant comparison feature.
- **Character-level input feedback (live word count, language indicator):** Validation runs on submit only, not on every keystroke.
- **Undo/redo history beyond the browser's native textarea behavior.**

## Open Questions

- Should the example hadith be hardcoded in the component, or loaded from a constants file so it can be updated without touching component logic?
- Word count: should we count by splitting on whitespace, or use a more Arabic-aware tokenizer that handles cases like attached prepositions (e.g., `وعن` as one token)?

## Further Notes

The textarea styling is fully specified in DESIGN_GUIDE.md under `.textarea-hadith` — `--font-display-arabic` at `--text-lg`, `line-height: 1.95`, `direction: rtl`. The submit button uses `.btn-primary`. Error messages use `input-error-msg` styling. All of this is pre-decided; the implementation should not deviate.
