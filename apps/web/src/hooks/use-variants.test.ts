import { describe, it } from "bun:test";

// Tests for useVariants hook (apps/web/src/hooks/use-variants.ts)
// Requires React testing infrastructure (@testing-library/react + jsdom).

describe("useVariants", () => {
	describe("addVariant", () => {
		it.todo(
			"addVariant() appends a new empty Variant with a unique id and the next label ('النسخة 2')",
		);
		it.todo("canAddMore is true when fewer than 5 variants are loaded");
		it.todo("canAddMore is false when 5 variants are loaded");
		it.todo("addVariant() is a no-op when variants.length is already 5");
	});

	describe("removeVariant", () => {
		it.todo("removeVariant(id) removes the variant with that id from state");
		it.todo(
			"removeVariant(id) removes the variant from hadith-variants in localStorage",
		);
		it.todo(
			"after removeVariant(), canAddMore becomes true if variants.length was 5",
		);
		it.todo("removeVariant() with a non-existent id is a no-op");
	});

	describe("updateVariant", () => {
		it.todo(
			"updateVariant(id, data) merges data into the matching variant without affecting other variants",
		);
		it.todo(
			"updateVariant() persists the change to hadith-variants in localStorage",
		);
	});

	describe("persistence", () => {
		it.todo(
			"variants is populated from hadith-variants in localStorage on mount",
		);
		it.todo(
			"variants added in a previous session are restored after a simulated page reload",
		);
	});

	describe("color assignment", () => {
		it.todo(
			"the first variant receives the first color in the pre-defined 5-color palette",
		);
		it.todo(
			"each added variant receives the next color in the palette in order",
		);
	});
});
