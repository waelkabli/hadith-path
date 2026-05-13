import { describe, it } from "bun:test";

// Tests for useHadithParser hook (apps/web/src/hooks/use-hadith-parser.ts)
// Requires React testing infrastructure (@testing-library/react + jsdom).

describe("useHadithParser", () => {
	describe("API key guard", () => {
		it.todo(
			"parse() with no stored API key sets error and does not call parseHadith",
		);
	});

	describe("successful parse", () => {
		it.todo(
			"parse() with a valid key calls parseHadith and sets result.splitAt from the response",
		);
		it.todo(
			"parse() writes { inputHash, llmSplitAt, splitAt, corrected: false } to hadith-parse-result in localStorage",
		);
		it.todo("isLoading is true while parseHadith is in flight");
		it.todo("isLoading becomes false after parseHadith resolves");
	});

	describe("failed parse", () => {
		it.todo("parse() sets error and clears result when parseHadith throws");
		it.todo("isLoading returns to false after parseHadith throws");
	});

	describe("reset", () => {
		it.todo("reset() clears result and error");
		it.todo("reset() removes hadith-parse-result from localStorage");
	});

	describe("localStorage restore", () => {
		it.todo(
			"restores result from hadith-parse-result on mount when the stored inputHash matches the current input",
		);
		it.todo(
			"does not restore result when the stored inputHash does not match the current input",
		);
	});
});
