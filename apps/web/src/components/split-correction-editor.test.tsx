import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SplitCorrectionEditor } from "@/components/split-correction-editor";

// "حدثنا مالك عن أنس"
// ح(0)د(1)ث(2)ن(3)ا(4) (5)م(6)ا(7)ل(8)ك(9) (10)ع(11)ن(12) (13)أ(14)ن(15)س(16)
// boundaries = [0, 6, 11, 14]
// slice(0, 6)  = "حدثنا"     (first word)
// slice(0, 11) = "حدثنا مالك"
// slice(11)    = " عن أنس"
const TEXT = "حدثنا مالك عن أنس";

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	cleanup();
	localStorage.clear();
});

describe("SplitCorrectionEditor", () => {
	describe("rendering", () => {
		it("renders the تأكيد confirm button", () => {
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={mock(() => {})}
				/>,
			);
			expect(screen.getByText("تأكيد")).toBeDefined();
		});

		it("renders the إعادة تعيين reset button", () => {
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={mock(() => {})}
				/>,
			);
			expect(screen.getByText("إعادة تعيين")).toBeDefined();
		});

		it("renders the إلغاء cancel button", () => {
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={mock(() => {})}
				/>,
			);
			expect(screen.getByText("إلغاء")).toBeDefined();
		});

		it("renders isnad portion in [data-part='isnad']", () => {
			// splitAt=11 snaps to boundary 11 → isnad = text.slice(0, 11) = "حدثنا مالك "
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={mock(() => {})}
				/>,
			);
			const isnadEl = document.querySelector("[data-part='isnad']");
			expect(isnadEl).not.toBeNull();
			expect(isnadEl?.textContent).toBe(TEXT.slice(0, 11));
		});

		it("renders matn portion in [data-part='matn']", () => {
			// splitAt=11 → matn = text.slice(11) = "عن أنس"
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={mock(() => {})}
				/>,
			);
			const matnEl = document.querySelector("[data-part='matn']");
			expect(matnEl).not.toBeNull();
			expect(matnEl?.textContent).toBe(TEXT.slice(11));
		});
	});

	describe("button actions", () => {
		it("clicking تأكيد calls onConfirm with the current (snapped) splitAt", async () => {
			const onConfirm = mock((_v: number) => {});
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={onConfirm}
					onCancel={mock(() => {})}
				/>,
			);
			await userEvent.click(screen.getByText("تأكيد"));
			expect(onConfirm).toHaveBeenCalledWith(11);
		});

		it("clicking إلغاء calls onCancel", async () => {
			const onCancel = mock(() => {});
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={11}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={onCancel}
				/>,
			);
			await userEvent.click(screen.getByText("إلغاء"));
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		it("clicking إعادة تعيين resets isnad text to the llmSplitAt boundary", async () => {
			// splitAt=14 (current), llmSplitAt=11 (LLM original)
			// Before reset: isnad = text.slice(0, 14) = "حدثنا مالك عن "
			// After reset:  isnad = text.slice(0, 11) = "حدثنا مالك "
			render(
				<SplitCorrectionEditor
					text={TEXT}
					splitAt={14}
					llmSplitAt={11}
					onConfirm={mock(() => {})}
					onCancel={mock(() => {})}
				/>,
			);
			expect(document.querySelector("[data-part='isnad']")?.textContent).toBe(
				TEXT.slice(0, 14),
			);

			await userEvent.click(screen.getByText("إعادة تعيين"));

			expect(document.querySelector("[data-part='isnad']")?.textContent).toBe(
				TEXT.slice(0, 11),
			);
		});
	});
});
