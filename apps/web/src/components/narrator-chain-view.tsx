import type { NarratorMatch } from "@/lib/match-narrators";
import type { NarratorRecord } from "@/lib/narrator-database";

interface NarratorChainViewProps {
	narrators: NarratorMatch[] | null;
	isLoading: boolean;
	error: string | null;
	isStale: boolean;
	showReExtract: boolean;
	onRetry: () => void;
	onReExtract: () => void;
	// Phase 1 — click-to-select
	selectedPosition?: number | null;
	onSelect?: (position: number) => void;
	// Phase 2 — guided step-through
	onStartGuided?: () => void;
	// Phase 6 — resolve selectedId against live DB (dangling reference detection)
	records?: NarratorRecord[];
}

export function NarratorChainView({
	narrators,
	isLoading,
	error,
	isStale,
	showReExtract,
	onRetry,
	onReExtract,
	selectedPosition,
	onSelect,
	onStartGuided,
	records,
}: NarratorChainViewProps) {
	if (!isLoading && !error && !narrators && !showReExtract) return null;

	// Phase 2: count unresolved narrators for the summary banner
	const unresolvedCount =
		narrators?.filter(
			(n) => !n.userOverride && (n.confidence === "low" || n.isAmbiguous),
		).length ?? 0;

	return (
		<div
			style={{
				borderTop: "1px solid var(--color-border-subtle)",
				direction: "rtl",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Section header bar */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "var(--space-2) var(--space-5)",
					minHeight: "2.75rem",
					borderBottom:
						narrators && narrators.length > 0
							? "1px solid var(--color-border-subtle)"
							: undefined,
				}}
			>
				{/* Right (RTL leading): label */}
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-2xs, 0.6875rem)",
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
						<span style={{ color: "#9ca3af", fontWeight: 400 }}>· قديم</span>
					)}
				</span>

				{/* Left (RTL trailing): count or re-extract */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-2)",
					}}
				>
					{narrators && narrators.length > 0 && !isLoading && (
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-tertiary)",
							}}
						>
							{`${toArabicNumeral(narrators.length)} رواة`}
						</span>
					)}
					{showReExtract && !isLoading && (
						<button
							type="button"
							onClick={onReExtract}
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-link)",
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
			</div>

			{/* Narrator list body */}
			<div style={{ padding: "var(--space-2) var(--space-5) var(--space-5)" }}>
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
					<>
						{/* Phase 2 — Summary banner */}
						{unresolvedCount > 0 && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: "var(--space-3)",
									padding: "var(--space-3) var(--space-4)",
									background: "#fef9c3",
									border: "1px solid #fde047",
									borderRadius: "var(--radius-md)",
								}}
							>
								<span
									style={{
										fontFamily: "var(--font-ui-arabic)",
										fontSize: "var(--text-sm)",
										color: "#92400e",
									}}
								>
									{unresolvedCount === 1
										? "١ راوٍ غير محدد"
										: `${toArabicNumeral(unresolvedCount)} رواة غير محددين`}
								</span>
								<button
									type="button"
									onClick={onStartGuided}
									style={{
										fontFamily: "var(--font-ui-arabic)",
										fontSize: "var(--text-xs)",
										fontWeight: "var(--weight-medium)",
										color: "#92400e",
										background: "#fde047",
										border: "none",
										borderRadius: "var(--radius-md)",
										cursor: "pointer",
										padding: "2px var(--space-3)",
										whiteSpace: "nowrap",
									}}
								>
									راجع الآن
								</button>
							</div>
						)}

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
							{narrators.map((narrator) => {
								const isSelected = narrator.position === selectedPosition;
								const resolvedRecord =
									narrator.selectedId && records
										? records.find((r) => r.id === narrator.selectedId)
										: undefined;
								const isConfirmed =
									narrator.userOverride &&
									narrator.selectedId !== null &&
									(!records || resolvedRecord !== undefined);
								const isUnknown =
									narrator.userOverride &&
									(narrator.selectedId === null ||
										(records !== undefined && resolvedRecord === undefined));

								let borderColor: string;
								let backgroundColor: string;
								if (isSelected) {
									borderColor = "#2563eb";
									backgroundColor = "#eff6ff";
								} else if (isConfirmed) {
									borderColor = "#16a34a";
									backgroundColor = "var(--color-surface-sunken)";
								} else if (isUnknown) {
									borderColor = "#9ca3af";
									backgroundColor = "var(--color-surface-sunken)";
								} else {
									borderColor = "var(--color-border-default)";
									backgroundColor = "var(--color-surface-sunken)";
								}

								const clickable = Boolean(onSelect);

								return (
									<li
										key={narrator.position}
										role={clickable ? "button" : undefined}
										tabIndex={clickable ? 0 : undefined}
										onClick={
											clickable
												? () => onSelect?.(narrator.position)
												: undefined
										}
										onKeyDown={
											clickable
												? (e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															onSelect?.(narrator.position);
														}
													}
												: undefined
										}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "var(--space-3)",
											padding: "var(--space-2) var(--space-3)",
											background: backgroundColor,
											borderRadius: "var(--radius-md)",
											border: `1px solid ${borderColor}`,
											cursor: clickable ? "pointer" : undefined,
											transition:
												"border-color 0.1s ease, background 0.1s ease",
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
											{resolvedRecord?.reliabilityGrade && (
												<ReliabilityBadge
													grade={resolvedRecord.reliabilityGrade}
												/>
											)}
											<ConfidenceBadge confidence={narrator.confidence} />
											{isConfirmed && <CheckIcon />}
											{isUnknown && <UnknownIcon />}
											{narrator.isAmbiguous && !isConfirmed && !isUnknown && (
												<AmbiguityIcon />
											)}
										</div>
									</li>
								);
							})}
						</ol>
					</>
				)}
			</div>
		</div>
	);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArabicNumeral(n: number): string {
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
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CONFIDENCE_STYLES: Record<
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
	const { background, color, label } = CONFIDENCE_STYLES[confidence];
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

const GRADE_BADGE_STYLES: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	ثقة: { bg: "#eef9f8", border: "#9fddd8", text: "#1d8a80" },
	صدوق: { bg: "#eef6fe", border: "#93c8f5", text: "#1a4e7a" },
	ضعيف: { bg: "#fef6e6", border: "#f0c060", text: "#8a5a00" },
	متروك: { bg: "#fef0f0", border: "#f0a0a0", text: "#8a1515" },
	مجهول: { bg: "#f3f2ef", border: "#d8d5ce", text: "#625e56" },
};

function ReliabilityBadge({ grade }: { grade: string }) {
	const style = GRADE_BADGE_STYLES[grade] ?? GRADE_BADGE_STYLES.مجهول;
	return (
		<span
			style={{
				fontFamily: "var(--font-ui-arabic)",
				fontSize: "var(--text-2xs, 0.6875rem)",
				fontWeight: "var(--weight-medium)",
				background: style.bg,
				border: `1px solid ${style.border}`,
				color: style.text,
				borderRadius: "var(--radius-sm)",
				padding: "2px 8px",
				direction: "rtl",
				whiteSpace: "nowrap",
			}}
		>
			{grade}
		</span>
	);
}

function CheckIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-label="مؤكد"
			style={{ flexShrink: 0 }}
		>
			<path
				d="M2 6l3 3 5-5"
				stroke="#16a34a"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function UnknownIcon() {
	return (
		<span
			role="img"
			aria-label="غير معروف"
			style={{
				fontFamily: "var(--font-ui-arabic)",
				fontSize: "var(--text-xs)",
				color: "#9ca3af",
				flexShrink: 0,
				lineHeight: 1,
			}}
		>
			؟
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
