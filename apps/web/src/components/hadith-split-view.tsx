interface HadithSplitViewProps {
	text: string;
	splitAt: number;
	corrected?: boolean;
	onEditSplit?: () => void;
}

export function HadithSplitView({
	text,
	splitAt,
	corrected,
	onEditSplit,
}: HadithSplitViewProps) {
	const isnad = text.slice(0, splitAt).trim();
	const matn = text.slice(splitAt).trim();

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-5)",
				padding: "var(--space-5)",
				borderTop: "1px solid var(--color-border-subtle)",
				direction: "rtl",
			}}
		>
			{/* Top row: corrected badge + edit button */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div>
					{corrected && (
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								padding: "var(--space-1) var(--space-2)",
								background: "var(--color-warning-bg)",
								border: "1px solid var(--color-warning-border)",
								borderRadius: "var(--radius-sm)",
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-warning-text)",
							}}
						>
							تم التعديل يدوياً
						</span>
					)}
				</div>
				{onEditSplit && (
					<button
						type="button"
						style={{
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
						}}
						onClick={onEditSplit}
					>
						تعديل نقطة الفصل
					</button>
				)}
			</div>
			<SplitSection label="السند" text={isnad} />
			<SplitSection label="المتن" text={matn} />
		</div>
	);
}

function SplitSection({ label, text }: { label: string; text: string }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-3)",
			}}
		>
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-xs)",
					fontWeight: "var(--weight-medium)",
					color: "var(--color-text-tertiary)",
					letterSpacing: "0.07em",
					direction: "rtl",
				}}
			>
				{label}
			</span>
			<p
				style={{
					fontFamily: "var(--font-display-arabic)",
					fontSize: "var(--text-lg)",
					lineHeight: "1.95",
					color: "var(--color-text-primary)",
					direction: "rtl",
					textAlign: "right",
					margin: 0,
					padding: "var(--space-4)",
					background: "var(--color-surface-sunken)",
					borderRadius: "var(--radius-lg)",
					border: "1px solid var(--color-border-default)",
				}}
			>
				{text}
			</p>
		</div>
	);
}
