import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useCustomNarrators } from "@/hooks/use-custom-narrators";

const STORAGE_KEY = "hadith-custom-narrators";

const BASE_INPUT = {
	nameArabic: "عبد الله بن زيد",
	nameTransliterated: "Abd Allah ibn Zayd",
	birthYear: null,
	deathYear: 65,
	generation: "Tabi'i" as const,
	reliabilityGrade: "ثقة",
	bioNote: "A test narrator",
};

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

describe("useCustomNarrators", () => {
	describe("add", () => {
		it("add() generates a custom- prefixed ID", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let record!: ReturnType<typeof result.current.add>;
			act(() => {
				record = result.current.add(BASE_INPUT);
			});
			expect(record.id).toMatch(/^custom-/);
		});

		it("the new record is in customNarrators after add()", () => {
			const { result } = renderHook(() => useCustomNarrators());
			act(() => {
				result.current.add(BASE_INPUT);
			});
			expect(result.current.customNarrators).toHaveLength(1);
			expect(result.current.customNarrators[0].nameArabic).toBe(
				BASE_INPUT.nameArabic,
			);
		});

		it("the record is written to hadith-custom-narrators in localStorage with all fields", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let record!: ReturnType<typeof result.current.add>;
			act(() => {
				record = result.current.add(BASE_INPUT);
			});
			const raw = localStorage.getItem(STORAGE_KEY);
			expect(raw).not.toBeNull();
			const stored = JSON.parse(raw ?? "null");
			expect(Array.isArray(stored)).toBe(true);
			expect(stored).toHaveLength(1);
			expect(stored[0].id).toBe(record.id);
			expect(stored[0].nameArabic).toBe(BASE_INPUT.nameArabic);
			expect(stored[0].teachers).toEqual([]);
			expect(stored[0].students).toEqual([]);
			expect(stored[0].collections).toEqual([]);
		});

		it("adding a second record appends without overwriting the first", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let first!: ReturnType<typeof result.current.add>;
			let second!: ReturnType<typeof result.current.add>;
			act(() => {
				first = result.current.add(BASE_INPUT);
			});
			act(() => {
				second = result.current.add({
					...BASE_INPUT,
					nameArabic: "محمد بن علي",
					nameTransliterated: "Muhammad ibn Ali",
				});
			});
			expect(result.current.customNarrators).toHaveLength(2);
			expect(first.id).not.toBe(second.id);
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
			expect(stored).toHaveLength(2);
		});

		it("on mount, reads from localStorage (simulated reload)", () => {
			// Pre-seed localStorage with a narrator record
			const seeded = [
				{
					id: "custom-seeded-abc",
					nameArabic: "راوٍ محفوظ",
					nameTransliterated: "Preserved Narrator",
					birthYear: null,
					deathYear: null,
					generation: "later",
					reliabilityGrade: "ثقة",
					teachers: [],
					students: [],
					collections: [],
					bioNote: "",
				},
			];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

			const { result } = renderHook(() => useCustomNarrators());
			expect(result.current.customNarrators).toHaveLength(1);
			expect(result.current.customNarrators[0].id).toBe("custom-seeded-abc");
			expect(result.current.customNarrators[0].nameArabic).toBe("راوٍ محفوظ");
		});
	});

	describe("update", () => {
		it("update(id, fields) modifies only the specified fields", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let record!: ReturnType<typeof result.current.add>;
			act(() => {
				record = result.current.add(BASE_INPUT);
			});

			act(() => {
				result.current.update(record.id, { nameArabic: "اسم جديد" });
			});

			const updated = result.current.customNarrators.find(
				(r) => r.id === record.id,
			);
			expect(updated?.nameArabic).toBe("اسم جديد");
			// Other fields unchanged
			expect(updated?.nameTransliterated).toBe(BASE_INPUT.nameTransliterated);
			expect(updated?.reliabilityGrade).toBe(BASE_INPUT.reliabilityGrade);
		});

		it("update(id, fields) persists to localStorage", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let record!: ReturnType<typeof result.current.add>;
			act(() => {
				record = result.current.add(BASE_INPUT);
			});

			act(() => {
				result.current.update(record.id, { deathYear: 99 });
			});

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
			const persisted = stored.find((r: { id: string }) => r.id === record.id);
			expect(persisted?.deathYear).toBe(99);
		});

		it("update with a non-existent ID is a no-op", () => {
			const { result } = renderHook(() => useCustomNarrators());
			act(() => {
				result.current.add(BASE_INPUT);
			});
			const before = result.current.customNarrators.length;

			act(() => {
				result.current.update("non-existent-id", { nameArabic: "شيء" });
			});

			expect(result.current.customNarrators.length).toBe(before);
		});
	});

	describe("remove", () => {
		it("remove(id) removes the record from customNarrators", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let record!: ReturnType<typeof result.current.add>;
			act(() => {
				record = result.current.add(BASE_INPUT);
			});
			expect(result.current.customNarrators).toHaveLength(1);

			act(() => {
				result.current.remove(record.id);
			});

			expect(result.current.customNarrators).toHaveLength(0);
		});

		it("remove(id) persists to localStorage — subsequent reads do not include the record", () => {
			const { result } = renderHook(() => useCustomNarrators());
			let record!: ReturnType<typeof result.current.add>;
			act(() => {
				record = result.current.add(BASE_INPUT);
			});

			act(() => {
				result.current.remove(record.id);
			});

			const stored = JSON.parse(
				localStorage.getItem(STORAGE_KEY) ?? "null",
			) as { id: string }[];
			expect(Array.isArray(stored)).toBe(true);
			expect(stored.find((r) => r.id === record.id)).toBeUndefined();
		});

		it("remove with a non-existent ID is a no-op", () => {
			const { result } = renderHook(() => useCustomNarrators());
			act(() => {
				result.current.add(BASE_INPUT);
			});
			const before = result.current.customNarrators.length;

			act(() => {
				result.current.remove("non-existent-id");
			});

			expect(result.current.customNarrators.length).toBe(before);
		});
	});
});
