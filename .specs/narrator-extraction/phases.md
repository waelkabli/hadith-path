# Phases: Narrator Extraction — LLM Extracts Names from the Isnad with Confidence Scores

> Source spec: .specs/narrator-extraction/spec.md

## Architectural Decisions

- **Trigger**: extraction runs automatically after Feature 2's parse succeeds. The `onSubmit` callback chain is: F1 submit → F2 parse (splitAt) → F4 extract (narrators). All three are awaited in sequence by the route coordinator.
- **Separate LLM call**: `extractNarrators(isnadText, apiKey)` is a distinct call from `parseHadith`. It takes `rawText.slice(0, splitAt)` as the isnad substring.
- **Two-step pipeline**: LLM returns `ExtractedNarrator[]` (names + positions); client-side `matchNarrators(extracted, database)` produces `NarratorMatch[]` with confidence scores. These are separate pure functions.
- **localStorage**: `hadith-narrator-extraction` → `{ inputHash, narrators: NarratorMatch[] }`. `inputHash` is derived from the isnad substring (not the full text) so a Feature 3 boundary correction invalidates the stored result.
- **Confidence thresholds**: ≥ 0.9 high (auto-selected), 0.6–0.89 medium (auto-selected, flagged), < 0.6 low (no auto-selection, flagged). Ambiguity flag: two candidates within 0.1 of each other and top score < 0.95.
- **Fixture DB**: ~10 well-known narrators used as the narrator database until Feature 6 replaces it with the real Dorar.net JSON.

---

## Phase 1: LLM Extraction Call + Raw Narrator List

**User stories**: #1, #2, #11
**Depends on**: Feature 2 Phase 2

### What to build

Wire `extractNarrators(isnadText, apiKey)` into the route coordinator so it runs automatically after `parseHadith` resolves. The function constructs a Claude prompt with few-shot examples of diverse isnad formats (simple chains with `عن`, chains beginning with `حدثنا`/`أخبرنا`, chains ending with a Companion narrator), calls the Claude API, and returns `ExtractedNarrator[]` ordered by `position`. The `useNarratorExtraction` hook manages loading state, error state, and the raw extraction result. After extraction, a narrator list renders below the split result view showing each extracted Arabic name in chain order. If the call fails, an inline error with a retry button is shown; existing results are not cleared.

### Acceptance criteria

- [ ] After a successful parse, `extractNarrators` is called automatically with the isnad substring
- [ ] The narrator list renders below the split result view, showing extracted names in chain order
- [ ] Each narrator shows its extracted Arabic name and `position` index
- [ ] If extraction fails, an inline error "فشل استخراج الرواة — يرجى المحاولة مجدداً" appears with a retry button
- [ ] Retry re-calls extraction without clearing existing results
- [ ] Reset (from Feature 1) clears the narrator list and removes `hadith-narrator-extraction` from localStorage

### Manual QA plan

1. **Auto-extraction**: Submit a valid hadith with a Claude API key set. **Expected**: after the split result appears, a loading state briefly shows then a list of Arabic narrator names renders below it, in chain order (right-to-left for RTL).
2. **Name accuracy**: Use the pre-loaded example hadith. **Expected**: the extracted names correspond to the narrators in the isnad portion of that hadith.
3. **Failure + retry**: Temporarily set an invalid API key, submit. **Expected**: after the parse succeeds, extraction fails with the inline error and a retry button; the split view is unaffected.
4. **Retry**: Click retry after a failure. **Expected**: extraction re-attempts; on success, names render correctly.
5. **Reset clears**: After extraction, click reset. **Expected**: narrator list disappears; `hadith-narrator-extraction` is absent from localStorage.

---

## Phase 2: Confidence Scoring + Database Matching + Badges + Flags

**User stories**: #3, #4
**Depends on**: Phase 1

### What to build

Implement `matchNarrators(extracted, database)` using the fixture narrator DB (~10 well-known narrators). The function normalizes both extracted names and DB records (strip tashkeel, collapse whitespace), runs trigram similarity, ranks candidates, and produces `NarratorMatch[]` with `topMatches`, `selectedId`, and confidence thresholds applied. The narrator list updates to show each narrator with a confidence badge (high/green, medium/yellow, low/red). Narrators below the confidence threshold or with ambiguous top matches display a warning indicator. `useNarratorExtraction` merges the extraction and matching steps so the caller sees only the final `NarratorMatch[]`.

### Acceptance criteria

- [ ] Each narrator in the list displays a confidence badge (high, medium, or low) based on the best match score
- [ ] Narrators with score ≥ 0.9 show a green badge and have `selectedId` auto-set to the best match
- [ ] Narrators with score 0.6–0.89 show a yellow badge and have `selectedId` auto-set but display a flag indicator
- [ ] Narrators with score < 0.6 show a red badge, `selectedId` is null, and a flag indicator is shown
- [ ] The ambiguity flag appears when two candidates score within 0.1 of each other and the top score < 0.95
- [ ] The fixture DB contains at least 10 narrators and produces correct matching results for the example hadith

### Manual QA plan

1. **Badge colors**: Submit the example hadith. **Expected**: narrator names show colored confidence badges; at least one well-known narrator (e.g., the Prophet ﷺ) shows a high-confidence green badge.
2. **Flag indicators**: Identify a narrator in the example hadith with an ambiguous or common name. **Expected**: a yellow or red flag indicator is visible on their card.
3. **Low confidence**: Use a hadith with a lesser-known narrator not in the fixture. **Expected**: that narrator shows a red badge with `selectedId: null`.
4. **Fixture DB coverage**: Open DevTools and inspect the narrator extraction state. **Expected**: `topMatches` for known narrators contains the correct fixture record ID with a high score.

---

## Phase 3: Persistence + Re-Extract After Correction

**User stories**: #8, #9
**Depends on**: Phase 2, Feature 3 Phase 3

### What to build

Write `{ inputHash, narrators }` to `hadith-narrator-extraction` in localStorage after each successful extraction. `inputHash` is derived from the isnad substring (`rawText.slice(0, splitAt)`). On page load, restore from localStorage if the stored hash matches. When Feature 3 changes `splitAt` (boundary correction), the isnad substring changes — the stored hash no longer matches. A "Re-extract" button appears in the narrator list area when Feature 3's `corrected` flag is true and the extraction hash is stale. Clicking Re-extract with existing `userOverride: true` narrators shows a confirmation warning ("ستُفقد التعديلات اليدوية على رواة السند") before proceeding. Confirming clears the stored extraction and re-runs the full extraction + matching pipeline.

### Acceptance criteria

- [ ] After extraction, `hadith-narrator-extraction` is written to localStorage with the isnad-derived hash
- [ ] Refreshing the page restores the narrator list from localStorage without re-calling the LLM
- [ ] After a Feature 3 boundary correction, a "Re-extract" button appears in the narrator area
- [ ] Clicking Re-extract when no `userOverride` narrators exist proceeds immediately
- [ ] Clicking Re-extract when `userOverride` narrators exist shows the Arabic confirmation warning
- [ ] Confirming Re-extract clears `hadith-narrator-extraction` and re-runs extraction against the new isnad text
- [ ] The restored list on page load includes confidence badges and flags

### Manual QA plan

1. **Restore on reload**: Extract narrators, refresh the page. **Expected**: narrator list appears immediately with badges intact; no LLM call visible in DevTools Network.
2. **Hash invalidation**: Extract, then use Feature 3 to move the split boundary, refresh. **Expected**: the Re-extract button appears; narrator list shows the stale state with a stale indicator.
3. **Re-extract without overrides**: Click Re-extract when no narrators have been manually corrected. **Expected**: proceeds immediately; new extraction runs against the corrected isnad.
4. **Re-extract with overrides**: Manually confirm a narrator (Feature 5 must be built), then trigger Re-extract. **Expected**: warning dialog appears; cancel keeps existing list; confirm clears and re-runs.
5. **Inspect hash**: After a Feature 3 correction, inspect `hadith-narrator-extraction.inputHash` vs the hash of `rawText.slice(0, correctedSplitAt)`. **Expected**: they differ — confirming the stale detection logic is correct.
