# Phases: Narrator Disambiguation UI — User Can Override Auto-Matched Narrator Links

> Source spec: .specs/narrator-disambiguation-ui/spec.md

## Architectural Decisions

- **Panel placement**: inline, below the clicked narrator card. Only one panel open at a time. The chain view signals the selected position to the parent; the parent renders the panel.
- **Custom narrator storage**: `hadith-custom-narrators` in localStorage — `NarratorRecord[]` with `custom-` prefixed IDs. Independent of any hadith session; persists until explicitly deleted.
- **Confirmation flow**: `confirmMatch(position, narratorId | null)` in `useNarratorExtraction` updates `selectedId` and `userOverride: true` for that position and persists to `hadith-narrator-extraction`.
- **Guided step-through**: parent route holds `guidedIndex: number | null`. Null = not in guided mode. Opening the guided flow starts at the first flagged narrator; Next/Prev step through the flagged subset; mode ends when the user closes or finishes.
- **Custom record + current slot**: adding a custom narrator immediately resolves the current slot and makes the record available as a live candidate in other panels.

---

## Phase 1: Disambiguation Panel — Open, Confirm, Unknown, Close

**User stories**: #3, #4, #5, #6, #7, #12
**Depends on**: Feature 4 Phase 2

### What to build

Clicking a narrator in the chain list opens the `NarratorDisambiguationPanel` inline below that narrator's card. The panel lists up to 5 ranked candidates from `topMatches`, each showing: Arabic name, transliterated name, death year, generation, reliability grade, and match score indicator. A "تأكيد" button next to each candidate calls `confirmMatch(position, narratorId)`, sets `userOverride: true`, and closes the panel. A "راوٍ غير معروف" button calls `confirmMatch(position, null)` and closes the panel. A close (X) button closes the panel with no change. Confirmed narrators immediately show a distinct visual indicator (checkmark or border) on their chain view card. Re-clicking a confirmed narrator reopens the panel showing the current selection highlighted.

### Acceptance criteria

- [ ] Clicking a narrator card opens the disambiguation panel inline with up to 5 ranked candidates
- [ ] Each candidate shows: Arabic name, transliterated name, death year, generation, reliability grade
- [ ] Clicking "تأكيد" on a candidate confirms the selection, sets `userOverride: true`, and closes the panel
- [ ] Confirmed selections persist in `hadith-narrator-extraction` localStorage
- [ ] Clicking "راوٍ غير معروف" sets `selectedId: null, userOverride: true` and closes the panel
- [ ] Only one panel is open at a time — opening a second closes the first
- [ ] Confirmed narrator cards show a visual distinction from auto-matched cards
- [ ] Re-opening a panel for a confirmed narrator highlights the currently selected candidate

### Manual QA plan

1. **Open panel**: Click any narrator card. **Expected**: disambiguation panel appears below the card with ranked candidates.
2. **Candidate details**: Inspect each candidate. **Expected**: Arabic name, transliteration, death year (or "غير معروف"), generation label, reliability grade all visible.
3. **Confirm selection**: Click "تأكيد" on the second candidate. **Expected**: panel closes; the narrator card shows a confirmed visual indicator (checkmark or distinct border).
4. **Persist across reload**: Confirm a narrator, refresh. **Expected**: the confirmed selection is still shown; `userOverride: true` in localStorage.
5. **Unknown**: Click "راوٍ غير معروف". **Expected**: panel closes; narrator card shows the unknown/muted style with "?" indicator.
6. **Single panel**: Open two narrators in sequence. **Expected**: the second panel opens and the first closes automatically.
7. **Re-open confirmed**: Click a confirmed narrator. **Expected**: panel opens with the currently confirmed candidate highlighted.

---

## Phase 2: Summary Banner + Guided Step-Through

**User stories**: #1, #2
**Depends on**: Phase 1

### What to build

A summary banner renders above the narrator list. It shows the count of unresolved narrators (those with `userOverride: false` AND confidence < 0.6 or ambiguous flag) and a "راجع الآن" button. Clicking the button sets `guidedIndex` to the first flagged narrator's position and opens that narrator's panel. While in guided mode, the panel shows Next and Previous buttons that step through flagged narrators without closing the panel. After a confirmed selection in guided mode, the panel auto-advances to the next flagged narrator. The banner count updates reactively as narrators are resolved. The banner is hidden when all narrators are resolved.

### Acceptance criteria

- [ ] A summary banner appears above the narrator list showing the count of unresolved/flagged narrators
- [ ] The banner is hidden when all narrators have `userOverride: true` or high confidence
- [ ] "راجع الآن" opens the panel for the first flagged narrator in guided mode
- [ ] In guided mode, the panel shows Next and Previous navigation buttons
- [ ] Confirming a narrator in guided mode auto-advances to the next flagged narrator
- [ ] Previous steps back to the previously reviewed narrator
- [ ] Guided mode ends when the user reaches the last flagged narrator and advances, or closes the panel
- [ ] Banner count decrements in real-time as narrators are confirmed

### Manual QA plan

1. **Banner count**: After extraction with flagged narrators, verify the banner shows the correct count (e.g., "٢ رواة غير محددين").
2. **Guided flow**: Click "راجع الآن". **Expected**: first flagged narrator's panel opens with Next/Prev buttons visible.
3. **Auto-advance**: Confirm the first narrator. **Expected**: panel automatically moves to the next flagged narrator without closing.
4. **Previous**: Navigate forward, then click Previous. **Expected**: returns to the previous narrator in the flagged sequence.
5. **Banner hides**: Resolve all flagged narrators. **Expected**: banner disappears.
6. **Count decrements**: Confirm one narrator. **Expected**: banner count decreases by one immediately.

---

## Phase 3: Custom Narrator Add Form + Persistence

**User stories**: #8, #9, #10, #11
**Depends on**: Phase 1

### What to build

An "إضافة راوٍ جديد" option at the bottom of the disambiguation panel (below "راوٍ غير معروف") opens an inline form within the panel. The candidate list and other actions are hidden while the form is visible. The form collects: Arabic name (required), transliterated name (required), death year (optional), generation (required), reliability grade (required). Saving calls `useCustomNarrators.add()`, generating a `custom-` prefixed ID, writes to `hadith-custom-narrators` in localStorage, confirms the current slot with the new record's ID, and closes the panel. The custom record immediately appears as a candidate in other narrators' disambiguation panels within the same session. Cancel returns to the candidate list without saving.

### Acceptance criteria

- [ ] An "إضافة راوٍ جديد" button appears at the bottom of the disambiguation panel
- [ ] Clicking it shows an inline form; the candidate list is hidden while the form is open
- [ ] The form collects Arabic name, transliterated name, death year (optional), generation, reliability grade
- [ ] Submitting a valid form creates a record with a `custom-` prefixed ID in `hadith-custom-narrators` localStorage
- [ ] The new record immediately confirms the current slot (`selectedId = custom-xxx, userOverride: true`)
- [ ] The new custom record appears as a candidate in other narrators' panels opened in the same session
- [ ] Custom records persist in `hadith-custom-narrators` across page reloads
- [ ] Cancel on the form returns to the candidate list without saving

### Manual QA plan

1. **Open add form**: Click "إضافة راوٍ جديد". **Expected**: candidate list hides; form fields appear for name, transliteration, death year, generation, reliability grade.
2. **Required fields**: Submit with Arabic name empty. **Expected**: validation error; form does not submit.
3. **Save**: Fill all required fields, click Save. **Expected**: panel closes; narrator card shows confirmed indicator with the custom record's name.
4. **Custom record in localStorage**: Open DevTools → Local Storage → `hadith-custom-narrators`. **Expected**: the new record appears with a `custom-` prefixed ID.
5. **Reuse in another panel**: Open a different narrator's panel. **Expected**: the just-added custom narrator appears as a candidate in the candidate list.
6. **Persist across reload**: Add a custom narrator, refresh. **Expected**: `hadith-custom-narrators` still contains the record; it is available in disambiguation panels.
7. **Cancel**: Click "إضافة راوٍ جديد", fill some fields, click Cancel. **Expected**: form hides; candidate list reappears; no record written to localStorage.
