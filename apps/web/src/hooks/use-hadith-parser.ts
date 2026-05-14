import { useState } from "react";

import { parseHadith } from "@/lib/parse-hadith";
import { useApiKey } from "./use-api-key";

const PARSE_RESULT_KEY = "hadith-parse-result";
const RAW_INPUT_KEY = "hadith-input-raw";

export interface ParseResult {
	splitAt: number;
	llmSplitAt: number;
	corrected: boolean;
}

interface StoredParseResult extends ParseResult {
	inputHash: string;
}

function hashText(text: string): string {
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	return hash.toString(16);
}

function readStoredResult(): StoredParseResult | null {
	try {
		const json = localStorage.getItem(PARSE_RESULT_KEY);
		if (!json) return null;
		const data = JSON.parse(json);
		if (
			typeof data?.inputHash !== "string" ||
			typeof data?.llmSplitAt !== "number" ||
			typeof data?.splitAt !== "number" ||
			typeof data?.corrected !== "boolean"
		) {
			return null;
		}
		return data as StoredParseResult;
	} catch {
		return null;
	}
}

export interface UseHadithParserReturn {
	result: ParseResult | null;
	error: string | null;
	isLoading: boolean;
	parse: (text: string) => Promise<ParseResult>;
	reset: () => void;
}

export function useHadithParser(): UseHadithParserReturn {
	const { apiKey } = useApiKey();

	const [result, setResult] = useState<ParseResult | null>(() => {
		try {
			const rawText = localStorage.getItem(RAW_INPUT_KEY);
			if (!rawText) return null;
			const stored = readStoredResult();
			if (!stored) return null;
			if (hashText(rawText) !== stored.inputHash) return null;
			return {
				splitAt: stored.splitAt,
				llmSplitAt: stored.llmSplitAt,
				corrected: stored.corrected,
			};
		} catch {
			return null;
		}
	});

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const parse = async (text: string): Promise<ParseResult> => {
		if (!apiKey) {
			const msg = "يرجى إدخال مفتاح API في الإعدادات";
			setError(msg);
			throw new Error(msg);
		}

		setError(null);
		setIsLoading(true);
		try {
			const { splitAt } = await parseHadith(text, apiKey);
			const newResult: ParseResult = {
				splitAt,
				llmSplitAt: splitAt,
				corrected: false,
			};
			const stored: StoredParseResult = {
				inputHash: hashText(text),
				...newResult,
			};
			localStorage.setItem(PARSE_RESULT_KEY, JSON.stringify(stored));
			setResult(newResult);
			return newResult;
		} catch {
			const msg =
				"فشل الاتصال بالنموذج — يرجى التحقق من المفتاح والمحاولة مجدداً";
			setError(msg);
			throw new Error(msg);
		} finally {
			setIsLoading(false);
		}
	};

	const reset = () => {
		setResult(null);
		setError(null);
		try {
			localStorage.removeItem(PARSE_RESULT_KEY);
		} catch {
			// ignore storage errors
		}
	};

	return { result, error, isLoading, parse, reset };
}
