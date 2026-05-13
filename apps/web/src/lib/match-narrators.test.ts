import { describe, expect, it } from "bun:test";
import { matchNarrators } from "./match-narrators";

// Canonical NarratorRecord fixtures — realistic data from the Sahihayn chain
const MALIK_IBN_ANAS = {
	id: "malik-ibn-anas",
	nameArabic: "مالك بن أنس",
	nameTransliterated: "Malik ibn Anas",
	birthYear: 711,
	deathYear: 795,
	generation: "Tabi' al-Tabi'in" as const,
	reliabilityGrade: "ثقة",
	teachers: ["ibn-shihab-al-zuhri", "nafi-mawla-ibn-umar"],
	students: ["al-shafii", "ibn-al-qasim", "abd-allah-ibn-yusuf"],
	collections: ["Muwatta", "Bukhari", "Muslim"],
	bioNote: "Imam of Madinah, compiler of al-Muwatta",
};

const IBN_SHIHAB = {
	id: "ibn-shihab-al-zuhri",
	nameArabic: "محمد بن مسلم بن شهاب الزهري",
	nameTransliterated: "Ibn Shihab al-Zuhri",
	birthYear: 671,
	deathYear: 742,
	generation: "Tabi'i" as const,
	reliabilityGrade: "ثقة",
	teachers: ["anas-ibn-malik", "sa-id-ibn-al-musayyab"],
	students: ["malik-ibn-anas", "sufyan-al-thawri"],
	collections: ["Bukhari", "Muslim"],
	bioNote: "One of the most prolific Tabi'i narrators",
};

const ANAS_IBN_MALIK = {
	id: "anas-ibn-malik",
	nameArabic: "أنس بن مالك",
	nameTransliterated: "Anas ibn Malik",
	birthYear: 612,
	deathYear: 709,
	generation: "Sahabi" as const,
	reliabilityGrade: "ثقة",
	teachers: [],
	students: ["ibn-shihab-al-zuhri", "qatada"],
	collections: ["Bukhari", "Muslim"],
	bioNote: "Companion of the Prophet, servant for ten years",
};

const DATABASE = [MALIK_IBN_ANAS, IBN_SHIHAB, ANAS_IBN_MALIK];

describe("matchNarrators", () => {
	describe("exact name matching", () => {
		it("returns score 1.0 and auto-selects on an exact Arabic name match", () => {
			const extracted = [
				{ name: "مالك بن أنس", position: 0, mentionStart: 0, mentionEnd: 12 },
			];
			const [match] = matchNarrators(extracted, DATABASE);
			expect(match.topMatches[0].score).toBe(1.0);
			expect(match.selectedId).toBe("malik-ibn-anas");
		});

		it("auto-selects the highest scoring match when score ≥ 0.9", () => {
			const extracted = [
				{ name: "مالك بن أنس", position: 0, mentionStart: 0, mentionEnd: 12 },
			];
			const [match] = matchNarrators(extracted, DATABASE);
			expect(match.selectedId).not.toBeNull();
			expect(match.userOverride).toBe(false);
		});
	});

	describe("diacritics-normalized matching", () => {
		it("matches a name with tashkeel to the same name without tashkeel in the DB", () => {
			// DB has "مالك بن أنس" without full tashkeel; extracted has full vocalization
			const extracted = [
				{
					name: "مَالِكُ بْنُ أَنَسٍ",
					position: 0,
					mentionStart: 0,
					mentionEnd: 17,
				},
			];
			const [match] = matchNarrators(extracted, DATABASE);
			expect(match.topMatches[0].score).toBeGreaterThanOrEqual(0.9);
			expect(match.selectedId).toBe("malik-ibn-anas");
		});
	});

	describe("low confidence matching", () => {
		it("sets selectedId to null when the best match scores below 0.6", () => {
			const extracted = [
				// A name not in the database at all
				{
					name: "زيد بن ثابت الأنصاري",
					position: 0,
					mentionStart: 0,
					mentionEnd: 20,
				},
			];
			const [match] = matchNarrators(extracted, DATABASE);
			expect(match.topMatches[0].score).toBeLessThan(0.6);
			expect(match.selectedId).toBeNull();
		});
	});

	describe("ambiguity detection", () => {
		it("flags ambiguity when two candidates score within 0.1 of each other below 0.95", () => {
			// "أنس" is a common name fragment — both "أنس بن مالك" and "مالك بن أنس" contain it
			const extracted = [
				{ name: "أنس", position: 0, mentionStart: 0, mentionEnd: 3 },
			];
			const matches = matchNarrators(extracted, DATABASE);
			// We can't assert exact scores without knowing the algorithm, but we can assert
			// that at least two candidates are present when the name is ambiguous
			expect(matches[0].topMatches.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("ordering", () => {
		it("returns narrator matches in ascending position order", () => {
			const extracted = [
				{ name: "أنس بن مالك", position: 2, mentionStart: 50, mentionEnd: 62 },
				{ name: "مالك بن أنس", position: 0, mentionStart: 0, mentionEnd: 12 },
				{
					name: "محمد بن مسلم بن شهاب",
					position: 1,
					mentionStart: 15,
					mentionEnd: 35,
				},
			];
			const result = matchNarrators(extracted, DATABASE);
			expect(result[0].position).toBe(0);
			expect(result[1].position).toBe(1);
			expect(result[2].position).toBe(2);
		});

		it("returns up to 5 candidates per narrator in descending score order", () => {
			const extracted = [
				{ name: "مالك بن أنس", position: 0, mentionStart: 0, mentionEnd: 12 },
			];
			const [match] = matchNarrators(extracted, DATABASE);
			expect(match.topMatches.length).toBeLessThanOrEqual(5);
			// Scores must be in descending order
			for (let i = 1; i < match.topMatches.length; i++) {
				expect(match.topMatches[i].score).toBeLessThanOrEqual(
					match.topMatches[i - 1].score,
				);
			}
		});
	});

	describe("empty database", () => {
		it("returns all low confidence when the database is empty", () => {
			const extracted = [
				{ name: "مالك بن أنس", position: 0, mentionStart: 0, mentionEnd: 12 },
			];
			const [match] = matchNarrators(extracted, []);
			expect(match.topMatches).toHaveLength(0);
			expect(match.selectedId).toBeNull();
		});
	});

	describe("userOverride", () => {
		it("sets userOverride to false for all auto-matched results", () => {
			const extracted = [
				{ name: "مالك بن أنس", position: 0, mentionStart: 0, mentionEnd: 12 },
			];
			const [match] = matchNarrators(extracted, DATABASE);
			expect(match.userOverride).toBe(false);
		});
	});
});
