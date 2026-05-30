import { useRef, useState } from "react";
import type { UseExportReturn } from "@/hooks/use-export";

interface ExportToolbarProps {
	exportHook: UseExportReturn;
}

const BTN: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	padding: "var(--space-1) var(--space-3)",
	background: "transparent",
	color: "var(--color-text-secondary)",
	border: "1px solid var(--color-border-default)",
	borderRadius: "var(--radius-md)",
	fontFamily: "var(--font-ui-arabic)",
	fontSize: "var(--text-xs)",
	cursor: "pointer",
	lineHeight: 1,
	whiteSpace: "nowrap" as const,
};

const BTN_DISABLED: React.CSSProperties = {
	...BTN,
	opacity: 0.5,
	cursor: "not-allowed",
};

export function ExportToolbar({ exportHook }: ExportToolbarProps) {
	const {
		exportJson,
		importJson,
		exportJpg,
		exportPdf,
		isExporting,
		exportError,
		clearError,
	} = exportHook;
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) setPendingFile(file);
		e.target.value = "";
	};

	const handleConfirmImport = async () => {
		if (!pendingFile) return;
		const file = pendingFile;
		setPendingFile(null);
		try {
			await importJson(file);
		} catch {
			// error surfaces via exportHook.exportError
		}
	};

	return (
		<>
			{/* Confirmation dialog */}
			{pendingFile && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.4)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 200,
					}}
				>
					<div
						style={{
							background: "var(--color-surface)",
							border: "1px solid var(--color-border-default)",
							borderRadius: "var(--radius-lg)",
							padding: "var(--space-6)",
							maxWidth: 400,
							width: "90%",
							direction: "rtl",
							display: "flex",
							flexDirection: "column",
							gap: "var(--space-4)",
							boxShadow: "var(--shadow-lg)",
						}}
					>
						{/* Title row */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "var(--space-2)",
							}}
						>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: 20,
									height: 20,
									borderRadius: "50%",
									background: "#f97316",
									color: "#fff",
									fontSize: 12,
									fontWeight: "bold",
									flexShrink: 0,
								}}
							>
								!
							</span>
							<span
								style={{
									fontFamily: "var(--font-ui-arabic)",
									fontSize: "var(--text-base)",
									fontWeight: "var(--weight-semibold)",
									color: "var(--color-text-primary)",
								}}
							>
								تأكيد الاستيراد
							</span>
						</div>
						<p
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-base)",
								color: "var(--color-text-primary)",
								margin: 0,
								lineHeight: 1.6,
							}}
						>
							استيراد هذا الملف سيستبدل جلسة العمل الحالية. هل تريد المتابعة؟
						</p>
						<div
							style={{
								display: "flex",
								gap: "var(--space-2)",
								justifyContent: "flex-end",
							}}
						>
							<button
								type="button"
								style={BTN}
								onClick={() => setPendingFile(null)}
							>
								إلغاء
							</button>
							<button
								type="button"
								style={{
									...BTN,
									background: "var(--color-gold-400)",
									borderColor: "var(--color-gold-500)",
									color: "var(--color-text-primary)",
									fontWeight: "var(--weight-medium)",
								}}
								onClick={handleConfirmImport}
							>
								متابعة
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Toolbar row */}
			<div
				style={{
					borderTop: "1px solid var(--color-border-subtle)",
					padding: "var(--space-3) var(--space-5)",
					direction: "rtl",
					display: "flex",
					alignItems: "center",
					gap: "var(--space-2)",
					flexWrap: "wrap",
					background: "var(--color-surface-sunken)",
					position: "relative",
				}}
			>
				{/* Loading overlay */}
				{isExporting && (
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: "rgba(255,255,255,0.75)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 10,
							borderRadius: "inherit",
						}}
					>
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-secondary)",
							}}
						>
							جارٍ التصدير…
						</span>
					</div>
				)}

				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-tertiary)",
						fontWeight: "var(--weight-medium)",
					}}
				>
					تصدير:
				</span>

				<button
					type="button"
					style={isExporting ? BTN_DISABLED : BTN}
					disabled={isExporting}
					onClick={exportJson}
				>
					JSON
				</button>

				<button
					type="button"
					style={isExporting ? BTN_DISABLED : BTN}
					disabled={isExporting}
					onClick={() => fileInputRef.current?.click()}
				>
					استيراد JSON
				</button>

				<button
					type="button"
					style={isExporting ? BTN_DISABLED : BTN}
					disabled={isExporting}
					onClick={exportJpg}
				>
					JPG
				</button>

				<button
					type="button"
					style={isExporting ? BTN_DISABLED : BTN}
					disabled={isExporting}
					onClick={exportPdf}
				>
					PDF
				</button>

				<input
					ref={fileInputRef}
					type="file"
					accept=".json"
					style={{ display: "none" }}
					onChange={handleFileChange}
				/>

				{/* Error row */}
				{exportError && (
					<div
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							gap: "var(--space-3)",
							padding: "var(--space-2) var(--space-3)",
							background: "var(--color-error-bg, #fef0f0)",
							border: "1px solid var(--color-error-border, #f0a0a0)",
							borderRadius: "var(--radius-sm)",
							marginTop: "var(--space-1)",
						}}
					>
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "var(--color-error-text, #8a1515)",
								flex: 1,
							}}
						>
							{exportError}
						</span>
						<button type="button" style={BTN} onClick={clearError}>
							إغلاق
						</button>
					</div>
				)}
			</div>
		</>
	);
}
