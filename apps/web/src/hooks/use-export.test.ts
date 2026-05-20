import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";

import { useExport } from "@/hooks/use-export";
import type { SessionVariant } from "@/lib/session";
import { serializeSession } from "@/lib/session";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const NARRATOR = {
	extractedName: "مالك بن أنس",
	position: 0,
	mentionStart: 10,
	mentionEnd: 22,
	topMatches: [{ narratorId: "malik-ibn-anas", score: 0.97 }],
	selectedId: "malik-ibn-anas",
	userOverride: true,
	confidence: "high" as const,
	isAmbiguous: false,
};

const VARIANT: SessionVariant = {
	id: "variant-primary",
	label: "النسخة 1",
	color: "#0d9488",
	rawText:
		"حدثنا عبد الله بن يوسف أخبرنا مالك عن أنس بن مالك أن النبي صلى الله عليه وسلم",
	parseResult: {
		inputHash: "abc123",
		llmSplitAt: 48,
		splitAt: 48,
		corrected: false,
	},
	narratorExtraction: {
		inputHash: "def456",
		narrators: [NARRATOR],
	},
};

const CUSTOM_NARRATOR = {
	id: "custom-001",
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

// ── Test setup ────────────────────────────────────────────────────────────────

function makeRefs() {
	return {
		splitViewRef: createRef<HTMLElement | null>(),
		narratorListRef: createRef<HTMLElement | null>(),
		chainContainerRef: createRef<HTMLElement | null>(),
		diffViewRef: createRef<HTMLElement | null>(),
		rfInstanceRef: createRef<null>(),
	};
}

let reloadCalls = 0;

beforeEach(() => {
	localStorage.clear();
	reloadCalls = 0;
	Object.defineProperty(window, "location", {
		value: {
			...window.location,
			reload: () => {
				reloadCalls++;
			},
		},
		configurable: true,
		writable: true,
	});
	URL.createObjectURL = mock(() => "blob:mock-url");
	URL.revokeObjectURL = mock(() => {});
});

afterEach(() => {
	localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useExport", () => {
	describe("clearError", () => {
		it("clears exportError back to null", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			// Trigger an error by importing invalid JSON
			const badFile = new File(["not valid json {{"], "session.json", {
				type: "application/json",
			});
			await act(async () => {
				await result.current.importJson(badFile).catch(() => {});
			});
			expect(result.current.exportError).not.toBeNull();

			act(() => {
				result.current.clearError();
			});
			expect(result.current.exportError).toBeNull();
		});
	});

	describe("isExporting", () => {
		it("is false initially", () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			expect(result.current.isExporting).toBe(false);
		});

		it("becomes false after importJson completes with an error", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			const badFile = new File(["bad json"], "session.json", {
				type: "application/json",
			});
			await act(async () => {
				await result.current.importJson(badFile).catch(() => {});
			});
			expect(result.current.isExporting).toBe(false);
		});

		it("becomes false after exportJpg fails when no DOM refs are set", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			await act(async () => {
				await result.current.exportJpg();
			});
			expect(result.current.isExporting).toBe(false);
		});
	});

	describe("exportError", () => {
		it("is null initially", () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			expect(result.current.exportError).toBeNull();
		});

		it("is set to the Arabic error message when importJson receives malformed JSON", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			const badFile = new File(["{{not: valid]]"], "session.json", {
				type: "application/json",
			});
			await act(async () => {
				await result.current.importJson(badFile).catch(() => {});
			});
			expect(result.current.exportError).toBe(
				"الملف غير صالح أو من إصدار غير مدعوم",
			);
		});

		it("is set to the Arabic error message when the session version is unrecognized", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			const futureVersion = JSON.stringify({
				version: 99,
				exportedAt: new Date().toISOString(),
				variants: [],
				customNarrators: [],
			});
			const file = new File([futureVersion], "session.json", {
				type: "application/json",
			});
			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});
			expect(result.current.exportError).toBe(
				"الملف غير صالح أو من إصدار غير مدعوم",
			);
		});

		it("is set when exportJpg is called with no DOM refs attached", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			await act(async () => {
				await result.current.exportJpg();
			});
			expect(result.current.exportError).not.toBeNull();
		});

		it("is set when exportPdf is called with no DOM refs attached", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			await act(async () => {
				await result.current.exportPdf();
			});
			expect(result.current.exportError).not.toBeNull();
		});
	});

	describe("exportJson", () => {
		it("calls URL.createObjectURL, indicating a download blob was created", () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			localStorage.setItem("hadith-input-raw", VARIANT.rawText);
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify(VARIANT.parseResult),
			);
			localStorage.setItem(
				"hadith-narrator-extraction",
				JSON.stringify(VARIANT.narratorExtraction),
			);

			act(() => {
				result.current.exportJson();
			});

			expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
		});

		it("the downloaded blob contains a valid JSON session with version: 1", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			localStorage.setItem("hadith-input-raw", VARIANT.rawText);
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify(VARIANT.parseResult),
			);
			localStorage.setItem(
				"hadith-narrator-extraction",
				JSON.stringify(VARIANT.narratorExtraction),
			);

			let capturedBlob: Blob | null = null;
			(URL.createObjectURL as ReturnType<typeof mock>).mockImplementation(
				(b: Blob) => {
					capturedBlob = b;
					return "blob:mock-url";
				},
			);

			act(() => {
				result.current.exportJson();
			});

			const text = await capturedBlob!.text();
			const parsed = JSON.parse(text);
			expect(parsed.version).toBe(1);
		});

		it("the exported JSON includes the primary variant's rawText", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			localStorage.setItem("hadith-input-raw", VARIANT.rawText);
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify(VARIANT.parseResult),
			);

			let capturedBlob: Blob | null = null;
			(URL.createObjectURL as ReturnType<typeof mock>).mockImplementation(
				(b: Blob) => {
					capturedBlob = b;
					return "blob:mock-url";
				},
			);

			act(() => {
				result.current.exportJson();
			});

			const text = await capturedBlob!.text();
			const parsed = JSON.parse(text);
			expect(parsed.variants[0].rawText).toBe(VARIANT.rawText);
		});

		it("the exported JSON includes userOverride narrator selections", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			localStorage.setItem("hadith-input-raw", VARIANT.rawText);
			localStorage.setItem(
				"hadith-narrator-extraction",
				JSON.stringify(VARIANT.narratorExtraction),
			);

			let capturedBlob: Blob | null = null;
			(URL.createObjectURL as ReturnType<typeof mock>).mockImplementation(
				(b: Blob) => {
					capturedBlob = b;
					return "blob:mock-url";
				},
			);

			act(() => {
				result.current.exportJson();
			});

			const text = await capturedBlob!.text();
			const parsed = JSON.parse(text);
			const narrator = parsed.variants[0].narratorExtraction?.narrators[0];
			expect(narrator?.userOverride).toBe(true);
		});

		it("the exported JSON includes custom narrator records", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			localStorage.setItem("hadith-input-raw", VARIANT.rawText);
			localStorage.setItem(
				"hadith-custom-narrators",
				JSON.stringify([CUSTOM_NARRATOR]),
			);

			let capturedBlob: Blob | null = null;
			(URL.createObjectURL as ReturnType<typeof mock>).mockImplementation(
				(b: Blob) => {
					capturedBlob = b;
					return "blob:mock-url";
				},
			);

			act(() => {
				result.current.exportJson();
			});

			const text = await capturedBlob!.text();
			const parsed = JSON.parse(text);
			expect(parsed.customNarrators).toHaveLength(1);
			expect(parsed.customNarrators[0].id).toBe("custom-001");
		});
	});

	describe("importJson", () => {
		it("writes the primary variant's rawText to hadith-input-raw", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			const session = serializeSession([VARIANT], []);
			const file = new File([JSON.stringify(session)], "session.json", {
				type: "application/json",
			});

			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});

			expect(localStorage.getItem("hadith-input-raw")).toBe(VARIANT.rawText);
		});

		it("writes the primary variant's parseResult to hadith-parse-result", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			const session = serializeSession([VARIANT], []);
			const file = new File([JSON.stringify(session)], "session.json", {
				type: "application/json",
			});

			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});

			const stored = JSON.parse(
				localStorage.getItem("hadith-parse-result") as string,
			);
			expect(stored.splitAt).toBe(VARIANT.parseResult!.splitAt);
		});

		it("writes narrator extraction data to hadith-narrator-extraction", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			const session = serializeSession([VARIANT], []);
			const file = new File([JSON.stringify(session)], "session.json", {
				type: "application/json",
			});

			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});

			const stored = JSON.parse(
				localStorage.getItem("hadith-narrator-extraction") as string,
			);
			expect(stored.narrators[0].selectedId).toBe(
				VARIANT.narratorExtraction!.narrators[0].selectedId,
			);
		});

		it("calls window.location.reload to apply the restored session", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			const session = serializeSession([VARIANT], []);
			const file = new File([JSON.stringify(session)], "session.json", {
				type: "application/json",
			});

			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});

			expect(reloadCalls).toBe(1);
		});

		it("appends imported custom narrators to existing ones without replacing records with the same ID", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			const existingNarrator = {
				...CUSTOM_NARRATOR,
				id: "existing-001",
				nameArabic: "شعبة بن الحجاج",
			};
			localStorage.setItem(
				"hadith-custom-narrators",
				JSON.stringify([existingNarrator]),
			);

			const session = serializeSession([VARIANT], [CUSTOM_NARRATOR]);
			const file = new File([JSON.stringify(session)], "session.json", {
				type: "application/json",
			});

			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});

			const stored = JSON.parse(
				localStorage.getItem("hadith-custom-narrators") as string,
			) as { id: string }[];
			const ids = stored.map((n) => n.id);
			expect(ids).toContain("existing-001");
			expect(ids).toContain("custom-001");
		});

		it("does not duplicate a custom narrator that already exists in storage", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));

			localStorage.setItem(
				"hadith-custom-narrators",
				JSON.stringify([CUSTOM_NARRATOR]),
			);

			const session = serializeSession([VARIANT], [CUSTOM_NARRATOR]);
			const file = new File([JSON.stringify(session)], "session.json", {
				type: "application/json",
			});

			await act(async () => {
				await result.current.importJson(file).catch(() => {});
			});

			const stored = JSON.parse(
				localStorage.getItem("hadith-custom-narrators") as string,
			) as { id: string }[];
			const matchingIds = stored.filter((n) => n.id === "custom-001");
			expect(matchingIds).toHaveLength(1);
		});

		it("throws and preserves exportError when JSON is malformed", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			const badFile = new File(["not { valid ] json"], "bad.json", {
				type: "application/json",
			});
			let threw = false;
			await act(async () => {
				try {
					await result.current.importJson(badFile);
				} catch {
					threw = true;
				}
			});
			expect(threw).toBe(true);
			expect(result.current.exportError).toBe(
				"الملف غير صالح أو من إصدار غير مدعوم",
			);
		});

		it("does not call reload when JSON import fails", async () => {
			const { result } = renderHook(() => useExport(makeRefs()));
			const badFile = new File(["bad json"], "bad.json", {
				type: "application/json",
			});
			await act(async () => {
				await result.current.importJson(badFile).catch(() => {});
			});
			expect(reloadCalls).toBe(0);
		});
	});
});
