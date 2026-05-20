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
	type OnInit,
	Position,
	ReactFlow,
} from "@xyflow/react";
import { useMemo } from "react";

import { buildChainGraph, type MatchState } from "@/lib/chain-graph";
import type { NarratorMatch } from "@/lib/match-narrators";
import type { NarratorRecord } from "@/lib/narrator-database";

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

// ── Custom narrator node ──────────────────────────────────────────────────────

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

// Defined outside the component to avoid re-registering on every render.
const nodeTypes = { narratorNode: NarratorNodeComponent };

// ── Dagre layout ──────────────────────────────────────────────────────────────
//
// buildChainGraph assigns position 0 to the first-mentioned narrator in the
// isnad text (Arabic, RTL) — typically the narrator closest to the collector.
// The scholarly diagram convention places the historically earlier narrator
// (Companion / Prophet) on the RIGHT and the collector on the LEFT.
//
// To reconcile these, we reverse the edges when feeding them to dagre so that
// the last-mentioned narrator (Companion) becomes the dagre source and dagre's
// RL layout places it on the right. We also reverse the reactflow edge
// source/target so arrows point Companion → Collector (right to left).

function buildLayout(
	chainNodes: ReturnType<typeof buildChainGraph>["nodes"],
	chainEdges: ReturnType<typeof buildChainGraph>["edges"],
): { rfNodes: Node<NarratorNodeData>[]; rfEdges: Edge[] } {
	const g = new dagre.graphlib.Graph();
	g.setDefaultEdgeLabel(() => ({}));
	g.setGraph({ rankdir: "RL", ranksep: 80, nodesep: 40 });

	for (const node of chainNodes) {
		g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	}
	for (const edge of chainEdges) {
		// Reversed: last-mentioned (Companion) becomes dagre source → placed right.
		g.setEdge(edge.target, edge.source);
	}
	dagre.layout(g);

	const rfNodes: Node<NarratorNodeData>[] = chainNodes.map((n) => {
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

	// Reversed edges: arrows flow from Companion (right) to collector (left).
	const rfEdges: Edge[] = chainEdges.map((e, i) => ({
		id: `e-${i}`,
		source: e.target,
		target: e.source,
		type: "smoothstep",
		markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af" },
		style: { stroke: "#9ca3af", strokeWidth: 1.5 },
	}));

	return { rfNodes, rfEdges };
}

// ── IsnadChainView ────────────────────────────────────────────────────────────

interface IsnadChainViewProps {
	narrators: NarratorMatch[];
	records: NarratorRecord[];
	onNodeClick?: (recordId: string | null) => void;
	onInit?: OnInit<Node<NarratorNodeData>, Edge>;
}

export function IsnadChainView({
	narrators,
	records,
	onNodeClick,
	onInit,
}: IsnadChainViewProps) {
	const { rfNodes, rfEdges } = useMemo(() => {
		const graph = buildChainGraph(narrators, records);
		return buildLayout(graph.nodes, graph.edges);
	}, [narrators, records]);

	if (narrators.length === 0) return null;

	return (
		<div
			style={{
				// borderTop is owned by the dashboard wrapper so the bio card
				// shares the same top border line.
				height: 320,
				direction: "ltr",
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
				onInit={onInit}
				onNodeClick={
					onNodeClick
						? (_evt, node) => {
								// Unknown narrator nodes have ids like "unknown-{pos}-{idx}";
								// all others use the resolved NarratorRecord id.
								const recordId = node.id.startsWith("unknown-")
									? null
									: node.id;
								onNodeClick(recordId);
							}
						: undefined
				}
			>
				<Background gap={16} color="#f3f4f6" />
				<Controls />
			</ReactFlow>
		</div>
	);
}
