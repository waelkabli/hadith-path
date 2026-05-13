# Spec: Narrator Extraction — LLM Extracts Names from the Isnad with Confidence Scores

## Problem Statement

Once the isnad text is identified (Feature 2), there is no way to know who the narrators are. The isnad is a chain of names connected by transmission phrases, but the names are not parsed, labeled, or linked to any biographical data. Without this step, the tool cannot visualize the chain, assess reliability grades, or flag ambiguous identifications.

## Solution

After the isnad/matn split is established, the tool automatically makes a second LLM call with the isnad substring. The LLM returns an ordered list of narrator name strings and their positions in the text. Client-side matching logic then scores each name against the narrator database and selects the best candidate. Narrators with low-confidence or ambiguous matches are visually flagged. The user can click any narrator to open a disambiguation panel, review the top candidates, and confirm the correct one — or mark a narrator as unknown if they are not in the database.

## User Stories

1. As a researcher, I want narrator names to be automatically extracted from the isnad after parsing, so I do not have to identify them manually.
2. As a researcher, I want to see the extracted narrators listed in chain order, so I can follow the transmission path at a glance.
3. As a researcher, I want each narrator matched to a database record with a visible confidence level, so I know how certain the tool is about each identification.
4. As a researcher, I want ambiguous or low-confidence matches to be visually flagged, so I know which narrators need my review.
5. As a researcher, I want to click on any narrator to open a disambiguation panel showing the top candidate matches, so I can select the correct one.
6. As a researcher, I want to see each candidate's key details (Arabic name, transliteration, death year, generation, reliability grade) in the panel, so I have enough context to identify them correctly.
7. As a researcher, I want to mark a narrator as "unknown" if none of the candidates match, so the chain is complete even when a narrator is missing from the database.
8. As a researcher, I want my manual narrator selections to persist after a page refresh, so I do not lose my corrections.
9. As a researcher, I want a "Re-extract" button after correcting the isnad boundary (Feature 3), so I can re-run extraction against the corrected isnad text.
10. As a researcher, I want a warning before re-extraction if I have already made manual corrections, so I do not accidentally discard my work.
11. As a researcher, I want to see an inline error with a retry option if the LLM extraction call fails, so I am not stuck.

## Acceptance Criteria

- [ ] Narrator extraction runs automatically after a successful parse (Feature 2 `splitAt` confirmed)
- [ ] Extracted narrators are displayed in chain order with their Arabic names
- [ ] Each narrator shows a confidence badge: high (≥ 0.9), medium (0.6–0.89), or low (< 0.6)
- [ ] Low-confidence and ambiguous narrators are visually flagged with a distinct color and icon
- [ ] Clicking a narrator opens a disambiguation panel with up to 5 ranked candidate matches
- [ ] Each candidate in the panel shows: Arabic name, transliterated name, death year, generation, reliability grade
- [ ] Selecting a candidate in the panel marks the narrator as user-confirmed (`userOverride: true`) and closes the panel
- [ ] An "Unknown narrator" option is available in the panel; selecting it sets `selectedId: null` with `userOverride: true`
- [ ] All narrator extraction results and user selections are persisted in localStorage
- [ ] Persisted results are restored on page load when the stored input hash matches the current input
- [ ] After a Feature 3 correction, a "Re-extract" button is shown; clicking it with existing user corrections shows a confirmation warning before proceeding
- [ ] If the LLM call fails, an inline error is shown with a retry button; existing results are not cleared
- [ ] The narrator database module ships with a fixture of at least 10 well-known narrators sufficient to exercise the full matching pipeline

## Implementation Decisions

### Architecture & Schema

Narrator extraction is a **separate LLM call** from the boundary detection call (Feature 2). The two calls are independent — extraction takes the isnad substring (already known) and can be retried without re-running boundary detection.

**Narrator record schema** (defined once; used by both the fixture and the eventual Dorar.net JSON):

```
NarratorRecord {
  id: string
  nameArabic: string
  nameTransliterated: string
  birthYear: number | null
  deathYear: number | null
  generation: "Sahabi" | "Tabi'i" | "Tabi' al-Tabi'in" | "later"
  reliabilityGrade: string          // e.g. "ثقة", "صدوق", "ضعيف"
  teachers: string[]                // narrator IDs
  students: string[]                // narrator IDs
  collections: string[]             // e.g. ["Bukhari", "Muslim"]
  bioNote: string
}
```

**LLM output schema** (what `extractNarrators` returns from the model):

```
ExtractedNarrator {
  name: string          // Arabic name as it appears in the isnad
  position: number      // 0-indexed order in the chain
  mentionStart: number  // character offset in the isnad substring
  mentionEnd: number    // character offset in the isnad substring
}
```

The LLM is not given the narrator database. It only identifies and positions names. Matching is done client-side.

**Match result schema** (produced by `matchNarrators`):

```
NarratorMatch {
  extractedName: string
  position: number
  mentionStart: number
  mentionEnd: number
  topMatches: { narratorId: string; score: number }[]   // up to 5, descending score
  selectedId: string | null   // null = unknown or unresolved
  userOverride: boolean       // true = user has manually confirmed or marked unknown
}
```

**Confidence thresholds:**

| Score | Badge | Behavior |
|-------|-------|----------|
| ≥ 0.9 | High (green) | Best match auto-selected; no flag |
| 0.6 – 0.89 | Medium (yellow) | Best match auto-selected; flagged for review |
| < 0.6 | Low (red) | No auto-selection; flagged as ambiguous; `selectedId` starts `null` |

A match is also considered **ambiguous** (and flagged) if two or more candidates have scores within 0.1 of each other and the top score is < 0.95 — even if the top score is above 0.6.

**localStorage key:** `hadith-narrator-extraction`

```
{
  inputHash: string,
  narrators: NarratorMatch[]
}
```

`inputHash` is derived from the isnad substring (not the full hadith text) so that a Feature 3 boundary correction correctly invalidates the stored extraction.

**Narrator database module:** Ships as a static asset — a JSON array of `NarratorRecord[]`. For development and testing, a fixture of ~10 well-known narrators (e.g., the Prophet ﷺ, Abu Bakr, Umar, Aisha, Ibn Abbas, Malik ibn Anas, al-Bukhari, Muslim, al-Zuhri, Anas ibn Malik) is used in place of the full Dorar.net bundle. The module interface does not change when the real JSON is swapped in.

### Interfaces & Contracts

**`extractNarrators(isnadText, apiKey): Promise<ExtractedNarrator[]>`** — deep module. Constructs the LLM prompt (including few-shot examples of diverse isnad formats), calls Claude, parses and validates the JSON response, and returns an ordered array. Throws on failure. Caller never sees prompt text, model name, or HTTP details.

**`matchNarrators(extracted, database): NarratorMatch[]`** — pure function, no side effects. Takes the LLM output and the narrator DB array. For each extracted name: strips diacritics, runs normalized string comparison against all DB records, scores, ranks, applies thresholds, and returns the full `NarratorMatch` array. This function is fully testable without any LLM or network dependency.

**`useNarratorExtraction` hook:**

```
{
  narrators: NarratorMatch[] | null,
  error: string | null,
  isLoading: boolean,
  extract: (isnadText: string) => void,   // triggers LLM call + matching
  confirmMatch: (position: number, narratorId: string | null) => void,
  reset: () => void,                      // clears results and localStorage
}
```

`confirmMatch` sets `selectedId` and `userOverride: true` for the narrator at `position`, then persists to localStorage. Passing `null` as `narratorId` marks the narrator as unknown.

**`NarratorChainView` component:** Renders the ordered list of `NarratorMatch` objects. Displays Arabic name, confidence badge, and flag indicator. Clicking a narrator calls an `onSelect(position)` prop.

**`NarratorDisambiguationPanel` component:** Receives a single `NarratorMatch` and the full `NarratorRecord[]` for its `topMatches`. Renders each candidate with key fields. Exposes `onConfirm(narratorId | null)` and `onClose` props. Owns no state — fully controlled.

### Behavior & Interactions

**Trigger:**

Extraction is triggered automatically by the same flow that triggers after Feature 2 succeeds. The `onSubmit` callback chain becomes:

```
Feature 1 onSubmit(text)
  → Feature 2: parseHadith → sets splitAt
      → Feature 4: extractNarrators(isnad) + matchNarrators → sets narrators
```

Extraction runs against the isnad text at the time parsing completes. If the user later applies a Feature 3 correction that changes the isnad boundary, the existing extraction results remain visible but a "Re-extract" button appears. Re-extraction with existing `userOverride` narrators shows a confirmation dialog: "ستُفقد التعديلات اليدوية على رواة السند — هل تريد المتابعة؟". Confirming clears the stored results and re-runs from the LLM step.

**Disambiguation panel:**

The panel opens inline (not in a modal) adjacent to the narrator's position in the chain list. Only one panel can be open at a time — opening a second closes the first. The panel closes on Confirm, on the "Unknown" action, or on an explicit close (X) button. Closing without selecting makes no change.

**Confidence scoring internals (inside `matchNarrators`):**

1. Strip diacritics (tashkeel) from both the extracted name and DB records.
2. Normalize: collapse whitespace, strip tatweel.
3. Run exact match. If found: score = 1.0.
4. Run trigram similarity on all DB entries. Take top 5 by score.
5. Apply the threshold and ambiguity rules to determine badge and auto-selection.

The diacritic-stripping utility used here is the same `normalizeArabic` utility called for by RESEARCH.md §12. If that utility does not yet exist as a shared module, it is extracted here and placed in a shared utilities layer.

**Error and retry:**

If `extractNarrators` throws, `useNarratorExtraction` sets `error` with the message "فشل استخراج الرواة — يرجى المحاولة مجدداً" and leaves any existing `narrators` state untouched (so a prior successful result is not cleared). A retry button calls `extract()` again with the same isnad text.

---

## Testing Decisions

**`matchNarrators` — unit tests (no network, pure function):**
- Exact Arabic name match returns score 1.0 and is auto-selected
- High-trigram-similarity match (diacritics differ) returns score ≥ 0.9 and is auto-selected
- Two candidates within 0.1 of each other below 0.95 both produce an ambiguous flag
- Score < 0.6 results in `selectedId: null` and low-confidence flag
- Returns narrators in ascending `position` order
- `normalizeArabic` strips tashkeel and tatweel correctly on fixture strings

**`extractNarrators` — unit tests (fetch mocked):**
- Returns correctly shaped `ExtractedNarrator[]` for a valid Claude JSON response
- Throws on 401 (bad API key)
- Throws on malformed or missing JSON in the response
- Throws on network error

**`useNarratorExtraction` — unit tests:**
- `extract()` with no API key sets `error`, does not call `extractNarrators`
- Successful extraction sets `narrators` and writes to localStorage
- `confirmMatch(position, id)` updates the correct narrator's `selectedId` and `userOverride`, persists
- `confirmMatch(position, null)` marks unknown, persists
- `reset()` clears narrators and removes localStorage key
- On mount, restores from localStorage when input hash matches

## Out of Scope

- **Full Dorar.net narrator JSON bundle:** The real ~10,000 entry JSON is not part of this feature. The module interface is defined here; the JSON is wired in as a separate maintenance task.
- **Narrator biography card / profile view:** Displaying a full narrator bio is deferred to Feature 5 (isnad visualization), where clicking a node in the chain diagram opens the bio card.
- **Multi-provider LLM support (Gemini, OpenAI):** The `extractNarrators` function follows the same TODO-marked extension point established in Feature 2.
- **Morphological name decomposition:** Some narrator names contain laqab (epithets) or kunya (honorifics) that may confuse fuzzy matching. Advanced morphological analysis is deferred; the trigram approach handles most common cases.
- **User-added narrator records:** RESEARCH.md describes a flow where users can add custom narrator records to localStorage. That flow is deferred to a later feature; the matching module is designed to accept any `NarratorRecord[]` array so custom records can be merged in later without changing the interface.

## Open Questions

- Should `matchNarrators` also attempt to use the narrator's `mentionStart`/`mentionEnd` positions to cross-check order against known teacher/student relationships in the DB? This could improve disambiguation but adds complexity.
- When the real Dorar.net JSON is large (potentially megabytes), should it be loaded lazily on first extraction, or bundled and tree-shaken at build time?

## Further Notes

The isnad substring used for extraction is `rawText.slice(0, splitAt)` from the Feature 2 result. After a Feature 3 user correction, the isnad is `rawText.slice(0, correctedSplitAt)`. The `inputHash` stored in `hadith-narrator-extraction` must be recomputed from whichever isnad text was used for the current extraction, so that a subsequent boundary correction correctly marks the stored result as stale.

The LLM prompt for `extractNarrators` must include few-shot examples covering: simple linear chains, chains with `عن` connectors, chains beginning with `حدثنا` or `أخبرنا`, and chains with a Companion narrator at the end. Prompt text is internal to the module and is not exposed.
