import { useEffect, useState } from "react";

import type { NarratorMatch } from "@/lib/match-narrators";

export const VARIANT_PALETTE = [
	"#0d9488",
	"#d97706",
	"#7c3aed",
	"#e11d48",
	"#0284c7",
];

const STORAGE_KEY = "hadith-variants";

export interface Variant {
	id: string;
	label: string;
	color: string;
	rawText: string;
	splitAt: number | null;
	narrators: NarratorMatch[] | null;
}

const PRIMARY_VARIANT: Variant = {
	id: "variant-primary",
	label: "النسخة 1",
	color: VARIANT_PALETTE[0],
	rawText: "",
	splitAt: null,
	narrators: null,
};

function readFromStorage(): Variant[] {
	try {
		const json = localStorage.getItem(STORAGE_KEY);
		if (!json) return [PRIMARY_VARIANT];
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed) || parsed.length === 0) return [PRIMARY_VARIANT];
		return parsed as Variant[];
	} catch {
		return [PRIMARY_VARIANT];
	}
}

function writeToStorage(variants: Variant[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(variants));
	} catch {
		// ignore storage errors
	}
}

export interface UseVariantsReturn {
	variants: Variant[];
	canAddMore: boolean;
	addVariant: () => void;
	removeVariant: (id: string) => void;
	updateVariant: (id: string, data: Partial<Variant>) => void;
}

export function useVariants(): UseVariantsReturn {
	const [variants, setVariants] = useState<Variant[]>(() => readFromStorage());

	useEffect(() => {
		setVariants(readFromStorage());
	}, []);

	const canAddMore = variants.length < 5;

	const addVariant = () => {
		setVariants((prev) => {
			if (prev.length >= 5) return prev;
			const n = prev.length + 1;
			const newVariant: Variant = {
				id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
				label: `النسخة ${n}`,
				color: VARIANT_PALETTE[n - 1],
				rawText: "",
				splitAt: null,
				narrators: null,
			};
			const updated = [...prev, newVariant];
			writeToStorage(updated);
			return updated;
		});
	};

	const removeVariant = (id: string) => {
		setVariants((prev) => {
			// Never remove index 0 (primary)
			if (prev[0]?.id === id) return prev;
			const updated = prev.filter((v) => v.id !== id);
			writeToStorage(updated);
			return updated;
		});
	};

	const updateVariant = (id: string, data: Partial<Variant>) => {
		setVariants((prev) => {
			const idx = prev.findIndex((v) => v.id === id);
			if (idx === -1) return prev;
			const updated = prev.map((v) => (v.id === id ? { ...v, ...data } : v));
			writeToStorage(updated);
			return updated;
		});
	};

	return { variants, canAddMore, addVariant, removeVariant, updateVariant };
}
