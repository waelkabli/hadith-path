# Spec: Export — JSON (Save/Restore Session), JPG, PDF

## Problem Statement

Analysis sessions in Hadith Path are ephemeral — stored only in localStorage, tied to one browser, with no way to share results or resume work in a different environment. Researchers also need to embed visualizations in papers, presentations, or social media. Without export, completed analyses are trapped in the browser.

## Solution

Three export formats are available from a persistent export toolbar:

- **JSON**: serializes the complete session state — all variants, narrator selections, custom narrators, split corrections — into a portable file. Re-importing the JSON fully restores the session, including all manual corrections, so the user can share work or resume it in another browser.
- **JPG**: captures the chain visualization (single or multi-variant graph) and the isnad/matn split result as a single image file, suitable for sharing on social media or embedding in documents.
- **PDF**: exports the full analysis as a formatted, print-ready document — split text, narrator list with reliability grades, chain diagram, and (if loaded) the diff view.

## User Stories

1. As a researcher, I want to export my analysis as a JSON file, so I can save it and restore it later or share it with a colleague.
2. As a researcher, I want to import a JSON session file, so I can resume a shared or previously exported analysis exactly where it left off.
3. As a researcher, I want the JSON import to restore all manual corrections (split boundary, narrator selections, custom narrators), so no work is lost.
4. As a researcher, I want to export the chain visualization as a JPG image, so I can share it on social media or embed it in a presentation.
5. As a researcher, I want the JPG to be clean — no browser UI chrome, just the analysis content — so it is ready to share without cropping.
6. As a researcher, I want to export the full analysis as a PDF, so I can print it or attach it to a research document.
7. As a researcher, I want the PDF to include: the original hadith text, the isnad and matn sections, the narrator list with reliability grades, and the chain diagram, so the document is self-contained.
8. As a researcher, I want to see a loading indicator during JPG or PDF generation, since rendering can take a few seconds, so I know the export is in progress.
9. As a researcher, I want a clear error message if an export fails, so I know to try again.
10. As a researcher, I want a warning before importing a JSON file that will overwrite my current session, so I do not accidentally lose in-progress work.

## Acceptance Criteria

- [ ] An export toolbar is persistently visible (not hidden behind a menu) once at least one variant has been analyzed
- [ ] JSON export produces a valid `.json` file that downloads to the user's device
- [ ] JSON import accepts a `.json` file via a file picker; importing replaces the current session after a confirmation dialog
- [ ] After JSON import, the app renders the restored session identically to the original — same split, same narrator selections, same manual corrections
- [ ] Custom narrator records included in the JSON are merged into `hadith-custom-narrators` on import (not replacing existing custom records — appending, deduplicating by ID)
- [ ] JPG export downloads a `.jpg` file containing the chain visualization and split result, with no browser UI chrome visible
- [ ] PDF export downloads a `.pdf` file containing: hadith title (if labeled), isnad text, matn text, ordered narrator list with names and reliability grades, and the chain diagram image
- [ ] JPG and PDF exports show a loading indicator while generation is in progress
- [ ] If JPG or PDF generation fails, an inline error is shown with a retry button
- [ ] Importing a JSON file shows a confirmation dialog ("سيتم استبدال الجلسة الحالية") before proceeding
- [ ] All export actions are accessible with a single click from the export toolbar

## Implementation Decisions

### Architecture & Schema

**JSON session schema:**

```
SessionExport {
  version: number               // schema version for future compatibility; currently 1
  exportedAt: string            // ISO-8601 timestamp
  variants: VariantExport[]
  customNarrators: NarratorRecord[]
}

VariantExport {
  id: string
  label: string
  rawText: string
  parseResult: {
    inputHash: string
    llmSplitAt: number
    splitAt: number
    corrected: boolean
  } | null
  narratorExtraction: {
    inputHash: string
    narrators: NarratorMatch[]
  } | null
}
```

`NarratorMatch` is the full shape from Feature 4, including `userOverride` and `selectedId`. All manually confirmed selections and "unknown" marks are preserved.

**`serializeSession(): SessionExport`** — pure function. Reads current state (passed as arguments, not read from localStorage directly) and produces the export object.

**`deserializeSession(json: string): SessionState`** — pure function. Parses and validates the JSON against the schema. Throws with a descriptive error if the JSON is malformed or the version is unrecognized.

**JPG generation:**

Uses `html2canvas` to capture a DOM element containing:
1. The split result view (isnad section + matn section, styled per DESIGN_GUIDE)
2. The chain visualization (reactflow canvas rendered to a static snapshot)

The target element is rendered in an off-screen container at a fixed width (1200px) with the app's RTL layout and fonts applied, so the output is consistent regardless of the user's viewport size. Background is set to the app's warm off-white base color.

**PDF generation:**

Uses `html2canvas` to capture sections individually, then assembles them into a PDF using `jsPDF`:
1. Page 1: hadith metadata header + isnad text block + matn text block
2. Page 2: narrator list table (Arabic name, transliterated name, death year, generation, reliability grade) — one row per narrator, ordered by chain position
3. Page 3+: chain diagram image (from the same html2canvas capture as the JPG export)

If a diff view is loaded (≥ 2 variants), an additional page captures the diff view.

PDF page size: A4. RTL text blocks are rendered via html2canvas (preserving the app's Arabic font rendering) rather than jsPDF's built-in text API, which has poor RTL support.

### Interfaces & Contracts

**`exportJson(session: SessionExport): void`** — serializes to a JSON string, creates a Blob, triggers a browser download with filename `hadith-session-<date>.json`.

**`importJson(file: File): Promise<SessionState>`** — reads the file, calls `deserializeSession`, returns the validated `SessionState`. Throws on parse failure or version mismatch.

**`exportJpg(targetElement: HTMLElement): Promise<void>`** — calls `html2canvas` on the target element at 2× pixel ratio, produces a JPEG Blob, triggers download with filename `hadith-chain-<date>.jpg`.

**`exportPdf(sections: ExportSections): Promise<void>`** — captures each section with `html2canvas`, assembles via `jsPDF`, triggers download with filename `hadith-analysis-<date>.pdf`.

```
ExportSections {
  splitView: HTMLElement
  narratorList: HTMLElement
  chainDiagram: HTMLElement
  diffView: HTMLElement | null
}
```

**`useExport` hook:**
```
{
  exportJson: () => void,
  importJson: (file: File) => Promise<void>,
  exportJpg: () => Promise<void>,
  exportPdf: () => Promise<void>,
  isExporting: boolean,       // true during any async export
  exportError: string | null,
}
```
The hook owns `isExporting` and `exportError` state. All four export actions set `isExporting: true` while in progress and clear it when done (or on error).

**`ExportToolbar` component:** Renders four buttons (JSON export, JSON import, JPG, PDF). Import uses a hidden `<input type="file" accept=".json">`. Shows a spinner overlay when `isExporting` is true. Shows an inline error row when `exportError` is set.

### Behavior & Interactions

**Export toolbar placement:**

The toolbar is a fixed row above the visualization area, visible once `variants.length ≥ 1` and a parse result exists. It does not appear during the initial input-only state.

**JSON import confirmation:**

Before applying the imported session, a confirmation dialog appears: "استيراد هذا الملف سيستبدل جلسة العمل الحالية. هل تريد المتابعة؟" with Confirm and Cancel. On Confirm:
1. The current session state is replaced by the imported `SessionState`.
2. Custom narrators from the import are merged into `hadith-custom-narrators`: existing records with the same ID are kept (not overwritten); new IDs are appended.
3. All localStorage keys are updated to reflect the imported state.
4. The app re-renders from the restored state.

**JPG off-screen rendering:**

The target element is cloned into an off-screen container before capture to avoid capturing loading states, open panels, or interactive controls. The clone has all interactive elements hidden (buttons, panels, form controls).

**Error handling:**

`html2canvas` and `jsPDF` failures (e.g., cross-origin font loading issues) surface as `exportError` strings. The retry button re-calls the same export function. JSON import failures (malformed JSON, wrong version) show a specific message: "الملف غير صالح أو من إصدار غير مدعوم".

**Filename convention:** `hadith-session-YYYY-MM-DD.json`, `hadith-chain-YYYY-MM-DD.jpg`, `hadith-analysis-YYYY-MM-DD.pdf`. Date is local date at time of export.

---

## Testing Decisions

**`serializeSession` — unit tests (pure function):**
- Output contains all variants with rawText, parseResult, and narratorExtraction
- `userOverride: true` narrator selections are preserved in the output
- Custom narrator records are included in the output
- `version: 1` is always present

**`deserializeSession` — unit tests (pure function):**
- Valid JSON produces the correct `SessionState`
- Missing `version` field throws
- Unknown version number throws with a descriptive message
- Malformed JSON throws

**`importJson` — unit tests (File API mocked):**
- Valid session file returns the correct `SessionState`
- Invalid file triggers the error message

**`useExport` — unit tests:**
- `isExporting` is true during async operations and false after completion
- `exportError` is set when an export function throws
- `exportJson` triggers a browser download (mocked)
- `importJson` with a valid file updates session state and merges custom narrators correctly

**`exportJpg` and `exportPdf` — not unit tested** (html2canvas and jsPDF are hard to test without a real DOM). Verified manually: download triggers, file opens correctly, content matches expected layout.

## Out of Scope

- **Cloud save / server-side storage:** JSON export is the only persistence mechanism beyond localStorage. No cloud sync, no user accounts.
- **Sharing a live link:** Deferred. The JSON file is the share artifact; a URL-based share requires a server.
- **Custom narrator records as a standalone export file:** Included in the JSON session export. A dedicated "export only custom narrators" action is deferred.
- **SVG export of the chain diagram:** The chain diagram is captured via html2canvas (rasterized). SVG vector export is deferred.
- **PDF with embedded Arabic text (as selectable text vs. image):** The PDF uses html2canvas rasterization throughout due to jsPDF's poor RTL text support. Selectable Arabic text in the PDF is deferred.
- **Batch export of multiple sessions:** One session per export. Multi-session management is out of scope for v1.

## Open Questions

- Should the JSON export include the bundled narrator DB record snapshots for each selected narrator (so the import is fully self-contained even if the bundled DB changes), or only the IDs (relying on the DB being present at import time)?
- Should there be a file size limit on JSON imports to guard against malicious or accidentally large files?

## Further Notes

The `html2canvas` library requires the app's Arabic fonts to be loaded before capture. The capture function should explicitly wait for `document.fonts.ready` before calling `html2canvas`, to avoid blank or system-font text in the output.

reactflow renders its canvas as an SVG inside a `<div>`. `html2canvas` can capture this correctly, but zoom/pan state must be reset to the default (fit-to-view) before capture so the exported image shows the full chain, not whatever the user has panned to.

The `version` field in the JSON schema is the first defense against breaking changes. If the schema changes in a future feature, increment `version` and update `deserializeSession` to handle both old and new shapes. This spec defines version 1 as the initial schema.
