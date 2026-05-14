import { normalizeArabic } from "./normalize-arabic";

export interface DiffVariantEntry {
	text: string | null;
	status: "match" | "substituted" | "added" | "deleted";
}

export interface DiffToken {
	baseText: string | null;
	allMatch: boolean;
	variants: DiffVariantEntry[];
}

export function computeDiff(variants: string[]): DiffToken[] {
	if (variants.length < 2) {
		throw new Error("computeDiff requires at least 2 variants");
	}

	const tokenized = variants.map((v) =>
		v.trim() === "" ? [] : v.trim().split(/\s+/),
	);

	const base = tokenized[0];
	const maxLen = Math.max(...tokenized.map((t) => t.length));
	const tokens: DiffToken[] = [];

	for (let i = 0; i < maxLen; i++) {
		const baseWord = i < base.length ? base[i] : null;
		const normalizedBase = baseWord ? normalizeArabic(baseWord) : null;

		const variantEntries: DiffVariantEntry[] = tokenized.map((words, j) => {
			const word = i < words.length ? words[i] : null;

			if (j === 0) {
				return { text: word, status: word !== null ? "match" : "deleted" };
			}

			if (word === null) {
				return { text: null, status: "deleted" };
			}

			if (baseWord === null) {
				return { text: word, status: "added" };
			}

			const normalizedWord = normalizeArabic(word);
			return {
				text: word,
				status: normalizedWord === normalizedBase ? "match" : "substituted",
			};
		});

		tokens.push({
			baseText: baseWord,
			allMatch: variantEntries.every((v) => v.status === "match"),
			variants: variantEntries,
		});
	}

	return tokens;
}
