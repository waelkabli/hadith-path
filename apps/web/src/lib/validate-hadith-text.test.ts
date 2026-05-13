import { describe, expect, it } from "bun:test";
import { validateHadithText } from "./validate-hadith-text";

// Short valid Arabic hadith for use across tests
const VALID_ARABIC =
	"حدثنا عبد الله بن يوسف أخبرنا مالك عن ابن شهاب عن أنس بن مالك أن رسول الله دخل مكة";

describe("validateHadithText", () => {
	describe("empty check", () => {
		it("returns empty error for an empty string", () => {
			const result = validateHadithText("");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("empty");
		});

		it("returns empty error for a whitespace-only string", () => {
			const result = validateHadithText("   ");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("empty");
		});
	});

	describe("Arabic language check", () => {
		it("returns non-arabic error when text has no Arabic characters", () => {
			const result = validateHadithText("hello world this is english text");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("non-arabic");
		});

		it("returns non-arabic error when fewer than 50% of non-whitespace characters are Arabic", () => {
			// Mostly Latin with a couple Arabic chars
			const result = validateHadithText("hello world مرحبا latin dominates");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("non-arabic");
		});

		it("accepts text where more than 50% of non-whitespace characters are Arabic", () => {
			const result = validateHadithText(VALID_ARABIC);
			expect(result.valid).toBe(true);
		});
	});

	describe("word count check", () => {
		it("returns too-long error for text exceeding 3000 words", () => {
			const longText = "مالك ".repeat(3001);
			const result = validateHadithText(longText);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("too-long");
		});

		it("accepts text at exactly 3000 words", () => {
			const exactText = "مالك ".repeat(3000).trim();
			const result = validateHadithText(exactText);
			expect(result.valid).toBe(true);
		});
	});

	describe("validation order", () => {
		it("reports empty error before non-arabic — empty takes priority", () => {
			// An empty string matches both empty and non-arabic checks;
			// empty should be reported first
			const result = validateHadithText("");
			expect(result.error).toBe("empty");
		});

		it("reports non-arabic error before too-long when text is non-Arabic and over 3000 words", () => {
			const longLatin = "word ".repeat(3001);
			const result = validateHadithText(longLatin);
			expect(result.error).toBe("non-arabic");
		});
	});

	describe("valid input", () => {
		it("returns valid for a well-formed short Arabic hadith", () => {
			const result = validateHadithText(VALID_ARABIC);
			expect(result).toEqual({ valid: true });
		});
	});
});
