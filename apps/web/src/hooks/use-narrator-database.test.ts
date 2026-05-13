import { describe, it } from "bun:test";

// Tests for useNarratorDatabase hook (apps/web/src/hooks/use-narrator-database.ts)
// Requires React testing infrastructure (@testing-library/react + jsdom).
// getNarratorDatabase() (the underlying fetch function) requires a mocked fetch or
// a real /data/narrators.json served in the test environment.

describe("useNarratorDatabase", () => {
	describe("loading", () => {
		it.todo("isLoading is true before the fetch resolves");
		it.todo("isLoading becomes false after the fetch resolves successfully");
		it.todo("isLoading becomes false even when the fetch fails");
	});

	describe("merged records", () => {
		it.todo(
			"records contains both bundled DB entries and custom narrator entries after a successful fetch",
		);
		it.todo(
			"adding a custom narrator via useCustomNarrators.add() updates records without re-fetching the bundled DB",
		);
		it.todo(
			"removing a custom narrator via useCustomNarrators.remove() removes it from records",
		);
	});

	describe("fetch caching", () => {
		it.todo(
			"getNarratorDatabase() is called only once per page lifetime — subsequent hook mounts return the cached result",
		);
	});

	describe("fetch failure", () => {
		it.todo(
			"error is set when the fetch fails, and records contains only custom narrator entries",
		);
		it.todo(
			"the hook does not crash when both the fetch fails and there are no custom narrators",
		);
	});
});
