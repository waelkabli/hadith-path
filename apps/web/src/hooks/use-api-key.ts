import { useState } from "react";

const STORAGE_KEY = "hadith-api-key-claude";

export interface UseApiKeyReturn {
	apiKey: string | null;
	setApiKey: (key: string) => void;
}

export function useApiKey(): UseApiKeyReturn {
	const [apiKey, setApiKeyState] = useState<string | null>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY);
		} catch {
			return null;
		}
	});

	const setApiKey = (key: string) => {
		try {
			localStorage.setItem(STORAGE_KEY, key);
		} catch {
			// ignore storage errors
		}
		setApiKeyState(key);
	};

	return { apiKey, setApiKey };
}
