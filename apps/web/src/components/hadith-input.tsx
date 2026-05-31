// figma: 110:18 (S01 Empty Input) · 110:19 (S02 Parsing)
import { Loader2 } from "lucide-react";

import { EXAMPLE_HADITH } from "@/constants/hadith-examples";
import {
	type UseHadithInputOptions,
	useHadithInput,
} from "@/hooks/use-hadith-input";

export function HadithInput({ onSubmit, onReset }: UseHadithInputOptions = {}) {
	const { value, error, isSubmitted, isLoading, onChange, submit, reset } =
		useHadithInput({ onSubmit, onReset });

	if (isSubmitted) {
		const preview = value.length > 80 ? `${value.slice(0, 80)}…` : value;
		return (
			<div
				data-testid="compact-summary"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "var(--space-4)",
					padding: "var(--space-3) var(--space-5)",
					height: "3rem",
					borderBottom: "1px solid var(--color-border-subtle)",
					direction: "rtl",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-display-arabic)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-secondary)",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						flex: 1,
						direction: "rtl",
					}}
				>
					{preview}
				</span>
				<button
					type="button"
					style={{
						display: "inline-flex",
						alignItems: "center",
						padding: "var(--space-2) var(--space-3)",
						background: "var(--color-surface)",
						color: "var(--color-gold-600)",
						border: "1px solid var(--color-gold-300)",
						borderRadius: "var(--radius-md)",
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						cursor: "pointer",
						flexShrink: 0,
						whiteSpace: "nowrap",
					}}
					onClick={reset}
				>
					بدء من جديد
				</button>
			</div>
		);
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-4)",
				padding: "var(--space-5)",
				direction: "rtl",
			}}
		>
			<textarea
				className="textarea-hadith"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="الصق نص الحديث هنا…"
				dir="rtl"
				rows={12}
			/>
			{error && (
				<p className="input-error-msg" dir="rtl">
					{error}
				</p>
			)}
			<div
				style={{
					display: "flex",
					gap: "var(--space-3)",
					direction: "rtl",
				}}
			>
				<button
					type="button"
					className="btn-primary"
					style={{ fontFamily: "var(--font-ui-arabic)" }}
					onClick={submit}
					disabled={isLoading}
				>
					{isLoading && (
						<span data-testid="submit-spinner" aria-hidden="true">
							<Loader2 size={16} className="animate-spin" />
						</span>
					)}
					تحليل الحديث
				</button>
				<button
					type="button"
					className="btn-ghost btn-sm"
					style={{ fontFamily: "var(--font-ui-arabic)" }}
					onClick={() => onChange(EXAMPLE_HADITH)}
					disabled={isLoading}
				>
					مثال
				</button>
			</div>
			{isLoading && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-2)",
						color: "var(--color-text-tertiary)",
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-sm)",
					}}
				>
					<Loader2 size={14} className="animate-spin" aria-hidden="true" />
					<span>جارٍ التحليل…</span>
				</div>
			)}
		</div>
	);
}
