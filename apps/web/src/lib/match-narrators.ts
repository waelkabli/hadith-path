import type { ExtractedNarrator } from "./extract-narrators";
import type { NarratorRecord } from "./narrator-database";
import { normalizeArabic } from "./normalize-arabic";

export type { NarratorRecord } from "./narrator-database";

export interface NarratorMatch {
	extractedName: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
	topMatches: { narratorId: string; score: number }[];
	selectedId: string | null;
	userOverride: boolean;
	confidence: "high" | "medium" | "low";
	isAmbiguous: boolean;
}

function makeTrigrams(s: string): Set<string> {
	const padded = ` ${s} `;
	const set = new Set<string>();
	for (let i = 0; i < padded.length - 2; i++) {
		set.add(padded.slice(i, i + 3));
	}
	return set;
}

function trigramSimilarity(a: string, b: string): number {
	const normA = normalizeArabic(a);
	const normB = normalizeArabic(b);
	if (normA === normB) return 1.0;
	const tA = makeTrigrams(normA);
	const tB = makeTrigrams(normB);
	if (tA.size === 0 && tB.size === 0) return 1.0;
	if (tA.size === 0 || tB.size === 0) return 0.0;
	let intersection = 0;
	for (const t of tA) {
		if (tB.has(t)) intersection++;
	}
	return (2 * intersection) / (tA.size + tB.size);
}

export function matchNarrators(
	extracted: ExtractedNarrator[],
	database: NarratorRecord[],
): NarratorMatch[] {
	return extracted
		.slice()
		.sort((a, b) => a.position - b.position)
		.map((narrator) => {
			const scored = database
				.map((record) => ({
					narratorId: record.id,
					score: trigramSimilarity(narrator.name, record.nameArabic),
				}))
				.filter((m) => m.score > 0)
				.sort((a, b) => b.score - a.score)
				.slice(0, 5);

			const bestScore = scored[0]?.score ?? 0;

			const isAmbiguous =
				scored.length >= 2 &&
				bestScore < 0.95 &&
				bestScore - scored[1].score < 0.1;

			let confidence: "high" | "medium" | "low";
			let selectedId: string | null;

			if (bestScore >= 0.9) {
				confidence = "high";
				selectedId = scored[0].narratorId;
			} else if (bestScore >= 0.6) {
				confidence = "medium";
				selectedId = scored[0].narratorId;
			} else {
				confidence = "low";
				selectedId = null;
			}

			return {
				extractedName: narrator.name,
				position: narrator.position,
				mentionStart: narrator.mentionStart,
				mentionEnd: narrator.mentionEnd,
				topMatches: scored,
				selectedId,
				userOverride: false,
				confidence,
				isAmbiguous,
			};
		});
}
