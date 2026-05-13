import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { extractNarrators } from "./extract-narrators";

const EXAMPLE_ISNAD =
	"حدثنا عبد الله بن يوسف أخبرنا مالك عن ابن شهاب عن أنس بن مالك";
const VALID_API_KEY = "sk-ant-test-key";

const EXAMPLE_NARRATOR_LIST = [
	{ name: "عبد الله بن يوسف", position: 0, mentionStart: 8, mentionEnd: 25 },
	{ name: "مالك", position: 1, mentionStart: 35, mentionEnd: 39 },
	{ name: "ابن شهاب", position: 2, mentionStart: 44, mentionEnd: 52 },
	{ name: "أنس بن مالك", position: 3, mentionStart: 57, mentionEnd: 69 },
];

const claudeResponse = (narrators: unknown) =>
	new Response(
		JSON.stringify({
			content: [{ type: "text", text: JSON.stringify({ narrators }) }],
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("extractNarrators", () => {
	it("returns an ordered array of ExtractedNarrator objects for a valid response", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(claudeResponse(EXAMPLE_NARRATOR_LIST)),
		) as typeof fetch;

		const result = await extractNarrators(EXAMPLE_ISNAD, VALID_API_KEY);
		expect(result).toHaveLength(4);
		expect(result[0].name).toBe("عبد الله بن يوسف");
		expect(result[0].position).toBe(0);
		expect(typeof result[0].mentionStart).toBe("number");
		expect(typeof result[0].mentionEnd).toBe("number");
	});

	it("returns narrators sorted by ascending position regardless of response order", async () => {
		const reversed = [...EXAMPLE_NARRATOR_LIST].reverse();
		globalThis.fetch = mock(() =>
			Promise.resolve(claudeResponse(reversed)),
		) as typeof fetch;

		const result = await extractNarrators(EXAMPLE_ISNAD, VALID_API_KEY);
		for (let i = 1; i < result.length; i++) {
			expect(result[i].position).toBeGreaterThan(result[i - 1].position);
		}
	});

	it("throws when the Claude API returns 401 (invalid key)", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(
				new Response(JSON.stringify({ error: { message: "unauthorized" } }), {
					status: 401,
				}),
			),
		) as typeof fetch;

		expect(extractNarrators(EXAMPLE_ISNAD, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws when the response text is not valid JSON", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						content: [{ type: "text", text: "here are the narrators: ..." }],
					}),
					{ status: 200 },
				),
			),
		) as typeof fetch;

		expect(extractNarrators(EXAMPLE_ISNAD, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws when the response JSON is missing the narrators array", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(claudeResponse(undefined)),
		) as typeof fetch;

		expect(extractNarrators(EXAMPLE_ISNAD, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws on network failure", async () => {
		globalThis.fetch = mock(() =>
			Promise.reject(new Error("network error")),
		) as typeof fetch;

		expect(extractNarrators(EXAMPLE_ISNAD, VALID_API_KEY)).rejects.toThrow();
	});
});
