import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { parseHadith } from "./parse-hadith";

const VALID_HADITH =
	"حدثنا عبد الله بن يوسف أخبرنا مالك عن ابن شهاب عن أنس بن مالك أن رسول الله دخل مكة";
const VALID_API_KEY = "sk-ant-test-key";

const successResponse = (splitAt: number, status = 200) =>
	new Response(
		JSON.stringify({
			content: [
				{
					type: "tool_use",
					id: "toolu_01",
					name: "report_split",
					input: { splitAt },
				},
			],
		}),
		{ status, headers: { "Content-Type": "application/json" } },
	);

const errorResponse = (status: number) =>
	new Response(JSON.stringify({ error: { message: "error" } }), { status });

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("parseHadith", () => {
	it("returns a numeric splitAt offset for a valid Claude response", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(successResponse(50)),
		) as typeof fetch;

		const result = await parseHadith(VALID_HADITH, VALID_API_KEY);
		expect(result.splitAt).toBe(50);
		expect(typeof result.splitAt).toBe("number");
	});

	it("throws when the Claude API returns 401 (invalid key)", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(errorResponse(401)),
		) as typeof fetch;

		expect(parseHadith(VALID_HADITH, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws when the Claude API returns 429 (rate limit)", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(errorResponse(429)),
		) as typeof fetch;

		expect(parseHadith(VALID_HADITH, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws when the response has no tool_use block", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						content: [{ type: "text", text: "some unexpected text" }],
					}),
					{ status: 200 },
				),
			),
		) as typeof fetch;

		expect(parseHadith(VALID_HADITH, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws when the tool_use block is missing the splitAt field", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						content: [
							{
								type: "tool_use",
								id: "toolu_01",
								name: "report_split",
								input: { boundary: 52 },
							},
						],
					}),
					{ status: 200 },
				),
			),
		) as typeof fetch;

		expect(parseHadith(VALID_HADITH, VALID_API_KEY)).rejects.toThrow();
	});

	it("throws on network failure", async () => {
		globalThis.fetch = mock(() =>
			Promise.reject(new Error("network error")),
		) as typeof fetch;

		expect(parseHadith(VALID_HADITH, VALID_API_KEY)).rejects.toThrow();
	});
});
