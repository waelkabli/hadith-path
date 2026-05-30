// figma: 110:24 (S07 Add Custom Narrator form)
import { useState } from "react";

import { useCustomNarrators } from "@/hooks/use-custom-narrators";
import { useNarratorDatabase } from "@/hooks/use-narrator-database";
import type { NarratorRecord } from "@/lib/narrator-database";

const EXTRACTION_KEY = "hadith-narrator-extraction";

function isNarratorInActiveSession(id: string): boolean {
	try {
		const json = localStorage.getItem(EXTRACTION_KEY);
		if (!json) return false;
		const data = JSON.parse(json);
		if (!Array.isArray(data?.narrators)) return false;
		return data.narrators.some(
			(n: { selectedId?: string }) => n.selectedId === id,
		);
	} catch {
		return false;
	}
}

// ── Edit form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
	record: NarratorRecord;
	onSave: (fields: Partial<NarratorRecord>) => void;
	onCancel: () => void;
}

type EditState = {
	nameArabic: string;
	nameTransliterated: string;
	deathYear: string;
	generation: NarratorRecord["generation"];
	reliabilityGrade: string;
};

function EditForm({ record, onSave, onCancel }: EditFormProps) {
	const [form, setForm] = useState<EditState>({
		nameArabic: record.nameArabic,
		nameTransliterated: record.nameTransliterated,
		deathYear: record.deathYear?.toString() ?? "",
		generation: record.generation,
		reliabilityGrade: record.reliabilityGrade,
	});

	const inputStyle: React.CSSProperties = {
		fontFamily: "var(--font-ui-arabic)",
		fontSize: "var(--text-sm)",
		color: "var(--color-text-primary)",
		background: "var(--color-surface)",
		border: "1px solid var(--color-border-default)",
		borderRadius: "var(--radius-md)",
		padding: "var(--space-2) var(--space-3)",
		width: "100%",
		boxSizing: "border-box",
	};

	const handleSave = () => {
		onSave({
			nameArabic: form.nameArabic.trim() || record.nameArabic,
			nameTransliterated:
				form.nameTransliterated.trim() || record.nameTransliterated,
			deathYear: form.deathYear ? Number.parseInt(form.deathYear, 10) : null,
			generation: form.generation,
			reliabilityGrade: form.reliabilityGrade,
		});
	};

	return (
		<div
			style={{
				padding: "var(--space-3)",
				background: "var(--color-surface-sunken)",
				borderTop: "1px solid var(--color-border-subtle)",
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-3)",
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: "var(--space-2)",
				}}
			>
				<div>
					<label
						htmlFor="edit-name-arabic"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-tertiary)",
							display: "block",
							marginBottom: 2,
						}}
					>
						الاسم العربي
					</label>
					<input
						id="edit-name-arabic"
						type="text"
						dir="rtl"
						value={form.nameArabic}
						onChange={(e) =>
							setForm((f) => ({ ...f, nameArabic: e.target.value }))
						}
						style={inputStyle}
					/>
				</div>
				<div>
					<label
						htmlFor="edit-name-transliterated"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-tertiary)",
							display: "block",
							marginBottom: 2,
						}}
					>
						الاسم اللاتيني
					</label>
					<input
						id="edit-name-transliterated"
						type="text"
						dir="ltr"
						value={form.nameTransliterated}
						onChange={(e) =>
							setForm((f) => ({ ...f, nameTransliterated: e.target.value }))
						}
						style={{ ...inputStyle, direction: "ltr" }}
					/>
				</div>
				<div>
					<label
						htmlFor="edit-death-year"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-tertiary)",
							display: "block",
							marginBottom: 2,
						}}
					>
						سنة الوفاة (هـ)
					</label>
					<input
						id="edit-death-year"
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
					<label
						htmlFor="edit-generation"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-tertiary)",
							display: "block",
							marginBottom: 2,
						}}
					>
						الطبقة
					</label>
					<select
						id="edit-generation"
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
					<label
						htmlFor="edit-reliability-grade"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-tertiary)",
							display: "block",
							marginBottom: 2,
						}}
					>
						الحكم
					</label>
					<select
						id="edit-reliability-grade"
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
			</div>

			<div
				style={{
					display: "flex",
					gap: "var(--space-2)",
					justifyContent: "flex-end",
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
						padding: "var(--space-1) var(--space-4)",
					}}
				>
					إلغاء
				</button>
				<button
					type="button"
					onClick={handleSave}
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-sm)",
						fontWeight: "var(--weight-medium)",
						color: "#fff",
						background: "#2563eb",
						border: "none",
						borderRadius: "var(--radius-md)",
						cursor: "pointer",
						padding: "var(--space-1) var(--space-4)",
					}}
				>
					حفظ
				</button>
			</div>
		</div>
	);
}

// ── Delete confirmation row ────────────────────────────────────────────────────

interface DeleteConfirmProps {
	recordId: string;
	onConfirm: () => void;
	onCancel: () => void;
}

function DeleteConfirm({ recordId, onConfirm, onCancel }: DeleteConfirmProps) {
	const usedInSession = isNarratorInActiveSession(recordId);

	return (
		<div
			style={{
				padding: "var(--space-3)",
				background: "#fef2f2",
				borderTop: "1px solid #fecaca",
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-2)",
			}}
		>
			{usedInSession && (
				<p
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "#b91c1c",
						margin: 0,
					}}
				>
					هذا الراوي مُستخدم في التحليل الحالي
				</p>
			)}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "var(--space-3)",
					justifyContent: "space-between",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-sm)",
						color: "#dc2626",
					}}
				>
					حذف هذا الراوي؟
				</span>
				<div style={{ display: "flex", gap: "var(--space-2)" }}>
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
							padding: "2px var(--space-3)",
						}}
					>
						إلغاء
					</button>
					<button
						type="button"
						onClick={onConfirm}
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							fontWeight: "var(--weight-medium)",
							color: "#fff",
							background: "#dc2626",
							border: "none",
							borderRadius: "var(--radius-md)",
							cursor: "pointer",
							padding: "2px var(--space-3)",
						}}
					>
						تأكيد
					</button>
				</div>
			</div>
		</div>
	);
}

// ── CustomNarratorManager ─────────────────────────────────────────────────────

export function CustomNarratorManager() {
	const { customNarrators, update, remove } = useCustomNarrators();
	const { bundledMeta } = useNarratorDatabase();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleEdit = (id: string) => {
		setDeletingId(null);
		setEditingId((prev) => (prev === id ? null : id));
	};

	const handleDelete = (id: string) => {
		setEditingId(null);
		setDeletingId((prev) => (prev === id ? null : id));
	};

	const handleSave = (id: string, fields: Partial<NarratorRecord>) => {
		update(id, fields);
		setEditingId(null);
	};

	const handleConfirmDelete = (id: string) => {
		remove(id);
		setDeletingId(null);
	};

	const rowStyle: React.CSSProperties = {
		border: "1px solid var(--color-border-default)",
		borderRadius: "var(--radius-md)",
		overflow: "hidden",
		background: "var(--color-surface)",
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-3)",
			}}
		>
			{/* Bundled DB metadata */}
			{bundledMeta && (
				<p
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-tertiary)",
						margin: 0,
					}}
				>
					قاعدة البيانات المدمجة — {bundledMeta.recordCount} راوٍ — آخر تحديث:{" "}
					{new Date(bundledMeta.generatedAt).toLocaleDateString("ar-SA")}
				</p>
			)}

			{/* Custom records list */}
			{customNarrators.length === 0 ? (
				<p
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-tertiary)",
						margin: 0,
						padding: "var(--space-3) 0",
						textAlign: "center",
					}}
				>
					لا توجد سجلات مخصصة
				</p>
			) : (
				<ul
					style={{
						listStyle: "none",
						margin: 0,
						padding: 0,
						display: "flex",
						flexDirection: "column",
						gap: "var(--space-2)",
					}}
				>
					{customNarrators.map((record) => (
						<li key={record.id} style={rowStyle}>
							{/* Record row */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "var(--space-3)",
									padding: "var(--space-2) var(--space-3)",
								}}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<p
										style={{
											fontFamily: "var(--font-display-arabic)",
											fontSize: "var(--text-sm)",
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
								<span
									style={{
										fontFamily: "var(--font-ui-arabic)",
										fontSize: "var(--text-xs)",
										color: "#6b7280",
										background: "#f3f4f6",
										borderRadius: "var(--radius-full, 9999px)",
										padding: "1px 6px",
										whiteSpace: "nowrap",
										flexShrink: 0,
									}}
								>
									{record.reliabilityGrade}
								</span>
								<div style={{ display: "flex", gap: "var(--space-1)" }}>
									<button
										type="button"
										onClick={() => handleEdit(record.id)}
										style={{
											fontFamily: "var(--font-ui-arabic)",
											fontSize: "var(--text-xs)",
											color: "var(--color-text-link, #2563eb)",
											background: "none",
											border: "1px solid var(--color-border-default)",
											borderRadius: "var(--radius-md)",
											cursor: "pointer",
											padding: "2px var(--space-2)",
										}}
									>
										تعديل
									</button>
									<button
										type="button"
										onClick={() => handleDelete(record.id)}
										style={{
											fontFamily: "var(--font-ui-arabic)",
											fontSize: "var(--text-xs)",
											color: "#dc2626",
											background: "none",
											border: "1px solid #fecaca",
											borderRadius: "var(--radius-md)",
											cursor: "pointer",
											padding: "2px var(--space-2)",
										}}
									>
										حذف
									</button>
								</div>
							</div>

							{/* Inline edit form */}
							{editingId === record.id && (
								<EditForm
									record={record}
									onSave={(fields) => handleSave(record.id, fields)}
									onCancel={() => setEditingId(null)}
								/>
							)}

							{/* Inline delete confirmation */}
							{deletingId === record.id && (
								<DeleteConfirm
									recordId={record.id}
									onConfirm={() => handleConfirmDelete(record.id)}
									onCancel={() => setDeletingId(null)}
								/>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
