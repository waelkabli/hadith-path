import { describe, it } from "bun:test";

// Tests for useSplitCorrection hook (apps/web/src/hooks/use-split-correction.ts)
// Requires React testing infrastructure (@testing-library/react + jsdom).

describe("useSplitCorrection", () => {
	describe("initialisation", () => {
		it.todo("draftSplitAt initialises to currentSplitAt on mount");
		it.todo(
			"wordBoundaries is computed from the text on mount and contains the correct character offsets for each whitespace-delimited token",
		);
		it.todo(
			"wordBoundaries for 'مالك بن أنس' contains three entries at the correct offsets",
		);
	});

	describe("drag snapping", () => {
		it.todo(
			"onDrag() snaps the provided offset to the nearest word boundary in wordBoundaries",
		);
		it.todo(
			"onDrag() never sets draftSplitAt to a value that is not in wordBoundaries",
		);
		it.todo("onDrag() updates draftSplitAt without persisting to localStorage");
	});

	describe("reset", () => {
		it.todo(
			"reset() sets draftSplitAt back to llmSplitAt without writing to localStorage",
		);
		it.todo("after reset(), confirm() persists llmSplitAt as the new splitAt");
	});

	describe("confirm", () => {
		it.todo(
			"confirm() writes splitAt = draftSplitAt and corrected = true to hadith-parse-result in localStorage",
		);
		it.todo(
			"confirm() calls the onConfirm callback with the confirmed splitAt value",
		);
		it.todo("confirm() does not overwrite llmSplitAt in localStorage");
	});

	describe("cancel", () => {
		it.todo(
			"cancel() calls the onCancel callback without writing to localStorage",
		);
		it.todo("hadith-parse-result.splitAt is unchanged after cancel()");
	});
});
