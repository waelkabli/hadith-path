# Phases: Isnad Chain Visualization — Horizontal RTL Flow with Clickable Narrator Nodes

> Source spec: .specs/isnad-chain-visualization/spec.md

## Architectural Decisions

- **Rendering engine**: reactflow with dagre layout (`rankdir: 'RL'`) for right-to-left horizontal flow.
- **Data separation**: `buildChainGraph(narrators, records)` is a pure function that produces logical node/edge data. Dagre layout (pixel coordinates) runs inside `IsnadChainView` after graph construction — `buildChainGraph` is layout-agnostic.
- **Node states**: auto-matched (no decoration), user-confirmed (checkmark/border), flagged (warning indicator), unknown (muted "?" placeholder). State derived from `NarratorMatch.userOverride` and `selectedId`.
- **Bio card**: `NarratorBioCard` is read-only. It is distinct from `NarratorDisambiguationPanel` (Feature 5) which has edit affordances. The parent holds `selectedNarratorId` and renders the card; the graph signals clicks upward via `onNodeClick`.
- **Conditional render**: `IsnadChainView` is rendered only when exactly one variant is loaded. When ≥ 2 variants exist, it is replaced by `VariantChainView` (Feature 8).

---

## Phase 1: Linear RTL Chain with Node States and Reliability Colors

**User stories**: #1, #2, #7, #8
**Depends on**: Feature 4 Phase 2, Feature 6 Phase 1

### What to build

Implement `buildChainGraph(narrators, records)` and `IsnadChainView`. The graph renders as a horizontal reactflow canvas with dagre `rankdir: 'RL'`. Each narrator becomes a node showing their Arabic name and a reliability grade color indicator (green/yellow-green/orange/red/gray per the grade). Node visual state reflects `matchState`: auto-matched (standard), user-confirmed (distinct border or checkmark), flagged (warning icon), unknown (muted placeholder node with "?" label). Directed edges connect narrators in transmission order. Pan and zoom are enabled via reactflow's built-in controls (zoom range 0.25×–2×).

### Acceptance criteria

- [ ] The chain renders as a right-to-left horizontal reactflow graph
- [ ] Each narrator node shows their Arabic name and a reliability grade color indicator
- [ ] Directed edges connect narrators in chain order (right = earlier, left = later)
- [ ] Node states are visually distinct: auto-matched, user-confirmed, flagged, unknown
- [ ] Unknown narrators render as muted placeholder nodes with "?" label
- [ ] Pan (drag) and zoom (scroll) work on the graph
- [ ] The visualization appears below the split result view and narrator list

### Manual QA plan

1. **RTL direction**: Submit a hadith and complete extraction. **Expected**: the chain flows right-to-left — earliest narrator (e.g., the Prophet ﷺ) at the far right, collector at the far left.
2. **Reliability colors**: Verify node colors match the spec: ثقة=green, ضعيف=orange, etc.
3. **Unknown node**: Use a hadith where one narrator is unresolved. **Expected**: a muted "?" placeholder node appears in the correct chain position.
4. **Confirmed state**: Confirm a narrator via Feature 5, then view the chain. **Expected**: the corresponding node shows the confirmed visual indicator.
5. **Pan/zoom**: Pan the graph by dragging; scroll to zoom. **Expected**: smooth pan and zoom; nodes and edges stay aligned.

---

## Phase 2: Node Click → Bio Card Panel

**User stories**: #3, #4, #5, #6
**Depends on**: Phase 1

### What to build

Clicking a narrator node sets `selectedNarratorId` in the parent and renders a `NarratorBioCard` panel alongside the graph. The panel shows all `NarratorRecord` fields: Arabic name, transliterated name, birth/death year, generation, reliability grade, teachers (resolved to Arabic names from `allRecords`), students, collections, and bio note. Teachers and students whose IDs cannot be resolved in `allRecords` display with a "غير موجود" label rather than crashing. Clicking a second node closes the first bio card and opens the new one. An X button closes the bio card and returns full width to the graph.

### Acceptance criteria

- [ ] Clicking a narrator node opens the bio card panel adjacent to the graph
- [ ] The bio card shows all `NarratorRecord` fields
- [ ] Teacher and student IDs are resolved to Arabic names; unresolvable IDs show "غير موجود"
- [ ] Clicking a second node closes the first bio card and opens the new one
- [ ] The X button closes the bio card
- [ ] Clicking an unknown ("?") node opens a bio card showing "راوٍ غير معروف" with no profile fields

### Manual QA plan

1. **Open bio card**: Click any identified narrator node. **Expected**: a panel slides/appears alongside the graph with the narrator's full profile.
2. **All fields present**: Inspect the bio card. **Expected**: Arabic name, transliterated name, death year, generation, reliability grade, teachers, students, collections, bio note all visible.
3. **Teacher resolution**: For a narrator with known teachers in the fixture, verify the bio card shows teacher Arabic names, not raw IDs.
4. **Unresolvable ID**: For a narrator whose teacher ID is not in the fixture, verify "غير موجود" appears rather than a crash.
5. **Node switch**: Click a second narrator without closing the first panel. **Expected**: first panel closes, second opens.
6. **Unknown node click**: Click a "?" placeholder node. **Expected**: bio card shows unknown state gracefully (no crash, appropriate message).
7. **Close**: Click X on the bio card. **Expected**: panel closes; graph returns to full width.
