import { describe, expect, it } from "bun:test";
import { normalizeArabic } from "./normalize-arabic";

describe("normalizeArabic", () => {
	it("strips Arabic diacritics (tashkeel) from text", () => {
		// مَالِكٌ = meem + fatha + alef + lam + kasra + kaf + dammatan
		expect(normalizeArabic("مَالِكٌ")).toBe("مالك");
	});

	it("strips all tashkeel variants — fatha, damma, kasra, shadda, sukun, tanwin", () => {
		// حَدَّثَنَا with fatha + shadda
		expect(normalizeArabic("حَدَّثَنَا")).toBe("حدثنا");
	});

	it("strips tatweel (U+0640) from text", () => {
		// مـالك = meem + tatweel + alef + lam + kaf
		expect(normalizeArabic("مـالك")).toBe("مالك");
	});

	it("collapses multiple whitespace characters to a single space", () => {
		expect(normalizeArabic("مالك  بن   أنس")).toBe("مالك بن أنس");
	});

	it("passes through plain Arabic text with no diacritics unchanged", () => {
		expect(normalizeArabic("مالك بن أنس")).toBe("مالك بن أنس");
	});

	it("handles empty string without throwing", () => {
		expect(normalizeArabic("")).toBe("");
	});

	it("diacritics-only difference — two spellings of the same word normalize to the same string", () => {
		expect(normalizeArabic("مَالِكٌ")).toBe(normalizeArabic("مالك"));
	});
});
