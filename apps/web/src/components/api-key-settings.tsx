// figma: 110:34 (S17 Settings Panel)
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useApiKey } from "@/hooks/use-api-key";
import { useCustomNarrators } from "@/hooks/use-custom-narrators";

const ALL_SESSION_KEYS = [
	"hadith-input-raw",
	"hadith-parse-result",
	"hadith-narrator-extraction",
	"hadith-variants",
	"hadith-custom-narrators",
];

interface ApiKeySettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
	const { apiKey, setApiKey } = useApiKey();
	const { clearAll: clearCustomNarrators } = useCustomNarrators();
	const [draft, setDraft] = useState(apiKey ?? "");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setDraft(apiKey ?? "");
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [isOpen, apiKey]);

	if (!isOpen) return null;

	const handleSave = () => {
		if (draft.trim()) {
			setApiKey(draft.trim());
		}
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") onClose();
		if (e.key === "Enter") handleSave();
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop dismiss pattern
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(28,26,23,0.50)",
				zIndex: 200,
			}}
			role="presentation"
			onClick={onClose}
			onKeyDown={handleKeyDown}
		>
			{/* Drawer */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-drawer-title"
				style={{
					position: "absolute",
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
					overflow: "hidden",
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "20px 24px",
						borderBottom: "1px solid var(--color-border-subtle)",
						flexShrink: 0,
					}}
				>
					<h2
						id="settings-drawer-title"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-xl, 1.25rem)",
							fontWeight: "var(--weight-semibold)",
							color: "var(--color-text-primary)",
							margin: 0,
						}}
					>
						الإعدادات
					</h2>
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
							borderRadius: "var(--radius-md)",
							width: 28,
							height: 28,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<X size={16} />
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
						gap: "var(--space-6)",
					}}
				>
					{/* Section 1 — API Configuration */}
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
							مفتاح API
						</span>

						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 6,
							}}
						>
							<label
								htmlFor="api-key-input"
								style={{
									fontFamily: "var(--font-ui-arabic)",
									fontSize: "var(--text-xs)",
									fontWeight: "var(--weight-medium)",
									color: "var(--color-text-secondary)",
									direction: "rtl",
								}}
							>
								مفتاح Claude API
							</label>
							{/* TODO: revert type to "password" once API troubleshooting is complete */}
							<input
								ref={inputRef}
								id="api-key-input"
								type="text"
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "var(--text-sm)",
									color: "var(--color-text-primary)",
									background: "var(--color-surface-sunken)",
									border: "1px solid var(--color-border-default)",
									borderRadius: "var(--radius-md)",
									padding: "10px 12px",
									height: 40,
									boxSizing: "border-box",
									direction: "ltr",
									width: "100%",
								}}
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								placeholder="sk-ant-..."
								autoComplete="off"
							/>
							<span
								style={{
									fontFamily: "var(--font-ui-arabic)",
									fontSize: "var(--text-xs)",
									color: "var(--color-text-tertiary)",
									direction: "rtl",
								}}
							>
								يُخزَّن محلياً فقط — لا يُرسَل إلى أي خادم
							</span>
						</div>

						<div
							style={{
								display: "flex",
								gap: "var(--space-2)",
							}}
						>
							<button
								type="button"
								className="btn-primary"
								style={{ fontFamily: "var(--font-ui-arabic)", flex: 1 }}
								onClick={handleSave}
							>
								حفظ
							</button>
							<button
								type="button"
								className="btn-secondary"
								style={{ fontFamily: "var(--font-ui-arabic)" }}
								onClick={onClose}
							>
								إلغاء
							</button>
						</div>
					</div>

					{/* Divider */}
					<hr
						style={{
							border: "none",
							borderTop: "1px solid var(--color-border-subtle)",
							margin: 0,
						}}
					/>

					{/* Section 2 — Data Management */}
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
							البيانات
						</span>
						<button
							type="button"
							onClick={clearCustomNarrators}
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-primary)",
								background: "none",
								border: "1px solid var(--color-border-default)",
								borderRadius: "var(--radius-md)",
								cursor: "pointer",
								padding: "var(--space-2) var(--space-4)",
								textAlign: "center",
								width: "fit-content",
							}}
						>
							مسح الرواة المخصصين
						</button>
						<button
							type="button"
							onClick={() => {
								for (const k of ALL_SESSION_KEYS) localStorage.removeItem(k);
								window.location.reload();
							}}
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-sm)",
								color: "var(--color-gold-700, #92400e)",
								background: "none",
								border: "1px solid var(--color-gold-400, #d97706)",
								borderRadius: "var(--radius-md)",
								cursor: "pointer",
								padding: "var(--space-2) var(--space-4)",
								textAlign: "center",
								width: "fit-content",
							}}
						>
							مسح جميع البيانات
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
