import type {
	ChainNode,
	MatchState,
	NarratorMatchInput,
	NarratorRecordInput,
} from "./chain-graph";

export type { NarratorMatchInput, NarratorRecordInput };

export interface VariantInput {
	id: string;
	color: string;
	narrators: NarratorMatchInput[];
}

export interface VariantChainEdge {
	source: string;
	target: string;
	variantId: string;
	color: string;
}

export interface VariantGraph {
	nodes: ChainNode[];
	edges: VariantChainEdge[];
}

// matchState priority: confirmed > auto > flagged
const STATE_PRIORITY: Record<MatchState, number> = {
	confirmed: 3,
	auto: 2,
	flagged: 1,
	unknown: 0,
};

function computeMatchState(
	narrator: NarratorMatchInput,
	record: NarratorRecordInput | null,
): MatchState {
	if (narrator.userOverride) {
		return narrator.selectedId !== null && record !== null
			? "confirmed"
			: "unknown";
	}
	return narrator.selectedId ? "auto" : "flagged";
}

export function buildVariantGraph(
	variants: VariantInput[],
	database: NarratorRecordInput[],
): VariantGraph {
	const nodeMap = new Map<string, ChainNode>();
	const edges: VariantChainEdge[] = [];

	for (const variant of variants) {
		const sorted = variant.narrators
			.slice()
			.sort((a, b) => a.position - b.position);
		const nodeIds: string[] = [];

		for (const narrator of sorted) {
			// Unknown narrators (no selectedId) are never merged
			const nodeId =
				narrator.selectedId !== null
					? narrator.selectedId
					: `unknown-${variant.id}-${narrator.position}`;

			const record = narrator.selectedId
				? (database.find((r) => r.id === narrator.selectedId) ?? null)
				: null;

			const newState = computeMatchState(narrator, record);

			if (!nodeMap.has(nodeId)) {
				nodeMap.set(nodeId, {
					id: nodeId,
					extractedName: narrator.extractedName,
					position: narrator.position,
					matchState: newState,
					reliabilityGrade: record?.reliabilityGrade ?? null,
					nameTransliterated: record?.nameTransliterated ?? null,
					deathYear: record?.deathYear ?? null,
				});
			} else {
				// Merge matchState: higher priority wins
				const existing = nodeMap.get(nodeId);
				if (
					existing &&
					STATE_PRIORITY[newState] > STATE_PRIORITY[existing.matchState]
				) {
					nodeMap.set(nodeId, { ...existing, matchState: newState });
				}
			}

			nodeIds.push(nodeId);
		}

		// Emit one edge per consecutive pair in this variant
		for (let i = 0; i < nodeIds.length - 1; i++) {
			edges.push({
				source: nodeIds[i],
				target: nodeIds[i + 1],
				variantId: variant.id,
				color: variant.color,
			});
		}
	}

	return { nodes: Array.from(nodeMap.values()), edges };
}
