import type { NarratorRecord } from "@/lib/narrator-database";

const GRADE_COLOR: Record<string, string> = {
	ثقة: "#16a34a",
	صدوق: "#84cc16",
	ضعيف: "#f97316",
	متروك: "#dc2626",
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
		<div
			style={{
				width: 280,
				flexShrink: 0,
				borderLeft: "1px solid var(--color-border-subtle)",
				display: "flex",
				flexDirection: "column",
				direction: "rtl",
				background: "var(--color-surface)",
				overflow: "hidden",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					padding: "var(--space-3) var(--space-4)",
					borderBottom: "1px solid var(--color-border-subtle)",
					gap: "var(--space-2)",
					flexShrink: 0,
				}}
			>
				<div style={{ minWidth: 0 }}>
					<p
						style={{
							fontFamily: "var(--font-display-arabic)",
							fontSize: "var(--text-base)",
							fontWeight: "var(--weight-medium)",
							color: "var(--color-text-primary)",
							margin: 0,
							lineHeight: 1.5,
						}}
					>
						{record ? record.nameArabic : "راوٍ غير معروف"}
					</p>
					{record && (
						<p
							style={{
								fontFamily: "var(--font-ui)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-tertiary)",
								margin: 0,
								marginTop: 2,
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
						padding: 2,
						flexShrink: 0,
						lineHeight: 1,
					}}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M2 2l10 10M12 2L2 12"
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
					padding: "var(--space-3) var(--space-4)",
					display: "flex",
					flexDirection: "column",
					gap: "var(--space-3)",
				}}
			>
				{!record ? (
					<p
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							color: "var(--color-text-secondary)",
							margin: 0,
							textAlign: "center",
						}}
					>
						لا توجد بيانات لهذا الراوي
					</p>
				) : (
					<>
						{/* Dates + generation */}
						<Section>
							{(record.deathYear !== null || record.birthYear !== null) && (
								<Field
									label="الوفاة"
									value={
										record.deathYear !== null
											? `${record.deathYear} هـ`
											: "غير معروف"
									}
								/>
							)}
							<Field
								label="الطبقة"
								value={GENERATION_LABEL[record.generation] ?? record.generation}
							/>
							<ReliabilityField grade={record.reliabilityGrade} />
						</Section>

						{/* Teachers */}
						{record.teachers.length > 0 && (
							<Section label="المشايخ">
								<NameList ids={record.teachers} allRecords={allRecords} />
							</Section>
						)}

						{/* Students */}
						{record.students.length > 0 && (
							<Section label="التلاميذ">
								<NameList ids={record.students} allRecords={allRecords} />
							</Section>
						)}

						{/* Collections */}
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

						{/* Bio note */}
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
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			{label && (
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						fontWeight: "var(--weight-medium)",
						color: "var(--color-text-tertiary)",
						letterSpacing: "0.05em",
					}}
				>
					{label}
				</span>
			)}
			{children}
		</div>
	);
}

function Field({ label, value }: { label: string; value: string }) {
	return (
		<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-xs)",
					color: "var(--color-text-tertiary)",
					flexShrink: 0,
				}}
			>
				{label}:
			</span>
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-xs)",
					color: "var(--color-text-secondary)",
				}}
			>
				{value}
			</span>
		</div>
	);
}

function ReliabilityField({ grade }: { grade: string }) {
	const color = GRADE_COLOR[grade] ?? "#9ca3af";
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-xs)",
					color: "var(--color-text-tertiary)",
					flexShrink: 0,
				}}
			>
				الحكم:
			</span>
			<span
				style={{
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-xs)",
					fontWeight: "var(--weight-medium)",
					color,
					background: `${color}18`,
					borderRadius: "var(--radius-full, 9999px)",
					padding: "1px 6px",
				}}
			>
				{grade}
			</span>
		</div>
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
				gap: 2,
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
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								color: resolved
									? "var(--color-text-secondary)"
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
