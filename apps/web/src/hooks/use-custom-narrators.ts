import { useEffect, useState } from "react";

import type { NarratorRecord } from "@/lib/narrator-database";

const STORAGE_KEY = "hadith-custom-narrators";

export interface UseCustomNarratorsReturn {
	customNarrators: NarratorRecord[];
	add: (
		data: Omit<NarratorRecord, "id" | "teachers" | "students" | "collections">,
	) => NarratorRecord;
}

function readFromStorage(): NarratorRecord[] {
	try {
		const json = localStorage.getItem(STORAGE_KEY);
		if (!json) return [];
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed as NarratorRecord[];
	} catch {
		return [];
	}
}

function writeToStorage(records: NarratorRecord[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
	} catch {
		// ignore storage errors
	}
}

export function useCustomNarrators(): UseCustomNarratorsReturn {
	const [customNarrators, setCustomNarrators] = useState<NarratorRecord[]>(() =>
		readFromStorage(),
	);

	// Sync from localStorage on mount (handles SSR / initial hydration)
	useEffect(() => {
		setCustomNarrators(readFromStorage());
	}, []);

	const add = (
		data: Omit<NarratorRecord, "id" | "teachers" | "students" | "collections">,
	): NarratorRecord => {
		const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		const newRecord: NarratorRecord = {
			...data,
			id,
			teachers: [],
			students: [],
			collections: [],
		};

		setCustomNarrators((prev) => {
			const updated = [...prev, newRecord];
			writeToStorage(updated);
			return updated;
		});

		return newRecord;
	};

	return { customNarrators, add };
}
