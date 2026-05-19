import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import {
	computeWordBoundaries,
	snapToNearestBoundary,
	useSplitCorrection,
} from "@/hooks/use-split-correction";

// "حدثنا مالك عن أنس"
// ح(0)د(1)ث(2)ن(3)ا(4) (5)م(6)ا(7)ل(8)ك(9) (10)ع(11)ن(12) (13)أ(14)ن(15)س(16)
// boundaries = [0, 6, 11, 14]
const TEXT = "حدثنا مالك عن أنس";
const BOUNDARIES = [0, 6, 11, 14];

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

// ── computeWordBoundaries ────────────────────────────────────────────────────

describe("computeWordBoundaries", () => {
	it("returns empty array for empty string", () => {
		expect(computeWordBoundaries("")).toEqual([]);
	});

	it("returns [0] for a single word with no spaces", () => {
		expect(computeWordBoundaries("مالك")).toEqual([0]);
	});

	it("returns three entries at the correct offsets for 'مالك بن أنس'", () => {
		// م(0)ا(1)ل(2)ك(3) (4)ب(5)ن(6) (7)أ(8)ن(9)س(10)
		expect(computeWordBoundaries("مالك بن أنس")).toEqual([0, 5, 8]);
	});

	it("handles multiple consecutive spaces without duplicate boundaries", () => {
		// word at 0, then spaces at 4-5, word at 6
		expect(computeWordBoundaries("مالك  بن")).toEqual([0, 6]);
	});

	it("returns the correct offsets for the standard test hadith", () => {
		expect(computeWordBoundaries(TEXT)).toEqual(BOUNDARIES);
	});
});

// ── snapToNearestBoundary ────────────────────────────────────────────────────

describe("snapToNearestBoundary", () => {
	it("returns 0 when boundaries is empty", () => {
		expect(snapToNearestBoundary(5, [])).toBe(0);
	});

	it("returns the boundary exactly when the offset matches", () => {
		expect(snapToNearestBoundary(6, BOUNDARIES)).toBe(6);
	});

	it("snaps to the nearest boundary when offset is between two", () => {
		// between 6 and 11: offset 8 → closer to 6 (dist 2) than 11 (dist 3)
		expect(snapToNearestBoundary(8, BOUNDARIES)).toBe(6);
		// offset 9 → closer to 11 (dist 2) than 6 (dist 3)
		expect(snapToNearestBoundary(9, BOUNDARIES)).toBe(11);
	});
});

// ── useSplitCorrection ───────────────────────────────────────────────────────

describe("useSplitCorrection", () => {
	describe("initialisation", () => {
		it("draftSplitAt initialises to the snapped currentSplitAt on mount", () => {
			// currentSplitAt=8 → nearest boundary is 6 (dist 2 < dist 3 to 11)
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 8,
					llmSplitAt: 8,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			expect(result.current.draftSplitAt).toBe(6);
		});

		it("wordBoundaries is computed from the text on mount", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			expect(result.current.wordBoundaries).toEqual(BOUNDARIES);
		});

		it("wordBoundaries for 'مالك بن أنس' contains three entries at the correct offsets", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: "مالك بن أنس",
					currentSplitAt: 0,
					llmSplitAt: 0,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			expect(result.current.wordBoundaries).toEqual([0, 5, 8]);
		});
	});

	describe("drag snapping", () => {
		it("onDrag() updates draftSplitAt to the nearest word boundary", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(12));
			// 12 is between 11 (dist 1) and 14 (dist 2) → snaps to 11
			expect(result.current.draftSplitAt).toBe(11);
		});

		it("onDrag() never sets draftSplitAt to a value outside wordBoundaries", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			// Drag to mid-word offset 8 — must snap to a boundary
			act(() => result.current.onDrag(8));
			expect(result.current.wordBoundaries).toContain(
				result.current.draftSplitAt,
			);
		});

		it("onDrag() does not write to localStorage", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(11));
			expect(localStorage.getItem("hadith-parse-result")).toBeNull();
		});
	});

	describe("reset", () => {
		it("reset() sets draftSplitAt back to the snapped llmSplitAt without persisting", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 11,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			// First drag away from llmSplitAt
			act(() => result.current.onDrag(14));
			expect(result.current.draftSplitAt).toBe(14);

			act(() => result.current.reset());
			expect(result.current.draftSplitAt).toBe(11);
			expect(localStorage.getItem("hadith-parse-result")).toBeNull();
		});

		it("after reset(), confirm() persists llmSplitAt as the new splitAt", () => {
			const onConfirm = mock((_v: number) => {});
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 11,
					onConfirm,
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(14));
			act(() => result.current.reset());
			act(() => result.current.confirm());

			const stored = JSON.parse(
				localStorage.getItem("hadith-parse-result") ?? "{}",
			);
			expect(stored.splitAt).toBe(11);
			expect(onConfirm).toHaveBeenCalledWith(11);
		});
	});

	describe("confirm", () => {
		it("writes splitAt = draftSplitAt and corrected = true to localStorage", () => {
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(11));
			act(() => result.current.confirm());

			const stored = JSON.parse(
				localStorage.getItem("hadith-parse-result") ?? "{}",
			);
			expect(stored.splitAt).toBe(11);
			expect(stored.corrected).toBe(true);
		});

		it("calls onConfirm with the confirmed splitAt value", () => {
			const onConfirm = mock((_v: number) => {});
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm,
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(14));
			act(() => result.current.confirm());
			expect(onConfirm).toHaveBeenCalledWith(14);
		});

		it("does not overwrite llmSplitAt in localStorage", () => {
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify({ llmSplitAt: 6, splitAt: 6, corrected: false }),
			);
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(11));
			act(() => result.current.confirm());

			const stored = JSON.parse(
				localStorage.getItem("hadith-parse-result") ?? "{}",
			);
			expect(stored.llmSplitAt).toBe(6);
		});

		it("preserves other fields already in hadith-parse-result", () => {
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify({
					inputHash: "abc123",
					llmSplitAt: 6,
					splitAt: 6,
					corrected: false,
				}),
			);
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.confirm());

			const stored = JSON.parse(
				localStorage.getItem("hadith-parse-result") ?? "{}",
			);
			expect(stored.inputHash).toBe("abc123");
		});
	});

	describe("cancel", () => {
		it("calls onCancel without writing to localStorage", () => {
			const onCancel = mock(() => {});
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel,
				}),
			);
			act(() => result.current.cancel());
			expect(onCancel).toHaveBeenCalledTimes(1);
			expect(localStorage.getItem("hadith-parse-result")).toBeNull();
		});

		it("leaves hadith-parse-result.splitAt unchanged after cancel", () => {
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify({ splitAt: 6, corrected: false }),
			);
			const { result } = renderHook(() =>
				useSplitCorrection({
					text: TEXT,
					currentSplitAt: 6,
					llmSplitAt: 6,
					onConfirm: mock(() => {}),
					onCancel: mock(() => {}),
				}),
			);
			act(() => result.current.onDrag(11));
			act(() => result.current.cancel());

			const stored = JSON.parse(
				localStorage.getItem("hadith-parse-result") ?? "{}",
			);
			expect(stored.splitAt).toBe(6);
		});
	});
});
