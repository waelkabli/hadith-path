# Phases: Export — JSON (Save/Restore Session), JPG, PDF

> Source spec: .specs/export/spec.md

## Architectural Decisions

- **Export toolbar**: persistent row above the visualization area, visible once a parse result exists. Not hidden behind menus.
- **JSON schema version**: `version: 1` in the export envelope from day one. `deserializeSession` handles version mismatches with a descriptive error.
- **Import merge policy**: custom narrators from the imported JSON are appended to `hadith-custom-narrators` (deduplicated by ID); they do not replace existing custom records.
- **Raster-first**: JPG and PDF both use `html2canvas` to capture DOM sections. jsPDF's built-in text API is not used — Arabic RTL rendering is poor; all text is captured as raster via html2canvas.
- **Off-screen capture**: JPG and PDF targets are cloned into an off-screen container at 1200px width with interactive elements hidden before capture. The reactflow canvas is reset to fit-view before capture.
- **Fonts await**: `document.fonts.ready` is awaited before any html2canvas call to prevent blank text.
- **Filenames**: `hadith-session-YYYY-MM-DD.json`, `hadith-chain-YYYY-MM-DD.jpg`, `hadith-analysis-YYYY-MM-DD.pdf`.

---

## Phase 1: JSON Export + Import

**User stories**: #1, #2, #3, #10
**Depends on**: Feature 8 Phase 1 (to capture multi-variant state)

### What to build

Implement `serializeSession()` and `deserializeSession(json)` as pure functions. `serializeSession` reads current state (all variants with `rawText`, `parseResult`, `narratorExtraction`) and custom narrator records, produces a `SessionExport` object with `version: 1` and `exportedAt`. `deserializeSession` parses and validates the JSON — throws on malformed JSON, missing `version`, or unrecognized version number. Implement `exportJson()` (serializes + triggers browser download) and `importJson(file)` (reads File, calls `deserializeSession`, returns `SessionState`). The export toolbar renders JSON export and import buttons. Clicking import opens a file picker; after the user selects a file, a confirmation dialog ("استيراد هذا الملف سيستبدل جلسة العمل الحالية") appears before applying. On import, all localStorage keys are updated, custom narrators are merged (append + deduplicate by ID), and the app re-renders from the restored state.

### Acceptance criteria

- [ ] An export toolbar is visible above the visualization area once a parse result exists
- [ ] JSON export downloads a `.json` file with the correct filename and `version: 1` schema
- [ ] The exported JSON contains all variants (rawText, parseResult, narratorExtraction including userOverride selections) and custom narrator records
- [ ] Importing a JSON file shows a confirmation dialog before proceeding
- [ ] After confirmed import, the app renders the restored session identically: same split, same narrator selections, same manual corrections
- [ ] Custom narrators from the import are merged with (not replacing) existing `hadith-custom-narrators`
- [ ] Importing a malformed JSON shows "الملف غير صالح أو من إصدار غير مدعوم"
- [ ] Cancel on the confirmation dialog aborts import with no state change

### Manual QA plan

1. **Export**: Complete a full analysis (parse + narrator extraction + some manual corrections), click JSON export. **Expected**: a `.json` file downloads; open it and verify it contains `version: 1`, the hadith text, `splitAt`, `narrators` array with `userOverride` entries.
2. **Import round-trip**: Clear localStorage (`hadith-input-raw`, `hadith-parse-result`, `hadith-narrator-extraction`), then import the downloaded file. **Expected**: the app fully restores the analysis — split view, narrator list with confirmed selections, corrected boundary badge if applicable.
3. **Confirmation dialog**: Start an analysis, then import a different JSON file. **Expected**: "استيراد هذا الملف سيستبدل جلسة العمل الحالية" dialog appears; Cancel leaves current session intact.
4. **Custom narrator merge**: Have custom narrator A in the current session, import a JSON with custom narrator B. **Expected**: both A and B appear in `hadith-custom-narrators`; neither is removed.
5. **Malformed import**: Import a `.json` file with invalid JSON. **Expected**: error message "الملف غير صالح أو من إصدار غير مدعوم" is shown; no state change.
6. **Version mismatch**: Manually edit the exported JSON to set `version: 99`, re-import. **Expected**: the version mismatch error is shown.

---

## Phase 2: JPG Export

**User stories**: #4, #5, #8, #9
**Depends on**: Feature 7 Phase 1 (chain visualization must exist to capture)

### What to build

Implement `exportJpg(targetElement)`. Before capture: await `document.fonts.ready`; clone the target element into an off-screen container at 1200px width; hide all interactive elements (buttons, panels, form controls) in the clone; reset the reactflow canvas to fit-view. Call `html2canvas` on the clone at 2× pixel ratio with the app's warm off-white background color. Convert the canvas to a JPEG Blob and trigger a browser download. The target element contains the split result view (isnad + matn labeled sections) and the chain visualization. The export toolbar shows a JPG button; `useExport` manages `isExporting` and `exportError` state. An error row with retry button appears on failure.

### Acceptance criteria

- [ ] The export toolbar has a JPG button
- [ ] Clicking it shows a loading indicator while generation is in progress
- [ ] A `.jpg` file downloads with the correct filename when complete
- [ ] The exported image shows the split result view and chain diagram on an off-white background
- [ ] No browser UI chrome (buttons, panels, error messages) is visible in the exported image
- [ ] The chain visualization is captured at fit-view (full chain visible, not panned/zoomed state)
- [ ] If export fails, an inline error with a retry button is shown

### Manual QA plan

1. **Export image**: Complete an analysis, click JPG export. **Expected**: loading indicator appears; after a few seconds, a `.jpg` file downloads.
2. **Open image**: Open the downloaded JPG. **Expected**: isnad and matn sections are visible with Arabic text and correct fonts; chain diagram is visible below; no browser chrome.
3. **No interactive elements**: Verify no buttons, panels, or form controls appear in the image.
4. **Fit-view capture**: Pan and zoom the chain before exporting. **Expected**: the exported image shows the full chain (fit-view), not the panned/zoomed state.
5. **Font quality**: Inspect the Arabic text in the image. **Expected**: Thmanyah fonts are rendered correctly, not system fallback fonts.
6. **Failure**: Block html2canvas (e.g., by disabling canvas in browser settings or intercepting the call). **Expected**: error row appears with retry button; clicking retry re-attempts.

---

## Phase 3: PDF Export

**User stories**: #6, #7, #8, #9
**Depends on**: Phase 2 (reuses html2canvas capture logic)

### What to build

Implement `exportPdf(sections)`. Capture each section with html2canvas using the same off-screen clone + font-await approach from Phase 2. Assemble captured images into an A4 PDF using jsPDF: Page 1 — hadith metadata header + isnad text block + matn text block (from the split result view). Page 2 — narrator list table (Arabic name, transliterated name, death year, generation, reliability grade; one row per narrator; ordered by chain position; from the narrator list view). Page 3+ — chain diagram image. If a diff view is active (≥ 2 variants), an additional page captures the diff view. Trigger a browser download of the assembled PDF. The export toolbar has a PDF button wired to `useExport.exportPdf()`.

### Acceptance criteria

- [ ] The export toolbar has a PDF button
- [ ] Clicking it shows a loading indicator while generation is in progress
- [ ] A `.pdf` file downloads with the correct filename
- [ ] The PDF contains: isnad text section + matn text section on page 1
- [ ] The PDF contains a narrator list table on page 2 with all narrators in chain order and their key fields
- [ ] The PDF contains the chain diagram image on page 3+
- [ ] If ≥ 2 variants are loaded and the diff view has content, an additional page captures the diff view
- [ ] All Arabic text is correctly rendered (via html2canvas rasterization, not jsPDF text API)
- [ ] If export fails, an inline error with a retry button is shown

### Manual QA plan

1. **Export PDF**: Complete a full analysis, click PDF export. **Expected**: loading indicator; `.pdf` file downloads.
2. **Page 1 content**: Open the PDF. **Expected**: page 1 shows the isnad and matn sections with Arabic text in the app's fonts; layout is RTL.
3. **Page 2 narrator table**: Check page 2. **Expected**: narrator list with columns for Arabic name, transliteration, death year, generation, reliability grade; narrators in chain order.
4. **Page 3 chain diagram**: Check page 3. **Expected**: the chain visualization image is present and legible.
5. **Diff page**: Load two variants, export. **Expected**: an additional page showing the diff view is included.
6. **No interactive elements**: Verify no buttons, tooltips, or dropdowns appear in any page of the PDF.
7. **Arabic font rendering**: Zoom in on the Arabic text in the PDF. **Expected**: Thmanyah fonts render correctly; no tofu (missing glyphs) or system fallback fonts.
8. **Failure + retry**: Simulate an export failure. **Expected**: inline error appears with retry; clicking retry re-attempts the full PDF generation.
