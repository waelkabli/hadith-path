import type { NarratorRecord } from "@/lib/narrator-database";

const GRADE_TOKENS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	ثقة: { bg: "#eef9f8", border: "#9fddd8", text: "#1d8a80" },
	صدوق: { bg: "#eef6fe", border: "#93c8f5", text: "#1a4e7a" },
	ضعيف: { bg: "#fef6e6", border: "#f0c060", text: "#8a5a00" },
	متروك: { bg: "#fef0f0", border: "#f0a0a0", text: "#8a1515" },
};

const GENERATION_LABEL: Record<string, string> = {
	Sahabi: "الصحابة",
	"Tabi'i": "التابعون",
	"Tabi' al-Tabi'in": "أتباع التابعين",
	later: "متأخرون",
};

function resolveName(id: string, allRecords: NarratorRecord[]): string {
	return allRecords.find((r) => r.id === id)?.nameArabic ?? "غير موجود";
}

interface NarratorBioCardProps {
	record: NarratorRecord | null;
	allRecords: NarratorRecord[];
	onClose: () => void;
}

export function NarratorBioCard({
	record,
	allRecords,
	onClose,
}: NarratorBioCardProps) {
	return (
		<>
			{/* Backdrop */}
			<div
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(28,26,23,0.50)",
					zIndex: 49,
				}}
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Drawer */}
			<div
				style={{
					position: "fixed",
					right: 0,
					top: "3.5rem",
					width: 400,
					height: "calc(100vh - 3.5rem)",
					background: "var(--color-surface)",
					borderLeft: "1px solid var(--color-border-default)",
					boxShadow:
						"0 20px 48px rgba(28,26,23,0.18), 0 6px 16px rgba(28,26,23,0.10)",
					display: "flex",
					flexDirection: "column",
					direction: "rtl",
					zIndex: 50,
					overflow: "hidden",
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						padding: "20px 24px",
						borderBottom: "1px solid var(--color-border-subtle)",
						gap: "var(--space-3)",
						flexShrink: 0,
					}}
				>
					<div style={{ minWidth: 0 }}>
						<p
							style={{
								fontFamily: "var(--font-display-arabic)",
								fontSize: "var(--text-2xl, 1.5rem)",
								fontWeight: "700",
								color: "var(--color-text-primary)",
								margin: 0,
								lineHeight: 1.35,
								direction: "rtl",
							}}
						>
							{record ? record.nameArabic : "راوٍ غير معروف"}
						</p>
						{record && (
							<p
								style={{
									fontFamily: "var(--font-ui)",
									fontSize: "var(--text-sm)",
									color: "var(--color-text-secondary)",
									margin: "4px 0 0",
									direction: "ltr",
									textAlign: "right",
								}}
							>
								{record.nameTransliterated}
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="إغلاق"
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: "var(--color-text-tertiary)",
							padding: 4,
							flexShrink: 0,
							lineHeight: 1,
							borderRadius: "var(--radius-md)",
							width: 28,
							height: 28,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2 2l12 12M14 2L2 14"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>

				{/* Body */}
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						padding: "20px 24px",
						display: "flex",
						flexDirection: "column",
						gap: "var(--space-5)",
					}}
				>
					{!record ? (
						<p
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-secondary)",
								margin: "40px 0",
								textAlign: "center",
							}}
						>
							لا توجد بيانات لهذا الراوي
						</p>
					) : (
						<>
							{/* Section 1 — Metadata grid */}
							<Section>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "var(--space-3)",
									}}
								>
									{(record.deathYear !== null || record.birthYear !== null) && (
										<MetaItem
											label="وفاة"
											value={
												record.deathYear !== null
													? `${record.deathYear} هـ`
													: "غير معروف"
											}
										/>
									)}
									<MetaItem
										label="طبقة"
										value={
											GENERATION_LABEL[record.generation] ?? record.generation
										}
									/>
									<div>
										<span
											style={{
												display: "block",
												fontFamily: "var(--font-ui-arabic)",
												fontSize: "var(--text-2xs, 0.6875rem)",
												fontWeight: "var(--weight-medium)",
												color: "var(--color-text-tertiary)",
												letterSpacing: "0.06em",
												marginBottom: 4,
												direction: "rtl",
											}}
										>
											حكم
										</span>
										<ReliabilityBadge grade={record.reliabilityGrade} />
									</div>
								</div>
							</Section>

							{/* Section 2 — Teachers */}
							{record.teachers.length > 0 && (
								<Section label="المشايخ">
									<NameList ids={record.teachers} allRecords={allRecords} />
								</Section>
							)}

							{/* Section 3 — Students */}
							{record.students.length > 0 && (
								<Section label="التلاميذ">
									<NameList ids={record.students} allRecords={allRecords} />
								</Section>
							)}

							{/* Section 4 — Collections */}
							{record.collections.length > 0 && (
								<Section label="المصادر">
									<p
										style={{
											margin: 0,
											fontFamily: "var(--font-ui)",
											fontSize: "var(--text-xs)",
											color: "var(--color-text-secondary)",
											direction: "ltr",
											textAlign: "right",
										}}
									>
										{record.collections.join("، ")}
									</p>
								</Section>
							)}

							{/* Section 5 — Biography */}
							{record.bioNote && (
								<Section label="ترجمة">
									<p
										style={{
											margin: 0,
											fontFamily: "var(--font-ui)",
											fontSize: "var(--text-xs)",
											color: "var(--color-text-secondary)",
											lineHeight: 1.6,
											direction: "ltr",
											textAlign: "right",
										}}
									>
										{record.bioNote}
									</p>
								</Section>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
	label,
	children,
}: {
	label?: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			{label && (
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						fontWeight: "var(--weight-medium)",
						color: "var(--color-text-tertiary)",
						letterSpacing: "0.05em",
						direction: "rtl",
					}}
				>
					{label}
				</span>
			)}
			{children}
		</div>
	);
}

function MetaItem({ label, value }: { label: string; value: string }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-2xs, 0.6875rem)",
					fontWeight: "var(--weight-medium)",
					color: "var(--color-text-tertiary)",
					letterSpacing: "0.06em",
					direction: "rtl",
				}}
			>
				{label}
			</span>
			<span
				style={{
					fontFamily: "var(--font-display-arabic)",
					fontSize: "var(--text-sm)",
					color: "var(--color-text-primary)",
					direction: "rtl",
				}}
			>
				{value}
			</span>
		</div>
	);
}

function ReliabilityBadge({ grade }: { grade: string }) {
	const tokens = GRADE_TOKENS[grade] ?? {
		bg: "#f3f2ef",
		border: "#d8d5ce",
		text: "#625e56",
	};
	return (
		<span
			style={{
				display: "inline-flex",
				fontFamily: "var(--font-ui-arabic)",
				fontSize: "var(--text-2xs, 0.6875rem)",
				fontWeight: "var(--weight-medium)",
				background: tokens.bg,
				border: `1px solid ${tokens.border}`,
				color: tokens.text,
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

function NameList({
	ids,
	allRecords,
}: {
	ids: string[];
	allRecords: NarratorRecord[];
}) {
	return (
		<ul
			style={{
				margin: 0,
				padding: 0,
				listStyle: "none",
				display: "flex",
				flexDirection: "column",
				gap: 4,
			}}
		>
			{ids.map((id) => {
				const name = resolveName(id, allRecords);
				const resolved = name !== "غير موجود";
				return (
					<li
						key={id}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							direction: "rtl",
						}}
					>
						<span
							style={{
								color: "var(--color-text-tertiary)",
								fontSize: 10,
								flexShrink: 0,
							}}
						>
							•
						</span>
						<span
							style={{
								fontFamily: "var(--font-display-arabic)",
								fontSize: "var(--text-sm)",
								color: resolved
									? "var(--color-text-primary)"
									: "var(--color-text-tertiary)",
								fontStyle: resolved ? "normal" : "italic",
							}}
						>
							{name}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
