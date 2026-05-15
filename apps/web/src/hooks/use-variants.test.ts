import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useVariants, VARIANT_PALETTE } from "@/hooks/use-variants";

const STORAGE_KEY = "hadith-variants";

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

describe("useVariants", () => {
	describe("addVariant", () => {
		it("addVariant() appends a new empty Variant with a unique id and the next label ('النسخة 2')", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
			});
			expect(result.current.variants).toHaveLength(2);
			const added = result.current.variants[1];
			expect(added.label).toBe("النسخة 2");
			expect(added.rawText).toBe("");
			expect(added.narrators).toBeNull();
			expect(added.splitAt).toBeNull();
			expect(added.id).not.toBe(result.current.variants[0].id);
		});

		it("canAddMore is true when fewer than 5 variants are loaded", () => {
			const { result } = renderHook(() => useVariants());
			// starts with 1 variant
			expect(result.current.canAddMore).toBe(true);
			act(() => {
				result.current.addVariant();
			});
			expect(result.current.canAddMore).toBe(true); // 2 variants
		});

		it("canAddMore is false when 5 variants are loaded", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
			});
			expect(result.current.variants).toHaveLength(5);
			expect(result.current.canAddMore).toBe(false);
		});

		it("addVariant() is a no-op when variants.length is already 5", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
			});
			expect(result.current.variants).toHaveLength(5);
			act(() => {
				result.current.addVariant();
			});
			expect(result.current.variants).toHaveLength(5);
		});
	});

	describe("removeVariant", () => {
		it("removeVariant(id) removes the variant with that id from state", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
			});
			const addedId = result.current.variants[1].id;
			act(() => {
				result.current.removeVariant(addedId);
			});
			expect(result.current.variants).toHaveLength(1);
			expect(
				result.current.variants.find((v) => v.id === addedId),
			).toBeUndefined();
		});

		it("removeVariant(id) removes the variant from hadith-variants in localStorage", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
			});
			const addedId = result.current.variants[1].id;
			act(() => {
				result.current.removeVariant(addedId);
			});
			const stored = JSON.parse(
				localStorage.getItem(STORAGE_KEY) ?? "null",
			) as { id: string }[];
			expect(Array.isArray(stored)).toBe(true);
			expect(stored.find((v) => v.id === addedId)).toBeUndefined();
		});

		it("after removeVariant(), canAddMore becomes true if variants.length was 5", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
			});
			expect(result.current.variants).toHaveLength(5);
			const lastId = result.current.variants[4].id;
			act(() => {
				result.current.removeVariant(lastId);
			});
			expect(result.current.canAddMore).toBe(true);
		});

		it("removeVariant() with a non-existent id is a no-op", () => {
			const { result } = renderHook(() => useVariants());
			const before = result.current.variants.length;
			act(() => {
				result.current.removeVariant("non-existent-id");
			});
			expect(result.current.variants.length).toBe(before);
		});

		it("removeVariant() does not remove the primary variant (index 0)", () => {
			const { result } = renderHook(() => useVariants());
			const primaryId = result.current.variants[0].id;
			act(() => {
				result.current.removeVariant(primaryId);
			});
			expect(result.current.variants).toHaveLength(1);
			expect(result.current.variants[0].id).toBe(primaryId);
		});
	});

	describe("updateVariant", () => {
		it("updateVariant(id, data) merges data into the matching variant without affecting other variants", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
			});
			const secondId = result.current.variants[1].id;
			act(() => {
				result.current.updateVariant(secondId, { rawText: "نص الحديث" });
			});
			expect(result.current.variants[1].rawText).toBe("نص الحديث");
			// primary variant unchanged
			expect(result.current.variants[0].rawText).toBe("");
		});

		it("updateVariant() persists the change to hadith-variants in localStorage", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
			});
			const secondId = result.current.variants[1].id;
			act(() => {
				result.current.updateVariant(secondId, { rawText: "نص محفوظ" });
			});
			const stored = JSON.parse(
				localStorage.getItem(STORAGE_KEY) ?? "null",
			) as { id: string; rawText: string }[];
			const persisted = stored.find((v) => v.id === secondId);
			expect(persisted?.rawText).toBe("نص محفوظ");
		});
	});

	describe("persistence", () => {
		it("variants is populated from hadith-variants in localStorage on mount", () => {
			const seeded = [
				{
					id: "variant-primary",
					label: "النسخة 1",
					color: VARIANT_PALETTE[0],
					rawText: "نص مخزّن",
					splitAt: null,
					narrators: null,
				},
				{
					id: "variant-seeded-2",
					label: "النسخة 2",
					color: VARIANT_PALETTE[1],
					rawText: "",
					splitAt: null,
					narrators: null,
				},
			];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
			const { result } = renderHook(() => useVariants());
			expect(result.current.variants).toHaveLength(2);
			expect(result.current.variants[0].rawText).toBe("نص مخزّن");
			expect(result.current.variants[1].id).toBe("variant-seeded-2");
		});

		it("variants added in a previous session are restored after a simulated page reload", () => {
			const { result: first } = renderHook(() => useVariants());
			act(() => {
				first.current.addVariant();
			});
			const savedId = first.current.variants[1].id;

			// Simulate reload: new hook instance reads from the same localStorage
			const { result: second } = renderHook(() => useVariants());
			expect(second.current.variants).toHaveLength(2);
			expect(second.current.variants[1].id).toBe(savedId);
		});
	});

	describe("color assignment", () => {
		it("the first variant receives the first color in the pre-defined 5-color palette", () => {
			const { result } = renderHook(() => useVariants());
			expect(result.current.variants[0].color).toBe(VARIANT_PALETTE[0]);
		});

		it("each added variant receives the next color in the palette in order", () => {
			const { result } = renderHook(() => useVariants());
			act(() => {
				result.current.addVariant();
				result.current.addVariant();
				result.current.addVariant();
			});
			expect(result.current.variants[1].color).toBe(VARIANT_PALETTE[1]);
			expect(result.current.variants[2].color).toBe(VARIANT_PALETTE[2]);
			expect(result.current.variants[3].color).toBe(VARIANT_PALETTE[3]);
		});
	});
});
