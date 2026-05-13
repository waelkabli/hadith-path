# Spec: Narrator Disambiguation UI — User Can Override Auto-Matched Narrator Links

## Problem Statement

After narrator extraction (Feature 4), some narrators are auto-matched with high confidence and need no attention. But others — common names like `عبد الله`, lightly documented narrators, or names spelled inconsistently across sources — are matched with low confidence or flagged as ambiguous. Without a way to resolve these, the chain visualization and reliability assessment are built on uncertain or wrong identifications. The user also has no recourse when a narrator simply does not exist in the database.

## Solution

A disambiguation panel opens inline when the user clicks any narrator in the chain view. It shows up to five ranked candidates from the database with compact identifying details, with an option to expand each candidate to its full profile. The user selects the correct match, marks the narrator as unknown, or adds a new custom narrator record on the spot. A summary banner above the chain view counts unresolved narrators and offers a guided step-through mode so the user can resolve all flagged narrators in sequence without hunting for them. Custom narrator records are stored in localStorage across sessions and immediately available as match candidates for future disambiguation.

## User Stories

1. As a researcher, I want to see how many narrators in the chain are unresolved or flagged, so I know how much manual review is needed.
2. As a researcher, I want a guided "review flagged" mode that walks me through unresolved narrators one by one, so I do not have to find them manually.
3. As a researcher, I want to click any narrator in the chain to open a disambiguation panel, so I can review or change any match at any time — not just flagged ones.
4. As a researcher, I want to see up to five ranked candidates in the panel, each showing Arabic name, transliterated name, death year, generation, and reliability grade, so I have enough information to identify the narrator quickly.
5. As a researcher, I want to expand any candidate to its full profile (teachers, students, collections, bio note) without leaving the panel, so I can dig deeper when the compact view is not enough.
6. As a researcher, I want to confirm a candidate as the correct match with a single click, so the correction is applied immediately.
7. As a researcher, I want to mark a narrator as "unknown" when none of the candidates are correct, so the chain is complete without fabricating an identification.
8. As a researcher, I want to add a custom narrator record directly from the disambiguation panel when the narrator is missing from the database entirely, so I can resolve the slot without a separate workflow.
9. As a researcher, I want my custom narrator records to persist across sessions, so I do not have to re-enter them every time I open the tool.
10. As a researcher, I want custom narrators I have added to appear as candidates in future disambiguation panels, so they can be reused for other hadiths.
11. As a researcher, I want confirmed manual selections to be visually distinct from auto-matched selections in the chain view, so I can see at a glance which links I have reviewed.
12. As a researcher, I want to reopen a narrator's panel after confirming a match, so I can change my selection if I realize I was wrong.

## Acceptance Criteria

- [ ] A summary banner above the chain view shows the count of unresolved or flagged narrators, and a "راجع الآن" button that begins guided step-through
- [ ] Guided step-through opens the first flagged narrator's panel; next/previous buttons step through remaining flagged narrators without closing the panel
- [ ] Clicking any narrator in the chain (flagged or not) opens its disambiguation panel inline; only one panel is open at a time
- [ ] The panel lists up to 5 ranked candidates with: Arabic name, transliterated name, death year, generation, reliability grade, and current match score
- [ ] Each candidate has a "▼ عرض التفاصيل" toggle that expands to show teachers, students, collections, and bio note
- [ ] Clicking a candidate's "تأكيد" button confirms the selection, sets `userOverride: true`, and closes the panel
- [ ] A "راوٍ غير معروف" button in the panel sets `selectedId: null` with `userOverride: true` and closes the panel
- [ ] An "إضافة راوٍ جديد" option in the panel opens an inline add-narrator form
- [ ] The add-narrator form collects: Arabic name (required), transliterated name (required), death year (optional), generation (required), reliability grade (required)
- [ ] Saving the form creates a `NarratorRecord` with a `custom-` prefixed ID, writes it to `hadith-custom-narrators` in localStorage, confirms this narrator for the current slot, and closes the panel
- [ ] Custom narrator records are loaded on page load and merged into the match candidate pool
- [ ] In the chain view, auto-matched narrators and manually confirmed narrators are visually distinguished (e.g., a small user icon or border color difference on confirmed cards)
- [ ] The summary banner count updates in real-time as the user resolves narrators
- [ ] All text, labels, and form fields are in Arabic; layout is RTL

## Implementation Decisions

### Architecture & Schema

**Custom narrator storage:**

localStorage key: `hadith-custom-narrators`
Value: `NarratorRecord[]` using the same schema defined in Feature 4, with IDs always prefixed `custom-` to avoid collisions with the main DB.

Custom records persist independently of any specific hadith session. They are not cleared by `reset()` in `useNarratorExtraction`. They accumulate across sessions until the user explicitly removes them (record deletion is out of scope for v1).

**Integration with matching:**

The `matchNarrators` function from Feature 4 already accepts any `NarratorRecord[]`. The caller (`useNarratorExtraction`) is responsible for merging custom records into the database array before calling `matchNarrators`:

```
matchNarrators(extracted, [...dbNarrators, ...customNarrators])
```

When a new custom record is added mid-session (during disambiguation), it does NOT trigger a re-run of `matchNarrators` for other narrators. The new record is available as a candidate if the user opens other narrators' panels within the same session, because the panel always queries the live merged pool. An explicit "Re-match" re-run is out of scope for v1.

**Guided step-through state:**

The chain view holds `guidedIndex: number | null` in local state. `null` means not in guided mode. A number means the panel is open for the narrator at that flagged index. "Next" increments to the next flagged narrator; "Previous" decrements. Guided mode ends when the user reaches the last flagged narrator and clicks "Next", or clicks outside the panel, or clicks "إنهاء المراجعة".

### Interfaces & Contracts

**`useCustomNarrators` hook:**

```
{
  customNarrators: NarratorRecord[],
  add: (record: Omit<NarratorRecord, 'id' | 'teachers' | 'students' | 'collections'>) => NarratorRecord,
}
```

`add` generates the `custom-` prefixed ID, fills `teachers`, `students`, and `collections` with empty arrays, writes the full record to localStorage, and returns it. The hook merges with the main DB externally; it does not know about the main DB.

**`NarratorDisambiguationPanel` component** (expanded from Feature 4's brief description):

Props:
```
{
  narratorMatch: NarratorMatch,
  candidateRecords: NarratorRecord[],   // resolved from topMatches IDs + custom pool
  onConfirm: (narratorId: string | null) => void,
  onAddCustom: (record) => void,
  onClose: () => void,
  isGuided: boolean,
  hasNext: boolean,
  hasPrevious: boolean,
  onNext: () => void,
  onPrevious: () => void,
}
```

The panel owns internal state for: which candidate is expanded (`expandedId: string | null`) and whether the add-narrator form is visible (`isAdding: boolean`). All other state is lifted to the parent.

**`NarratorAddForm` component:** Rendered inside the disambiguation panel when `isAdding` is true. Collects the required fields. On submit, calls `onAddCustom` with the form data. On cancel, hides the form without clearing it. The form is not a separate route or modal — it is an inline expansion within the panel.

**`NarratorChainView` component** (updated from Feature 4):

Gains:
- A summary banner at the top showing unresolved count and "راجع الآن" button
- Per-narrator card: visual distinction between auto-matched (no decoration) and user-confirmed (`userOverride: true`) cards
- `onSelect(position)` prop that the parent uses to open the correct panel

The chain view does not render the panel itself — it signals to the parent which narrator was selected, and the parent renders the panel.

### Behavior & Interactions

**Panel open/close:**

Only one panel can be open at a time. Opening a second narrator's panel closes the first. The panel renders inline below the selected narrator's card, not in a modal. On mobile viewports (deferred), this would need adjustment; on desktop it expands in-flow.

**Candidate display:**

Candidates are listed in descending score order. The currently selected candidate (if any) is highlighted. Each candidate renders a compact row: Arabic name (bold), transliterated name, death year (or "غير معروف"), generation badge, reliability grade badge, score indicator. The "▼ عرض التفاصيل" toggle expands a section below the row showing teachers/students/collections/bio note. Expanding one candidate collapses any previously expanded one.

**Confirmation flow:**

Single click on "تأكيد" next to a candidate: calls `onConfirm(narratorId)`, closes the panel, and updates the narrator card in the chain view with the confirmed styling. In guided mode, after confirming, the panel automatically advances to the next flagged narrator without requiring the user to click "Next".

**Add-narrator form:**

Appears when the user clicks "إضافة راوٍ جديد" at the bottom of the panel (below the candidate list and "unknown" button). The candidate list and other actions are hidden while the form is visible. On save: calls `onAddCustom`, which calls `useCustomNarrators.add()`, then calls `onConfirm(newRecord.id)`, and closes the panel. On cancel: returns to the candidate list view.

**Summary banner:**

Unresolved count = narrators where `userOverride` is false AND (confidence < 0.6 OR ambiguous flag). The banner is hidden when count is 0. It shows: "٣ رواة غير محددين" (or similar) and the "راجع الآن" button. The count updates reactively as the user confirms narrators.

**Visual distinction in chain view:**

- Auto-matched (not user-reviewed): standard card style
- User-confirmed (`userOverride: true`, specific ID selected): small checkmark icon or distinct border tint
- Marked unknown (`userOverride: true`, `selectedId: null`): distinct muted style with a "?" indicator
- Flagged/unresolved (`userOverride: false`, low confidence): warning indicator per Feature 4's confidence badge

---

## Testing Decisions

**`useCustomNarrators` — unit tests:**
- `add()` generates a `custom-` prefixed ID and writes to localStorage
- `customNarrators` is populated from localStorage on mount
- Adding a second record appends; does not overwrite the first
- Records survive a simulated page reload (read from localStorage on mount)

**`NarratorDisambiguationPanel` — component tests:**
- Renders all candidates in descending score order
- Expanding a candidate shows its full profile fields
- Expanding a second candidate collapses the first
- Clicking "تأكيد" calls `onConfirm` with the correct narrator ID
- Clicking "راوٍ غير معروف" calls `onConfirm(null)`
- Clicking "إضافة راوٍ جديد" shows the add form and hides the candidate list
- Submitting the add form with required fields calls `onAddCustom` with the correct shape
- Next/previous buttons are rendered only when `isGuided` is true and `hasNext`/`hasPrevious` are true

**`NarratorChainView` (updated) — component tests:**
- Summary banner shows correct unresolved count
- Banner is hidden when all narrators are resolved
- User-confirmed narrators render with the confirmed visual indicator
- Unknown-marked narrators render with the unknown indicator

## Out of Scope

- **Custom narrator deletion:** Custom records accumulate in localStorage indefinitely. A "manage custom narrators" screen for viewing, editing, and deleting custom records is deferred to a later feature.
- **Searching the DB by name in the panel:** The panel shows the pre-ranked top 5 from the matching step. Free-text search across the full DB within the panel is deferred; the add-custom path is the escape hatch for unlisted narrators.
- **Re-matching all narrators after a custom record is added:** Only the current slot is resolved; other panels surface the new custom record as a live candidate without re-running the full pipeline. A full re-match trigger is deferred.
- **Mobile/touch-optimized panel layout:** The panel is designed for desktop in v1. Mobile layout adjustments are deferred.
- **Narrator profile linking:** Clicking a teacher or student name inside a full profile to jump to their disambiguation panel is deferred to the chain visualization feature.

## Open Questions

- Should the guided step-through skip narrators that are already auto-matched with high confidence (score ≥ 0.9) even if `userOverride` is false, or should it only step through narrators below the medium threshold?
- Should custom narrator records be exportable as part of the JSON session export (Feature 11 in RESEARCH.md), or only the `selectedId` references?

## Further Notes

This feature does not make any LLM or network calls. It is entirely local state manipulation and localStorage reads/writes.

The `candidateRecords` prop passed to `NarratorDisambiguationPanel` are the fully resolved `NarratorRecord` objects corresponding to the `topMatches` IDs in the `NarratorMatch`. The parent (or `useNarratorExtraction`) is responsible for resolving IDs to records before passing them down. The panel itself has no DB access — it only renders what it receives.

The add-narrator form fields map directly to `NarratorRecord` fields. Teachers, students, and collections are intentionally omitted from the form (empty arrays on create) because they require cross-referencing other narrator IDs — that level of data entry is impractical inline and is deferred to the custom narrator management screen.
