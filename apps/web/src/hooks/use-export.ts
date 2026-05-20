import type { ReactFlowInstance } from "@xyflow/react";
import type { RefObject } from "react";
import { useState } from "react";
import type {
	ExportJpgSections,
	ExportPdfSections,
} from "@/lib/export-functions";
import {
	exportJpg as doExportJpg,
	exportPdf as doExportPdf,
	exportJsonFile,
} from "@/lib/export-functions";
import type {
	CustomNarrator,
	NarratorMatchEntry,
	SessionVariant,
} from "@/lib/session";
import { deserializeSession } from "@/lib/session";

export interface UseExportRefs {
	splitViewRef: RefObject<HTMLElement | null>;
	narratorListRef: RefObject<HTMLElement | null>;
	chainContainerRef: RefObject<HTMLElement | null>;
	diffViewRef: RefObject<HTMLElement | null>;
	rfInstanceRef: RefObject<ReactFlowInstance | null>;
}

export interface UseExportReturn {
	exportJson: () => void;
	importJson: (file: File) => Promise<void>;
	exportJpg: () => Promise<void>;
	exportPdf: () => Promise<void>;
	isExporting: boolean;
	exportError: string | null;
	clearError: () => void;
}

function readSessionFromStorage(): {
	variants: SessionVariant[];
	customNarrators: CustomNarrator[];
} {
	try {
		const rawText = localStorage.getItem("hadith-input-raw") ?? "";
		const parseResultJson = localStorage.getItem("hadith-parse-result");
		const extractionJson = localStorage.getItem("hadith-narrator-extraction");
		const variantsJson = localStorage.getItem("hadith-variants");
		const customNarratorsJson = localStorage.getItem("hadith-custom-narrators");

		const storedVariants: Array<{
			id: string;
			label: string;
			color: string;
			rawText: string;
			splitAt: number | null;
			narrators: unknown[] | null;
		}> = variantsJson ? JSON.parse(variantsJson) : [];

		const primaryColor = storedVariants[0]?.color ?? "#0d9488";
		const primaryLabel = storedVariants[0]?.label ?? "النسخة 1";

		const primaryVariant: SessionVariant = {
			id: "variant-primary",
			label: primaryLabel,
			color: primaryColor,
			rawText,
			parseResult: parseResultJson ? JSON.parse(parseResultJson) : null,
			narratorExtraction: extractionJson ? JSON.parse(extractionJson) : null,
		};

		const additionalVariants: SessionVariant[] = storedVariants
			.slice(1)
			.map((v) => ({
				id: v.id,
				label: v.label,
				color: v.color,
				rawText: v.rawText,
				parseResult:
					v.splitAt !== null
						? {
								inputHash: "",
								llmSplitAt: v.splitAt,
								splitAt: v.splitAt,
								corrected: false,
							}
						: null,
				narratorExtraction: v.narrators
					? {
							inputHash: "",
							narrators: v.narrators as NarratorMatchEntry[],
						}
					: null,
			}));

		const customNarrators: CustomNarrator[] = customNarratorsJson
			? JSON.parse(customNarratorsJson)
			: [];

		return {
			variants: [primaryVariant, ...additionalVariants],
			customNarrators,
		};
	} catch {
		return { variants: [], customNarrators: [] };
	}
}

function applyImportedSession(
	variants: SessionVariant[],
	customNarrators: CustomNarrator[],
): void {
	const primary = variants[0];

	if (primary) {
		localStorage.setItem("hadith-input-raw", primary.rawText ?? "");
		if (primary.parseResult) {
			localStorage.setItem(
				"hadith-parse-result",
				JSON.stringify(primary.parseResult),
			);
		} else {
			localStorage.removeItem("hadith-parse-result");
		}
		if (primary.narratorExtraction) {
			localStorage.setItem(
				"hadith-narrator-extraction",
				JSON.stringify(primary.narratorExtraction),
			);
		} else {
			localStorage.removeItem("hadith-narrator-extraction");
		}
	} else {
		localStorage.removeItem("hadith-input-raw");
		localStorage.removeItem("hadith-parse-result");
		localStorage.removeItem("hadith-narrator-extraction");
	}

	const primaryForStorage = {
		id: "variant-primary",
		label: primary?.label ?? "النسخة 1",
		color: primary?.color ?? "#0d9488",
		rawText: "",
		splitAt: null,
		narrators: null,
	};
	const additionalForStorage = variants.slice(1).map((v) => ({
		id: v.id,
		label: v.label,
		color: v.color,
		rawText: v.rawText,
		splitAt: v.parseResult?.splitAt ?? null,
		narrators: v.narratorExtraction?.narrators ?? null,
	}));
	localStorage.setItem(
		"hadith-variants",
		JSON.stringify([primaryForStorage, ...additionalForStorage]),
	);

	const existingJson = localStorage.getItem("hadith-custom-narrators");
	const existing: CustomNarrator[] = existingJson
		? JSON.parse(existingJson)
		: [];
	const existingIds = new Set(existing.map((n) => n.id));
	const toAdd = customNarrators.filter((n) => !existingIds.has(n.id));
	localStorage.setItem(
		"hadith-custom-narrators",
		JSON.stringify([...existing, ...toAdd]),
	);
}

export function useExport({
	splitViewRef,
	narratorListRef,
	chainContainerRef,
	diffViewRef,
	rfInstanceRef,
}: UseExportRefs): UseExportReturn {
	const [isExporting, setIsExporting] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	const wrapAsync = async (fn: () => Promise<void>): Promise<void> => {
		setIsExporting(true);
		setExportError(null);
		try {
			await fn();
		} catch (e) {
			setExportError(e instanceof Error ? e.message : "حدث خطأ أثناء التصدير");
		} finally {
			setIsExporting(false);
		}
	};

	const getFitView = (): (() => void) | undefined => {
		const inst = rfInstanceRef.current;
		if (!inst) return undefined;
		return () => void inst.fitView({ padding: 0.3 });
	};

	const exportJson = () => {
		try {
			const { variants, customNarrators } = readSessionFromStorage();
			exportJsonFile(variants, customNarrators);
		} catch (e) {
			setExportError(e instanceof Error ? e.message : "حدث خطأ أثناء التصدير");
		}
	};

	const importJson = async (file: File): Promise<void> => {
		setIsExporting(true);
		setExportError(null);
		try {
			const text = await file.text();
			const { variants, customNarrators } = deserializeSession(text);
			applyImportedSession(variants, customNarrators);
			window.location.reload();
		} catch {
			setIsExporting(false);
			const msg = "الملف غير صالح أو من إصدار غير مدعوم";
			setExportError(msg);
			throw new Error(msg);
		}
	};

	const exportJpg = () =>
		wrapAsync(async () => {
			const splitView = splitViewRef.current;
			const chainDiagram = chainContainerRef.current;
			if (!splitView || !chainDiagram)
				throw new Error("عناصر التصدير غير متاحة");
			const sections: ExportJpgSections = { splitView, chainDiagram };
			await doExportJpg(sections, getFitView());
		});

	const exportPdf = () =>
		wrapAsync(async () => {
			const splitView = splitViewRef.current;
			const narratorList = narratorListRef.current;
			const chainDiagram = chainContainerRef.current;
			if (!splitView || !narratorList || !chainDiagram)
				throw new Error("عناصر التصدير غير متاحة");
			const sections: ExportPdfSections = {
				splitView,
				narratorList,
				chainDiagram,
				diffView: diffViewRef.current,
			};
			await doExportPdf(sections, getFitView());
		});

	return {
		exportJson,
		importJson,
		exportJpg,
		exportPdf,
		isExporting,
		exportError,
		clearError: () => setExportError(null),
	};
}
