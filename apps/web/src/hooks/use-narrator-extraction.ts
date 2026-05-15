import { useState } from "react";

import { extractNarrators } from "@/lib/extract-narrators";
import { matchNarrators, type NarratorMatch } from "@/lib/match-narrators";
import {
	getNarratorDatabase,
	type NarratorRecord,
} from "@/lib/narrator-database";
import { useApiKey } from "./use-api-key";

const EXTRACTION_KEY = "hadith-narrator-extraction";
const PARSE_RESULT_KEY = "hadith-parse-result";
const RAW_INPUT_KEY = "hadith-input-raw";

interface StoredExtraction {
	inputHash: string;
	narrators: NarratorMatch[];
}

function hashText(text: string): string {
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	return hash.toString(16);
}

function readStoredExtraction(): StoredExtraction | null {
	try {
		const json = localStorage.getItem(EXTRACTION_KEY);
		if (!json) return null;
		const data = JSON.parse(json);
		if (typeof data?.inputHash !== "string" || !Array.isArray(data?.narrators))
			return null;
		return data as StoredExtraction;
	} catch {
		return null;
	}
}

function readCurrentIsnadOnMount(): string {
	try {
		const rawText = localStorage.getItem(RAW_INPUT_KEY);
		if (!rawText) return "";
		const stored = JSON.parse(localStorage.getItem(PARSE_RESULT_KEY) ?? "null");
		if (!stored || typeof stored.splitAt !== "number") return "";
		return rawText.slice(0, stored.splitAt);
	} catch {
		return "";
	}
}

function persistExtraction(hash: string, narrators: NarratorMatch[]): void {
	try {
		localStorage.setItem(
			EXTRACTION_KEY,
			JSON.stringify({ inputHash: hash, narrators }),
		);
	} catch {
		// ignore storage errors
	}
}

export interface UseNarratorExtractionReturn {
	narrators: NarratorMatch[] | null;
	error: string | null;
	isLoading: boolean;
	isStale: boolean;
	extract: (isnadText: string, database?: NarratorRecord[]) => Promise<void>;
	confirmMatch: (position: number, narratorId: string | null) => void;
	reset: () => void;
}

export function useNarratorExtraction(
	currentIsnadText?: string,
): UseNarratorExtractionReturn {
	const { apiKey } = useApiKey();

	const [narrators, setNarrators] = useState<NarratorMatch[] | null>(() => {
		const stored = readStoredExtraction();
		if (!stored) return null;
		const currentIsnad = readCurrentIsnadOnMount();
		if (!currentIsnad) return null;
		if (hashText(currentIsnad) !== stored.inputHash) return stored.narrators;
		return stored.narrators;
	});

	const [extractedIsnadHash, setExtractedIsnadHash] = useState<string | null>(
		() => readStoredExtraction()?.inputHash ?? null,
	);

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const isStale =
		extractedIsnadHash !== null &&
		currentIsnadText !== undefined &&
		currentIsnadText !== "" &&
		hashText(currentIsnadText) !== extractedIsnadHash;

	const extract = async (
		isnadText: string,
		database?: NarratorRecord[],
	): Promise<void> => {
		if (!apiKey) {
			setError("يرجى إدخال مفتاح API في الإعدادات");
			return;
		}

		setError(null);
		setIsLoading(true);
		try {
			const extracted = await extractNarrators(isnadText, apiKey);
			const matched = matchNarrators(
				extracted,
				database ?? getNarratorDatabase(),
			);
			const hash = hashText(isnadText);
			persistExtraction(hash, matched);
			setNarrators(matched);
			setExtractedIsnadHash(hash);
		} catch {
			setError("فشل استخراج الرواة — يرجى المحاولة مجدداً");
			// existing narrators state is intentionally preserved on failure
		} finally {
			setIsLoading(false);
		}
	};

	const confirmMatch = (position: number, narratorId: string | null): void => {
		setNarrators((prev) => {
			if (!prev) return prev;
			const updated = prev.map((n) =>
				n.position === position
					? { ...n, selectedId: narratorId, userOverride: true }
					: n,
			);
			persistExtraction(extractedIsnadHash ?? "", updated);
			return updated;
		});
	};

	const reset = () => {
		setNarrators(null);
		setError(null);
		setExtractedIsnadHash(null);
		try {
			localStorage.removeItem(EXTRACTION_KEY);
		} catch {
			// ignore storage errors
		}
	};

	return {
		narrators,
		error,
		isLoading,
		isStale,
		extract,
		confirmMatch,
		reset,
	};
}
