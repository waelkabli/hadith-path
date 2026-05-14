import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useNarratorExtraction } from "@/hooks/use-narrator-extraction";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_KEY_STORAGE = "hadith-api-key-claude";
const EXTRACTION_KEY = "hadith-narrator-extraction";

const EXAMPLE_ISNAD = "مالك عن نافع عن ابن عمر";
// Each name is exactly as the LLM would return it
const EXAMPLE_RAW_NARRATORS = [
	{ name: "مالك", position: 0, mentionStart: 0, mentionEnd: 4 },
	{ name: "نافع", position: 1, mentionStart: 8, mentionEnd: 12 },
	{ name: "ابن عمر", position: 2, mentionStart: 16, mentionEnd: 23 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeNarratorsResponse = (narrators: unknown): Response =>
	new Response(
		JSON.stringify({
			content: [
				{
					type: "tool_use",
					id: "toolu_01",
					name: "report_narrators",
					input: { narrators },
				},
			],
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);

/** Seed localStorage to simulate what useHadithParser writes after a parse. */
function seedParseResult(isnadText: string, fullText?: string): void {
	const text = fullText ?? `${isnadText} قال النبي صلى الله عليه وسلم`;
	localStorage.setItem("hadith-input-raw", text);
	localStorage.setItem(
		"hadith-parse-result",
		JSON.stringify({
			splitAt: isnadText.length,
			llmSplitAt: isnadText.length,
			corrected: false,
			inputHash: "dummy",
		}),
	);
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
	localStorage.clear();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	localStorage.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useNarratorExtraction", () => {
	describe("API key guard", () => {
		it("extract() with no stored API key sets error and does not call fetch", async () => {
			const spy = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			);
			globalThis.fetch = spy as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			expect(result.current.error).toBe("يرجى إدخال مفتاح API في الإعدادات");
			expect(result.current.narrators).toBeNull();
			expect(spy.mock.calls).toHaveLength(0);
		});
	});

	describe("successful extraction", () => {
		it("sets narrators in state after extract() completes", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			expect(result.current.narrators).not.toBeNull();
			expect(result.current.narrators).toHaveLength(3);
			expect(result.current.narrators?.[0].extractedName).toBe("مالك");
			expect(result.current.narrators?.[1].extractedName).toBe("نافع");
			expect(result.current.narrators?.[2].extractedName).toBe("ابن عمر");
			expect(result.current.error).toBeNull();
		});

		it("writes { inputHash, narrators } to hadith-narrator-extraction in localStorage", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			const raw = localStorage.getItem(EXTRACTION_KEY);
			expect(raw).not.toBeNull();
			const stored = JSON.parse(raw ?? "null");
			expect(typeof stored.inputHash).toBe("string");
			expect(stored.inputHash).not.toBe("");
			expect(Array.isArray(stored.narrators)).toBe(true);
			expect(stored.narrators).toHaveLength(3);
		});

		it("isLoading is true while the request is in-flight and false after it resolves", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");

			let resolveRequest!: (r: Response) => void;
			globalThis.fetch = mock(
				() =>
					new Promise<Response>((resolve) => {
						resolveRequest = resolve;
					}),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());

			// Synchronous act: fires the call without awaiting, flushing only
			// the synchronous state updates (setIsLoading(true)).
			act(() => {
				result.current.extract(EXAMPLE_ISNAD).catch(() => {});
			});

			expect(result.current.isLoading).toBe(true);

			// Resolve the pending fetch and let React flush all remaining updates.
			await act(async () => {
				resolveRequest(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS));
			});

			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("failed extraction", () => {
		it("sets Arabic error message when extraction throws, leaving existing narrators untouched", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");

			// First extraction succeeds
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});
			const existingNarrators = result.current.narrators;
			expect(existingNarrators).not.toBeNull();

			// Second extraction fails (401)
			globalThis.fetch = mock(() =>
				Promise.resolve(
					new Response(JSON.stringify({ error: "unauthorized" }), {
						status: 401,
					}),
				),
			) as typeof fetch;

			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			expect(result.current.error).toBe(
				"فشل استخراج الرواة — يرجى المحاولة مجدداً",
			);
			// Existing narrators are preserved — not cleared on failure
			expect(result.current.narrators).toBe(existingNarrators);
		});
	});

	describe("confirmMatch", () => {
		it("sets selectedId and userOverride: true for the narrator at position, leaving others untouched", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			act(() => {
				result.current.confirmMatch(0, "malik-ibn-anas");
			});

			const narrator0 = result.current.narrators?.find((n) => n.position === 0);
			expect(narrator0?.selectedId).toBe("malik-ibn-anas");
			expect(narrator0?.userOverride).toBe(true);

			const narrator1 = result.current.narrators?.find((n) => n.position === 1);
			expect(narrator1?.userOverride).toBe(false);
		});

		it("confirmMatch(position, null) marks the narrator as unknown with userOverride: true", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			act(() => {
				result.current.confirmMatch(0, null);
			});

			const narrator0 = result.current.narrators?.find((n) => n.position === 0);
			expect(narrator0?.selectedId).toBeNull();
			expect(narrator0?.userOverride).toBe(true);
		});

		it("persists the updated narrator list to hadith-narrator-extraction in localStorage", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});

			act(() => {
				result.current.confirmMatch(0, "malik-ibn-anas");
			});

			const stored = JSON.parse(localStorage.getItem(EXTRACTION_KEY)!);
			const narrator0 = stored.narrators.find(
				(n: { position: number }) => n.position === 0,
			);
			expect(narrator0.selectedId).toBe("malik-ibn-anas");
			expect(narrator0.userOverride).toBe(true);
		});
	});

	describe("reset", () => {
		it("clears narrators and error", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});
			expect(result.current.narrators).not.toBeNull();

			act(() => {
				result.current.reset();
			});

			expect(result.current.narrators).toBeNull();
			expect(result.current.error).toBeNull();
		});

		it("removes hadith-narrator-extraction from localStorage", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			const { result } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});
			expect(localStorage.getItem(EXTRACTION_KEY)).not.toBeNull();

			act(() => {
				result.current.reset();
			});

			expect(localStorage.getItem(EXTRACTION_KEY)).toBeNull();
		});
	});

	describe("localStorage restore", () => {
		it("restores narrators on mount when the stored inputHash matches the current isnad", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			seedParseResult(EXAMPLE_ISNAD);
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			// First mount: extract and persist
			const { result, unmount } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});
			expect(result.current.narrators).toHaveLength(3);
			unmount();

			// Second mount: should restore from localStorage without calling fetch
			const callsBefore = (
				globalThis.fetch as unknown as { mock: { calls: unknown[] } }
			).mock.calls.length;
			const { result: result2 } = renderHook(() => useNarratorExtraction());

			expect(result2.current.narrators).toHaveLength(3);
			expect(result2.current.narrators?.[0].extractedName).toBe("مالك");
			// No additional fetch call during restoration
			expect(
				(globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock
					.calls.length,
			).toBe(callsBefore);
		});

		it("restores narrators as stale and sets isStale when currentIsnadText differs from the stored hash", async () => {
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test");
			seedParseResult(EXAMPLE_ISNAD);
			globalThis.fetch = mock(() =>
				Promise.resolve(makeNarratorsResponse(EXAMPLE_RAW_NARRATORS)),
			) as typeof fetch;

			// First mount: extract with the original isnad
			const { result, unmount } = renderHook(() => useNarratorExtraction());
			await act(async () => {
				await result.current.extract(EXAMPLE_ISNAD);
			});
			unmount();

			// Simulate Feature 3 boundary correction: splitAt moves → new (shorter) isnad
			const correctedIsnad = "مالك عن نافع";
			seedParseResult(correctedIsnad);

			// Second mount: pass the corrected isnad as currentIsnadText
			const { result: result2 } = renderHook(() =>
				useNarratorExtraction(correctedIsnad),
			);

			// Narrators are still shown (stale) so the user can see the old results
			expect(result2.current.narrators).toHaveLength(3);
			// isStale because the stored hash was for EXAMPLE_ISNAD, not correctedIsnad
			expect(result2.current.isStale).toBe(true);
		});
	});
});
