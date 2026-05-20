import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { CustomNarrator, SessionVariant } from "./session";
import { serializeSession } from "./session";

function localDateString(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function exportJsonFile(
	variants: SessionVariant[],
	customNarrators: CustomNarrator[],
): void {
	const session = serializeSession(variants, customNarrators);
	const json = JSON.stringify(session, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	triggerDownload(blob, `hadith-session-${localDateString()}.json`);
}

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
	await document.fonts.ready;
	return html2canvas(el, {
		scale: 2,
		useCORS: true,
		backgroundColor: "#fdf8f0",
		logging: false,
		allowTaint: true,
	});
}

export interface ExportJpgSections {
	splitView: HTMLElement;
	chainDiagram: HTMLElement;
}

export async function exportJpg(
	sections: ExportJpgSections,
	fitView?: () => void | Promise<void>,
): Promise<void> {
	if (fitView) await Promise.resolve(fitView());
	await new Promise<void>((r) => setTimeout(r, 200));

	const [splitCanvas, chainCanvas] = await Promise.all([
		captureElement(sections.splitView),
		captureElement(sections.chainDiagram),
	]);

	const width = Math.max(splitCanvas.width, chainCanvas.width);
	const totalHeight = splitCanvas.height + chainCanvas.height;

	const combined = document.createElement("canvas");
	combined.width = width;
	combined.height = totalHeight;
	const ctx = combined.getContext("2d");
	if (!ctx) throw new Error("فشل إنشاء سياق الرسم");

	ctx.fillStyle = "#fdf8f0";
	ctx.fillRect(0, 0, width, totalHeight);
	ctx.drawImage(splitCanvas, 0, 0);
	ctx.drawImage(chainCanvas, 0, splitCanvas.height);

	await new Promise<void>((resolve, reject) => {
		combined.toBlob(
			(blob) => {
				if (blob) {
					triggerDownload(blob, `hadith-chain-${localDateString()}.jpg`);
					resolve();
				} else {
					reject(new Error("فشل إنشاء الصورة"));
				}
			},
			"image/jpeg",
			0.92,
		);
	});
}

export interface ExportPdfSections {
	splitView: HTMLElement;
	narratorList: HTMLElement;
	chainDiagram: HTMLElement;
	diffView: HTMLElement | null;
}

export async function exportPdf(
	sections: ExportPdfSections,
	fitView?: () => void | Promise<void>,
): Promise<void> {
	if (fitView) await Promise.resolve(fitView());
	await new Promise<void>((r) => setTimeout(r, 200));
	await document.fonts.ready;

	// eslint-disable-next-line new-cap
	const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const margin = 10;
	const contentWidth = pageWidth - 2 * margin;
	const maxHeight = pageHeight - 2 * margin;

	const sectionEls: HTMLElement[] = [
		sections.splitView,
		sections.narratorList,
		sections.chainDiagram,
		...(sections.diffView ? [sections.diffView] : []),
	];

	for (let i = 0; i < sectionEls.length; i++) {
		const canvas = await captureElement(sectionEls[i]);
		const imgData = canvas.toDataURL("image/jpeg", 0.92);
		const aspectRatio = canvas.height / canvas.width;
		const imgH = Math.min(contentWidth * aspectRatio, maxHeight);

		if (i > 0) pdf.addPage();
		pdf.addImage(imgData, "JPEG", margin, margin, contentWidth, imgH);
	}

	pdf.save(`hadith-analysis-${localDateString()}.pdf`);
}
