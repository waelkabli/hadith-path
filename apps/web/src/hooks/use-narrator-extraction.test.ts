import { describe, it } from "bun:test";

// Tests for useNarratorExtraction hook (apps/web/src/hooks/use-narrator-extraction.ts)
// Requires React testing infrastructure (@testing-library/react + jsdom).

describe("useNarratorExtraction", () => {
	describe("API key guard", () => {
		it.todo(
			"extract() with no stored API key sets error and does not call extractNarrators",
		);
	});

	describe("successful extraction", () => {
		it.todo(
			"extract() calls extractNarrators then matchNarrators and sets narrators in state",
		);
		it.todo(
			"extract() writes { inputHash, narrators } to hadith-narrator-extraction in localStorage",
		);
		it.todo(
			"isLoading is true while extraction is in flight and false after it resolves",
		);
	});

	describe("failed extraction", () => {
		it.todo(
			"extract() sets error when extractNarrators throws, leaving existing narrators state untouched",
		);
	});

	describe("confirmMatch", () => {
		it.todo(
			"confirmMatch(position, narratorId) sets selectedId and userOverride: true for the narrator at that position",
		);
		it.todo(
			"confirmMatch(position, null) sets selectedId to null and userOverride: true (unknown narrator)",
		);
		it.todo(
			"confirmMatch persists the updated narrator list to hadith-narrator-extraction in localStorage",
		);
	});

	describe("reset", () => {
		it.todo("reset() clears narrators and error from state");
		it.todo("reset() removes hadith-narrator-extraction from localStorage");
	});

	describe("localStorage restore", () => {
		it.todo(
			"restores narrators on mount when the stored inputHash matches the isnad-derived hash",
		);
		it.todo(
			"does not restore narrators when the stored inputHash does not match",
		);
	});
});
