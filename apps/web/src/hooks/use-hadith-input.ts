import { useEffect, useState } from "react";

import { EXAMPLE_HADITH } from "@/constants/hadith-examples";

const STORAGE_KEY = "hadith-input-raw";

export interface UseHadithInputOptions {
	onSubmit?: (text: string) => Promise<void>;
	onReset?: () => void;
}

export interface UseHadithInputReturn {
	value: string;
	error: string | null;
	isSubmitted: boolean;
	isLoading: boolean;
	onChange: (text: string) => void;
	submit: () => void;
	reset: () => void;
}

function validateText(text: string): string | null {
	const trimmed = text.trim();
	if (!trimmed) return "الرجاء إدخال نص الحديث";

	const chars = [...trimmed].filter((c) => !/\s/.test(c));
	const arabicCount = chars.filter((c) => /[؀-ۿ]/.test(c)).length;
	if (chars.length > 0 && arabicCount / chars.length <= 0.5) {
		return "النص غير مدعوم — الأداة تقبل النصوص العربية فقط";
	}

	const wordCount = trimmed.split(/\s+/).length;
	if (wordCount > 3000) return "النص يتجاوز الحد المسموح به (٣٠٠٠ كلمة)";

	return null;
}

export function useHadithInput(
	options: UseHadithInputOptions = {},
): UseHadithInputReturn {
	const { onSubmit = async () => {}, onReset = () => {} } = options;

	const [value, setValue] = useState<string>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) ?? EXAMPLE_HADITH;
		} catch {
			return EXAMPLE_HADITH;
		}
	});

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, value);
		} catch {
			// ignore storage errors (private browsing, quota exceeded)
		}
	}, [value]);

	const submit = async () => {
		const validationError = validateText(value);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
		setIsLoading(true);
		try {
			await onSubmit(value);
			setIsSubmitted(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "حدث خطأ أثناء المعالجة");
		} finally {
			setIsLoading(false);
		}
	};

	const reset = () => {
		setIsSubmitted(false);
		setIsLoading(false);
		setError(null);
		onReset();
	};

	return {
		value,
		error,
		isSubmitted,
		isLoading,
		onChange: setValue,
		submit,
		reset,
	};
}
