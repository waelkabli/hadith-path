import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HadithSplitView } from "@/components/hadith-split-view";

afterEach(() => {
	cleanup();
});

// "حدثنا مالك عن أنس"
// indices: ح(0)د(1)ث(2)ن(3)ا(4) (5)م(6)ا(7)ل(8)ك(9) (10)ع(11)ن(12) (13)أ(14)ن(15)س(16)
// slice(0, 10) = "حدثنا مالك"  slice(10) = " عن أنس"
const TEXT = "حدثنا مالك عن أنس";
const SPLIT_AT = 10;

describe("HadithSplitView", () => {
	it("renders the 'السند' label", () => {
		render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
		expect(screen.getByText("السند")).toBeDefined();
	});

	it("renders the 'المتن' label", () => {
		render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
		expect(screen.getByText("المتن")).toBeDefined();
	});

	it("renders the isnad text (text.slice(0, splitAt).trim())", () => {
		render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
		expect(screen.getByText("حدثنا مالك")).toBeDefined();
	});

	it("renders the matn text (text.slice(splitAt).trim())", () => {
		render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
		expect(screen.getByText("عن أنس")).toBeDefined();
	});

	it("trims leading whitespace from the matn section when splitAt falls before a space", () => {
		render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
		expect(screen.queryByText(" عن أنس")).toBeNull();
		expect(screen.getByText("عن أنس")).toBeDefined();
	});

	it("trims trailing whitespace from the isnad section when splitAt falls after a space", () => {
		// SPLIT_AT=11 puts the space inside the isnad slice: "حدثنا مالك "
		render(<HadithSplitView text={TEXT} splitAt={11} />);
		expect(screen.queryByText("حدثنا مالك ")).toBeNull();
		expect(screen.getByText("حدثنا مالك")).toBeDefined();
	});

	describe("edit split button (F3)", () => {
		it("shows the edit button when onEditSplit is provided", () => {
			render(
				<HadithSplitView
					text={TEXT}
					splitAt={SPLIT_AT}
					onEditSplit={mock(() => {})}
				/>,
			);
			expect(screen.getByText("تعديل نقطة الفصل")).toBeDefined();
		});

		it("does not show the edit button when onEditSplit is omitted", () => {
			render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
			expect(screen.queryByText("تعديل نقطة الفصل")).toBeNull();
		});

		it("calls onEditSplit when the edit button is clicked", async () => {
			const onEditSplit = mock(() => {});
			render(
				<HadithSplitView
					text={TEXT}
					splitAt={SPLIT_AT}
					onEditSplit={onEditSplit}
				/>,
			);
			await userEvent.click(screen.getByText("تعديل نقطة الفصل"));
			expect(onEditSplit).toHaveBeenCalledTimes(1);
		});
	});

	describe("corrected badge (F3)", () => {
		it("shows the badge when corrected is true", () => {
			render(
				<HadithSplitView text={TEXT} splitAt={SPLIT_AT} corrected={true} />,
			);
			expect(screen.getByText("تم التعديل يدوياً")).toBeDefined();
		});

		it("does not show the badge when corrected is false", () => {
			render(
				<HadithSplitView text={TEXT} splitAt={SPLIT_AT} corrected={false} />,
			);
			expect(screen.queryByText("تم التعديل يدوياً")).toBeNull();
		});

		it("does not show the badge when corrected is omitted", () => {
			render(<HadithSplitView text={TEXT} splitAt={SPLIT_AT} />);
			expect(screen.queryByText("تم التعديل يدوياً")).toBeNull();
		});
	});
});
