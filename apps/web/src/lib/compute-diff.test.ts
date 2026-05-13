import { describe, expect, it } from "bun:test";
import { computeDiff } from "./compute-diff";

describe("computeDiff", () => {
	describe("input validation", () => {
		it("throws when fewer than 2 variants are provided", () => {
			expect(() => computeDiff(["بسم الله"])).toThrow();
		});

		it("accepts exactly 2 variants without throwing", () => {
			expect(() => computeDiff(["بسم الله", "بسم الله"])).not.toThrow();
		});

		it("accepts more than 2 variants (N-way diff)", () => {
			expect(() =>
				computeDiff(["بسم الله", "بسم الله", "بسم الله"]),
			).not.toThrow();
		});
	});

	describe("identical variants", () => {
		it("marks all tokens as allMatch when both variants are identical", () => {
			const tokens = computeDiff(["الرحمن الرحيم", "الرحمن الرحيم"]);
			expect(tokens.every((t) => t.allMatch)).toBe(true);
		});

		it("produces one token per whitespace-delimited word", () => {
			const tokens = computeDiff(["بسم الله الرحمن", "بسم الله الرحمن"]);
			expect(tokens).toHaveLength(3);
		});
	});

	describe("substitution", () => {
		it("marks the changed word as allMatch false with substituted status in variant 2", () => {
			// الرحيم (mercy, base) vs الكريم (generous, variant 2)
			const tokens = computeDiff(["الرحمن الرحيم", "الرحمن الكريم"]);
			const changedToken = tokens.find((t) => !t.allMatch);
			expect(changedToken).toBeDefined();
			expect(changedToken!.variants[0].status).toBe("match");
			expect(changedToken!.variants[1].status).toBe("substituted");
			expect(changedToken!.variants[1].text).toBe("الكريم");
		});

		it("preserves the base word text on the changed token", () => {
			const tokens = computeDiff(["الرحمن الرحيم", "الرحمن الكريم"]);
			const changedToken = tokens.find((t) => !t.allMatch);
			expect(changedToken!.baseText).toBe("الرحيم");
		});

		it("keeps unchanged words as allMatch true", () => {
			const tokens = computeDiff(["الرحمن الرحيم", "الرحمن الكريم"]);
			const matchedToken = tokens.find((t) => t.allMatch);
			expect(matchedToken!.baseText).toBe("الرحمن");
		});
	});

	describe("addition", () => {
		it("marks an extra word in variant 2 as added with null baseText", () => {
			// variant 2 has an extra word الرحمن not in the base
			const tokens = computeDiff(["بسم الله", "بسم الله الرحمن"]);
			const addedToken = tokens.find((t) => t.variants[1]?.status === "added");
			expect(addedToken).toBeDefined();
			expect(addedToken!.baseText).toBeNull();
			expect(addedToken!.variants[1].text).toBe("الرحمن");
		});
	});

	describe("deletion", () => {
		it("marks a word present in base but absent in variant 2 as deleted", () => {
			// base has 3 words; variant 2 drops the last
			const tokens = computeDiff(["بسم الله الرحمن", "بسم الله"]);
			const deletedToken = tokens.find(
				(t) => t.variants[1]?.status === "deleted",
			);
			expect(deletedToken).toBeDefined();
			expect(deletedToken!.baseText).toBe("الرحمن");
			expect(deletedToken!.variants[1].text).toBeNull();
		});
	});

	describe("diacritics normalization", () => {
		it("treats words that differ only in tashkeel as matching", () => {
			// مَالِكٌ (with full tashkeel) vs مالك (without) — same word
			const tokens = computeDiff(["مَالِكٌ أَنَسٌ", "مالك أنس"]);
			expect(tokens.every((t) => t.allMatch)).toBe(true);
		});

		it("displays the original diacritized text even when comparison is normalized", () => {
			const tokens = computeDiff(["مَالِكٌ", "مالك"]);
			// The base text should preserve the diacritized form
			expect(tokens[0].variants[0].text).toBe("مَالِكٌ");
		});
	});

	describe("N-way diff", () => {
		it("correctly assigns per-variant status for three variants", () => {
			// base: "الله"  v2: "الله" (same)  v3: "الرحمن" (different)
			const tokens = computeDiff(["الله", "الله", "الرحمن"]);
			expect(tokens[0].allMatch).toBe(false);
			expect(tokens[0].variants[0].status).toBe("match");
			expect(tokens[0].variants[1].status).toBe("match");
			expect(tokens[0].variants[2].status).toBe("substituted");
		});

		it("marks allMatch true only when all N variants agree on a word", () => {
			// All three variants agree on the first word
			const tokens = computeDiff(["بسم الله", "بسم الرحمن", "بسم الكريم"]);
			expect(tokens[0].allMatch).toBe(true); // "بسم" matches in all three
			expect(tokens[1].allMatch).toBe(false); // second word differs
		});
	});

	describe("variant[0] is always the base reference", () => {
		it("variant 0 status is always match for words present in the base", () => {
			const tokens = computeDiff(["مالك أنس", "مالك شهاب"]);
			for (const token of tokens) {
				if (token.baseText !== null) {
					expect(token.variants[0].status).toBe("match");
				}
			}
		});
	});
});
