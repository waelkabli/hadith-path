import "@xyflow/react/dist/style.css";

import dagre from "@dagrejs/dagre";
import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import { useMemo } from "react";

import type { Variant } from "@/hooks/use-variants";
import type { MatchState } from "@/lib/chain-graph";
import type { NarratorRecord } from "@/lib/narrator-database";
import { buildVariantGraph } from "@/lib/variant-graph";

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_WIDTH = 152;
const NODE_HEIGHT = 60;

// ── Reliability grade → color ─────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
	ثقة: "#16a34a",
	صدوق: "#84cc16",
	ضعيف: "#f97316",
	متروك: "#dc2626",
};

function gradeColor(grade: string | null): string {
	if (!grade) return "#9ca3af";
	return GRADE_COLOR[grade] ?? "#9ca3af";
}

// ── Match state → border color ────────────────────────────────────────────────

function stateBorderColor(state: MatchState): string {
	switch (state) {
		case "confirmed":
			return "#16a34a";
		case "flagged":
			return "#d97706";
		case "unknown":
			return "#d1d5db";
		default:
			return "#e5e7eb";
	}
}

// ── Custom narrator node (duplicated from isnad-chain-view.tsx) ───────────────

type NarratorNodeData = {
	label: string;
	matchState: MatchState;
	reliabilityGrade: string | null;
};

type NarratorNodeType = Node<NarratorNodeData>;

function NarratorNodeComponent({ data }: NodeProps<NarratorNodeType>) {
	const { label, matchState, reliabilityGrade } = data;
	const isUnknown = matchState === "unknown";

	return (
		<div
			style={{
				width: NODE_WIDTH,
				height: NODE_HEIGHT,
				background: isUnknown ? "#f9fafb" : "#ffffff",
				border: `2px solid ${stateBorderColor(matchState)}`,
				borderRadius: 8,
				padding: "0 10px",
				boxSizing: "border-box",
				display: "flex",
				alignItems: "center",
				direction: "rtl",
				gap: 6,
				cursor: "pointer",
			}}
		>
			{/* Receives edges from the right (earlier narrator) */}
			<Handle
				type="target"
				position={Position.Right}
				style={{ background: "#d1d5db", width: 8, height: 8, border: "none" }}
			/>

			{/* Reliability grade dot */}
			<div
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: gradeColor(reliabilityGrade),
					flexShrink: 0,
				}}
			/>

			{/* Arabic name */}
			<span
				style={{
					fontFamily: "var(--font-display-arabic)",
					fontSize: 13,
					color: isUnknown ? "#9ca3af" : "#111827",
					flex: 1,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
					lineHeight: 1.4,
				}}
			>
				{isUnknown ? "؟" : label}
			</span>

			{/* State icon */}
			{matchState === "confirmed" && (
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					aria-label="مؤكد"
					style={{ flexShrink: 0 }}
				>
					<path
						d="M2 6l3 3 5-5"
						stroke="#16a34a"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			)}
			{matchState === "flagged" && (
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					aria-label="غير محدد"
					style={{ flexShrink: 0 }}
				>
					<path
						d="M6 1.5L11 10H1L6 1.5Z"
						stroke="#d97706"
						strokeWidth="1.2"
						strokeLinejoin="round"
					/>
					<path
						d="M6 4.5V7M6 8.5H6.01"
						stroke="#d97706"
						strokeWidth="1.2"
						strokeLinecap="round"
					/>
				</svg>
			)}

			{/* Sends edges to the left (later narrator) */}
			<Handle
				type="source"
				position={Position.Left}
				style={{ background: "#d1d5db", width: 8, height: 8, border: "none" }}
			/>
		</div>
	);
}

const nodeTypes = { narratorNode: NarratorNodeComponent };

// ── Dagre layout ──────────────────────────────────────────────────────────────
//
// Same reversal technique as isnad-chain-view.tsx: reverse edges in dagre so
// the last-mentioned narrator (Companion/Prophet) ends up on the right.
// For reactflow edges, keep all variant-colored edges (one per variant per pair).

function buildVariantLayout(
	graphNodes: {
		id: string;
		extractedName: string;
		matchState: MatchState;
		reliabilityGrade: string | null;
	}[],
	graphEdges: {
		source: string;
		target: string;
		variantId: string;
		color: string;
	}[],
): { rfNodes: Node<NarratorNodeData>[]; rfEdges: Edge[] } {
	const g = new dagre.graphlib.Graph();
	g.setDefaultEdgeLabel(() => ({}));
	g.setGraph({ rankdir: "RL", ranksep: 80, nodesep: 40 });

	for (const node of graphNodes) {
		g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	}

	// Deduplicate edges for dagre by (source, target) pair — dagre only needs structure
	const seenDagreEdges = new Set<string>();
	for (const edge of graphEdges) {
		const key = `${edge.source}||${edge.target}`;
		if (!seenDagreEdges.has(key)) {
			seenDagreEdges.add(key);
			// Reversed: last-mentioned (Companion) becomes dagre source → placed right
			g.setEdge(edge.target, edge.source);
		}
	}

	dagre.layout(g);

	const rfNodes: Node<NarratorNodeData>[] = graphNodes.map((n) => {
		const pos = g.node(n.id);
		return {
			id: n.id,
			type: "narratorNode",
			position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
			data: {
				label: n.extractedName,
				matchState: n.matchState,
				reliabilityGrade: n.reliabilityGrade,
			},
		};
	});

	// Keep ALL edges (one per variant per edge pair), each with variant color.
	// Reversed: arrows flow from Companion (right) to collector (left).
	const rfEdges: Edge[] = graphEdges.map((e, i) => ({
		id: `e-${i}-${e.variantId}`,
		source: e.target,
		target: e.source,
		type: "smoothstep",
		markerEnd: { type: MarkerType.ArrowClosed, color: e.color },
		style: { stroke: e.color, strokeWidth: 1.5 },
	}));

	return { rfNodes, rfEdges };
}

// ── VariantChainView ──────────────────────────────────────────────────────────

interface VariantChainViewProps {
	variants: Variant[];
	records: NarratorRecord[];
	onNodeClick: (narratorId: string | null) => void;
}

export function VariantChainView({
	variants,
	records,
	onNodeClick,
}: VariantChainViewProps) {
	const { rfNodes, rfEdges } = useMemo(() => {
		const variantInputs = variants.map((v) => ({
			id: v.id,
			color: v.color,
			narrators: (v.narrators ?? []).map((n) => ({
				extractedName: n.extractedName,
				position: n.position,
				mentionStart: n.mentionStart,
				mentionEnd: n.mentionEnd,
				topMatches: n.topMatches,
				selectedId: n.selectedId,
				userOverride: n.userOverride,
			})),
		}));
		const graph = buildVariantGraph(variantInputs, records);
		return buildVariantLayout(graph.nodes, graph.edges);
	}, [variants, records]);

	return (
		<div
			style={{
				height: 320,
				direction: "ltr",
				position: "relative",
			}}
		>
			<ReactFlow
				nodes={rfNodes}
				edges={rfEdges}
				nodeTypes={nodeTypes}
				fitView
				fitViewOptions={{ padding: 0.3 }}
				minZoom={0.25}
				maxZoom={2}
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={false}
				onNodeClick={(_evt, node) => {
					const recordId = node.id.startsWith("unknown-") ? null : node.id;
					onNodeClick(recordId);
				}}
			>
				<Background gap={16} color="#f3f4f6" />
				<Controls />
			</ReactFlow>

			{/* Legend: top-right overlay */}
			<div
				style={{
					position: "absolute",
					top: 8,
					right: 8,
					background: "rgba(255,255,255,0.92)",
					border: "1px solid var(--color-border-subtle)",
					borderRadius: "var(--radius-sm)",
					padding: "var(--space-2) var(--space-3)",
					display: "flex",
					flexDirection: "column",
					gap: "var(--space-1)",
					zIndex: 10,
					direction: "rtl",
					pointerEvents: "none",
				}}
			>
				{variants.map((v) => (
					<div
						key={v.id}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "var(--space-2)",
						}}
					>
						<div
							style={{
								width: 8,
								height: 8,
								background: v.color,
								borderRadius: 2,
								flexShrink: 0,
							}}
						/>
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-secondary)",
							}}
						>
							{v.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
