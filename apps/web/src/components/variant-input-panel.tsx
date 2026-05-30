// figma: 110:29 (S12 Variant Input Panel)
import { useState } from "react";

import { useApiKey } from "@/hooks/use-api-key";
import type { Variant } from "@/hooks/use-variants";
import { extractNarrators } from "@/lib/extract-narrators";
import { matchNarrators } from "@/lib/match-narrators";
import type { NarratorRecord } from "@/lib/narrator-database";
import { parseHadith } from "@/lib/parse-hadith";

interface VariantInputPanelProps {
	variant: Variant;
	allRecords: NarratorRecord[];
	onUpdate: (data: Partial<Variant>) => void;
	onRemove: () => void;
}

export function VariantInputPanel({
	variant,
	allRecords,
	onUpdate,
	onRemove,
}: VariantInputPanelProps) {
	const { apiKey } = useApiKey();
	const [localText, setLocalText] = useState(variant.rawText ?? "");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasNarrators = variant.narrators !== null;

	const handleSubmit = async () => {
		if (!localText.trim() || !apiKey) return;
		setIsLoading(true);
		setError(null);
		try {
			const { splitAt } = await parseHadith(localText, apiKey);
			const isnadText = localText.slice(0, splitAt);
			const extracted = await extractNarrators(isnadText, apiKey);
			const narrators = matchNarrators(extracted, allRecords);
			onUpdate({ rawText: localText, splitAt, narrators });
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
		} finally {
			setIsLoading(false);
		}
	};

	const handleReset = () => {
		onUpdate({ narrators: null, splitAt: null });
		setError(null);
	};

	// Arabic numeral conversion for display
	const toArabicNumerals = (n: number): string => {
		return n
			.toString()
			.replace(/0/g, "٠")
			.replace(/1/g, "١")
			.replace(/2/g, "٢")
			.replace(/3/g, "٣")
			.replace(/4/g, "٤")
			.replace(/5/g, "٥")
			.replace(/6/g, "٦")
			.replace(/7/g, "٧")
			.replace(/8/g, "٨")
			.replace(/9/g, "٩");
	};

	return (
		<div
			style={{
				borderTop: "1px solid var(--color-border-subtle)",
				direction: "rtl",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "var(--space-2)",
					padding: "var(--space-3) var(--space-5)",
					justifyContent: "space-between",
					background: "var(--color-surface-sunken)",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-2)",
					}}
				>
					{/* Color dot */}
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: "50%",
							background: variant.color,
							flexShrink: 0,
						}}
					/>
					<span
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							fontWeight: "var(--weight-medium)",
							color: "var(--color-text-secondary)",
						}}
					>
						{variant.label}
					</span>
				</div>
				{/* Remove button */}
				<button
					type="button"
					onClick={onRemove}
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-tertiary)",
						background: "none",
						border: "none",
						cursor: "pointer",
						padding: "var(--space-1) var(--space-2)",
					}}
				>
					✕ حذف
				</button>
			</div>

			{/* Body */}
			{!hasNarrators ? (
				<div
					style={{
						padding: "0 var(--space-5) var(--space-4)",
						display: "flex",
						flexDirection: "column",
						gap: "var(--space-3)",
					}}
				>
					<textarea
						className="textarea-hadith"
						dir="rtl"
						value={localText}
						onChange={(e) => setLocalText(e.target.value)}
						placeholder="أدخل نص الحديث لهذه النسخة…"
						rows={4}
						disabled={isLoading}
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							resize: "vertical",
							width: "100%",
							boxSizing: "border-box",
							minHeight: "160px",
						}}
					/>

					{error && (
						<p
							style={{
								margin: 0,
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "#dc2626",
							}}
						>
							{error}
						</p>
					)}

					<div style={{ display: "flex", justifyContent: "flex-start" }}>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={isLoading || !localText.trim() || !apiKey}
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color:
									isLoading || !localText.trim() || !apiKey
										? "var(--color-text-tertiary)"
										: variant.color,
								background: "transparent",
								border: `1px solid ${isLoading || !localText.trim() || !apiKey ? "var(--color-border-default)" : variant.color}`,
								borderRadius: "var(--radius-md)",
								padding: "var(--space-2) var(--space-3)",
								cursor:
									isLoading || !localText.trim() || !apiKey
										? "not-allowed"
										: "pointer",
								opacity: isLoading || !localText.trim() || !apiKey ? 0.5 : 1,
							}}
						>
							{isLoading ? "جارٍ التحليل…" : "تحليل هذه النسخة"}
						</button>
					</div>
				</div>
			) : (
				<div
					style={{
						padding: "0 var(--space-5) var(--space-4)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "var(--space-4)",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "var(--space-3)",
							flex: 1,
							minWidth: 0,
						}}
					>
						{/* Text preview */}
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-secondary)",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								flex: 1,
							}}
						>
							{variant.rawText
								? variant.rawText.slice(0, 60) +
									(variant.rawText.length > 60 ? "…" : "")
								: "—"}
						</span>
						{/* Narrator count badge */}
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-secondary)",
								background: "var(--color-surface-raised)",
								border: "1px solid var(--color-border-subtle)",
								borderRadius: "var(--radius-sm)",
								padding: "1px var(--space-2)",
								flexShrink: 0,
								whiteSpace: "nowrap",
							}}
						>
							{toArabicNumerals(variant.narrators?.length ?? 0)} رواة
						</span>
					</div>
					<button
						type="button"
						className="btn-secondary btn-sm"
						onClick={handleReset}
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							flexShrink: 0,
						}}
					>
						إعادة التحليل
					</button>
				</div>
			)}
		</div>
	);
}
