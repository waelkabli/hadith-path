import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useHadithParser } from "@/hooks/use-hadith-parser";

const API_KEY_STORAGE = "hadith-api-key-claude";
const VALID_HADITH =
	"حدثنا عبد الله بن يوسف أخبرنا مالك عن ابن شهاب عن أنس بن مالك";

const makeClaudeResponse = (splitAt: number): Response =>
	new Response(
		JSON.stringify({
			content: [{ type: "text", text: JSON.stringify({ splitAt }) }],
		}),
		{ status: 200 },
	);

const makeErrorResponse = (status: number): Response =>
	new Response(JSON.stringify({ error: { message: "error" } }), { status });

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
	localStorage.clear();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	localStorage.clear();
});

describe("useHadithParser", () => {
	describe("API key guard", () => {
		it("sets error to the missing-key message when no API key is stored", async () => {
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.error).toBe("يرجى إدخال مفتاح API في الإعدادات");
		});

		it("throws with the missing-key message when no API key is stored", async () => {
			const { result } = renderHook(() => useHadithParser());
			let caughtMessage = "";
			await act(async () => {
				try {
					await result.current.parse(VALID_HADITH);
				} catch (e) {
					caughtMessage = (e as Error).message;
				}
			});
			expect(caughtMessage).toBe("يرجى إدخال مفتاح API في الإعدادات");
		});

		it("leaves result as null when no API key is stored", async () => {
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.result).toBeNull();
		});
	});

	describe("successful parse", () => {
		it("sets result.splitAt to the value returned by the Claude API", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeClaudeResponse(42)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH);
			});
			expect(result.current.result?.splitAt).toBe(42);
		});

		it("sets result.llmSplitAt equal to result.splitAt on first parse", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeClaudeResponse(42)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH);
			});
			expect(result.current.result?.llmSplitAt).toBe(42);
		});

		it("sets result.corrected to false", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeClaudeResponse(42)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH);
			});
			expect(result.current.result?.corrected).toBe(false);
		});

		it("isLoading is true while the fetch is pending", async () => {
			let resolveFetch!: (r: Response) => void;
			globalThis.fetch = mock(
				() =>
					new Promise<Response>((res) => {
						resolveFetch = res;
					}),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			act(() => {
				result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.isLoading).toBe(true);
			await act(async () => {
				resolveFetch(makeClaudeResponse(42));
			});
		});

		it("isLoading becomes false after a successful parse", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeClaudeResponse(42)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH);
			});
			expect(result.current.isLoading).toBe(false);
		});

		it("error is null after a successful parse", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeClaudeResponse(42)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH);
			});
			expect(result.current.error).toBeNull();
		});
	});

	describe("failed parse", () => {
		it("sets error to the API-failure message when the Claude call fails", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeErrorResponse(401)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-bad-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.error).toBe(
				"فشل الاتصال بالنموذج — يرجى التحقق من المفتاح والمحاولة مجدداً",
			);
		});

		it("throws with the API-failure message when the Claude call fails", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeErrorResponse(401)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-bad-key");
			const { result } = renderHook(() => useHadithParser());
			let caughtMessage = "";
			await act(async () => {
				try {
					await result.current.parse(VALID_HADITH);
				} catch (e) {
					caughtMessage = (e as Error).message;
				}
			});
			expect(caughtMessage).toBe(
				"فشل الاتصال بالنموذج — يرجى التحقق من المفتاح والمحاولة مجدداً",
			);
		});

		it("isLoading returns to false after a failed parse", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeErrorResponse(500)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.isLoading).toBe(false);
		});

		it("result remains null after a failed parse", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeErrorResponse(500)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.result).toBeNull();
		});
	});

	describe("reset", () => {
		it("reset() clears result to null", async () => {
			globalThis.fetch = mock(() =>
				Promise.resolve(makeClaudeResponse(42)),
			) as typeof fetch;
			localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH);
			});
			expect(result.current.result).not.toBeNull();
			await act(async () => {
				result.current.reset();
			});
			expect(result.current.result).toBeNull();
		});

		it("reset() clears a prior error to null", async () => {
			const { result } = renderHook(() => useHadithParser());
			await act(async () => {
				await result.current.parse(VALID_HADITH).catch(() => {});
			});
			expect(result.current.error).not.toBeNull();
			await act(async () => {
				result.current.reset();
			});
			expect(result.current.error).toBeNull();
		});
	});

	describe("localStorage persistence", () => {
		describe("write after successful parse", () => {
			it("writes hadith-parse-result to localStorage after a successful parse", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH);
				});
				expect(localStorage.getItem("hadith-parse-result")).not.toBeNull();
			});

			it("stored splitAt equals the API's returned value", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH);
				});
				const stored = JSON.parse(
					localStorage.getItem("hadith-parse-result") as string,
				);
				expect(stored.splitAt).toBe(50);
			});

			it("stored llmSplitAt equals splitAt on first parse", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH);
				});
				const stored = JSON.parse(
					localStorage.getItem("hadith-parse-result") as string,
				);
				expect(stored.llmSplitAt).toBe(50);
			});

			it("stored corrected is false", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH);
				});
				const stored = JSON.parse(
					localStorage.getItem("hadith-parse-result") as string,
				);
				expect(stored.corrected).toBe(false);
			});

			it("stored inputHash is a non-empty string", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH);
				});
				const stored = JSON.parse(
					localStorage.getItem("hadith-parse-result") as string,
				);
				expect(typeof stored.inputHash).toBe("string");
				expect(stored.inputHash.length).toBeGreaterThan(0);
			});

			it("does not write hadith-parse-result after a failed Claude call", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeErrorResponse(401)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-bad-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH).catch(() => {});
				});
				expect(localStorage.getItem("hadith-parse-result")).toBeNull();
			});
		});

		describe("restore on mount", () => {
			it("result is non-null on fresh mount when stored hash matches hadith-input-raw", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				const { result: first } = renderHook(() => useHadithParser());
				await act(async () => {
					await first.current.parse(VALID_HADITH);
				});

				const { result: restored } = renderHook(() => useHadithParser());
				expect(restored.current.result).not.toBeNull();
			});

			it("restored result.splitAt matches the stored value", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				const { result: first } = renderHook(() => useHadithParser());
				await act(async () => {
					await first.current.parse(VALID_HADITH);
				});

				const { result: restored } = renderHook(() => useHadithParser());
				expect(restored.current.result?.splitAt).toBe(50);
			});

			it("restored result.llmSplitAt matches the stored value", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				const { result: first } = renderHook(() => useHadithParser());
				await act(async () => {
					await first.current.parse(VALID_HADITH);
				});

				const { result: restored } = renderHook(() => useHadithParser());
				expect(restored.current.result?.llmSplitAt).toBe(50);
			});

			it("result is null on mount when hadith-input-raw does not match the stored hash", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				const { result: first } = renderHook(() => useHadithParser());
				await act(async () => {
					await first.current.parse(VALID_HADITH);
				});
				// Simulate user pasting different text
				localStorage.setItem(
					"hadith-input-raw",
					"نص عربي مختلف تماماً عن النص الأصلي",
				);

				const { result: stale } = renderHook(() => useHadithParser());
				expect(stale.current.result).toBeNull();
			});

			it("result is null on mount when hadith-parse-result is absent", () => {
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				const { result } = renderHook(() => useHadithParser());
				expect(result.current.result).toBeNull();
			});

			it("result is null on mount when hadith-input-raw is absent", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				const { result: first } = renderHook(() => useHadithParser());
				await act(async () => {
					await first.current.parse(VALID_HADITH);
				});
				localStorage.removeItem("hadith-input-raw");

				const { result } = renderHook(() => useHadithParser());
				expect(result.current.result).toBeNull();
			});

			it("result is null on mount when hadith-parse-result contains malformed JSON", () => {
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				localStorage.setItem("hadith-parse-result", "not json {{{");
				const { result } = renderHook(() => useHadithParser());
				expect(result.current.result).toBeNull();
			});

			it("result is null on mount when hadith-parse-result has an invalid shape", () => {
				localStorage.setItem("hadith-input-raw", VALID_HADITH);
				localStorage.setItem(
					"hadith-parse-result",
					JSON.stringify({ foo: "bar" }),
				);
				const { result } = renderHook(() => useHadithParser());
				expect(result.current.result).toBeNull();
			});
		});

		describe("reset", () => {
			it("reset() removes hadith-parse-result from localStorage", async () => {
				globalThis.fetch = mock(() =>
					Promise.resolve(makeClaudeResponse(50)),
				) as typeof fetch;
				localStorage.setItem(API_KEY_STORAGE, "sk-ant-test-key");
				const { result } = renderHook(() => useHadithParser());
				await act(async () => {
					await result.current.parse(VALID_HADITH);
				});
				expect(localStorage.getItem("hadith-parse-result")).not.toBeNull();
				await act(async () => {
					result.current.reset();
				});
				expect(localStorage.getItem("hadith-parse-result")).toBeNull();
			});
		});
	});
});
