import { useHadithInput } from "@/hooks/use-hadith-input";

export function HadithInput() {
	const { value, onChange } = useHadithInput();

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
			<div style={{ display: "flex", justifyContent: "flex-start" }}>
				<button
					type="button"
					className="btn-primary"
					style={{ fontFamily: "var(--font-ui-arabic)" }}
				>
					تحليل الحديث
				</button>
			</div>
		</div>
	);
}
