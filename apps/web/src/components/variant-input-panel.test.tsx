import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { VariantInputPanel } from "@/components/variant-input-panel";
import type { Variant } from "@/hooks/use-variants";
import type { NarratorMatch } from "@/lib/match-narrators";

afterEach(() => {
	cleanup();
	localStorage.clear();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMatch(position: number, name: string): NarratorMatch {
	return {
		extractedName: name,
		position,
		mentionStart: position * 10,
		mentionEnd: position * 10 + name.length,
		topMatches: [],
		selectedId: null,
		userOverride: false,
		confidence: "low",
		isAmbiguous: false,
	};
}

const UNANALYZED: Variant = {
	id: "v2",
	label: "النسخة 2",
	color: "#d97706",
	rawText: "",
	splitAt: null,
	narrators: null,
};

const ANALYZED: Variant = {
	id: "v2",
	label: "النسخة 2",
	color: "#d97706",
	rawText: "حدثنا مالك عن نافع عن ابن عمر",
	splitAt: 20,
	narrators: [
		makeMatch(0, "مالك"),
		makeMatch(1, "نافع"),
		makeMatch(2, "ابن عمر"),
	],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("VariantInputPanel", () => {
	it("shows the variant label in the header", () => {
		render(
			<VariantInputPanel
				variant={UNANALYZED}
				allRecords={[]}
				onUpdate={() => {}}
				onRemove={() => {}}
			/>,
		);
		expect(screen.getByText("النسخة 2")).toBeDefined();
	});

	it("shows a textarea when the variant has not yet been analyzed", () => {
		render(
			<VariantInputPanel
				variant={UNANALYZED}
				allRecords={[]}
				onUpdate={() => {}}
				onRemove={() => {}}
			/>,
		);
		expect(screen.getByRole("textbox")).toBeDefined();
	});

	it("shows the extracted narrator count using Arabic numerals in the compact summary", () => {
		render(
			<VariantInputPanel
				variant={ANALYZED}
				allRecords={[]}
				onUpdate={() => {}}
				onRemove={() => {}}
			/>,
		);
		// ANALYZED has 3 narrators → "٣ رواة"
		expect(screen.getByText("٣ رواة")).toBeDefined();
	});

	it("clicking 'إعادة التحليل' calls onUpdate with narrators and splitAt reset to null", () => {
		let updated: Partial<typeof ANALYZED> | undefined;
		render(
			<VariantInputPanel
				variant={ANALYZED}
				allRecords={[]}
				onUpdate={(data) => {
					updated = data;
				}}
				onRemove={() => {}}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "إعادة التحليل" }));
		expect(updated).toEqual({ narrators: null, splitAt: null });
	});

	it("does not show a textarea once the variant has been analyzed", () => {
		render(
			<VariantInputPanel
				variant={ANALYZED}
				allRecords={[]}
				onUpdate={() => {}}
				onRemove={() => {}}
			/>,
		);
		expect(screen.queryByRole("textbox")).toBeNull();
	});

	it("clicking the Remove button calls onRemove", () => {
		let removed = false;
		render(
			<VariantInputPanel
				variant={UNANALYZED}
				allRecords={[]}
				onUpdate={() => {}}
				onRemove={() => {
					removed = true;
				}}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "حذف" }));
		expect(removed).toBe(true);
	});
});
