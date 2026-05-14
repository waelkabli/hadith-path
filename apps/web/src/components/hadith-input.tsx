import { Loader2 } from "lucide-react";

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
					className="btn-secondary btn-sm"
					style={{ fontFamily: "var(--font-ui-arabic)", flexShrink: 0 }}
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
					justifyContent: "flex-start",
					gap: "var(--space-3)",
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
			</div>
		</div>
	);
}
