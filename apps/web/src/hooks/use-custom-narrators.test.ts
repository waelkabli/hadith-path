import { describe, it } from "bun:test";

// Tests for useCustomNarrators hook (apps/web/src/hooks/use-custom-narrators.ts)
// Requires React testing infrastructure (@testing-library/react + jsdom).

describe("useCustomNarrators", () => {
	describe("add", () => {
		it.todo(
			"add() generates a custom- prefixed ID and appends the record to hadith-custom-narrators in localStorage",
		);
		it.todo("add() returns the full NarratorRecord including the generated ID");
		it.todo(
			"add() fills teachers, students, and collections with empty arrays when not provided",
		);
		it.todo(
			"calling add() twice results in two records with distinct IDs in localStorage",
		);
	});

	describe("update", () => {
		it.todo(
			"update(id, fields) modifies only the specified fields and leaves all other fields unchanged",
		);
		it.todo(
			"update() persists the change to hadith-custom-narrators in localStorage immediately",
		);
		it.todo("update() with a non-existent ID is a no-op");
	});

	describe("remove", () => {
		it.todo(
			"remove(id) deletes the record from hadith-custom-narrators in localStorage",
		);
		it.todo("remove() with a non-existent ID is a no-op and does not throw");
		it.todo(
			"after remove(), the deleted record no longer appears in customNarrators",
		);
	});

	describe("persistence", () => {
		it.todo(
			"customNarrators is populated from hadith-custom-narrators in localStorage on mount",
		);
		it.todo(
			"records added in a previous session are present after a simulated page reload",
		);
	});
});
