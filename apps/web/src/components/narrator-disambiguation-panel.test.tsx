import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { NarratorDisambiguationPanel } from "@/components/narrator-disambiguation-panel";
import type { NarratorMatch } from "@/lib/match-narrators";
import type { NarratorRecord } from "@/lib/narrator-database";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeRecord = (
	overrides: Partial<NarratorRecord> = {},
): NarratorRecord => ({
	id: "test-narrator-1",
	nameArabic: "مالك بن أنس",
	nameTransliterated: "Malik ibn Anas",
	birthYear: 711,
	deathYear: 795,
	generation: "Tabi' al-Tabi'in",
	reliabilityGrade: "ثقة",
	teachers: ["ibn-shihab-al-zuhri"],
	students: ["sufyan-ibn-uyayna"],
	collections: ["Muwatta", "Bukhari"],
	bioNote: "Imam of Madinah, compiler of al-Muwatta",
	...overrides,
});

const makeRecord2 = (
	overrides: Partial<NarratorRecord> = {},
): NarratorRecord => ({
	id: "test-narrator-2",
	nameArabic: "سفيان بن عيينة",
	nameTransliterated: "Sufyan ibn Uyayna",
	birthYear: 725,
	deathYear: 814,
	generation: "later",
	reliabilityGrade: "ثقة",
	teachers: ["malik-ibn-anas"],
	students: ["bukhari"],
	collections: ["Bukhari", "Muslim"],
	bioNote: "Major hadith scholar of Mecca",
	...overrides,
});

const makeMatch = (overrides: Partial<NarratorMatch> = {}): NarratorMatch => ({
	extractedName: "مالك",
	position: 0,
	mentionStart: 0,
	mentionEnd: 4,
	topMatches: [
		{ narratorId: "test-narrator-1", score: 0.85 },
		{ narratorId: "test-narrator-2", score: 0.6 },
	],
	selectedId: null,
	userOverride: false,
	confidence: "medium",
	isAmbiguous: false,
	...overrides,
});

// ── Setup/teardown ────────────────────────────────────────────────────────────

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	cleanup();
	localStorage.clear();
});

// ── Default props helper ──────────────────────────────────────────────────────

function defaultProps(overrides: Record<string, unknown> = {}) {
	return {
		narratorMatch: makeMatch(),
		candidateRecords: [makeRecord(), makeRecord2()],
		onConfirm: mock(() => {}),
		onAddCustom: mock(() => {}),
		onClose: mock(() => {}),
		...overrides,
	};
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NarratorDisambiguationPanel", () => {
	it("renders candidates in descending score order (highest score first in DOM)", () => {
		const match = makeMatch({
			topMatches: [
				{ narratorId: "test-narrator-2", score: 0.6 },
				{ narratorId: "test-narrator-1", score: 0.85 },
			],
		});
		render(
			<NarratorDisambiguationPanel
				{...defaultProps({ narratorMatch: match })}
			/>,
		);

		const items = screen.getAllByRole("listitem");
		// First item should be the higher-scored narrator (test-narrator-1, Malik)
		expect(items[0].textContent).toContain("مالك بن أنس");
		// Second item should be lower-scored (test-narrator-2, Sufyan)
		expect(items[1].textContent).toContain("سفيان بن عيينة");
	});

	it("expanding a candidate shows its bioNote and teachers/students/collections", () => {
		render(<NarratorDisambiguationPanel {...defaultProps()} />);

		// Click details toggle for first candidate
		const toggleButtons = screen.getAllByText("▼ التفاصيل");
		fireEvent.click(toggleButtons[0]);

		expect(
			screen.getByText("Imam of Madinah, compiler of al-Muwatta"),
		).toBeTruthy();
		expect(screen.getByText(/ibn-shihab-al-zuhri/)).toBeTruthy();
		expect(screen.getByText(/sufyan-ibn-uyayna/)).toBeTruthy();
		expect(screen.getByText("Muwatta, Bukhari")).toBeTruthy();
	});

	it("expanding a second candidate collapses the first", () => {
		render(<NarratorDisambiguationPanel {...defaultProps()} />);

		const toggleButtons = screen.getAllByText("▼ التفاصيل");

		// Expand first
		fireEvent.click(toggleButtons[0]);
		expect(
			screen.getByText("Imam of Madinah, compiler of al-Muwatta"),
		).toBeTruthy();

		// Expand second — first should collapse
		// After expanding first, toggle labels change; get all current toggles
		const collapseBtn = screen.getByText("▲ إخفاء");
		const allToggleButtons = screen.getAllByText(/التفاصيل|إخفاء/);
		const secondToggle = allToggleButtons.find((b) => b !== collapseBtn);
		expect(secondToggle).toBeTruthy();
		fireEvent.click(secondToggle as HTMLElement);

		// First candidate's bio note should no longer be visible
		expect(
			screen.queryByText("Imam of Madinah, compiler of al-Muwatta"),
		).toBeNull();
		// Second candidate's bio note should be visible
		expect(screen.getByText("Major hadith scholar of Mecca")).toBeTruthy();
	});

	it("clicking تأكيد calls onConfirm with the candidate's narratorId", () => {
		const onConfirm = mock(() => {});
		render(<NarratorDisambiguationPanel {...defaultProps({ onConfirm })} />);

		const confirmButtons = screen.getAllByText("تأكيد");
		// First confirm button corresponds to highest-score candidate (test-narrator-1)
		fireEvent.click(confirmButtons[0]);

		expect(onConfirm.mock.calls).toHaveLength(1);
		expect(onConfirm.mock.calls[0][0]).toBe("test-narrator-1");
	});

	it("clicking راوٍ غير معروف calls onConfirm(null)", () => {
		const onConfirm = mock(() => {});
		render(<NarratorDisambiguationPanel {...defaultProps({ onConfirm })} />);

		const unknownBtn = screen.getByText("راوٍ غير معروف");
		fireEvent.click(unknownBtn);

		expect(onConfirm.mock.calls).toHaveLength(1);
		expect(onConfirm.mock.calls[0][0]).toBeNull();
	});

	it("the currently selected candidate (selectedId === record.id) has green border", () => {
		const match = makeMatch({ selectedId: "test-narrator-1" });
		render(
			<NarratorDisambiguationPanel
				{...defaultProps({ narratorMatch: match })}
			/>,
		);

		const items = screen.getAllByRole("listitem");
		// First item is test-narrator-1 (highest score, and it's selected)
		const firstItemStyle = (items[0] as HTMLElement).style;
		expect(firstItemStyle.border).toContain("#16a34a");
	});

	it("close ✕ button calls onClose", () => {
		const onClose = mock(() => {});
		render(<NarratorDisambiguationPanel {...defaultProps({ onClose })} />);

		const closeBtn = screen.getByLabelText("إغلاق");
		fireEvent.click(closeBtn);

		expect(onClose.mock.calls).toHaveLength(1);
	});

	it("التالي button renders only when isGuided && hasNext", () => {
		// Without guided mode: no next button
		render(<NarratorDisambiguationPanel {...defaultProps()} />);
		expect(screen.queryByText("التالي")).toBeNull();
		cleanup();

		// With guided mode but hasNext=false: no التالي, but إنهاء المراجعة instead
		render(
			<NarratorDisambiguationPanel
				{...defaultProps({ isGuided: true, hasNext: false })}
			/>,
		);
		expect(screen.queryByText("التالي")).toBeNull();
		expect(screen.getByText("إنهاء المراجعة")).toBeTruthy();
		cleanup();

		// With guided mode and hasNext=true: التالي shown
		render(
			<NarratorDisambiguationPanel
				{...defaultProps({ isGuided: true, hasNext: true })}
			/>,
		);
		expect(screen.getByText("التالي")).toBeTruthy();
	});

	it("السابق button renders only when isGuided && hasPrevious", () => {
		// Without guided: no previous
		render(<NarratorDisambiguationPanel {...defaultProps()} />);
		expect(screen.queryByText("السابق")).toBeNull();
		cleanup();

		// Guided but hasPrevious=false: no previous button
		render(
			<NarratorDisambiguationPanel
				{...defaultProps({ isGuided: true, hasPrevious: false })}
			/>,
		);
		expect(screen.queryByText("السابق")).toBeNull();
		cleanup();

		// Guided and hasPrevious=true: shown
		render(
			<NarratorDisambiguationPanel
				{...defaultProps({ isGuided: true, hasPrevious: true })}
			/>,
		);
		expect(screen.getByText("السابق")).toBeTruthy();
	});

	it("clicking إضافة راوٍ جديد shows the add form and hides candidate list", () => {
		render(<NarratorDisambiguationPanel {...defaultProps()} />);

		// Candidate list is visible initially
		expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);

		const addBtn = screen.getByText("إضافة راوٍ جديد");
		fireEvent.click(addBtn);

		// Candidate list hidden, form shown
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
		expect(screen.getByLabelText("الاسم العربي")).toBeTruthy();
		expect(screen.getByLabelText("الاسم اللاتيني")).toBeTruthy();
	});

	it("submitting valid add form calls onAddCustom with correct shape", () => {
		const onAddCustom = mock(() => {});
		render(<NarratorDisambiguationPanel {...defaultProps({ onAddCustom })} />);

		fireEvent.click(screen.getByText("إضافة راوٍ جديد"));

		fireEvent.change(screen.getByLabelText("الاسم العربي"), {
			target: { value: "يحيى بن معين" },
		});
		fireEvent.change(screen.getByLabelText("الاسم اللاتيني"), {
			target: { value: "Yahya ibn Main" },
		});
		fireEvent.change(screen.getByLabelText("سنة الوفاة"), {
			target: { value: "233" },
		});

		fireEvent.click(screen.getByText("حفظ"));

		expect(onAddCustom.mock.calls).toHaveLength(1);
		const submitted = onAddCustom.mock.calls[0][0] as Record<string, unknown>;
		expect(submitted.nameArabic).toBe("يحيى بن معين");
		expect(submitted.nameTransliterated).toBe("Yahya ibn Main");
		expect(submitted.deathYear).toBe(233);
		expect(submitted.birthYear).toBeNull();
		expect(submitted.bioNote).toBe("");
		expect(typeof submitted.generation).toBe("string");
		expect(typeof submitted.reliabilityGrade).toBe("string");
	});

	it("clicking إلغاء on the add form returns to candidate list without calling onAddCustom", () => {
		const onAddCustom = mock(() => {});
		render(<NarratorDisambiguationPanel {...defaultProps({ onAddCustom })} />);

		fireEvent.click(screen.getByText("إضافة راوٍ جديد"));
		expect(screen.getByLabelText("الاسم العربي")).toBeTruthy();

		fireEvent.click(screen.getByText("إلغاء"));

		// Back to candidate list
		expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
		expect(onAddCustom.mock.calls).toHaveLength(0);
	});
});
