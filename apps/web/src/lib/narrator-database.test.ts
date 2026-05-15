import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import {
	_clearNarratorDatabaseCache,
	getNarratorDatabase,
} from "@/lib/narrator-database";

const MOCK_NARRATORS = [
	{
		id: "test-1",
		nameArabic: "مالك بن أنس",
		nameTransliterated: "Malik ibn Anas",
		birthYear: 711,
		deathYear: 795,
		generation: "Tabi' al-Tabi'in",
		reliabilityGrade: "ثقة",
		teachers: [],
		students: [],
		collections: ["Muwatta"],
		bioNote: "",
	},
];

const MOCK_RESPONSE = {
	meta: {
		generatedAt: "2025-01-01T00:00:00.000Z",
		recordCount: 1,
		source: "test",
	},
	narrators: MOCK_NARRATORS,
};

function makeJsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
	_clearNarratorDatabaseCache();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	_clearNarratorDatabaseCache();
});

describe("getNarratorDatabase", () => {
	it("first call fetches and returns the parsed narrator array", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(makeJsonResponse(MOCK_RESPONSE)),
		) as typeof fetch;

		const result = await getNarratorDatabase();

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("test-1");
		expect(result[0].nameArabic).toBe("مالك بن أنس");
	});

	it("second call returns the cached result without a second fetch", async () => {
		const spy = mock(() =>
			Promise.resolve(makeJsonResponse(MOCK_RESPONSE)),
		) as typeof fetch;
		globalThis.fetch = spy;

		await getNarratorDatabase();
		await getNarratorDatabase();

		expect(spy.mock.calls).toHaveLength(1);
	});

	it("throws on network failure", async () => {
		globalThis.fetch = mock(() =>
			Promise.reject(new Error("network error")),
		) as typeof fetch;

		await expect(getNarratorDatabase()).rejects.toThrow();
	});

	it("throws on non-ok HTTP response", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(makeJsonResponse({ error: "not found" }, 404)),
		) as typeof fetch;

		await expect(getNarratorDatabase()).rejects.toThrow("HTTP 404");
	});

	it("throws on malformed JSON response", async () => {
		globalThis.fetch = mock(() =>
			Promise.resolve(
				new Response("not json {{{", {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			),
		) as typeof fetch;

		await expect(getNarratorDatabase()).rejects.toThrow();
	});

	it("clears cache and re-fetches after a failed attempt", async () => {
		// First call fails
		globalThis.fetch = mock(() =>
			Promise.reject(new Error("network error")),
		) as typeof fetch;

		await expect(getNarratorDatabase()).rejects.toThrow();

		// Second call should re-fetch (cache was not set on failure)
		const spy = mock(() =>
			Promise.resolve(makeJsonResponse(MOCK_RESPONSE)),
		) as typeof fetch;
		globalThis.fetch = spy;

		const result = await getNarratorDatabase();

		expect(spy.mock.calls).toHaveLength(1);
		expect(result).toHaveLength(1);
	});
});
