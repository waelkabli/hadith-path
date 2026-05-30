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

import type { Variant } from "@/hooks/use-variants";
import type { MatchState } from "@/lib/chain-graph";
import type { NarratorRecord } from "@/lib/narrator-database";
import { buildVariantGraph } from "@/lib/variant-graph";

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

// ── Custom narrator node — same pill shape as IsnadChainView ──────────────────

type NarratorNodeData = {
	label: string;
	matchState: MatchState;
	reliabilityGrade: string | null;
	nameTranslit: string | null;
	deathYear: number | null;
	isTerminal?: boolean;
	uniqueVariantColor: string | null;
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
		uniqueVariantColor,
	} = data;
	const isUnknown = matchState === "unknown";
	const tokens = gradeTokens(reliabilityGrade);

	// Unique-to-variant nodes get the variant color border; terminals get gold
	const borderColor = isTerminal
		? "#e2bc50"
		: (uniqueVariantColor ?? stateBorderColor(matchState));
	const topBorder = isTerminal ? "#e2bc50" : tokens.topBorder;
	const bg = isTerminal ? "#fdf8ec" : stateBackground(matchState);
	const nameColor = isTerminal ? "#7a5512" : isUnknown ? "#9c9890" : "#1c1a17";

	return (
		<div
			style={{
				width: NODE_WIDTH,
				minHeight: NODE_HEIGHT,
				background: bg,
				border: `1.5px solid ${borderColor}`,
				borderTop: `3px solid ${topBorder}`,
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

			{/* State icon overlay */}
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

const nodeTypes = { narratorNode: NarratorNodeComponent };

// ── Dagre layout ──────────────────────────────────────────────────────────────

function buildVariantLayout(
	graphNodes: {
		id: string;
		extractedName: string;
		matchState: MatchState;
		reliabilityGrade: string | null;
		nameTransliterated: string | null;
		deathYear: number | null;
	}[],
	graphEdges: {
		source: string;
		target: string;
		variantId: string;
		color: string;
	}[],
	variantColorMap: Map<string, string>,
): { rfNodes: Node<NarratorNodeData>[]; rfEdges: Edge[] } {
	const g = new dagre.graphlib.Graph();
	g.setDefaultEdgeLabel(() => ({}));
	g.setGraph({ rankdir: "RL", ranksep: 80, nodesep: 40 });

	for (const node of graphNodes) {
		g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	}

	// Compute which nodes belong to which variants (for unique-variant coloring)
	const nodeVariants = new Map<string, Set<string>>();
	for (const edge of graphEdges) {
		if (!nodeVariants.has(edge.source))
			nodeVariants.set(edge.source, new Set());
		if (!nodeVariants.has(edge.target))
			nodeVariants.set(edge.target, new Set());
		nodeVariants.get(edge.source)?.add(edge.variantId);
		nodeVariants.get(edge.target)?.add(edge.variantId);
	}

	// Deduplicate edges for dagre layout
	const seenDagreEdges = new Set<string>();
	for (const edge of graphEdges) {
		const key = `${edge.source}||${edge.target}`;
		if (!seenDagreEdges.has(key)) {
			seenDagreEdges.add(key);
			g.setEdge(edge.target, edge.source);
		}
	}
	dagre.layout(g);

	const rfNodes: Node<NarratorNodeData>[] = graphNodes.map((n) => {
		const pos = g.node(n.id);
		const variantSet = nodeVariants.get(n.id);
		const uniqueVariantColor =
			variantSet?.size === 1
				? (variantColorMap.get([...variantSet][0]) ?? null)
				: null;

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
				isTerminal: false,
				uniqueVariantColor,
			},
		};
	});

	// Keep all variant-colored edges (reversed: Companion → collector)
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
	onInit?: OnInit<Node<NarratorNodeData>, Edge>;
}

export function VariantChainView({
	variants,
	records,
	onNodeClick,
	onInit,
}: VariantChainViewProps) {
	const { rfNodes, rfEdges } = useMemo(() => {
		const variantColorMap = new Map(variants.map((v) => [v.id, v.color]));
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
		return buildVariantLayout(graph.nodes, graph.edges, variantColorMap);
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
				onInit={onInit}
				onNodeClick={(_evt, node) => {
					const recordId = node.id.startsWith("unknown-") ? null : node.id;
					onNodeClick(recordId);
				}}
			>
				<Background gap={16} color="#f3f4f6" />
				<Controls />
			</ReactFlow>

			{/* Variant legend — top-right overlay */}
			<div
				style={{
					position: "absolute",
					top: 12,
					right: 12,
					background: "rgba(255,255,255,0.92)",
					border: "1px solid var(--color-border-subtle)",
					borderRadius: "var(--radius-sm)",
					padding: "8px 12px",
					display: "flex",
					flexDirection: "column",
					gap: 4,
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
							gap: 6,
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
