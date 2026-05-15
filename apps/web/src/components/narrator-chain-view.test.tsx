import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { NarratorChainView } from "@/components/narrator-chain-view";
import type { NarratorMatch } from "@/lib/match-narrators";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNarrator(overrides: Partial<NarratorMatch> = {}): NarratorMatch {
	return {
		extractedName: "مالك",
		position: 0,
		mentionStart: 0,
		mentionEnd: 4,
		topMatches: [{ narratorId: "malik-ibn-anas", score: 0.9 }],
		selectedId: "malik-ibn-anas",
		userOverride: false,
		confidence: "high",
		isAmbiguous: false,
		...overrides,
	};
}

const DEFAULT_PROPS = {
	isLoading: false,
	error: null,
	isStale: false,
	showReExtract: false,
	onRetry: () => {},
	onReExtract: () => {},
};

afterEach(() => {
	cleanup();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NarratorChainView", () => {
	describe("summary banner", () => {
		it("shows correct unresolved count for narrators with !userOverride && (confidence === 'low' || isAmbiguous)", () => {
			const narrators = [
				makeNarrator({ position: 0, confidence: "high", isAmbiguous: false }), // resolved
				makeNarrator({
					position: 1,
					extractedName: "نافع",
					confidence: "low",
					isAmbiguous: false,
					userOverride: false,
				}), // unresolved
				makeNarrator({
					position: 2,
					extractedName: "ابن عمر",
					confidence: "medium",
					isAmbiguous: true,
					userOverride: false,
				}), // unresolved
			];

			render(<NarratorChainView {...DEFAULT_PROPS} narrators={narrators} />);

			// 2 unresolved → "٢ رواة غير محددين"
			expect(screen.getByText("٢ رواة غير محددين")).toBeTruthy();
		});

		it("banner is hidden when all narrators have userOverride: true or high confidence", () => {
			const narrators = [
				makeNarrator({
					position: 0,
					confidence: "high",
					isAmbiguous: false,
					userOverride: false,
				}),
				makeNarrator({
					position: 1,
					extractedName: "نافع",
					confidence: "low",
					isAmbiguous: false,
					userOverride: true, // overridden → not unresolved
				}),
			];

			render(<NarratorChainView {...DEFAULT_PROPS} narrators={narrators} />);

			expect(screen.queryByText(/غير محدد/)).toBeNull();
			expect(screen.queryByText("راجع الآن")).toBeNull();
		});

		it("راجع الآن button calls onStartGuided", () => {
			const onStartGuided = mock(() => {});
			const narrators = [
				makeNarrator({
					position: 0,
					confidence: "low",
					isAmbiguous: false,
					userOverride: false,
				}),
			];

			render(
				<NarratorChainView
					{...DEFAULT_PROPS}
					narrators={narrators}
					onStartGuided={onStartGuided}
				/>,
			);

			fireEvent.click(screen.getByText("راجع الآن"));
			expect(onStartGuided.mock.calls).toHaveLength(1);
		});
	});

	describe("narrator state icons", () => {
		it("user-confirmed narrator (userOverride: true, selectedId !== null) shows checkmark icon", () => {
			const narrators = [
				makeNarrator({
					position: 0,
					userOverride: true,
					selectedId: "malik-ibn-anas",
				}),
			];

			render(<NarratorChainView {...DEFAULT_PROPS} narrators={narrators} />);

			expect(screen.getByLabelText("مؤكد")).toBeTruthy();
		});

		it("unknown narrator (userOverride: true, selectedId: null) shows ؟ indicator", () => {
			const narrators = [
				makeNarrator({
					position: 0,
					userOverride: true,
					selectedId: null,
				}),
			];

			render(<NarratorChainView {...DEFAULT_PROPS} narrators={narrators} />);

			expect(screen.getByLabelText("غير معروف")).toBeTruthy();
		});
	});

	describe("click interaction", () => {
		it("clicking a narrator card calls onSelect with its position", () => {
			const onSelect = mock(() => {});
			const narrators = [
				makeNarrator({ position: 0, extractedName: "مالك" }),
				makeNarrator({ position: 1, extractedName: "نافع" }),
			];

			render(
				<NarratorChainView
					{...DEFAULT_PROPS}
					narrators={narrators}
					onSelect={onSelect}
				/>,
			);

			const items = screen.getAllByRole("button");
			// Find the narrator list item buttons (not the re-extract button if visible)
			// Items with role=button are the narrator li elements when onSelect is provided
			fireEvent.click(items[0]);
			expect(onSelect.mock.calls).toHaveLength(1);
			expect(onSelect.mock.calls[0][0]).toBe(0);

			fireEvent.click(items[1]);
			expect(onSelect.mock.calls).toHaveLength(2);
			expect(onSelect.mock.calls[1][0]).toBe(1);
		});

		it("selected narrator (position === selectedPosition) has blue border styling", () => {
			const narrators = [
				makeNarrator({ position: 0, extractedName: "مالك" }),
				makeNarrator({ position: 1, extractedName: "نافع" }),
			];

			render(
				<NarratorChainView
					{...DEFAULT_PROPS}
					narrators={narrators}
					onSelect={() => {}}
					selectedPosition={1}
				/>,
			);

			const items = screen.getAllByRole("button");
			// items[0] = position 0 (not selected), items[1] = position 1 (selected)
			const selectedItem = items[1] as HTMLElement;
			expect(selectedItem.style.border).toContain("#2563eb");
		});
	});
});
