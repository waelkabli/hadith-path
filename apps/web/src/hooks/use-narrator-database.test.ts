import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useCustomNarrators } from "@/hooks/use-custom-narrators";
import { useNarratorDatabase } from "@/hooks/use-narrator-database";
import { _clearNarratorDatabaseCache } from "@/lib/narrator-database";

const STORAGE_KEY = "hadith-custom-narrators";

const BUNDLED_NARRATOR = {
	id: "bundled-1",
	nameArabic: "مالك بن أنس",
	nameTransliterated: "Malik ibn Anas",
	birthYear: 711,
	deathYear: 795,
	generation: "Tabi' al-Tabi'in" as const,
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: ["Muwatta"],
	bioNote: "",
};

const CUSTOM_NARRATOR = {
	id: "custom-seeded",
	nameArabic: "راوٍ مخصص",
	nameTransliterated: "Custom Narrator",
	birthYear: null,
	deathYear: null,
	generation: "later" as const,
	reliabilityGrade: "ثقة",
	teachers: [],
	students: [],
	collections: [],
	bioNote: "",
};

function makeJsonResponse(narrators: unknown[]): Response {
	return new Response(
		JSON.stringify({
			meta: {
				generatedAt: "2025-01-01T00:00:00.000Z",
				recordCount: narrators.length,
				source: "test",
			},
			narrators,
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
	_clearNarratorDatabaseCache();
	localStorage.clear();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	_clearNarratorDatabaseCache();
	localStorage.clear();
});

describe("useNarratorDatabase", () => {
	describe("loading", () => {
		it("isLoading is true before the fetch resolves", async () => {
			let resolve!: (r: Response) => void;
			globalThis.fetch = mock(
				() =>
					new Promise<Response>((res) => {
						resolve = res;
					}),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());

			expect(result.current.isLoading).toBe(true);

			await act(async () => {
				resolve(makeJsonResponse([BUNDLED_NARRATOR]));
			});
		});

		it("isLoading becomes false after the fetch resolves successfully", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeJsonResponse([BUNDLED_NARRATOR])),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());

			await act(async () => {});

			expect(result.current.isLoading).toBe(false);
		});

		it("isLoading becomes false even when the fetch fails", async () => {
			globalThis.fetch = mock(() =>
				Promise.reject(new Error("network error")),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());

			await act(async () => {});

			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("merged records", () => {
		it("records contains both bundled DB entries and custom narrator entries after a successful fetch", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([CUSTOM_NARRATOR]));
			globalThis.fetch = mock(() =>
				Promise.resolve(makeJsonResponse([BUNDLED_NARRATOR])),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());

			await act(async () => {});

			expect(result.current.records).toHaveLength(2);
			expect(
				result.current.records.find((r) => r.id === "bundled-1"),
			).toBeTruthy();
			expect(
				result.current.records.find((r) => r.id === "custom-seeded"),
			).toBeTruthy();
		});

		it("bundled records appear before custom records", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([CUSTOM_NARRATOR]));
			globalThis.fetch = mock(() =>
				Promise.resolve(makeJsonResponse([BUNDLED_NARRATOR])),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());

			await act(async () => {});

			expect(result.current.records[0].id).toBe("bundled-1");
			expect(result.current.records[1].id).toBe("custom-seeded");
		});

		it("adding a custom narrator via useCustomNarrators.add() updates records without re-fetching the bundled DB", async () => {
			const fetchSpy = mock(() =>
				Promise.resolve(makeJsonResponse([BUNDLED_NARRATOR])),
			) as typeof fetch;
			globalThis.fetch = fetchSpy;

			// Render both hooks together — add() on the custom hook notifies the
			// module-level subscriber inside useNarratorDatabase's internal instance.
			const { result } = renderHook(() => ({
				db: useNarratorDatabase(),
				custom: useCustomNarrators(),
			}));
			await act(async () => {});

			const callsBefore = fetchSpy.mock.calls.length;
			expect(result.current.db.records).toHaveLength(1);

			await act(async () => {
				result.current.custom.add({
					nameArabic: CUSTOM_NARRATOR.nameArabic,
					nameTransliterated: CUSTOM_NARRATOR.nameTransliterated,
					birthYear: null,
					deathYear: null,
					generation: CUSTOM_NARRATOR.generation,
					reliabilityGrade: CUSTOM_NARRATOR.reliabilityGrade,
					bioNote: "",
				});
			});

			expect(result.current.db.records).toHaveLength(2);
			// No additional bundled DB fetch
			expect(fetchSpy.mock.calls.length).toBe(callsBefore);
		});

		it("removing a custom narrator via useCustomNarrators.remove() removes it from records", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([CUSTOM_NARRATOR]));
			globalThis.fetch = mock(() =>
				Promise.resolve(makeJsonResponse([BUNDLED_NARRATOR])),
			) as typeof fetch;

			const { result } = renderHook(() => ({
				db: useNarratorDatabase(),
				custom: useCustomNarrators(),
			}));
			await act(async () => {});

			expect(result.current.db.records).toHaveLength(2);

			act(() => {
				result.current.custom.remove("custom-seeded");
			});

			expect(
				result.current.db.records.find((r) => r.id === "custom-seeded"),
			).toBeUndefined();
		});
	});

	describe("fetch caching", () => {
		it("getNarratorDatabase() is called only once per page lifetime — subsequent hook mounts return the cached result", async () => {
			const spy = mock(() =>
				Promise.resolve(makeJsonResponse([BUNDLED_NARRATOR])),
			) as typeof fetch;
			globalThis.fetch = spy;

			// First mount
			const { unmount } = renderHook(() => useNarratorDatabase());
			await act(async () => {});
			unmount();

			// Second mount — cache is warm, no new fetch
			const { result: r2 } = renderHook(() => useNarratorDatabase());
			await act(async () => {});

			expect(spy.mock.calls).toHaveLength(1);
			expect(r2.current.records.find((r) => r.id === "bundled-1")).toBeTruthy();
		});
	});

	describe("fetch failure", () => {
		it("error is set when the fetch fails, and records contains only custom narrator entries", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([CUSTOM_NARRATOR]));
			globalThis.fetch = mock(() =>
				Promise.reject(new Error("network error")),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());
			await act(async () => {});

			expect(result.current.error).not.toBeNull();
			expect(result.current.records).toHaveLength(1);
			expect(result.current.records[0].id).toBe("custom-seeded");
		});

		it("the hook does not crash when both the fetch fails and there are no custom narrators", async () => {
			globalThis.fetch = mock(() =>
				Promise.reject(new Error("network error")),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorDatabase());
			await act(async () => {});

			expect(result.current.error).not.toBeNull();
			expect(result.current.records).toHaveLength(0);
			expect(result.current.isLoading).toBe(false);
		});
	});
});
