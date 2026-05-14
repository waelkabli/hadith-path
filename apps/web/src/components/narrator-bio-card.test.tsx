import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { NarratorBioCard } from "@/components/narrator-bio-card";
import type { NarratorRecord } from "@/lib/narrator-database";

afterEach(() => {
	cleanup();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MALIK: NarratorRecord = {
	id: "malik-ibn-anas",
	nameArabic: "مالك بن أنس",
	nameTransliterated: "Malik ibn Anas",
	birthYear: 711,
	deathYear: 795,
	generation: "Tabi' al-Tabi'in",
	reliabilityGrade: "ثقة",
	teachers: ["ibn-shihab-al-zuhri", "nafi-mawla-ibn-umar"],
	students: ["sufyan-ibn-uyayna"],
	collections: ["Muwatta", "Bukhari"],
	bioNote: "Imam of Madinah, compiler of al-Muwatta",
};

const IBN_SHIHAB: NarratorRecord = {
	id: "ibn-shihab-al-zuhri",
	nameArabic: "محمد بن مسلم بن شهاب الزهري",
	nameTransliterated: "Ibn Shihab al-Zuhri",
	birthYear: null,
	deathYear: 742,
	generation: "Tabi'i",
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
};

const SUFYAN: NarratorRecord = {
	id: "sufyan-ibn-uyayna",
	nameArabic: "سفيان بن عيينة",
	nameTransliterated: "Sufyan ibn Uyayna",
	birthYear: null,
	deathYear: 814,
	generation: "later",
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
};

// allRecords includes one of Malik's teachers (ibn-shihab) but NOT the other
// (nafi-mawla-ibn-umar), so we can test both resolved and unresolvable names.
const ALL_RECORDS = [IBN_SHIHAB, SUFYAN];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NarratorBioCard", () => {
	describe("identified narrator", () => {
		it("shows the narrator's Arabic name in the header", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("مالك بن أنس")).toBeDefined();
		});

		it("shows the transliterated name below the Arabic name", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("Malik ibn Anas")).toBeDefined();
		});

		it("shows the death year with هـ suffix", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("795 هـ")).toBeDefined();
		});

		it("shows the Arabic label for the generation", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("أتباع التابعين")).toBeDefined();
		});

		it("shows the reliability grade", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("ثقة")).toBeDefined();
		});

		it("resolves a teacher ID to the teacher's Arabic name from allRecords", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("محمد بن مسلم بن شهاب الزهري")).toBeDefined();
		});

		it("shows غير موجود for a teacher ID not in allRecords", () => {
			// MALIK has "nafi-mawla-ibn-umar" as a teacher, which is not in ALL_RECORDS
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("غير موجود")).toBeDefined();
		});

		it("resolves a student ID to the student's Arabic name from allRecords", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("سفيان بن عيينة")).toBeDefined();
		});

		it("shows collections joined with the Arabic comma separator ،", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.getByText("Muwatta، Bukhari")).toBeDefined();
		});

		it("shows the bio note", () => {
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(
				screen.getByText("Imam of Madinah, compiler of al-Muwatta"),
			).toBeDefined();
		});

		it("calls onClose when the close button is clicked", () => {
			let closed = false;
			render(
				<NarratorBioCard
					record={MALIK}
					allRecords={ALL_RECORDS}
					onClose={() => {
						closed = true;
					}}
				/>,
			);
			fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
			expect(closed).toBe(true);
		});

		it("omits the teachers section when the record has no teachers", () => {
			const noTeachers = { ...MALIK, teachers: [] };
			render(
				<NarratorBioCard
					record={noTeachers}
					allRecords={ALL_RECORDS}
					onClose={() => {}}
				/>,
			);
			expect(screen.queryByText("المشايخ")).toBeNull();
		});
	});

	describe("unknown narrator (record = null)", () => {
		it("shows راوٍ غير معروف in the header", () => {
			render(
				<NarratorBioCard record={null} allRecords={[]} onClose={() => {}} />,
			);
			expect(screen.getByText("راوٍ غير معروف")).toBeDefined();
		});

		it("does not show a transliterated name when record is null", () => {
			render(
				<NarratorBioCard record={null} allRecords={[]} onClose={() => {}} />,
			);
			expect(screen.queryByText("Malik ibn Anas")).toBeNull();
		});

		it("shows لا توجد بيانات لهذا الراوي in the body when record is null", () => {
			render(
				<NarratorBioCard record={null} allRecords={[]} onClose={() => {}} />,
			);
			expect(screen.getByText("لا توجد بيانات لهذا الراوي")).toBeDefined();
		});
	});
});
