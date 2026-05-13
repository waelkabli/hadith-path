# Phases: Narrator Database — Bundled JSON from Dorar.net + User-Added Records in localStorage

> Source spec: .specs/narrator-database/spec.md

## Architectural Decisions

- **DB loading**: `getNarratorDatabase(): Promise<NarratorRecord[]>` fetches `/data/narrators.json` once per page lifetime and caches the result at module level. No re-fetch unless the previous attempt failed.
- **Unified hook**: `useNarratorDatabase()` merges bundled + custom records and is the sole source of `NarratorRecord[]` for all callers. Replaces the manual merge pattern from Features 4–5.
- **Custom records**: `hadith-custom-narrators` in localStorage — same schema, `custom-` prefixed IDs. Managed by `useCustomNarrators` (introduced in Feature 5, expanded here with edit + delete).
- **Scraping script**: in-repo Bun script under `scripts/`. Not shipped. Output committed as `/public/data/narrators.json`.
- **Schema**: `NarratorRecord` as defined in the narrator-database spec is the canonical reference for all features.
- **Management screen**: accessible from the app header settings area alongside the API key section. No separate route.

---

## Phase 1: DB Module + Fixture + `useNarratorDatabase` Hook

**User stories**: #1, #2
**Depends on**: Feature 4 Phase 2

### What to build

Create `getNarratorDatabase()` — a module-level cached fetch of `/public/data/narrators.json`. The bundled JSON starts as the development fixture (the ~10-narrator array from Feature 4, promoted into a valid bundled JSON file with the `meta` envelope: `{ meta: { generatedAt, recordCount, source }, narrators: [...] }`). Create `useNarratorDatabase()`, which calls `getNarratorDatabase()` on mount and merges the result with `useCustomNarrators().customNarrators`. Wire all callers — `matchNarrators` in Feature 4 and the disambiguation panel in Feature 5 — to use the hook's `records` array instead of their local merge logic. `isLoading` is true during the initial fetch; `error` is set if the fetch fails (callers fall back to custom records only with a warning banner).

### Acceptance criteria

- [ ] `getNarratorDatabase()` fetches `/data/narrators.json` exactly once per page load; subsequent calls return the cached result
- [ ] `useNarratorDatabase()` returns the merged array of bundled + custom records
- [ ] `isLoading` is true during the fetch and false after
- [ ] Adding a custom narrator via `useCustomNarrators.add()` updates `records` without re-fetching the bundled DB
- [ ] If the fetch fails, `error` is set and `records` contains only custom records
- [ ] Feature 4's `matchNarrators` and Feature 5's disambiguation panel use the hook's records (manual merge pattern removed)

### Manual QA plan

1. **Single fetch**: Open DevTools → Network, load the app. **Expected**: exactly one request to `/data/narrators.json` on initial load; navigating between sections produces no additional requests.
2. **Merged records**: Open the disambiguation panel. **Expected**: candidates include both fixture records and any previously added custom records.
3. **isLoading**: Add a network throttle in DevTools, reload. **Expected**: a loading state is visible in the narrator list while the fetch is in progress.
4. **Fetch failure**: Block `/data/narrators.json` in DevTools, reload. **Expected**: error banner appears; disambiguation panels show only custom records (if any); no crash.
5. **Custom merge**: Add a custom narrator (Feature 5), then open a different narrator's panel. **Expected**: the custom record appears in the candidate list alongside fixture records.

---

## Phase 2: Custom Narrator Management Screen

**User stories**: #3, #4, #5, #6, #7
**Depends on**: Phase 1, Feature 5 Phase 3

### What to build

Add a "قاعدة الرواة" section to the app header settings area (alongside the API key section from Feature 2). This section shows: a metadata row with bundled DB record count and `meta.generatedAt` date, and a list of all custom narrator records. Each record row shows Arabic name, transliterated name, death year, generation, reliability grade, and Edit + Delete action buttons. Edit expands an inline form pre-filled with the record's current values (same five editable fields as the add form in Feature 5); only one row can be in edit mode at a time. Saving calls `useCustomNarrators.update()`. Delete shows an inline confirmation row; if the record's ID appears as `selectedId` in the active session's `hadith-narrator-extraction`, an additional Arabic warning line is shown before confirmation. Confirming calls `useCustomNarrators.remove()`. Deleting a record that is currently selected does not cascade — dangling references render as "راوٍ غير معروف" in the chain view at render time.

### Acceptance criteria

- [ ] The settings area has a "قاعدة الرواة" section showing bundled DB metadata (count + last updated date)
- [ ] The section lists all custom narrator records with their key fields and Edit/Delete buttons
- [ ] An empty-state message is shown when no custom records exist
- [ ] Clicking Edit on a record expands an inline form pre-filled with current values; opening a second collapses the first
- [ ] Saving an edit calls `update()` and reflects the change immediately in the list
- [ ] Cancel on edit collapses the form without saving
- [ ] Delete shows an inline confirmation; deleting a currently-selected narrator shows the additional warning line
- [ ] Confirmed delete removes the record from `hadith-custom-narrators`; the narrator list re-renders immediately
- [ ] A deleted narrator that was `selectedId` in the active session renders as unknown in the chain view (no crash, no write-back)

### Manual QA plan

1. **Open DB section**: Click gear icon → navigate to "قاعدة الرواة" section. **Expected**: bundled DB metadata row shows record count and a date; custom records list below it.
2. **Empty state**: Open the section before adding any custom records. **Expected**: a message like "لا توجد سجلات مخصصة" is shown.
3. **Edit flow**: Click Edit on a custom record, change the Arabic name, Save. **Expected**: the list updates immediately with the new name; the form collapses.
4. **Cancel edit**: Click Edit, change a field, click Cancel. **Expected**: form collapses; original values are shown unchanged.
5. **Delete without session reference**: Delete a custom record that is not used in the active analysis. **Expected**: simple confirmation row; record removed on confirm.
6. **Delete with session reference**: Confirm a narrator using a custom record, then delete that custom record from the management screen. **Expected**: the additional Arabic warning appears; after confirming deletion, the narrator card in the chain view shows the unknown style.
7. **Bundled DB metadata**: Inspect the metadata row. **Expected**: record count matches the number of entries in `/data/narrators.json`; date matches `meta.generatedAt`.

---

## Phase 3: Real Dorar.net JSON + Scraping Script

**User stories**: #8
**Depends on**: Phase 1

### What to build

A Bun script in `scripts/` that crawls Dorar.net narrator pages for the top ~10,000 narrators (ranked by frequency across major collections — Sahihayn, Sunan, Muwatta). The script extracts all available `NarratorRecord` fields from Dorar.net's HTML, writes empty strings for unavailable fields (no fabrication), and outputs a valid `/public/data/narrators.json` with the `meta` envelope (`generatedAt` set to the run date, `recordCount`, `source: "dorar.net"`). Running the script and committing the output replaces the development fixture. The app requires no code changes — the module interface is unchanged.

### Acceptance criteria

- [ ] The script exists in `scripts/` and is runnable with `bun run scripts/<name>`
- [ ] Running the script produces a valid `/public/data/narrators.json` matching the `NarratorRecord` schema
- [ ] The output contains ≥ 10,000 narrator records
- [ ] The `meta` envelope is present with `generatedAt`, `recordCount`, and `source: "dorar.net"`
- [ ] Fields unavailable on Dorar.net are stored as empty strings or null (not fabricated)
- [ ] Replacing the fixture JSON with the script output requires no changes to application code

### Manual QA plan

1. **Run the script**: Execute `bun run scripts/<scraping-script>`. **Expected**: completes without unhandled errors; a `narrators.json` file is produced in `/public/data/`.
2. **Record count**: Check `meta.recordCount` in the output. **Expected**: ≥ 10,000.
3. **Schema validation**: Load the JSON in the app. **Expected**: no runtime errors; narrator matching works for common well-known narrators.
4. **Known narrator check**: Search the output for a well-known narrator (e.g., Imam al-Bukhari). **Expected**: the record exists with correct `nameArabic`, `deathYear`, `generation`, and `reliabilityGrade`.
5. **No code changes**: Swap the fixture for the script output, restart the dev server, submit a hadith. **Expected**: narrator matching works with the full DB; no errors.
