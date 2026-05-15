export interface NarratorMatchInput {
	extractedName: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
	topMatches: { narratorId: string; score: number }[];
	selectedId: string | null;
	userOverride: boolean;
}

export interface NarratorRecordInput {
	id: string;
	reliabilityGrade: string;
}

export type MatchState = "auto" | "confirmed" | "unknown" | "flagged";

export interface ChainNode {
	id: string;
	extractedName: string;
	position: number;
	matchState: MatchState;
	reliabilityGrade: string | null;
}

export interface ChainEdge {
	source: string;
	target: string;
}

export interface ChainGraph {
	nodes: ChainNode[];
	edges: ChainEdge[];
}

export function buildChainGraph(
	narrators: NarratorMatchInput[],
	database: NarratorRecordInput[],
): ChainGraph {
	const sorted = narrators.slice().sort((a, b) => a.position - b.position);

	const nodes: ChainNode[] = sorted.map((narrator, index) => {
		const record = narrator.selectedId
			? (database.find((r) => r.id === narrator.selectedId) ?? null)
			: null;

		let matchState: MatchState;
		if (narrator.userOverride) {
			// dangling reference: selectedId points to a deleted record → treat as unknown
			matchState =
				narrator.selectedId !== null && record !== null
					? "confirmed"
					: "unknown";
		} else {
			matchState = narrator.selectedId ? "auto" : "flagged";
		}

		return {
			id: narrator.selectedId ?? `unknown-${narrator.position}-${index}`,
			extractedName: narrator.extractedName,
			position: narrator.position,
			matchState,
			reliabilityGrade: record?.reliabilityGrade ?? null,
		};
	});

	const edges: ChainEdge[] = [];
	for (let i = 0; i < nodes.length - 1; i++) {
		edges.push({ source: nodes[i].id, target: nodes[i + 1].id });
	}

	return { nodes, edges };
}
