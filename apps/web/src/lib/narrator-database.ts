export interface NarratorRecord {
	id: string;
	nameArabic: string;
	nameTransliterated: string;
	birthYear: number | null;
	deathYear: number | null;
	generation: "Sahabi" | "Tabi'i" | "Tabi' al-Tabi'in" | "later";
	reliabilityGrade: string;
	teachers: string[];
	students: string[];
	collections: string[];
	bioNote: string;
}

export interface BundledDatabaseMeta {
	generatedAt: string;
	recordCount: number;
	source: string;
}

interface BundledDB {
	meta: BundledDatabaseMeta;
	narrators: NarratorRecord[];
}

let cachedNarrators: NarratorRecord[] | null = null;
let cachedMeta: BundledDatabaseMeta | null = null;

export async function getNarratorDatabase(): Promise<NarratorRecord[]> {
	if (cachedNarrators !== null) return cachedNarrators;
	const res = await fetch("/data/narrators.json");
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const data: BundledDB = await res.json();
	cachedNarrators = data.narrators;
	cachedMeta = data.meta;
	return cachedNarrators;
}

export function getBundledMeta(): BundledDatabaseMeta | null {
	return cachedMeta;
}

export function getCachedNarrators(): NarratorRecord[] | null {
	return cachedNarrators;
}

export function _clearNarratorDatabaseCache(): void {
	cachedNarrators = null;
	cachedMeta = null;
}
