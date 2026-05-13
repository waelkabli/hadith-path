import { useEffect, useState } from "react";

import { EXAMPLE_HADITH } from "@/constants/hadith-examples";

const STORAGE_KEY = "hadith-input-raw";

export interface UseHadithInputReturn {
	value: string;
	onChange: (text: string) => void;
}

export function useHadithInput(): UseHadithInputReturn {
	const [value, setValue] = useState<string>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) ?? EXAMPLE_HADITH;
		} catch {
			return EXAMPLE_HADITH;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, value);
		} catch {
			// ignore storage errors (private browsing, quota exceeded)
		}
	}, [value]);

	return {
		value,
		onChange: setValue,
	};
}
