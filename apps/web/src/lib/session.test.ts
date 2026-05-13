import { describe, expect, it } from "bun:test";
import { deserializeSession, serializeSession } from "./session";

const EXAMPLE_VARIANT = {
	id: "variant-1",
	label: "النسخة 1",
	rawText:
		"حدثنا عبد الله بن يوسف أخبرنا مالك عن ابن شهاب عن أنس بن مالك أن رسول الله دخل مكة",
	color: "#0d9488",
	parseResult: {
		inputHash: "abc123",
		llmSplitAt: 52,
		splitAt: 52,
		corrected: false,
	},
	narratorExtraction: {
		inputHash: "def456",
		narrators: [
			{
				extractedName: "مالك بن أنس",
				position: 0,
				mentionStart: 20,
				mentionEnd: 32,
				topMatches: [{ narratorId: "malik-ibn-anas", score: 1.0 }],
				selectedId: "malik-ibn-anas",
				userOverride: false,
			},
		],
	},
};

const EXAMPLE_CUSTOM_NARRATOR = {
	id: "custom-abc",
	nameArabic: "يحيى بن سعيد",
	nameTransliterated: "Yahya ibn Said",
	birthYear: null,
	deathYear: 760,
	generation: "Tabi'i" as const,
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
};

describe("serializeSession", () => {
	it("includes version: 1 in the output", () => {
		const result = serializeSession([EXAMPLE_VARIANT], []);
		expect(result.version).toBe(1);
	});

	it("includes an ISO-8601 exportedAt timestamp", () => {
		const result = serializeSession([EXAMPLE_VARIANT], []);
		expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
	});

	it("includes all variant fields — rawText, parseResult, narratorExtraction", () => {
		const result = serializeSession([EXAMPLE_VARIANT], []);
		const v = result.variants[0];
		expect(v.rawText).toBe(EXAMPLE_VARIANT.rawText);
		expect(v.parseResult?.splitAt).toBe(52);
		expect(v.narratorExtraction?.narrators[0].selectedId).toBe(
			"malik-ibn-anas",
		);
	});

	it("preserves userOverride: true narrator selections in the output", () => {
		const variantWithOverride = {
			...EXAMPLE_VARIANT,
			narratorExtraction: {
				inputHash: "def456",
				narrators: [
					{
						...EXAMPLE_VARIANT.narratorExtraction!.narrators[0],
						userOverride: true,
					},
				],
			},
		};
		const result = serializeSession([variantWithOverride], []);
		expect(
			result.variants[0].narratorExtraction?.narrators[0].userOverride,
		).toBe(true);
	});

	it("includes custom narrator records in the output", () => {
		const result = serializeSession(
			[EXAMPLE_VARIANT],
			[EXAMPLE_CUSTOM_NARRATOR],
		);
		expect(result.customNarrators).toHaveLength(1);
		expect(result.customNarrators[0].id).toBe("custom-abc");
	});

	it("emits an empty customNarrators array when none are provided", () => {
		const result = serializeSession([EXAMPLE_VARIANT], []);
		expect(result.customNarrators).toEqual([]);
	});
});

describe("deserializeSession", () => {
	it("round-trips a session through serialize → JSON.stringify → deserialize", () => {
		const exported = serializeSession(
			[EXAMPLE_VARIANT],
			[EXAMPLE_CUSTOM_NARRATOR],
		);
		const json = JSON.stringify(exported);
		const restored = deserializeSession(json);
		expect(restored.variants[0].rawText).toBe(EXAMPLE_VARIANT.rawText);
		expect(restored.variants[0].parseResult?.splitAt).toBe(52);
		expect(restored.customNarrators[0].id).toBe("custom-abc");
	});

	it("throws a descriptive error on malformed JSON", () => {
		expect(() => deserializeSession("not json {{")).toThrow();
	});

	it("throws when the version field is missing", () => {
		const noVersion = JSON.stringify({ variants: [], customNarrators: [] });
		expect(() => deserializeSession(noVersion)).toThrow();
	});

	it("throws when the version number is unrecognized", () => {
		const futureVersion = JSON.stringify({
			version: 99,
			exportedAt: new Date().toISOString(),
			variants: [],
			customNarrators: [],
		});
		expect(() => deserializeSession(futureVersion)).toThrow();
	});

	it("restores a variant with null parseResult without throwing", () => {
		const exported = serializeSession(
			[{ ...EXAMPLE_VARIANT, parseResult: null, narratorExtraction: null }],
			[],
		);
		const restored = deserializeSession(JSON.stringify(exported));
		expect(restored.variants[0].parseResult).toBeNull();
	});
});
