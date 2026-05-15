import { useEffect, useState } from "react";

import type { NarratorRecord } from "@/lib/narrator-database";

const STORAGE_KEY = "hadith-custom-narrators";

type EditableFields = Pick<
	NarratorRecord,
	| "nameArabic"
	| "nameTransliterated"
	| "birthYear"
	| "deathYear"
	| "generation"
	| "reliabilityGrade"
>;

export interface UseCustomNarratorsReturn {
	customNarrators: NarratorRecord[];
	add: (
		data: Omit<NarratorRecord, "id" | "teachers" | "students" | "collections">,
	) => NarratorRecord;
	update: (id: string, fields: Partial<EditableFields>) => void;
	remove: (id: string) => void;
}

// Module-level subscriber set so all hook instances stay in sync when any one
// instance writes to localStorage (StorageEvent only fires for cross-tab changes).
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
	for (const fn of subscribers) fn();
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

	useEffect(() => {
		// Sync on mount and subscribe for cross-instance updates
		setCustomNarrators(readFromStorage());
		const refresh = () => setCustomNarrators(readFromStorage());
		subscribers.add(refresh);
		return () => {
			subscribers.delete(refresh);
		};
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
			notifySubscribers();
			return updated;
		});

		return newRecord;
	};

	const update = (id: string, fields: Partial<EditableFields>): void => {
		setCustomNarrators((prev) => {
			const idx = prev.findIndex((r) => r.id === id);
			if (idx === -1) return prev;
			const updated = prev.map((r) => (r.id === id ? { ...r, ...fields } : r));
			writeToStorage(updated);
			notifySubscribers();
			return updated;
		});
	};

	const remove = (id: string): void => {
		setCustomNarrators((prev) => {
			const idx = prev.findIndex((r) => r.id === id);
			if (idx === -1) return prev;
			const updated = prev.filter((r) => r.id !== id);
			writeToStorage(updated);
			notifySubscribers();
			return updated;
		});
	};

	return { customNarrators, add, update, remove };
}
