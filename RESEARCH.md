# Hadith Path — Research & Design Brief

> This document exists so a future implementation agent understands every decision made during the design phase, including the *why* behind each choice. Do not deviate from these decisions without explicit user instruction.

---

## What Is Hadith Path?

Hadith Path is a **client-side web tool** for analyzing Islamic hadiths. Think of it like a JSON formatter or a code beautifier — but purpose-built for hadith text. A user pastes raw Arabic hadith text and the tool:

1. **Parses and separates the isnad** (chain of narrators) from the matn (the hadith body text)
2. **Identifies each narrator** in the chain and links them to biographical profiles
3. **Visualizes the narrator chain** as an interactive diagram
4. **Compares multiple variants** of the same hadith with a word-level diff view (like Word's track changes)

The tool is purely client-side — no backend, no user accounts, no server. It behaves like a formatter utility scattered on the internet.

---

## Core Decisions & Rationale

### 1. Language
- **Input language: Arabic only**
- The tool targets authentic Arabic hadith text, not translations
- Narrator names are displayed in both Arabic script and transliterated form in the UI for accessibility

---

### 2. Input
- **Text-only paste input**
- No PDF, image, OCR, or file upload support in v1
- Users copy and paste text from any source (Sunnah.com, IslamWeb, Shamela, etc.)
- The tool must normalize Arabic text (handle inconsistent spacing, diacritics, encoding) before parsing

---

### 3. Isnad / Matn Boundary Detection
- **Fully automated** using an LLM (see §6)
- The system detects where the isnad ends and the matn begins (transition phrases like `قال`, `أن النبي ﷺ`, etc.)
- A **manual correction editor** is provided as a fallback — users can visually drag or click to reassign which segment is the isnad and which is the matn
- Rationale: no parser is 100% accurate across all collections; the editor prevents user frustration and can be used to refine edge cases

---

### 4. Narrator Extraction & Disambiguation
- The LLM extracts individual narrator names from the isnad
- Each extracted name is matched against the narrator database (see §5) with a **confidence score**
- Ambiguous matches are flagged (e.g., `عبد الله` could be Ibn ʿUmar or Ibn ʿAbbas)
- **Users can manually correct any narrator link** — overriding what the system auto-selected
- Rationale: same name maps to multiple historical persons; automatic disambiguation alone is too error-prone for scholarly use

---

### 5. Narrator Database

#### Primary Source: Dorar.net (الدرر السنية)
- Data is **pre-scraped and bundled as a JSON file** shipped with the app
- Covers the most important/famous narrators (Sahaba, major Tabi'in, narrators in Sahihayn, etc.)
- This is a static asset — updated periodically as a maintenance task, not fetched live
- Rationale: Dorar.net has no public API; live fetching would require a CORS proxy (breaks client-side constraint); a bundled JSON gives instant offline lookups

#### Secondary Source: User-Provided Manual Data
- Users can manually add narrator records that are missing from the bundle
- This data is stored in **localStorage** only — it is private to that browser session
- There is no community contribution, no data sync, no sharing of custom narrator records
- Rationale: the tool is designed to behave like a client-side utility, not a collaborative platform

#### Narrator Record Schema (Standard Tier)
Each narrator record contains:
```json
{
  "id": "string",
  "nameArabic": "string",
  "nameTransliterated": "string",
  "birthYear": "number | null",
  "deathYear": "number | null",
  "generation": "Sahabi | Tabi'i | Tabi' al-Tabi'in | ...",
  "reliabilityGrade": "ثقة | صدوق | ضعيف | متروك | ...",
  "teachers": ["narrator_id", "..."],
  "students": ["narrator_id", "..."],
  "collections": ["Bukhari", "Muslim", "..."],
  "bioNote": "string"
}
```
- Reliability grade (jarh wa ta'dil) is a first-class field — it is the scholarly purpose of studying the isnad

---

### 6. Parsing Engine — LLM-Powered

- The isnad parser and narrator extractor are powered by an **LLM API**
- **Supported providers:** Google Gemini, OpenAI, Anthropic Claude
- **Users provide their own API key** — stored in `localStorage`, never sent to any server
- The app owner pays nothing; each user is responsible for their own API usage
- Gemini is the recommended default because Google AI Studio offers a **free tier** (15 req/min, no credit card)
- A settings panel lets users switch providers and enter their key

#### Why LLM over rule-based NLP?
- Isnad parsing is a structured extraction task — exactly what LLMs do well
- Rule-based Arabic NLP (CAMeL Tools, Farasa) would require months of engineering and still fail on edge cases
- LLM cost per parse is negligible (hadiths are short texts)
- The failure modes of LLMs are easier to correct via the manual editor (§3)

---

### 7. Platform
- **Web app only** — no desktop app, no mobile app, no Electron wrapper in v1
- No backend server, no database, no authentication
- All state lives in the browser (`localStorage` / `IndexedDB`)
- Rationale: client-side-only matches the "formatter utility" mental model; easier to deploy and iterate

---

### 8. Users & Storage
- **Anonymous multi-user** — no accounts, no login
- Each browser is its own isolated environment
- Data that persists across sessions:
  - User's API key(s) — `localStorage`
  - Custom narrator additions — `localStorage`
  - Saved hadith sessions (via JSON import/export) — see §10

---

### 9. Variant Comparison & Diff View

#### How Variants Are Provided
- **Fully manual** — the user pastes each version of the hadith they want to compare
- The system does not auto-fetch variants from any database
- Rationale: aligns with client-side-only constraint; keeps v1 scope manageable

#### Diff Granularity
- **Word-level diff only**
- Text is normalized (diacritics stripped) before comparison to avoid false positives from inconsistent vocalization
- Original text with diacritics is preserved in the display — only the comparison logic strips them
- Additions, deletions, and substitutions are color-coded (standard track-changes convention)

#### Diff View Layout
- **Inline by default** (unified diff — all versions overlaid with color markers, like Git's unified view)
- **Toggle to side-by-side** (each version in its own column, useful for longer matns)
- Both views are available; user switches between them

---

### 10. Isnad Visualization

#### Single Hadith
- Displayed as a **horizontal RTL flow** — narrators rendered right-to-left in a chain with connecting arrows
- Mirrors how scholars traditionally draw isnads on paper
- Each narrator node is clickable → opens the narrator profile card (§5)

#### Multiple Variants
- When more than one hadith version is loaded, the visualization switches to a **tree/graph**
- Branching points show where chains diverge between versions
- This makes the comparison structurally visible at a glance

---

### 11. Export Formats

| Format | Purpose |
|--------|---------|
| **JSON** | Save and restore full app state — parsed hadith, narrator links, user corrections, variant versions. Re-importing the JSON re-renders everything exactly as left. Acts as the "save file." |
| **JPG** | Export the visual components (isnad chain diagram, narrator cards) as a clean image for sharing on social media or embedding in documents |
| **PDF** | Export all visuals and content to a print-ready document |

---

### 12. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React + TypeScript |
| Styling | Tailwind CSS (RTL utilities via `dir="rtl"`) |
| Build tool | Vite |
| State | React state + `localStorage` / `IndexedDB` |
| LLM calls | Fetch directly from browser to LLM provider APIs |
| Diff engine | Custom word-level diff (or `diff-match-patch` library) |
| Visualization | React-based SVG or a lightweight graph library (e.g., `reactflow`) |
| PDF/JPG export | `html2canvas` + `jsPDF` |

---

## Design Philosophy: Deep Modules

Hadith Path must follow **deep module design** — a principle where each module has a **small, simple interface that hides a large, complex implementation**. The opposite (shallow modules: large interfaces, little logic inside) must be actively avoided.

This philosophy was chosen for two reasons:
1. It makes the codebase dramatically easier to maintain as complexity grows
2. It makes AI agents more effective when working in this repo — a small surface area means an agent can understand and use a module without reading its internals

### The Three Questions

Before finalizing any module, component, or function signature, ask:

1. **Can we reduce the number of methods/exports?**
   - If a module exposes 10 functions but callers only ever need 2, consolidate
   - Prefer one well-named function over three that compose a workflow the caller shouldn't have to orchestrate

2. **Can we simplify the parameters?**
   - Prefer passing a single structured object over many positional arguments
   - If a caller must know internal details to construct valid arguments, the abstraction is leaking
   - Parameters should represent *intent*, not *mechanism*

3. **Can we hide more complexity inside?**
   - Normalization, retry logic, prompt engineering, error recovery — none of this should be the caller's problem
   - The caller says *what* they want; the module figures out *how*

### Concrete Examples for This Codebase

| Shallow (avoid) | Deep (prefer) |
|-----------------|---------------|
| `stripDiacritics(text)`, `tokenize(text)`, `diffTokens(a, b)` exposed separately | Single `compareMatn(variantA, variantB): DiffResult` that handles normalization and tokenization internally |
| `callGemini(prompt, key)`, `callOpenAI(prompt, key)`, `callClaude(prompt, key)` all exposed | Single `parseSanad(hadithText): ParsedHadith` — caller never knows which LLM was used |
| `extractNames(isnad)`, `matchToDatabase(names)`, `scoreConfidence(matches)` as separate calls | Single `resolveNarrators(isnad): NarratorMatch[]` — extraction, matching, and scoring are internal |

### Rule for AI Agents Working in This Repo

When adding a new feature: implement it fully inside the relevant module and expose the smallest possible interface. If you find yourself writing glue code in a component that coordinates multiple service calls, that glue belongs inside a service, not in the component.

---

## What This Tool Is NOT (v1 Scope Limits)

- Not a hadith search engine
- Not a collaborative platform — no sharing, no community contributions
- Not a translation tool
- Not a PDF/image input processor — text paste only
- Not fetching live data from any external source at runtime (except LLM API calls)
- Not authenticating users or storing anything server-side

---

## Open Implementation Questions (for the builder)

1. **Dorar.net scraping:** The narrator JSON bundle needs to be built before the app ships. Decide on the schema above and write a one-time scraping script. Scope: top ~10,000 narrators by frequency of appearance across major collections.

2. **LLM prompt design:** The isnad extraction prompt needs careful engineering. It must return structured JSON (narrator list, matn text, boundary index). Include few-shot examples of diverse isnad formats in the system prompt.

3. **CORS for LLM APIs:** All three providers (Gemini, OpenAI, Claude) support direct browser calls with an API key. No proxy needed.

4. **RTL layout:** The entire app must be RTL-first. Use `<html dir="rtl">` globally and test all components in RTL.

5. **Diacritics normalization:** Build a utility function `normalizeArabic(text: string): string` that strips tashkeel for comparison but is never used for display.
