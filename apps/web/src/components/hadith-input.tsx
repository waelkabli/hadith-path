import { Loader2 } from "lucide-react";

import {
	type UseHadithInputOptions,
	useHadithInput,
} from "@/hooks/use-hadith-input";

export function HadithInput({ onSubmit, onReset }: UseHadithInputOptions = {}) {
	const { value, error, isSubmitted, isLoading, onChange, submit, reset } =
		useHadithInput({ onSubmit, onReset });

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
				readOnly={isSubmitted}
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
				{!isSubmitted ? (
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
				) : (
					<button
						type="button"
						className="btn-secondary"
						style={{ fontFamily: "var(--font-ui-arabic)" }}
						onClick={reset}
					>
						بدء من جديد
					</button>
				)}
			</div>
		</div>
	);
}
