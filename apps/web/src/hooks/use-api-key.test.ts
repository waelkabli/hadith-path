import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useApiKey } from "@/hooks/use-api-key";

const STORAGE_KEY = "hadith-api-key-claude";

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

describe("useApiKey", () => {
	it("returns null when no key is stored", () => {
		const { result } = renderHook(() => useApiKey());
		expect(result.current.apiKey).toBeNull();
	});

	it("restores the key from localStorage on mount", () => {
		localStorage.setItem(STORAGE_KEY, "sk-ant-test-abc123");
		const { result } = renderHook(() => useApiKey());
		expect(result.current.apiKey).toBe("sk-ant-test-abc123");
	});

	it("setApiKey writes to localStorage and updates the returned value", async () => {
		const { result } = renderHook(() => useApiKey());
		await act(async () => {
			result.current.setApiKey("sk-ant-new-key");
		});
		expect(result.current.apiKey).toBe("sk-ant-new-key");
		expect(localStorage.getItem(STORAGE_KEY)).toBe("sk-ant-new-key");
	});

	it("a subsequent mount reads the key written by a previous setApiKey call", async () => {
		const { result: first } = renderHook(() => useApiKey());
		await act(async () => {
			first.current.setApiKey("sk-ant-persisted");
		});
		const { result: second } = renderHook(() => useApiKey());
		expect(second.current.apiKey).toBe("sk-ant-persisted");
	});
});
