# Spec: Isnad/Matn Separation — LLM-Powered Boundary Detection

## Problem Statement

After a user submits hadith text (Feature 1), nothing happens — there is no parsing step. The tool needs to automatically detect where the isnad (chain of narrators) ends and the matn (hadith body) begins, and present the result to the user.

## Solution

The user's API key for Claude is stored via a settings modal (gear icon in the header). When Feature 1 fires its `onSubmit` callback, the tool calls Claude with the raw hadith text, receives a character offset marking the isnad/matn boundary, persists the result, and renders the two parts as labeled sections below a collapsed input panel. On failure, an inline error returns the user to idle so they can fix settings and retry.

## User Stories

1. As a researcher, I want to open a settings modal and enter my Claude API key, so the tool can make LLM calls on my behalf.
2. As a researcher, I want my API key to be remembered between sessions, so I do not have to re-enter it every time I open the tool.
3. As a researcher, I want my submitted hadith to be automatically parsed the moment I click Submit, so I do not have to trigger a separate step.
4. As a researcher, I want to see an error if I have not entered an API key, so I know I need to open settings before I can parse.
5. As a researcher, I want to see my hadith split into a labeled isnad section and a labeled matn section after parsing, so I can verify the LLM's boundary detection.
6. As a researcher, I want to see an inline error if the Claude call fails (bad key, network error, rate limit), so I know what went wrong.
7. As a researcher, I want to be able to retry parsing after a failure (by resetting via Feature 1's reset action), so I am not stuck.
8. As a researcher, I want the parsed split to persist after a page refresh, so I can return to an in-progress analysis without re-running the LLM.
9. As a researcher, I want the persisted split to be invalidated when I paste different hadith text, so I never see a stale result from a prior input.

## Acceptance Criteria

- [ ] A gear icon in the app header opens a modal with a Claude API key input field and a Save button
- [ ] The API key is written to localStorage on Save and restored on page load
- [ ] When Feature 1's `onSubmit` fires and no API key is set, an inline error appears and the input returns to idle
- [ ] When Feature 1's `onSubmit` fires with a valid API key, a Claude API call is made with the raw hadith text
- [ ] A successful parse produces a character offset (`splitAt`) that splits the original text into isnad and matn
- [ ] The parsed result is displayed as two labeled, visually separated sections (isnad above, matn below) on the same screen
- [ ] The input panel collapses after a successful parse (not removed — the user can still see and reset it)
- [ ] If the Claude call fails for any reason, an inline error is shown and the input returns to idle (textarea re-editable)
- [ ] The parse result (`splitAt`, plus a hash of the input text) is written to localStorage on success
- [ ] On page load, if the stored input text matches the stored hash, the split result is restored without re-calling the LLM
- [ ] All labels and error messages are in Arabic; layout is RTL

## Implementation Decisions

### Architecture & Schema

Entirely client-side. Claude is called directly from the browser using the user's API key. No proxy, no server.

**localStorage keys:**

| Key | Value |
|-----|-------|
| `hadith-api-key-claude` | Raw API key string |
| `hadith-parse-result` | `{ inputHash: string, llmSplitAt: number, splitAt: number, corrected: boolean }` |

`inputHash` is a lightweight hash (e.g., FNV-1a or `btoa` of a truncated substring) of the raw input text. It is used to detect stale results — if the stored hash does not match a hash of the current `hadith-input-raw`, the stored result is discarded and the split view is not shown.

`llmSplitAt` is the original LLM-returned offset and is never overwritten after the first write — it allows the manual correction editor (Feature 3) to reset to the LLM original even after a page refresh.

`splitAt` is the active split point (starts equal to `llmSplitAt`; may be updated by Feature 3).

`corrected` starts as `false`; Feature 3 sets it to `true`.

**LLM output schema (Feature 2 scope only):**

The LLM returns `{ splitAt: number }` — a character offset in the original text. Narrator extraction is a separate later feature and is not part of this call.

### Interfaces & Contracts

**`parseHadith(text, apiKey): Promise<{ splitAt: number }>`** — deep module. All prompt construction, the Claude API call, response JSON parsing, and error normalization are internal. The caller passes text and a key; gets back a split offset or a thrown error. The caller never sees prompt strings, model names, or HTTP details.

> TODO: When additional providers (Gemini, OpenAI) are added, this function becomes a thin dispatcher that routes to a provider-specific internal implementation. The external signature does not change.

**`useHadithParser` hook:**
```
{
  result: { splitAt: number, llmSplitAt: number, corrected: boolean } | null,
  error: string | null,
  isLoading: boolean,
  parse: (text: string) => void,   // called by Feature 1's onSubmit
  reset: () => void,               // clears result and error; called by Feature 1's reset
}
```
The hook reads and writes `hadith-parse-result` from localStorage. It also reads `hadith-api-key-claude` to check for a key before calling `parseHadith`.

**`useApiKey` hook:**
```
{
  apiKey: string | null,
  setApiKey: (key: string) => void,
}
```
Reads and writes `hadith-api-key-claude`.

**`ApiKeySettings` component:** Renders the modal. Accepts no props beyond what it reads from `useApiKey`. Opened/closed by a gear icon in the app header.

**`HadithSplitView` component:** Renders the two labeled sections from a `result` prop. Accepts `{ text: string, splitAt: number }`. Does not own state.

### Behavior & Interactions

**Parse flow:**

```
Feature 1 onSubmit(text)
  → useHadithParser.parse(text)
      → check apiKey: missing → set error, return
      → call parseHadith(text, apiKey)
          → success: write to localStorage, set result
          → failure: set error string, return to idle
```

**Error messages (Arabic):**

| Condition | Message |
|-----------|---------|
| No API key | "يرجى إدخال مفتاح API في الإعدادات" |
| API call failure (any) | "فشل الاتصال بالنموذج — يرجى التحقق من المفتاح والمحاولة مجدداً" |

**Result display:**

After a successful parse, the input panel collapses to a compact summary row (showing a truncated preview of the hadith text and a reset button). The split view renders below it with two labeled regions: "السند" (isnad) and "المتن" (matn), each styled with `ThmanyahSerifDisplay` per DESIGN_GUIDE.

**Reset:**

When Feature 1's `reset()` is called, `useHadithParser.reset()` is called as the `onReset` callback. This clears `result`, `error`, and removes `hadith-parse-result` from localStorage. The input panel re-expands.

---

## Testing Decisions

**`parseHadith` — unit tests (fetch mocked):**
- Returns correct `splitAt` for a valid Claude JSON response
- Throws for a 401 (invalid API key) response
- Throws for a network error
- Throws for a Claude response that contains malformed or missing JSON

**`useHadithParser` — unit tests:**
- Calling `parse()` with no API key sets `error`, does not call `parseHadith`
- Calling `parse()` with a valid key and a successful `parseHadith` response sets `result` and writes to localStorage
- Calling `parse()` when `parseHadith` throws sets `error` and clears `result`
- `reset()` clears `result`, `error`, and removes the localStorage key
- On mount, restores `result` from localStorage when the input hash matches; discards when it does not

**`useApiKey` — unit tests:**
- `setApiKey` writes to localStorage; next read returns the written value
- Returns `null` when no key is stored

## Out of Scope

- **Gemini and OpenAI providers:** Deferred. A TODO is left inside `parseHadith` marking the provider-dispatch extension point.
- **"Test connection" button in settings:** Deferred. v1 is save-only.
- **Retry with exponential backoff:** Deferred. v1 returns to idle on any failure.
- **Narrator extraction in the same LLM call:** Deferred to a later feature. This call returns only `{ splitAt }`.
- **Prompt caching or response streaming:** Deferred. Hadiths are short; latency is acceptable.

## Open Questions

- Should the collapsed input summary row show the full text in a small scroll area, or just a character count + first few words?
- Should the error state distinguish between "bad API key" (likely user error) and "network failure" (likely transient) with different messages, or is a single generic message sufficient?

## Further Notes

Claude is called directly from the browser — no CORS proxy is needed as Anthropic's API supports browser `fetch` with an API key. The model choice (e.g., `claude-haiku-4-5-20251001` for cost efficiency on short texts) is an implementation detail hidden inside `parseHadith`.

The LLM prompt must include few-shot examples of diverse isnad formats. Prompt text is internal to `parseHadith` and not exposed to callers.
