import { afterEach, beforeEach, describe, expect, it } from "bun:test";
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
		it.todo(
			"calling submit() with an empty value sets error to 'empty' and does not call onSubmit",
		);
		it.todo(
			"calling submit() with a whitespace-only value sets error to 'empty'",
		);
	});

	describe("validation — non-arabic", () => {
		it.todo(
			"calling submit() with Latin-only text sets error to 'non-arabic' and does not call onSubmit",
		);
	});

	describe("validation — word count", () => {
		it.todo(
			"calling submit() with text exceeding 3000 words sets error to 'too-long' and does not call onSubmit",
		);
	});

	describe("valid submit", () => {
		it.todo(
			"calling submit() with valid Arabic text calls onSubmit with the raw string",
		);
		it.todo("isLoading is true while the onSubmit promise is pending");
		it.todo(
			"isSubmitted becomes true and isLoading becomes false when the onSubmit promise resolves",
		);
		it.todo(
			"returns to idle with isLoading false when the onSubmit promise rejects",
		);
	});

	describe("reset", () => {
		it.todo(
			"reset() clears isSubmitted, isLoading, and error while preserving value",
		);
		it.todo("reset() calls the onReset callback");
	});

	describe("locked state", () => {
		it.todo(
			"isSubmitted being true signals that the textarea should be read-only",
		);
	});
});
