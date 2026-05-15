import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { VariantChainView } from "@/components/variant-chain-view";
import type { Variant } from "@/hooks/use-variants";
import { VARIANT_PALETTE } from "@/hooks/use-variants";
import type { NarratorRecord } from "@/lib/narrator-database";

afterEach(() => {
	cleanup();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNarratorMatch(
	position: number,
	name: string,
	selectedId: string | null,
	userOverride = false,
) {
	return {
		extractedName: name,
		position,
		mentionStart: position * 20,
		mentionEnd: position * 20 + name.length,
		topMatches: selectedId
			? [{ narratorId: selectedId, score: userOverride ? 1.0 : 0.95 }]
			: [],
		selectedId,
		userOverride,
		confidence: (selectedId ? "high" : "low") as "high" | "low",
		isAmbiguous: false,
	};
}

function makeRecord(id: string, nameArabic: string): NarratorRecord {
	return {
		id,
		nameArabic,
		nameTransliterated: `${id}-transliterated`,
		birthYear: null,
		deathYear: null,
		generation: "Tabi'i",
		reliabilityGrade: "ثقة",
		teachers: [],
		students: [],
		collections: [],
		bioNote: "",
	};
}

function makeVariant(
	id: string,
	label: string,
	color: string,
	narrators: ReturnType<typeof makeNarratorMatch>[],
): Variant {
	return {
		id,
		label,
		color,
		rawText: "نص الحديث",
		splitAt: 10,
		narrators,
	};
}

const RECORDS = [
	makeRecord("malik", "مالك بن أنس"),
	makeRecord("nafi", "نافع"),
	makeRecord("ibn-umar", "ابن عمر"),
	makeRecord("ayyub", "أيوب السختياني"),
];

const VARIANT_1 = makeVariant("v1", "النسخة 1", VARIANT_PALETTE[0], [
	makeNarratorMatch(0, "مالك بن أنس", "malik"),
	makeNarratorMatch(1, "نافع", "nafi"),
	makeNarratorMatch(2, "ابن عمر", "ibn-umar"),
]);

const VARIANT_2 = makeVariant("v2", "النسخة 2", VARIANT_PALETTE[1], [
	makeNarratorMatch(0, "أيوب السختياني", "ayyub"),
	makeNarratorMatch(1, "نافع", "nafi"),
	makeNarratorMatch(2, "ابن عمر", "ibn-umar"),
]);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("VariantChainView", () => {
	it("renders narrator names from all provided variants", () => {
		render(
			<VariantChainView
				variants={[VARIANT_1, VARIANT_2]}
				records={RECORDS}
				onNodeClick={() => {}}
			/>,
		);
		expect(screen.getByText("مالك بن أنس")).toBeDefined();
		expect(screen.getByText("نافع")).toBeDefined();
		expect(screen.getByText("ابن عمر")).toBeDefined();
		expect(screen.getByText("أيوب السختياني")).toBeDefined();
	});

	it("shows '؟' for unknown narrator nodes", () => {
		const variantWithUnknown = makeVariant(
			"v-unknown",
			"النسخة 1",
			VARIANT_PALETTE[0],
			[
				makeNarratorMatch(0, "مالك بن أنس", "malik"),
				makeNarratorMatch(1, "راوٍ مجهول", null, true), // unknown
			],
		);
		render(
			<VariantChainView
				variants={[variantWithUnknown]}
				records={RECORDS}
				onNodeClick={() => {}}
			/>,
		);
		expect(screen.getByText("؟")).toBeDefined();
	});

	it("calls onNodeClick with the correct ID when a known node is clicked", () => {
		let clicked: string | null | undefined;
		render(
			<VariantChainView
				variants={[VARIANT_1]}
				records={RECORDS}
				onNodeClick={(id) => {
					clicked = id;
				}}
			/>,
		);
		fireEvent.click(screen.getByText("مالك بن أنس"));
		expect(clicked).toBe("malik");
	});

	it("calls onNodeClick with null when an unknown node is clicked", () => {
		let clicked: string | null | undefined;
		const variantWithUnknown = makeVariant(
			"v-unknown",
			"النسخة 1",
			VARIANT_PALETTE[0],
			[
				makeNarratorMatch(0, "مالك بن أنس", "malik"),
				makeNarratorMatch(1, "راوٍ مجهول", null, true),
			],
		);
		render(
			<VariantChainView
				variants={[variantWithUnknown]}
				records={RECORDS}
				onNodeClick={(id) => {
					clicked = id;
				}}
			/>,
		);
		fireEvent.click(screen.getByText("؟"));
		expect(clicked).toBeNull();
	});

	it("shows exactly one legend entry per variant", () => {
		render(
			<VariantChainView
				variants={[VARIANT_1, VARIANT_2]}
				records={RECORDS}
				onNodeClick={() => {}}
			/>,
		);
		// getAllByText matches the two legend labels; getByText (singular) would throw
		// if either label appeared more than once, so together they pin the exact count.
		expect(screen.getAllByText(/النسخة/)).toHaveLength(2);
		expect(screen.getByText("النسخة 1")).toBeDefined();
		expect(screen.getByText("النسخة 2")).toBeDefined();
	});
});
