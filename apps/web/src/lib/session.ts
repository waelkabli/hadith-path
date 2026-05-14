export interface ParseResult {
	inputHash: string;
	llmSplitAt: number;
	splitAt: number;
	corrected: boolean;
}

export interface NarratorMatchEntry {
	extractedName: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
	topMatches: { narratorId: string; score: number }[];
	selectedId: string | null;
	userOverride: boolean;
}

export interface NarratorExtraction {
	inputHash: string;
	narrators: NarratorMatchEntry[];
}

export interface SessionVariant {
	id: string;
	label: string;
	rawText: string;
	color: string;
	parseResult: ParseResult | null;
	narratorExtraction: NarratorExtraction | null;
}

export interface CustomNarrator {
	id: string;
	nameArabic: string;
	nameTransliterated: string;
	birthYear: number | null;
	deathYear: number | null;
	generation: string;
	reliabilityGrade: string;
	teachers: string[];
	students: string[];
	collections: string[];
	bioNote: string;
}

export interface SessionData {
	version: number;
	exportedAt: string;
	variants: SessionVariant[];
	customNarrators: CustomNarrator[];
}

export function serializeSession(
	variants: SessionVariant[],
	customNarrators: CustomNarrator[],
): SessionData {
	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		variants,
		customNarrators,
	};
}

export function deserializeSession(json: string): {
	variants: SessionVariant[];
	customNarrators: CustomNarrator[];
} {
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch {
		throw new Error("Invalid JSON");
	}

	const d = data as Record<string, unknown>;

	if (typeof d?.version !== "number") {
		throw new Error("Session file missing version field");
	}

	if (d.version !== 1) {
		throw new Error(`Unrecognized session version: ${d.version}`);
	}

	return {
		variants: (d.variants as SessionVariant[]) ?? [],
		customNarrators: (d.customNarrators as CustomNarrator[]) ?? [],
	};
}
