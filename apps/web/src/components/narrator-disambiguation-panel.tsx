// figma: 110:23 (S06 Disambiguation Candidates) · 110:24 (S07 Add Custom Narrator)
import { useState } from "react";

import type { NarratorMatch } from "@/lib/match-narrators";
import type { NarratorRecord } from "@/lib/narrator-database";

export type CustomNarratorInput = Omit<
	NarratorRecord,
	"id" | "teachers" | "students" | "collections"
>;

export interface NarratorDisambiguationPanelProps {
	narratorMatch: NarratorMatch;
	candidateRecords: NarratorRecord[];
	onConfirm: (narratorId: string | null) => void;
	onAddCustom: (data: CustomNarratorInput) => void;
	onClose: () => void;
	isGuided?: boolean;
	hasNext?: boolean;
	hasPrevious?: boolean;
	onNext?: () => void;
	onPrevious?: () => void;
}

const GENERATION_LABEL: Record<NarratorRecord["generation"], string> = {
	Sahabi: "صحابي",
	"Tabi'i": "تابعي",
	"Tabi' al-Tabi'in": "تابع التابعين",
	later: "متأخر",
};

const GRADE_COLOR: Record<string, string> = {
	ثقة: "#16a34a",
	"ثقة ثبت": "#16a34a",
	صدوق: "#84cc16",
	"لا بأس به": "#84cc16",
	صالح: "#84cc16",
	ضعيف: "#f97316",
	متروك: "#dc2626",
	مجهول: "#9ca3af",
};

function gradeColor(grade: string): string {
	return GRADE_COLOR[grade] ?? "#9ca3af";
}

// ── NarratorAddForm ───────────────────────────────────────────────────────────

interface NarratorAddFormProps {
	onSubmit: (data: CustomNarratorInput) => void;
	onCancel: () => void;
}

type AddFormState = {
	nameArabic: string;
	nameTransliterated: string;
	deathYear: string;
	generation: NarratorRecord["generation"];
	reliabilityGrade: string;
};

function NarratorAddForm({ onSubmit, onCancel }: NarratorAddFormProps) {
	const [form, setForm] = useState<AddFormState>({
		nameArabic: "",
		nameTransliterated: "",
		deathYear: "",
		generation: "Tabi'i",
		reliabilityGrade: "ثقة",
	});
	const [errors, setErrors] = useState<{
		nameArabic?: string;
		nameTransliterated?: string;
	}>({});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors: typeof errors = {};
		if (!form.nameArabic.trim()) newErrors.nameArabic = "الاسم العربي مطلوب";
		if (!form.nameTransliterated.trim())
			newErrors.nameTransliterated = "الاسم اللاتيني مطلوب";
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}
		onSubmit({
			nameArabic: form.nameArabic.trim(),
			nameTransliterated: form.nameTransliterated.trim(),
			birthYear: null,
			deathYear: form.deathYear ? Number.parseInt(form.deathYear, 10) : null,
			generation: form.generation,
			reliabilityGrade: form.reliabilityGrade,
			bioNote: "",
		});
	};

	const inputStyle: React.CSSProperties = {
		fontFamily: "var(--font-ui-arabic)",
		fontSize: "var(--text-sm)",
		color: "var(--color-text-primary)",
		background: "var(--color-surface-sunken)",
		border: "1px solid var(--color-border-default)",
		borderRadius: "var(--radius-md)",
		padding: "var(--space-2) var(--space-3)",
		width: "100%",
		boxSizing: "border-box",
	};

	const labelStyle: React.CSSProperties = {
		fontFamily: "var(--font-ui-arabic)",
		fontSize: "var(--text-xs)",
		fontWeight: "var(--weight-medium)",
		color: "var(--color-text-tertiary)",
		display: "block",
		marginBottom: 4,
	};

	const errorStyle: React.CSSProperties = {
		fontFamily: "var(--font-ui-arabic)",
		fontSize: "var(--text-xs)",
		color: "#dc2626",
		marginTop: 2,
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-3)",
			}}
		>
			<div>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<label htmlFor="add-narrator-name-arabic" style={labelStyle}>
						الاسم العربي
					</label>
					<span
						aria-hidden="true"
						style={{ color: "#dc2626", fontSize: "var(--text-xs)" }}
					>
						*
					</span>
				</div>
				<input
					id="add-narrator-name-arabic"
					type="text"
					dir="rtl"
					value={form.nameArabic}
					onChange={(e) => {
						setForm((f) => ({ ...f, nameArabic: e.target.value }));
						if (errors.nameArabic)
							setErrors((er) => ({ ...er, nameArabic: undefined }));
					}}
					style={inputStyle}
				/>
				{errors.nameArabic && <p style={errorStyle}>{errors.nameArabic}</p>}
			</div>

			<div>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<label htmlFor="add-narrator-name-transliterated" style={labelStyle}>
						الاسم اللاتيني
					</label>
					<span
						aria-hidden="true"
						style={{ color: "#dc2626", fontSize: "var(--text-xs)" }}
					>
						*
					</span>
				</div>
				<input
					id="add-narrator-name-transliterated"
					type="text"
					dir="ltr"
					value={form.nameTransliterated}
					onChange={(e) => {
						setForm((f) => ({ ...f, nameTransliterated: e.target.value }));
						if (errors.nameTransliterated)
							setErrors((er) => ({ ...er, nameTransliterated: undefined }));
					}}
					style={{ ...inputStyle, direction: "ltr" }}
				/>
				{errors.nameTransliterated && (
					<p style={errorStyle}>{errors.nameTransliterated}</p>
				)}
			</div>

			<div>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<label htmlFor="add-narrator-death-year" style={labelStyle}>
						سنة الوفاة
					</label>
					<span
						aria-hidden="true"
						style={{
							color: "var(--color-text-tertiary)",
							fontSize: "var(--text-xs)",
						}}
					>
						(هـ)
					</span>
				</div>
				<input
					id="add-narrator-death-year"
					type="number"
					dir="ltr"
					value={form.deathYear}
					onChange={(e) =>
						setForm((f) => ({ ...f, deathYear: e.target.value }))
					}
					style={{ ...inputStyle, direction: "ltr" }}
				/>
			</div>

			<div>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<label htmlFor="add-narrator-generation" style={labelStyle}>
						الطبقة
					</label>
					<span
						aria-hidden="true"
						style={{ color: "#dc2626", fontSize: "var(--text-xs)" }}
					>
						*
					</span>
				</div>
				<select
					id="add-narrator-generation"
					value={form.generation}
					onChange={(e) =>
						setForm((f) => ({
							...f,
							generation: e.target.value as NarratorRecord["generation"],
						}))
					}
					style={inputStyle}
				>
					<option value="Sahabi">صحابي</option>
					<option value="Tabi'i">تابعي</option>
					<option value="Tabi' al-Tabi'in">تابع التابعين</option>
					<option value="later">متأخر</option>
				</select>
			</div>

			<div>
				<label htmlFor="add-narrator-reliability-grade" style={labelStyle}>
					الحكم
					<span
						aria-hidden="true"
						style={{ color: "#dc2626", marginInlineStart: 2 }}
					>
						*
					</span>
				</label>
				<select
					id="add-narrator-reliability-grade"
					value={form.reliabilityGrade}
					onChange={(e) =>
						setForm((f) => ({ ...f, reliabilityGrade: e.target.value }))
					}
					style={inputStyle}
				>
					<option value="ثقة">ثقة</option>
					<option value="ثقة ثبت">ثقة ثبت</option>
					<option value="صدوق">صدوق</option>
					<option value="لا بأس به">لا بأس به</option>
					<option value="صالح">صالح</option>
					<option value="ضعيف">ضعيف</option>
					<option value="متروك">متروك</option>
					<option value="مجهول">مجهول</option>
				</select>
			</div>

			<div
				style={{
					display: "flex",
					gap: "var(--space-2)",
					justifyContent: "flex-end",
					paddingTop: "var(--space-2)",
				}}
			>
				<button
					type="button"
					onClick={onCancel}
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-secondary)",
						background: "none",
						border: "1px solid var(--color-border-default)",
						borderRadius: "var(--radius-md)",
						cursor: "pointer",
						padding: "var(--space-2) var(--space-4)",
					}}
				>
					إلغاء
				</button>
				<button
					type="submit"
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-sm)",
						fontWeight: "var(--weight-medium)",
						color: "#fff",
						background: "#2563eb",
						border: "none",
						borderRadius: "var(--radius-md)",
						cursor: "pointer",
						padding: "var(--space-2) var(--space-4)",
					}}
				>
					حفظ
				</button>
			</div>
		</form>
	);
}

// ── NarratorDisambiguationPanel ───────────────────────────────────────────────

export function NarratorDisambiguationPanel({
	narratorMatch,
	candidateRecords,
	onConfirm,
	onAddCustom,
	onClose,
	isGuided = false,
	hasNext = false,
	hasPrevious = false,
	onNext,
	onPrevious,
}: NarratorDisambiguationPanelProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [isAdding, setIsAdding] = useState(false);

	// Sort candidates by score descending
	const sorted = [...narratorMatch.topMatches]
		.sort((a, b) => b.score - a.score)
		.slice(0, 5);

	const handleConfirm = (narratorId: string | null) => {
		onConfirm(narratorId);
	};

	const toggleExpand = (id: string) => {
		setExpandedId((prev) => (prev === id ? null : id));
	};

	return (
		<div
			style={{
				borderTop: "1px solid var(--color-border-subtle)",
				direction: "rtl",
				background: "var(--color-surface-sunken)",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					padding: "var(--space-4) var(--space-5)",
					borderBottom: "1px solid var(--color-border-subtle)",
				}}
			>
				<div>
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
						{narratorMatch.extractedName}
					</p>
					<p
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-tertiary)",
							margin: 0,
							marginTop: 2,
						}}
					>
						تحديد الراوي
					</p>
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
						width: 24,
						height: 24,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
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

			{isAdding ? (
				/* Add form — hides candidate list */
				<div style={{ padding: "var(--space-4) var(--space-5)" }}>
					<NarratorAddForm
						onSubmit={(data) => {
							onAddCustom(data);
							setIsAdding(false);
						}}
						onCancel={() => setIsAdding(false)}
					/>
				</div>
			) : (
				<>
					{/* Candidate list */}
					{sorted.length > 0 && (
						<ul
							style={{
								listStyle: "none",
								margin: 0,
								padding: "var(--space-3) var(--space-5) 0",
								display: "flex",
								flexDirection: "column",
								gap: "var(--space-2)",
							}}
						>
							{sorted.map(({ narratorId, score }) => {
								const record = candidateRecords.find(
									(r) => r.id === narratorId,
								);
								if (!record) return null;

								const isSelected = narratorMatch.selectedId === record.id;
								const isExpanded = expandedId === record.id;
								const color = gradeColor(record.reliabilityGrade);

								return (
									<li
										key={record.id}
										style={{
											border: isSelected
												? "1px solid #16a34a"
												: "1px solid var(--color-border-default)",
											borderRadius: "var(--radius-md)",
											background: isSelected
												? "#f0fdf4"
												: "var(--color-surface)",
											overflow: "hidden",
										}}
									>
										{/* Main candidate row */}
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "var(--space-3)",
												padding: "var(--space-2) var(--space-3)",
											}}
										>
											{/* Names */}
											<div style={{ flex: 1, minWidth: 0 }}>
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
													{record.nameArabic}
												</p>
												<p
													style={{
														fontFamily: "var(--font-ui)",
														fontSize: "var(--text-xs)",
														color: "var(--color-text-tertiary)",
														margin: 0,
														direction: "ltr",
														textAlign: "right",
													}}
												>
													{record.nameTransliterated}
													{record.deathYear !== null
														? ` · ت. ${record.deathYear} هـ`
														: ""}
												</p>
											</div>

											{/* Badges */}
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "var(--space-2)",
													flexShrink: 0,
												}}
											>
												{/* Generation badge */}
												<span
													style={{
														fontFamily: "var(--font-ui-arabic)",
														fontSize: "var(--text-xs)",
														color: "#6b7280",
														background: "#f3f4f6",
														borderRadius: "var(--radius-full, 9999px)",
														padding: "1px 6px",
														whiteSpace: "nowrap",
													}}
												>
													{GENERATION_LABEL[record.generation]}
												</span>

												{/* Reliability grade badge */}
												<span
													style={{
														fontFamily: "var(--font-ui-arabic)",
														fontSize: "var(--text-xs)",
														fontWeight: "var(--weight-medium)",
														color,
														background: `${color}18`,
														borderRadius: "var(--radius-full, 9999px)",
														padding: "1px 6px",
														whiteSpace: "nowrap",
													}}
												>
													{record.reliabilityGrade}
												</span>

												{/* Score */}
												<span
													style={{
														fontFamily: "var(--font-ui)",
														fontSize: "var(--text-xs)",
														color: "var(--color-text-tertiary)",
														direction: "ltr",
														whiteSpace: "nowrap",
													}}
												>
													{Math.round(score * 100)}%
												</span>
											</div>

											{/* Toggle details */}
											<button
												type="button"
												onClick={() => toggleExpand(record.id)}
												style={{
													fontFamily: "var(--font-ui-arabic)",
													fontSize: "var(--text-xs)",
													color: "var(--color-text-link, #2563eb)",
													background: "none",
													border: "none",
													cursor: "pointer",
													padding: "2px 4px",
													flexShrink: 0,
													whiteSpace: "nowrap",
												}}
											>
												{isExpanded ? "▲ إخفاء" : "▼ التفاصيل"}
											</button>

											{/* Confirm button */}
											<button
												type="button"
												onClick={() => handleConfirm(record.id)}
												style={{
													fontFamily: "var(--font-ui-arabic)",
													fontSize: "var(--text-xs)",
													fontWeight: "var(--weight-medium)",
													color: "#fff",
													background: isSelected ? "#16a34a" : "#2563eb",
													border: "none",
													borderRadius: "var(--radius-md)",
													cursor: "pointer",
													padding: "var(--space-2) var(--space-3)",
													flexShrink: 0,
												}}
											>
												تأكيد
											</button>
										</div>

										{/* Expanded details */}
										{isExpanded && (
											<div
												style={{
													borderTop: "1px solid var(--color-border-subtle)",
													padding: "var(--space-3)",
													display: "flex",
													flexDirection: "column",
													gap: "var(--space-2)",
													background: "var(--color-surface-sunken)",
												}}
											>
												{record.bioNote && (
													<p
														style={{
															fontFamily: "var(--font-ui)",
															fontSize: "var(--text-xs)",
															color: "var(--color-text-secondary)",
															margin: 0,
															direction: "ltr",
															lineHeight: 1.6,
														}}
													>
														{record.bioNote}
													</p>
												)}

												{record.teachers.length > 0 && (
													<div>
														<span
															style={{
																fontFamily: "var(--font-ui-arabic)",
																fontSize: "var(--text-xs)",
																color: "var(--color-text-tertiary)",
																fontWeight: "var(--weight-medium)",
															}}
														>
															المشايخ:{" "}
														</span>
														<span
															style={{
																fontFamily: "var(--font-ui)",
																fontSize: "var(--text-xs)",
																color: "var(--color-text-secondary)",
																direction: "ltr",
															}}
														>
															{record.teachers.join(", ")}
														</span>
													</div>
												)}

												{record.students.length > 0 && (
													<div>
														<span
															style={{
																fontFamily: "var(--font-ui-arabic)",
																fontSize: "var(--text-xs)",
																color: "var(--color-text-tertiary)",
																fontWeight: "var(--weight-medium)",
															}}
														>
															التلاميذ:{" "}
														</span>
														<span
															style={{
																fontFamily: "var(--font-ui)",
																fontSize: "var(--text-xs)",
																color: "var(--color-text-secondary)",
																direction: "ltr",
															}}
														>
															{record.students.join(", ")}
														</span>
													</div>
												)}

												{record.collections.length > 0 && (
													<div>
														<span
															style={{
																fontFamily: "var(--font-ui-arabic)",
																fontSize: "var(--text-xs)",
																color: "var(--color-text-tertiary)",
																fontWeight: "var(--weight-medium)",
															}}
														>
															المصادر:{" "}
														</span>
														<span
															style={{
																fontFamily: "var(--font-ui)",
																fontSize: "var(--text-xs)",
																color: "var(--color-text-secondary)",
																direction: "ltr",
															}}
														>
															{record.collections.join(", ")}
														</span>
													</div>
												)}
											</div>
										)}
									</li>
								);
							})}
						</ul>
					)}

					{/* Action buttons footer */}
					<div
						style={{
							display: "flex",
							gap: "var(--space-2)",
							flexWrap: "wrap",
							alignItems: "center",
							borderTop: "1px solid var(--color-border-subtle)",
							padding: "var(--space-3) var(--space-5)",
							marginTop: "var(--space-2)",
						}}
					>
						<button
							type="button"
							onClick={() => handleConfirm(null)}
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "#6b7280",
								background: "none",
								border: "1px solid #d1d5db",
								borderRadius: "var(--radius-md)",
								cursor: "pointer",
								padding: "var(--space-2) var(--space-4)",
							}}
						>
							راوٍ غير معروف
						</button>

						<button
							type="button"
							onClick={() => setIsAdding(true)}
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-link, #2563eb)",
								background: "none",
								border: "1px solid var(--color-border-default)",
								borderRadius: "var(--radius-md)",
								cursor: "pointer",
								padding: "var(--space-2) var(--space-4)",
							}}
						>
							إضافة راوٍ جديد
						</button>

						{/* Guided navigation */}
						{isGuided && (
							<>
								{hasPrevious && (
									<button
										type="button"
										onClick={onPrevious}
										style={{
											fontFamily: "var(--font-ui-arabic)",
											fontSize: "var(--text-sm)",
											color: "var(--color-text-secondary)",
											background: "none",
											border: "1px solid var(--color-border-default)",
											borderRadius: "var(--radius-md)",
											cursor: "pointer",
											padding: "var(--space-2) var(--space-4)",
											marginRight: "auto",
										}}
									>
										السابق
									</button>
								)}
								{hasNext ? (
									<button
										type="button"
										onClick={onNext}
										style={{
											fontFamily: "var(--font-ui-arabic)",
											fontSize: "var(--text-sm)",
											fontWeight: "var(--weight-medium)",
											color: "#fff",
											background: "#2563eb",
											border: "none",
											borderRadius: "var(--radius-md)",
											cursor: "pointer",
											padding: "var(--space-2) var(--space-4)",
										}}
									>
										التالي
									</button>
								) : (
									<button
										type="button"
										onClick={onClose}
										style={{
											fontFamily: "var(--font-ui-arabic)",
											fontSize: "var(--text-sm)",
											fontWeight: "var(--weight-medium)",
											color: "#fff",
											background: "#16a34a",
											border: "none",
											borderRadius: "var(--radius-md)",
											cursor: "pointer",
											padding: "var(--space-2) var(--space-4)",
										}}
									>
										إنهاء المراجعة
									</button>
								)}
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}
