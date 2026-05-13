# Spec: Isnad Chain Visualization — Horizontal RTL Flow with Clickable Narrator Nodes

## Problem Statement

After narrator extraction and disambiguation (Features 4–5), the tool has a structured list of narrators in transmission order with their database records. But this data is only shown as a list. Scholars traditionally draw isnads as linear chains flowing from the original source to the collector — a visual that makes the transmission path and each narrator's position immediately legible. Without this view, the tool fails to communicate the chain's structure at a glance.

## Solution

The narrator chain is rendered as a horizontal, right-to-left flow using reactflow — nodes for narrators, directed arrows for transmission links. Each node shows the narrator's Arabic name and a reliability-grade color indicator. Clicking a node opens a read-only biography panel with the narrator's full profile. The chain supports pan and zoom. When only one hadith variant is loaded, this linear view is the default visualization.

## User Stories

1. As a researcher, I want to see the narrators rendered as a horizontal RTL chain with arrows, so the transmission path mirrors how scholars traditionally draw isnads.
2. As a researcher, I want each narrator node to show their Arabic name and a reliability-grade indicator, so I can assess chain strength at a glance without opening each profile.
3. As a researcher, I want to click a narrator node to open a read-only biography panel, so I can read their full profile without leaving the visualization.
4. As a researcher, I want the biography panel to show the narrator's full profile (name, transliteration, dates, generation, reliability grade, teachers, students, collections, bio note), so I have complete scholarly information.
5. As a researcher, I want to close the biography panel and return to the chain, so I can browse multiple narrators in sequence.
6. As a researcher, I want to pan and zoom the chain, so I can navigate long isnads that extend beyond the viewport.
7. As a researcher, I want narrator nodes to be visually distinct based on whether their identification is auto-matched, user-confirmed, or unresolved, so I can see the confidence state of the chain in one view.
8. As a researcher, I want unknown narrators (marked as such in Feature 5) to appear in the chain as placeholder nodes, so the chain is complete even when a narrator is not in the database.

## Acceptance Criteria

- [ ] The narrator chain renders as a horizontal reactflow graph flowing right-to-left
- [ ] Each narrator is a node showing: Arabic name (primary), reliability grade badge
- [ ] Directed edges connect narrators in transmission order (right to left — earlier narrator on the right)
- [ ] Node visual state distinguishes: auto-matched (standard), user-confirmed (checkmark or border), unresolved/flagged (warning indicator), unknown (muted placeholder)
- [ ] Clicking a node opens a `NarratorBioCard` panel alongside the graph (not a modal)
- [ ] The bio panel shows all `NarratorRecord` fields: Arabic name, transliterated name, birth/death year, generation, reliability grade, teachers (resolved to names), students (resolved to names), collections, bio note
- [ ] Closing the bio panel (X button or clicking another node) returns focus to the graph
- [ ] The graph supports pan (drag) and zoom (scroll/pinch) via reactflow's built-in controls
- [ ] Unknown narrators render as distinct placeholder nodes with a "?" label
- [ ] The visualization is RTL — the chain reads from right (earliest narrator/Prophet) to left (collector)

## Implementation Decisions

### Architecture & Schema

Rendering engine: **reactflow**. reactflow's node/edge model maps directly to the narrator chain. RTL layout is achieved by configuring the dagre layout algorithm with `rankdir: 'RL'` (right-to-left). reactflow's pan/zoom is enabled by default.

**Graph data model:**

```
ChainNode {
  id: string             // narrator's resolved ID, or "unknown-<position>" for unresolved
  position: number       // 0 = earliest in chain (e.g. Companion), N = collector
  label: string          // Arabic name to display
  recordId: string | null  // resolved NarratorRecord ID; null for unknown
  matchState: 'auto' | 'confirmed' | 'flagged' | 'unknown'
  reliabilityGrade: string | null
}

ChainEdge {
  source: string   // node ID of the transmitter (earlier narrator)
  target: string   // node ID of the receiver (later narrator)
}
```

**`buildChainGraph(narrators, records): { nodes: ChainNode[], edges: ChainEdge[] }`** — pure function. Takes the `NarratorMatch[]` from Feature 4 and the merged `NarratorRecord[]` from Feature 6. Produces the reactflow-ready node and edge arrays. Resolves `recordId` to a `NarratorRecord` for display fields. All reactflow-specific positioning is handled by dagre layout after this function runs — this function produces the logical graph, not pixel coordinates.

### Interfaces & Contracts

**`IsnadChainView` component:**
```
{
  narrators: NarratorMatch[],
  records: NarratorRecord[],
  onNodeClick: (narratorId: string | null) => void,
}
```
Internally calls `buildChainGraph`, applies dagre layout, renders the reactflow graph. Manages its own pan/zoom state (reactflow internal). Does not manage the bio panel — signals the clicked narrator ID to the parent.

**`NarratorBioCard` component:**
```
{
  record: NarratorRecord,
  allRecords: NarratorRecord[],  // for resolving teacher/student IDs to names
  onClose: () => void,
}
```
Read-only. Resolves teacher and student IDs to Arabic names using `allRecords`. Renders a structured panel with all profile fields. This component is distinct from `NarratorDisambiguationPanel` (Feature 5) — it has no selection, confirmation, or edit affordances.

The parent route holds `selectedNarratorId: string | null` in state. When `onNodeClick` fires, the parent opens the bio card. Clicking a second node closes the first bio card and opens the new one.

### Behavior & Interactions

**Reliability grade color coding:**

| Grade | Color |
|-------|-------|
| ثقة (trustworthy) | green |
| صدوق (honest) | yellow-green |
| ضعيف (weak) | orange |
| متروك (abandoned) | red |
| Unknown / null | gray |

The color appears as a small badge or left-border tint on the node card.

**Node click:**
The bio card renders in a fixed panel to the side of the graph (not overlapping it). The graph reflows to accommodate the panel if the viewport is wide enough; on narrower viewports, the panel overlays.

**Bio card teacher/student display:**
Teachers and students are listed by Arabic name (resolved from `allRecords`). If a referenced ID is not found in `allRecords`, the ID is shown with a "غير موجود" label rather than breaking.

**Zoom controls:**
reactflow's default minimap and zoom buttons are shown. Zoom range: 0.25×–2×.

---

## Testing Decisions

**`buildChainGraph` — unit tests (pure function):**
- Produces one node per narrator in the correct order
- Edges connect consecutive narrators (position N → position N+1)
- `matchState` is correctly set from `NarratorMatch.userOverride` and `selectedId`
- Unknown narrators (selectedId null, userOverride true) produce a placeholder node
- A single narrator produces one node and no edges

**`NarratorBioCard` — component tests:**
- Renders all fields from the provided `NarratorRecord`
- Teacher IDs are resolved to Arabic names from `allRecords`
- Unresolvable IDs show the fallback label
- `onClose` is called when the close button is clicked

**`IsnadChainView` — component tests:**
- Renders the correct number of nodes and edges for a fixture narrator array
- `onNodeClick` is called with the correct narrator ID when a node is clicked

## Out of Scope

- **Narrator node editing from within the chain view:** Clicking a node opens a read-only bio card. To change a narrator identification, the user returns to the narrator chain list (Feature 5). The chain view is display-only.
- **Custom layout / manual node repositioning:** The dagre RTL layout is fixed. Drag-to-reposition individual nodes is deferred.
- **Minimap:** reactflow's minimap is deferred — it adds complexity and is most useful for very long chains. Can be enabled later with one line.
- **Export of the chain image:** Covered in Feature 10.

## Open Questions

- Should the reliability grade color appear on the node card border, as a background tint, or as an explicit badge label? The final choice is a design/DESIGN_GUIDE decision.

## Further Notes

reactflow requires nodes to have explicit x/y pixel coordinates. The dagre layout algorithm computes these from the logical graph produced by `buildChainGraph`. The dagre layout step runs inside `IsnadChainView` after the graph data is built — it is not part of `buildChainGraph` itself, which stays pure and layout-agnostic.

This component renders only a single hadith's chain. When multiple variants are loaded, `IsnadChainView` is replaced by `VariantChainView` (Feature 8), which uses the same reactflow base but with a branching layout.
