# Spec: Narrator Database — Bundled JSON from Dorar.net + User-Added Records in localStorage

## Problem Statement

Features 4 and 5 require a narrator database to match extracted names against, but no such database exists yet. The fixture used during development is too small to be useful in production, and there is no module that reliably merges the bundled DB with user-added custom records. Additionally, there is no way for users to manage (view, edit, or delete) the custom narrator records they have added across sessions.

## Solution

The narrator database ships as a static JSON file bundled with the app, produced by a one-time scraping script against Dorar.net covering approximately 10,000 narrators. A data-access module lazy-loads this file on first use and caches it. A `useNarratorDatabase()` hook merges the bundled records with user-added custom records and provides the unified array to all callers. A management screen in the app settings lets users view, edit, and delete their custom narrator records.

## User Stories

1. As a researcher, I want narrator matching to work against a comprehensive database of ~10,000 narrators, so that common narrators in major collections are identified automatically.
2. As a researcher, I want the app to load quickly on first open, so that the narrator database does not block the initial render.
3. As a researcher, I want to see all the custom narrator records I have added across sessions, so I can review what I have contributed.
4. As a researcher, I want to edit the basic fields of a custom narrator record (name, transliteration, death year, generation, reliability grade), so I can correct mistakes I made when adding them.
5. As a researcher, I want to delete a custom narrator record I no longer need, so my custom list stays clean.
6. As a researcher, I want a warning before deleting a custom narrator that is currently used in my active hadith analysis, so I understand the impact before confirming.
7. As a researcher, I want to see when the bundled narrator database was last updated, so I know how current the data is.
8. As a developer/maintainer, I want a scraping script that produces the bundled JSON from Dorar.net in the correct schema, so the database can be refreshed periodically without manual data entry.

## Acceptance Criteria

- [ ] The bundled narrator JSON is served as a static asset and lazy-loaded on first call to `getNarratorDatabase()`; it does not block the initial page render
- [ ] `useNarratorDatabase()` returns a merged array of bundled records and custom records from `hadith-custom-narrators` localStorage
- [ ] The hook reflects custom record additions, edits, and deletions in real-time without a page reload
- [ ] The bundled JSON contains ≥ 10,000 narrator records following the canonical `NarratorRecord` schema
- [ ] The bundled JSON includes a top-level metadata field with the date it was generated
- [ ] The management screen is accessible from the app header (same settings area as the API key)
- [ ] The management screen lists all custom narrator records with: Arabic name, transliterated name, death year, generation, reliability grade
- [ ] Each record has an edit action that opens an inline form pre-filled with the record's current values
- [ ] Saving an edit updates the record in localStorage and reflects the change immediately in the list
- [ ] Each record has a delete action with a confirmation step
- [ ] Deleting a record that is currently selected (`selectedId`) in the active session shows a warning before confirming
- [ ] After deletion, any `selectedId` references to the deleted record display as "راوٍ غير معروف" in the chain view
- [ ] The management screen shows the bundled database's generation date and total bundled record count
- [ ] The scraping script exists in the repository and produces valid JSON matching the canonical schema

## Implementation Decisions

### Architecture & Schema

**Canonical `NarratorRecord` schema** (single source of truth — all prior specs reference this):

```
NarratorRecord {
  id: string                    // bundled: opaque DB id; custom: "custom-<uuid>"
  nameArabic: string
  nameTransliterated: string
  birthYear: number | null
  deathYear: number | null
  generation: "Sahabi" | "Tabi'i" | "Tabi' al-Tabi'in" | "later"
  reliabilityGrade: string      // e.g. "ثقة", "صدوق", "ضعيف", "متروك"
  teachers: string[]            // narrator IDs
  students: string[]            // narrator IDs
  collections: string[]         // e.g. ["Bukhari", "Muslim"]
  bioNote: string
}
```

**Bundled JSON file structure:**

```
{
  "meta": {
    "generatedAt": "ISO-8601 date string",
    "recordCount": number,
    "source": "dorar.net"
  },
  "narrators": NarratorRecord[]
}
```

Served as a static asset at `/data/narrators.json`. Not imported into the JS bundle — fetched at runtime.

**Custom records:** `hadith-custom-narrators` in localStorage — `NarratorRecord[]`. Defined and managed by `useCustomNarrators` (introduced in Feature 5, expanded here with edit support).

**Database module (pure, framework-agnostic):**

`getNarratorDatabase(): Promise<NarratorRecord[]>` — fetches `/data/narrators.json` on first call, caches the result at module level, returns the cached array on all subsequent calls. This is a module-level singleton cache, not React state. If the fetch fails, it throws — the caller decides how to handle the error.

This function is the only place in the codebase that knows the JSON file's URL and shape.

**React hook (merges bundled + custom):**

`useNarratorDatabase()` returns `{ records: NarratorRecord[], isLoading: boolean, error: string | null }`. On mount it calls `getNarratorDatabase()` and merges the result with `useCustomNarrators().customNarrators`. When custom records change (add, edit, delete), the hook re-renders and the merged array updates. Bundled records are never re-fetched after the first successful load.

All callers — `matchNarrators` in Feature 4, the disambiguation panel in Feature 5 — receive their `NarratorRecord[]` from this hook. The manual merge pattern `[...dbNarrators, ...customNarrators]` in prior specs is retired in favor of this hook.

**Dangling reference handling:**

When a custom record is deleted, `hadith-custom-narrators` is updated immediately. Any `hadith-narrator-extraction` entry where `selectedId` matches the deleted record's ID is not automatically updated — the stored ID becomes a dangling reference. At render time, the chain view resolves `selectedId` against the live merged database; if the ID is not found, it renders the slot as unknown ("راوٍ غير معروف") and sets `userOverride` display to the unknown style. No write-back occurs unless the user actively re-disambiguates the slot.

**Scraping script:**

A Bun script in the repository (under a `scripts/` directory, not shipped to users). It:
1. Crawls Dorar.net narrator pages for the top ~10,000 narrators (ranked by frequency of appearance across major collections — Sahihayn, Sunan, Muwatta)
2. Extracts all `NarratorRecord` fields available from Dorar.net's HTML structure
3. Outputs a valid JSON file matching the bundled JSON structure above, with `meta.generatedAt` set to the run date
4. Is run manually by a maintainer and the output committed to the repository

Fields that Dorar.net does not provide (e.g. `bioNote` for some narrators) are stored as empty strings. The script does not attempt to infer or fabricate missing data.

### Interfaces & Contracts

**`getNarratorDatabase(): Promise<NarratorRecord[]>`** — module-level function. No parameters. Fetches once, caches forever for the page lifetime. Throws on network failure or malformed JSON.

**`useNarratorDatabase(): { records: NarratorRecord[], isLoading: boolean, error: string | null }`** — React hook. `isLoading` is true only during the initial fetch; false on all subsequent renders. `error` is set if `getNarratorDatabase()` throws; in that case `records` is an empty array (only custom records, if any).

**`useCustomNarrators` hook** (expanded from Feature 5):

```
{
  customNarrators: NarratorRecord[],
  add: (record: Omit<NarratorRecord, 'id' | 'teachers' | 'students' | 'collections'>) => NarratorRecord,
  update: (id: string, fields: Partial<Pick<NarratorRecord, 'nameArabic' | 'nameTransliterated' | 'birthYear' | 'deathYear' | 'generation' | 'reliabilityGrade'>>) => void,
  remove: (id: string) => void,
}
```

`update` and `remove` write to localStorage immediately and trigger a re-render. `remove` does not touch `hadith-narrator-extraction` — dangling reference handling is at render time.

**`CustomNarratorManager` component:** Renders the management screen. Receives no props — reads entirely from `useCustomNarrators` and displays `useNarratorDatabase().records` metadata for the bundled DB info row. Manages its own edit-form open/closed state per row.

### Behavior & Interactions

**Initial load:**

On first render of any component that calls `useNarratorDatabase()`, the fetch begins. `isLoading` is true during the fetch. The chain view and disambiguation panel show a loading skeleton. Once resolved, all consumers receive the merged array in a single re-render. Subsequent navigation within the app does not re-fetch.

**Management screen location:**

The settings area accessible from the app header contains two sections: "مفتاح API" (introduced in Feature 2) and "قاعدة الرواة" (this feature). The narrator database section shows:
- A metadata row: "قاعدة البيانات المدمجة — N راوٍ — آخر تحديث: [date]"
- A list of custom narrator records (empty state message if none added yet)
- Each record row: name fields + edit and delete action buttons

**Edit flow:**

Clicking edit on a record row expands an inline form pre-filled with the record's current editable fields. Only one record can be in edit mode at a time — opening a second collapses the first without saving. Saving calls `useCustomNarrators.update()` and collapses the form. Cancel collapses the form with no change.

**Delete flow:**

Clicking delete shows a confirmation row inline (replacing the action buttons): "حذف هذا الراوي؟ تأكيد / إلغاء". If the record's ID appears as a `selectedId` in the currently stored `hadith-narrator-extraction`, an additional warning line is shown: "هذا الراوي مُستخدم في التحليل الحالي". Confirming calls `useCustomNarrators.remove()`. Canceling collapses the confirmation row.

**Error state for DB load failure:**

If `getNarratorDatabase()` throws, `useNarratorDatabase()` sets `error` and returns an empty `records` array merged with any custom records. The disambiguation panel still functions against custom records only. An inline warning banner is shown in the chain view: "تعذّر تحميل قاعدة بيانات الرواة — المطابقة تعمل على السجلات المخصصة فقط". A retry button re-calls `getNarratorDatabase()` (which clears its cache on failure so the next call re-fetches).

---

## Testing Decisions

**`getNarratorDatabase` — unit tests (fetch mocked):**
- First call fetches and returns the parsed narrator array
- Second call returns the cached result without a second fetch
- Throws on network failure
- Throws on malformed JSON response
- Clears cache and re-fetches after a failed attempt (retry behavior)

**`useNarratorDatabase` — unit tests:**
- `isLoading` is true during fetch, false after
- `records` merges bundled + custom narrators; custom narrators appear after bundled
- Adding a custom narrator via `useCustomNarrators.add()` updates `records` without re-fetching bundled DB
- `error` is set and `records` contains only custom records when fetch fails

**`useCustomNarrators` — unit tests (expanded from Feature 5):**
- `update(id, fields)` modifies only the specified fields and persists to localStorage
- `remove(id)` removes the record from localStorage; subsequent reads do not include it
- `update` and `remove` with a non-existent ID are no-ops

**`CustomNarratorManager` — component tests:**
- Renders an empty-state message when no custom records exist
- Renders a row per custom record with correct field values
- Edit action opens the inline form pre-filled with current values
- Save calls `update` with the correct ID and changed fields
- Cancel collapses the form without calling `update`
- Delete shows the confirmation row; confirming calls `remove`
- Delete shows the additional warning line when the record is a dangling reference in the active session

**Scraping script — not unit tested.** Verified by running it and validating the output JSON against the schema using a JSON schema validator. Schema validation is documented in the script's README block.

## Out of Scope

- **Live Dorar.net data fetching at runtime:** The database is always a static bundled asset. Live fetching would break the client-side-only constraint and introduce CORS issues.
- **Automatic database update checks:** No version checking, no background refresh, no notification when a new JSON is available. Updates require a maintainer to re-run the scraping script and deploy.
- **Full narrator profile editing (teachers, students, collections):** Editing cross-referenced fields requires a separate narrator-linking UX. Deferred; only the five basic fields collected during add are editable.
- **Custom narrator import/export as a standalone file:** Exporting custom records independently of the full session JSON is deferred. Custom records are included in the full JSON session export (Feature 11).
- **Search or filter within the management screen:** The custom list is expected to be small enough to scroll. Search is deferred.
- **Narrator deduplication across bundled and custom records:** If a user adds a custom record for a narrator who exists in the bundled DB, both entries will exist. Deduplication logic is deferred.

## Open Questions

- Should the scraping script target a specific ranked list from Dorar.net (e.g., narrators sorted by number of hadiths attributed to them), or crawl all available narrator pages up to a count limit?
- Should the bundled JSON be split into multiple chunk files (e.g., by generation) to reduce the size of the initial load, or kept as a single file for simplicity?

## Further Notes

The `getNarratorDatabase()` module-level cache means the bundled DB is shared across all React trees in the same page lifetime. This is intentional — there is only one narrator database per session, and re-fetching it per component would waste bandwidth and cause flicker.

The schema definition in this spec is the canonical reference. All prior specs (F4, F5) that mention `NarratorRecord` defer to this document for the authoritative field list. If the schema changes in a future feature, this spec should be updated first and the change propagated to dependent features.

The development fixture (10 well-known narrators defined in Feature 4) is replaced by the real bundled JSON when the scraping script is run. The fixture is only used in tests that need a predictable, small dataset.
