import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { IsnadChainView } from "@/components/isnad-chain-view";
import type { NarratorMatch } from "@/lib/match-narrators";
import type { NarratorRecord } from "@/lib/narrator-database";

afterEach(() => {
	cleanup();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const narratorMatch = (
	position: number,
	name: string,
	selectedId: string | null,
	userOverride = false,
): NarratorMatch => ({
	extractedName: name,
	position,
	mentionStart: position * 20,
	mentionEnd: position * 20 + name.length,
	topMatches: selectedId
		? [{ narratorId: selectedId, score: userOverride ? 1.0 : 0.95 }]
		: [],
	selectedId,
	userOverride,
	confidence: selectedId ? "high" : "low",
	isAmbiguous: false,
});

const record = (id: string, nameArabic: string): NarratorRecord => ({
	id,
	nameArabic,
	nameTransliterated: `${id} (transliterated)`,
	birthYear: null,
	deathYear: null,
	generation: "Tabi'i",
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
});

const NARRATORS = [
	narratorMatch(0, "مالك بن أنس", "malik-ibn-anas"),
	narratorMatch(1, "نافع", "nafi-mawla-ibn-umar"),
	narratorMatch(2, "ابن عمر", "ibn-umar"),
];

const RECORDS = [
	record("malik-ibn-anas", "مالك بن أنس"),
	record("nafi-mawla-ibn-umar", "نافع مولى ابن عمر"),
	record("ibn-umar", "عبد الله بن عمر"),
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("IsnadChainView", () => {
	it("renders nothing when the narrators array is empty", () => {
		const { container } = render(
			<IsnadChainView narrators={[]} records={[]} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders an Arabic name for each narrator in the chain", () => {
		render(<IsnadChainView narrators={NARRATORS} records={RECORDS} />);
		expect(screen.getByText("مالك بن أنس")).toBeDefined();
		expect(screen.getByText("نافع")).toBeDefined();
		expect(screen.getByText("ابن عمر")).toBeDefined();
	});

	it("shows a placeholder label for an unknown narrator (userOverride: true, selectedId: null)", () => {
		const withUnknown = [
			narratorMatch(0, "مالك بن أنس", "malik-ibn-anas"),
			narratorMatch(1, "راوٍ مجهول", null, true), // unknown
		];
		render(<IsnadChainView narrators={withUnknown} records={RECORDS} />);
		expect(screen.getByText("راوٍ غير معروف")).toBeDefined();
	});

	it("calls onNodeClick with the narrator's record ID when a known narrator node is clicked", () => {
		let clicked: string | null | undefined;
		render(
			<IsnadChainView
				narrators={NARRATORS}
				records={RECORDS}
				onNodeClick={(id) => {
					clicked = id;
				}}
			/>,
		);
		// Each narrator name is rendered inside the custom node component.
		// Clicking the text element bubbles up through the reactflow node wrapper
		// to the pane's click handler, which calls onNodeClick.
		fireEvent.click(screen.getByText("مالك بن أنس"));
		expect(clicked).toBe("malik-ibn-anas");
	});

	it("calls onNodeClick with null when an unknown narrator node is clicked", () => {
		let clicked: string | null | undefined;
		const withUnknown = [
			narratorMatch(0, "مالك بن أنس", "malik-ibn-anas"),
			narratorMatch(1, "راوٍ مجهول", null, true),
		];
		render(
			<IsnadChainView
				narrators={withUnknown}
				records={RECORDS}
				onNodeClick={(id) => {
					clicked = id;
				}}
			/>,
		);
		fireEvent.click(screen.getByText("راوٍ غير معروف"));
		expect(clicked).toBeNull();
	});
});
