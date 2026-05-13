import { describe, expect, it } from "bun:test";
import { buildChainGraph } from "./chain-graph";

// Minimal NarratorMatch fixtures
const match = (
	position: number,
	selectedId: string | null,
	userOverride = false,
	topScore = 0.95,
) => ({
	extractedName: "مالك",
	position,
	mentionStart: position * 10,
	mentionEnd: position * 10 + 5,
	topMatches: selectedId ? [{ narratorId: selectedId, score: topScore }] : [],
	selectedId,
	userOverride,
});

// Minimal NarratorRecord fixtures
const record = (id: string, reliabilityGrade = "ثقة") => ({
	id,
	nameArabic: `راوٍ ${id}`,
	nameTransliterated: `Narrator ${id}`,
	birthYear: null,
	deathYear: null,
	generation: "Tabi'i" as const,
	reliabilityGrade,
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
});

describe("buildChainGraph", () => {
	describe("nodes", () => {
		it("produces exactly one node per narrator", () => {
			const narrators = [
				match(0, "narrator-a"),
				match(1, "narrator-b"),
				match(2, "narrator-c"),
			];
			const { nodes } = buildChainGraph(narrators, [
				record("narrator-a"),
				record("narrator-b"),
				record("narrator-c"),
			]);
			expect(nodes).toHaveLength(3);
		});

		it("produces no nodes for an empty narrator array", () => {
			const { nodes } = buildChainGraph([], []);
			expect(nodes).toHaveLength(0);
		});

		it("marks an auto-matched narrator (userOverride false, high score) as matchState 'auto'", () => {
			const narrators = [match(0, "narrator-a", false, 0.95)];
			const { nodes } = buildChainGraph(narrators, [record("narrator-a")]);
			expect(nodes[0].matchState).toBe("auto");
		});

		it("marks a user-confirmed narrator (userOverride true, non-null selectedId) as matchState 'confirmed'", () => {
			const narrators = [match(0, "narrator-a", true)];
			const { nodes } = buildChainGraph(narrators, [record("narrator-a")]);
			expect(nodes[0].matchState).toBe("confirmed");
		});

		it("marks an unknown narrator (userOverride true, null selectedId) as matchState 'unknown'", () => {
			const narrators = [match(0, null, true)];
			const { nodes } = buildChainGraph(narrators, []);
			expect(nodes[0].matchState).toBe("unknown");
		});

		it("marks a low-confidence narrator (userOverride false, null selectedId) as matchState 'flagged'", () => {
			const narrators = [match(0, null, false)];
			const { nodes } = buildChainGraph(narrators, []);
			expect(nodes[0].matchState).toBe("flagged");
		});

		it("carries the reliability grade from the resolved NarratorRecord onto the node", () => {
			const narrators = [match(0, "narrator-a")];
			const { nodes } = buildChainGraph(narrators, [
				record("narrator-a", "ضعيف"),
			]);
			expect(nodes[0].reliabilityGrade).toBe("ضعيف");
		});

		it("sets reliabilityGrade to null for unknown narrators with no resolved record", () => {
			const narrators = [match(0, null, true)];
			const { nodes } = buildChainGraph(narrators, []);
			expect(nodes[0].reliabilityGrade).toBeNull();
		});
	});

	describe("edges", () => {
		it("produces no edges for a single narrator", () => {
			const narrators = [match(0, "narrator-a")];
			const { edges } = buildChainGraph(narrators, [record("narrator-a")]);
			expect(edges).toHaveLength(0);
		});

		it("produces N-1 edges for N narrators", () => {
			const narrators = [
				match(0, "narrator-a"),
				match(1, "narrator-b"),
				match(2, "narrator-c"),
			];
			const { edges } = buildChainGraph(narrators, [
				record("narrator-a"),
				record("narrator-b"),
				record("narrator-c"),
			]);
			expect(edges).toHaveLength(2);
		});

		it("connects consecutive narrators by position", () => {
			const narrators = [match(0, "narrator-a"), match(1, "narrator-b")];
			const { nodes, edges } = buildChainGraph(narrators, [
				record("narrator-a"),
				record("narrator-b"),
			]);
			const nodeIds = nodes.map((n) => n.id);
			// Each edge references valid node IDs
			for (const edge of edges) {
				expect(nodeIds).toContain(edge.source);
				expect(nodeIds).toContain(edge.target);
			}
		});
	});

	describe("unknown narrator nodes", () => {
		it("assigns a unique id to each unknown narrator so they do not collide", () => {
			const narrators = [match(0, null, true), match(1, null, true)];
			const { nodes } = buildChainGraph(narrators, []);
			const ids = nodes.map((n) => n.id);
			expect(new Set(ids).size).toBe(2);
		});
	});
});
