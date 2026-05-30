// figma: 110:26 (S09 Chain Visualization — Single)
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

const NODE_WIDTH = 160;
const NODE_HEIGHT = 141;

// ── Grade → visual tokens ─────────────────────────────────────────────────────

type GradeTokens = {
	topBorder: string;
	badgeBg: string;
	badgeBorder: string;
	badgeText: string;
};

const GRADE_TOKENS: Record<string, GradeTokens> = {
	ثقة: {
		topBorder: "#1d8a80",
		badgeBg: "#eef9f8",
		badgeBorder: "#9fddd8",
		badgeText: "#1d8a80",
	},
	صدوق: {
		topBorder: "#2878c8",
		badgeBg: "#eef6fe",
		badgeBorder: "#93c8f5",
		badgeText: "#1a4e7a",
	},
	ضعيف: {
		topBorder: "#d4900a",
		badgeBg: "#fef6e6",
		badgeBorder: "#f0c060",
		badgeText: "#8a5a00",
	},
	متروك: {
		topBorder: "#cc2828",
		badgeBg: "#fef0f0",
		badgeBorder: "#f0a0a0",
		badgeText: "#8a1515",
	},
};

const GRADE_UNKNOWN_TOKENS: GradeTokens = {
	topBorder: "#b5b1a8",
	badgeBg: "#f3f2ef",
	badgeBorder: "#d8d5ce",
	badgeText: "#625e56",
};

function gradeTokens(grade: string | null): GradeTokens {
	if (!grade) return GRADE_UNKNOWN_TOKENS;
	return GRADE_TOKENS[grade] ?? GRADE_UNKNOWN_TOKENS;
}

// ── Match state → side border color ──────────────────────────────────────────

function stateBorderColor(state: MatchState): string {
	switch (state) {
		case "confirmed":
			return "#2aa57a";
		case "flagged":
			return "#d4900a";
		case "unknown":
			return "#b5b1a8";
		default:
			return "#d8d5ce";
	}
}

function stateBackground(state: MatchState): string {
	return state === "unknown" ? "#f3f2ef" : "#ffffff";
}

// ── Custom narrator node — Figma C09 pill shape ───────────────────────────────

type NarratorNodeData = {
	label: string;
	matchState: MatchState;
	reliabilityGrade: string | null;
	nameTranslit: string | null;
	deathYear: number | null;
	isTerminal?: boolean;
};

type NarratorNodeType = Node<NarratorNodeData>;

function NarratorNodeComponent({ data }: NodeProps<NarratorNodeType>) {
	const {
		label,
		matchState,
		reliabilityGrade,
		nameTranslit,
		deathYear,
		isTerminal,
	} = data;
	const isUnknown = matchState === "unknown";
	const tokens = gradeTokens(reliabilityGrade);

	const borderColor = isTerminal ? "#e2bc50" : stateBorderColor(matchState);
	const bg = isTerminal ? "#fdf8ec" : stateBackground(matchState);
	const nameColor = isTerminal ? "#7a5512" : isUnknown ? "#9c9890" : "#1c1a17";

	return (
		<div
			style={{
				width: NODE_WIDTH,
				minHeight: NODE_HEIGHT,
				background: bg,
				border: `1.5px solid ${borderColor}`,
				borderTop: `3px solid ${isTerminal ? "#e2bc50" : tokens.topBorder}`,
				borderRadius: 24,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 6,
				padding: "14px 16px",
				cursor: "pointer",
				boxShadow: "0 1px 3px rgba(28,26,23,0.08)",
				position: "relative",
				overflow: "visible",
			}}
		>
			{/* Receives edges from the right (earlier narrator) */}
			<Handle
				type="target"
				position={Position.Right}
				style={{
					background: "#b5b1a8",
					width: 8,
					height: 8,
					border: "none",
					borderRadius: "50%",
				}}
			/>

			{/* State icon overlay — top-right corner */}
			{matchState === "confirmed" && (
				<div style={{ position: "absolute", top: 5, right: 5 }}>
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						aria-label="مؤكد"
					>
						<circle cx="7" cy="7" r="6.5" fill="#2aa57a" />
						<path
							d="M4 7l2 2 4-4"
							stroke="#fff"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			)}
			{matchState === "flagged" && (
				<div style={{ position: "absolute", top: 5, right: 5 }}>
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						aria-label="غير محدد"
					>
						<path d="M7 1.5L12.5 11H1.5L7 1.5Z" fill="#d4900a" />
						<path
							d="M7 5.5V8M7 9.5H7.01"
							stroke="#fff"
							strokeWidth="1.2"
							strokeLinecap="round"
						/>
					</svg>
				</div>
			)}

			{/* Arabic name */}
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: 17,
					fontWeight: 600,
					color: nameColor,
					textAlign: "center",
					direction: "rtl",
					lineHeight: 1.4,
					maxWidth: "100%",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{isUnknown ? "راوٍ غير معروف" : label}
			</span>

			{/* Latin transliteration */}
			{nameTranslit && !isUnknown && (
				<span
					style={{
						fontFamily: "var(--font-ui-latin)",
						fontSize: 12,
						color: "#625e56",
						textAlign: "center",
						direction: "ltr",
						lineHeight: 1.3,
						maxWidth: "100%",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{nameTranslit}
				</span>
			)}

			{/* Death year */}
			{deathYear != null && !isUnknown && (
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: 11,
						color: "#9c9890",
						textAlign: "center",
						direction: "ltr",
					}}
				>
					{`ت. ${deathYear} هـ`}
				</span>
			)}

			{/* Grade badge */}
			{!isUnknown && (
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: 11,
						fontWeight: 500,
						background: isTerminal ? "#fdf8ec" : tokens.badgeBg,
						border: `1px solid ${isTerminal ? "#e2bc50" : tokens.badgeBorder}`,
						color: isTerminal ? "#7a5512" : tokens.badgeText,
						borderRadius: 4,
						padding: "2px 8px",
						lineHeight: 1.5,
						direction: "rtl",
					}}
				>
					{reliabilityGrade ?? "مجهول"}
				</span>
			)}

			{/* Sends edges to the left (later narrator) */}
			<Handle
				type="source"
				position={Position.Left}
				style={{
					background: "#b5b1a8",
					width: 8,
					height: 8,
					border: "none",
					borderRadius: "50%",
				}}
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

	const lastIdx = chainNodes.length - 1;
	const rfNodes: Node<NarratorNodeData>[] = chainNodes.map((n, i) => {
		const pos = g.node(n.id);
		return {
			id: n.id,
			type: "narratorNode",
			position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
			data: {
				label: n.extractedName,
				matchState: n.matchState,
				reliabilityGrade: n.reliabilityGrade,
				nameTranslit: n.nameTransliterated,
				deathYear: n.deathYear,
				isTerminal: i === 0 || i === lastIdx,
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
