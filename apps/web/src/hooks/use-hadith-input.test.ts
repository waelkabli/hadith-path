import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { EXAMPLE_HADITH } from "@/constants/hadith-examples";
import { useHadithInput } from "@/hooks/use-hadith-input";

const STORAGE_KEY = "hadith-input-raw";

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

describe("useHadithInput", () => {
	describe("localStorage persistence", () => {
		it("pre-fills the example hadith as the initial value when localStorage is empty", () => {
			const { result } = renderHook(() => useHadithInput());
			expect(result.current.value).toBe(EXAMPLE_HADITH);
		});

		it("restores hadith-input-raw from localStorage on mount when the key is present", () => {
			const stored = "حدثنا أبو بكر عن عائشة رضي الله عنها";
			localStorage.setItem(STORAGE_KEY, stored);
			const { result } = renderHook(() => useHadithInput());
			expect(result.current.value).toBe(stored);
		});

		it("writes the current value to hadith-input-raw on every change", async () => {
			const { result } = renderHook(() => useHadithInput());
			await act(async () => {
				result.current.onChange("نص جديد للاختبار");
			});
			expect(localStorage.getItem(STORAGE_KEY)).toBe("نص جديد للاختبار");
		});
	});

	describe("validation — empty", () => {
		it("calling submit() with an empty value sets error to 'empty' and does not call onSubmit", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe("الرجاء إدخال نص الحديث");
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it("calling submit() with a whitespace-only value sets error to 'empty'", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("   \n\t  ");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe("الرجاء إدخال نص الحديث");
			expect(onSubmit).not.toHaveBeenCalled();
		});
	});

	describe("validation — non-arabic", () => {
		it("calling submit() with Latin-only text sets error to 'non-arabic' and does not call onSubmit", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("hello world this is latin text");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe(
				"النص غير مدعوم — الأداة تقبل النصوص العربية فقط",
			);
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it("text where exactly 50% of non-whitespace chars are Arabic triggers the non-arabic error", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			// "عa" — 1 Arabic char, 1 Latin char → 50% Arabic → error
			await act(async () => {
				result.current.onChange("عa");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe(
				"النص غير مدعوم — الأداة تقبل النصوص العربية فقط",
			);
		});

		it("text where just over 50% of non-whitespace chars are Arabic passes the language check", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			// "عبa" — 2 Arabic chars, 1 Latin char → 66.7% Arabic → passes
			await act(async () => {
				result.current.onChange("عبa");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBeNull();
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});
	});

	describe("validation — order", () => {
		it("non-Arabic text that also exceeds 3000 words produces the non-Arabic error, not the word-count error", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			const longLatin = "word ".repeat(3001).trim();
			await act(async () => {
				result.current.onChange(longLatin);
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe(
				"النص غير مدعوم — الأداة تقبل النصوص العربية فقط",
			);
		});
	});

	describe("validation — word count", () => {
		it("calling submit() with text exceeding 3000 words sets error to 'too-long' and does not call onSubmit", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			const longText = "عن ".repeat(3001).trim();
			await act(async () => {
				result.current.onChange(longText);
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe(
				"النص يتجاوز الحد المسموح به (٣٠٠٠ كلمة)",
			);
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it("exactly 3000 words passes the word-count check", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			const exactText = "عن ".repeat(3000).trim();
			await act(async () => {
				result.current.onChange(exactText);
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBeNull();
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});
	});

	describe("error lifecycle", () => {
		it("error is null before any submit attempt", () => {
			const { result } = renderHook(() => useHadithInput());
			expect(result.current.error).toBeNull();
		});

		it("valid submit after a failed submit clears the previous error", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			// First: trigger a validation error
			await act(async () => {
				result.current.onChange("");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe("الرجاء إدخال نص الحديث");
			// Then: submit valid Arabic
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBeNull();
		});

		it("onSubmit rejection sets error to the rejection message", async () => {
			const onSubmit = mock(async () => {
				throw new Error("LLM parse failed");
			});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.error).toBe("LLM parse failed");
		});
	});

	describe("valid submit", () => {
		it("calling submit() with valid Arabic text calls onSubmit with the raw string", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			const text = "حدثنا محمد عن عبدالله رضي الله عنه";
			await act(async () => {
				result.current.onChange(text);
			});
			await act(async () => {
				result.current.submit();
			});
			expect(onSubmit).toHaveBeenCalledWith(text);
		});

		it("isLoading is true while the onSubmit promise is pending", async () => {
			let resolve!: () => void;
			const pending = new Promise<void>((res) => {
				resolve = res;
			});
			const { result } = renderHook(() =>
				useHadithInput({ onSubmit: async () => pending }),
			);
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			act(() => {
				result.current.submit();
			});
			expect(result.current.isLoading).toBe(true);
			await act(async () => {
				resolve();
			});
			expect(result.current.isLoading).toBe(false);
		});

		it("isSubmitted becomes true and isLoading becomes false when the onSubmit promise resolves", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.isSubmitted).toBe(true);
			expect(result.current.isLoading).toBe(false);
		});

		it("returns to idle with isLoading false when the onSubmit promise rejects", async () => {
			const onSubmit = mock(async () => {
				throw new Error("network error");
			});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.isLoading).toBe(false);
			expect(result.current.isSubmitted).toBe(false);
		});
	});

	describe("reset", () => {
		it("reset() clears isSubmitted, isLoading, and error while preserving value", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			const text = "حدثنا محمد عن عبدالله رضي الله عنه";
			await act(async () => {
				result.current.onChange(text);
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.isSubmitted).toBe(true);
			await act(async () => {
				result.current.reset();
			});
			expect(result.current.isSubmitted).toBe(false);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(result.current.value).toBe(text);
		});

		it("reset() calls the onReset callback", async () => {
			const onSubmit = mock(async () => {});
			const onReset = mock(() => {});
			const { result } = renderHook(() =>
				useHadithInput({ onSubmit, onReset }),
			);
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			await act(async () => {
				result.current.submit();
			});
			await act(async () => {
				result.current.reset();
			});
			expect(onReset).toHaveBeenCalledTimes(1);
		});
	});

	describe("locked state", () => {
		it("isSubmitted being true signals that the textarea should be read-only", async () => {
			const onSubmit = mock(async () => {});
			const { result } = renderHook(() => useHadithInput({ onSubmit }));
			await act(async () => {
				result.current.onChange("حدثنا محمد عن عبدالله رضي الله عنه");
			});
			await act(async () => {
				result.current.submit();
			});
			expect(result.current.isSubmitted).toBe(true);
		});
	});
});
