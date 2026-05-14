import type { NarratorMatch } from "@/lib/match-narrators";

interface NarratorChainViewProps {
	narrators: NarratorMatch[] | null;
	isLoading: boolean;
	error: string | null;
	isStale: boolean;
	showReExtract: boolean;
	onRetry: () => void;
	onReExtract: () => void;
}

export function NarratorChainView({
	narrators,
	isLoading,
	error,
	isStale,
	showReExtract,
	onRetry,
	onReExtract,
}: NarratorChainViewProps) {
	if (!isLoading && !error && !narrators && !showReExtract) return null;

	return (
		<div
			style={{
				borderTop: "1px solid var(--color-border-subtle)",
				padding: "var(--space-5)",
				direction: "rtl",
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-4)",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
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
						display: "flex",
						alignItems: "center",
						gap: "var(--space-2)",
					}}
				>
					الرواة
					{isStale && !isLoading && (
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-quaternary, #9ca3af)",
								fontWeight: "var(--weight-normal)",
							}}
						>
							· قديم
						</span>
					)}
				</span>

				{showReExtract && !isLoading && (
					<button
						type="button"
						onClick={onReExtract}
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-link, #2563eb)",
							background: "none",
							border: "1px solid var(--color-border-default)",
							borderRadius: "var(--radius-md)",
							cursor: "pointer",
							padding: "2px var(--space-3)",
							whiteSpace: "nowrap",
						}}
					>
						إعادة الاستخراج
					</button>
				)}
			</div>

			{isLoading && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-2)",
						color: "var(--color-text-secondary)",
						fontSize: "var(--text-sm)",
						fontFamily: "var(--font-ui-arabic)",
					}}
				>
					<Spinner />
					<span>جارٍ استخراج الرواة…</span>
				</div>
			)}

			{error && !isLoading && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-3)",
						flexWrap: "wrap",
					}}
				>
					<span
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							color: "var(--color-error, #dc2626)",
						}}
					>
						{error}
					</span>
					<button
						type="button"
						onClick={onRetry}
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							color: "var(--color-text-link, #2563eb)",
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 0,
							textDecoration: "underline",
						}}
					>
						إعادة المحاولة
					</button>
				</div>
			)}

			{narrators && narrators.length > 0 && !isLoading && (
				<ol
					style={{
						listStyle: "none",
						margin: 0,
						padding: 0,
						display: "flex",
						flexDirection: "column",
						gap: "var(--space-2)",
						opacity: isStale ? 0.6 : 1,
						transition: "opacity 0.15s ease",
					}}
				>
					{narrators.map((narrator) => (
						<li
							key={narrator.position}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "var(--space-3)",
								padding: "var(--space-2) var(--space-3)",
								background: "var(--color-surface-sunken)",
								borderRadius: "var(--radius-md)",
								border: "1px solid var(--color-border-default)",
							}}
						>
							<span
								style={{
									fontFamily: "var(--font-ui)",
									fontSize: "var(--text-xs)",
									color: "var(--color-text-tertiary)",
									minWidth: "1.25rem",
									textAlign: "center",
									direction: "ltr",
									flexShrink: 0,
								}}
							>
								{narrator.position + 1}
							</span>
							<span
								style={{
									fontFamily: "var(--font-display-arabic)",
									fontSize: "var(--text-base)",
									color: "var(--color-text-primary)",
									lineHeight: "1.7",
									flex: 1,
								}}
							>
								{narrator.extractedName}
							</span>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "var(--space-2)",
									flexShrink: 0,
								}}
							>
								{narrator.isAmbiguous && <AmbiguityIcon />}
								<ConfidenceBadge confidence={narrator.confidence} />
							</div>
						</li>
					))}
				</ol>
			)}
		</div>
	);
}

const BADGE_STYLES: Record<
	NarratorMatch["confidence"],
	{ background: string; color: string; label: string }
> = {
	high: { background: "#dcfce7", color: "#15803d", label: "عالية" },
	medium: { background: "#fef9c3", color: "#a16207", label: "متوسطة" },
	low: { background: "#fee2e2", color: "#b91c1c", label: "منخفضة" },
};

function ConfidenceBadge({
	confidence,
}: {
	confidence: NarratorMatch["confidence"];
}) {
	const { background, color, label } = BADGE_STYLES[confidence];
	return (
		<span
			style={{
				fontFamily: "var(--font-ui-arabic)",
				fontSize: "var(--text-xs)",
				fontWeight: "var(--weight-medium)",
				background,
				color,
				borderRadius: "var(--radius-full, 9999px)",
				padding: "1px 8px",
				direction: "rtl",
				whiteSpace: "nowrap",
			}}
		>
			{label}
		</span>
	);
}

function AmbiguityIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			aria-label="راوٍ مبهم"
			style={{ flexShrink: 0, color: "#d97706" }}
		>
			<path
				d="M7 1.5L12.5 11H1.5L7 1.5Z"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinejoin="round"
			/>
			<path
				d="M7 5.5V7.5M7 9.5H7.01"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function Spinner() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			aria-hidden="true"
			style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
		>
			<style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
			<circle
				cx="7"
				cy="7"
				r="5.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeDasharray="22 10"
			/>
		</svg>
	);
}
