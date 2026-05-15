import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CustomNarratorManager } from "@/components/custom-narrator-manager";
import { _clearNarratorDatabaseCache } from "@/lib/narrator-database";

const STORAGE_KEY = "hadith-custom-narrators";
const EXTRACTION_KEY = "hadith-narrator-extraction";

const RECORD = {
	id: "custom-test-1",
	nameArabic: "عبد الله بن زيد",
	nameTransliterated: "Abd Allah ibn Zayd",
	birthYear: null,
	deathYear: 65,
	generation: "Tabi'i",
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
};

const RECORD_2 = {
	id: "custom-test-2",
	nameArabic: "محمد بن علي",
	nameTransliterated: "Muhammad ibn Ali",
	birthYear: null,
	deathYear: null,
	generation: "later",
	reliabilityGrade: "صدوق",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
};

function seedCustom(records: unknown[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function makeNarratorsJson(): Response {
	return new Response(
		JSON.stringify({
			meta: {
				generatedAt: "2025-01-01T00:00:00.000Z",
				recordCount: 0,
				source: "test",
			},
			narrators: [],
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
	globalThis.fetch = mock(() =>
		Promise.resolve(makeNarratorsJson()),
	) as typeof fetch;
	_clearNarratorDatabaseCache();
	localStorage.clear();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	_clearNarratorDatabaseCache();
	cleanup();
	localStorage.clear();
});

describe("CustomNarratorManager", () => {
	it("renders an empty-state message when no custom records exist", () => {
		render(<CustomNarratorManager />);
		expect(screen.getByText("لا توجد سجلات مخصصة")).toBeTruthy();
	});

	it("renders a row per custom record with correct field values", () => {
		seedCustom([RECORD, RECORD_2]);
		render(<CustomNarratorManager />);
		expect(screen.getByText("عبد الله بن زيد")).toBeTruthy();
		expect(screen.getByText("محمد بن علي")).toBeTruthy();
	});

	it("Edit action opens the inline form pre-filled with current values", () => {
		seedCustom([RECORD]);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "تعديل" }));

		const input = screen.getByDisplayValue(
			"عبد الله بن زيد",
		) as HTMLInputElement;
		expect(input).toBeTruthy();
	});

	it("opening a second edit collapses the first", () => {
		seedCustom([RECORD, RECORD_2]);
		render(<CustomNarratorManager />);

		const editButtons = screen.getAllByRole("button", { name: "تعديل" });
		fireEvent.click(editButtons[0]);
		expect(screen.getByDisplayValue("عبد الله بن زيد")).toBeTruthy();

		fireEvent.click(editButtons[1]);
		// First form should no longer be visible
		expect(screen.queryByDisplayValue("عبد الله بن زيد")).toBeNull();
		expect(screen.getByDisplayValue("محمد بن علي")).toBeTruthy();
	});

	it("Cancel on edit collapses the form without saving", () => {
		seedCustom([RECORD]);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "تعديل" }));
		const input = screen.getByDisplayValue(
			"عبد الله بن زيد",
		) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "اسم مختلف" } });

		fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));

		expect(screen.queryByDisplayValue("اسم مختلف")).toBeNull();
		expect(screen.getByText("عبد الله بن زيد")).toBeTruthy();
	});

	it("Save calls update and reflects the change immediately in the list", () => {
		seedCustom([RECORD]);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "تعديل" }));
		const input = screen.getByDisplayValue(
			"عبد الله بن زيد",
		) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "اسم جديد" } });
		fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

		expect(screen.getByText("اسم جديد")).toBeTruthy();
		expect(screen.queryByText("عبد الله بن زيد")).toBeNull();
	});

	it("Delete shows the confirmation row", () => {
		seedCustom([RECORD]);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "حذف" }));

		expect(screen.getByText("حذف هذا الراوي؟")).toBeTruthy();
	});

	it("confirming delete removes the record from the list", () => {
		seedCustom([RECORD]);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "حذف" }));
		fireEvent.click(screen.getByRole("button", { name: "تأكيد" }));

		expect(screen.queryByText("عبد الله بن زيد")).toBeNull();
		expect(screen.getByText("لا توجد سجلات مخصصة")).toBeTruthy();
	});

	it("Delete shows additional warning when the record is used in the active session", () => {
		seedCustom([RECORD]);
		localStorage.setItem(
			EXTRACTION_KEY,
			JSON.stringify({
				inputHash: "abc",
				narrators: [
					{
						position: 0,
						extractedName: "عبد الله",
						selectedId: RECORD.id,
						userOverride: true,
						confidence: "high",
						isAmbiguous: false,
						topMatches: [],
						mentionStart: 0,
						mentionEnd: 8,
					},
				],
			}),
		);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "حذف" }));

		expect(
			screen.getByText("هذا الراوي مُستخدم في التحليل الحالي"),
		).toBeTruthy();
	});

	it("Delete without session reference does NOT show the session warning", () => {
		seedCustom([RECORD]);
		render(<CustomNarratorManager />);

		fireEvent.click(screen.getByRole("button", { name: "حذف" }));

		expect(
			screen.queryByText("هذا الراوي مُستخدم في التحليل الحالي"),
		).toBeNull();
	});
});
