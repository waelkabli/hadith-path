# Phases: Isnad/Matn Separation — LLM-Powered Boundary Detection

> Source spec: .specs/isnad-matn-separation/spec.md

## Architectural Decisions

- **Trigger**: Feature 1's `onSubmit(text): Promise<void>` callback is owned by this feature's `useHadithParser.parse(text)`. The promise resolves when the parse succeeds (Feature 1 transitions to locked) and rejects on failure (Feature 1 returns to idle).
- **LLM**: Claude only in v1. All prompt construction, model selection, and HTTP details are internal to `parseHadith()`. A TODO comment inside marks the provider-dispatch extension point.
- **Output schema**: `{ splitAt: number }` — character offset only. Narrator extraction is Feature 4.
- **localStorage keys**: `hadith-api-key-claude` (API key string), `hadith-parse-result` (`{ inputHash, llmSplitAt, splitAt, corrected }`)
- **inputHash**: lightweight hash of the raw input text used to invalidate stale results when the user pastes different text.
- **Reset**: Feature 1's `onReset` callback is implemented here to call `useHadithParser.reset()`, which clears `hadith-parse-result` from localStorage and collapses the split view.
- **Settings**: Gear icon in app header → modal dialog with Claude API key field + Save. Accessible at all times.

---

## Phase 1: API Key Settings Modal

**User stories**: #1, #2
**Depends on**: Feature 1 Phase 2

### What to build

A gear icon in the app header opens a modal dialog. The modal contains a single API key input field (password type, so the key is masked) and a Save button. Saving writes the key to localStorage under `hadith-api-key-claude` and closes the modal. On page load the stored key is restored into the field so the user can see it is set (masked). A `useApiKey` hook owns all read/write logic.

### Acceptance criteria

- [ ] A gear icon is visible in the app header at all times
- [ ] Clicking the gear icon opens a modal with a masked API key input field and a Save button
- [ ] Saving a non-empty key writes it to `hadith-api-key-claude` in localStorage and closes the modal
- [ ] Opening the modal when a key is already stored shows the field pre-filled (masked)
- [ ] Closing the modal without saving discards any unsaved edits

### Manual QA plan

1. **Open settings**: Click the gear icon. **Expected**: modal appears with a masked text field labeled for the Claude API key.
2. **Enter and save key**: Type a test string, click Save. **Expected**: modal closes; re-opening the modal shows the field populated (masked).
3. **Key persists**: Save a key, refresh the page, reopen settings. **Expected**: key is still present in the field.
4. **Cancel discards**: Open modal, change the value, close modal without saving, reopen. **Expected**: original key is shown, not the edited value.

---

## Phase 2: Claude Call + Split Result Display

**User stories**: #3, #4, #5, #6, #7
**Depends on**: Phase 1, Feature 1 Phase 2

### What to build

Wire Feature 1's `onSubmit` callback to `useHadithParser.parse(text)`. The hook first checks for a stored API key; if missing, it rejects the promise with an Arabic error message so Feature 1 returns to idle and the error surfaces inline. If a key exists, it calls `parseHadith(text, apiKey)`, which constructs the Claude prompt (few-shot examples of diverse isnad formats), calls the Claude API directly from the browser, and returns `{ splitAt: number }`. On success, the input panel collapses to a compact summary row and a split result view renders below showing the isnad and matn as labeled sections. On any Claude API failure (bad key, network error, rate limit), the hook rejects so Feature 1 returns to idle with the appropriate error.

Feature 1's `onReset` is wired here: calling reset collapses the split view, re-expands the input panel, and clears `useHadithParser` state.

### Acceptance criteria

- [ ] Submitting valid Arabic text with no API key stored shows "يرجى إدخال مفتاح API في الإعدادات" inline and returns the input to idle
- [ ] Submitting with a valid key triggers a Claude API call
- [ ] A successful response renders the hadith split into a labeled "السند" section and a labeled "المتن" section below the collapsed input panel
- [ ] The input panel collapses to a compact summary row (truncated text preview + reset button) after a successful parse
- [ ] A Claude API failure (any HTTP error or network failure) shows "فشل الاتصال بالنموذج — يرجى التحقق من المفتاح والمحاولة مجدداً" and returns to idle
- [ ] Reset re-expands the input panel, hides the split view, and clears all parse state

### Manual QA plan

1. **No API key**: Clear `hadith-api-key-claude` from localStorage, paste valid Arabic text, click Submit. **Expected**: inline error about missing key; textarea re-editable.
2. **Invalid key**: Set an obviously invalid key (e.g., "bad-key"), submit a valid hadith. **Expected**: Claude returns a 401 or similar; error "فشل الاتصال..." appears; input returns to idle.
3. **Valid parse**: Set a real Claude API key, submit the pre-loaded example hadith. **Expected**: loading indicator appears; after a few seconds, the split view renders with "السند" and "المتن" sections containing the correct portions of the text.
4. **Input collapses**: After successful parse, verify the textarea is no longer visible in full; a compact summary row is shown with the reset button.
5. **Reset**: Click the reset button in the summary row. **Expected**: full input panel re-appears with the text preserved; split view disappears.
6. **RTL layout**: Verify both the "السند" and "المتن" label and text blocks are RTL-aligned with the Thmanyah Serif Display font.

---

## Phase 3: Parse Result Persistence

**User stories**: #8, #9
**Depends on**: Phase 2

### What to build

After a successful parse, write `{ inputHash, llmSplitAt, splitAt, corrected: false }` to `hadith-parse-result` in localStorage. `inputHash` is derived from the raw input text. On page load, if `hadith-input-raw` is present and its hash matches `hadith-parse-result.inputHash`, restore the split view without re-calling the LLM. If the hash does not match (the user has pasted different text), discard the stored result and show only the input panel. Reset removes `hadith-parse-result` from localStorage.

### Acceptance criteria

- [ ] After a successful parse, `hadith-parse-result` is written to localStorage with the correct shape
- [ ] Refreshing the page with matching input and stored result restores the split view without an LLM call
- [ ] Refreshing after changing the input text (hash mismatch) shows only the input panel — no stale split view
- [ ] Reset removes `hadith-parse-result` from localStorage
- [ ] `llmSplitAt` and `splitAt` are both set to the LLM's returned offset on first write; `corrected` is `false`

### Manual QA plan

1. **Restore on reload**: Parse a hadith successfully, then refresh the page. **Expected**: the split view is immediately shown without a loading state or LLM call; DevTools Network shows no Claude API request.
2. **Hash mismatch discards**: Parse a hadith, change the text in the textarea (paste something else), refresh. **Expected**: only the input panel is shown; no split view.
3. **Reset clears localStorage**: Parse, then click reset. Open DevTools → Application → Local Storage. **Expected**: `hadith-parse-result` key is absent.
4. **Inspect stored shape**: After a successful parse, inspect `hadith-parse-result` in localStorage. **Expected**: object contains `inputHash`, `llmSplitAt`, `splitAt` (same value), `corrected: false`.
