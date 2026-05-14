import { normalizeArabic } from "./normalize-arabic";

export interface ExtractedNarrator {
	name: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
}

export interface NarratorRecord {
	id: string;
	nameArabic: string;
	[key: string]: unknown;
}

export interface NarratorMatch {
	extractedName: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
	topMatches: { narratorId: string; score: number }[];
	selectedId: string | null;
	userOverride: boolean;
}

function wordJaccard(a: string, b: string): number {
	const wordsA = new Set(normalizeArabic(a).split(/\s+/).filter(Boolean));
	const wordsB = new Set(normalizeArabic(b).split(/\s+/).filter(Boolean));

	if (wordsA.size === 0 && wordsB.size === 0) return 1.0;
	if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

	let intersection = 0;
	for (const w of wordsA) {
		if (wordsB.has(w)) intersection++;
	}

	return intersection / (wordsA.size + wordsB.size - intersection);
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
					score: wordJaccard(narrator.name, record.nameArabic),
				}))
				.filter((m) => m.score > 0)
				.sort((a, b) => b.score - a.score)
				.slice(0, 5);

			const bestScore = scored[0]?.score ?? 0;
			const selectedId = bestScore >= 0.9 ? scored[0].narratorId : null;

			return {
				extractedName: narrator.name,
				position: narrator.position,
				mentionStart: narrator.mentionStart,
				mentionEnd: narrator.mentionEnd,
				topMatches: scored,
				selectedId,
				userOverride: false,
			};
		});
}
