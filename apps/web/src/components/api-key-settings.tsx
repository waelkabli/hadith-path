import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useApiKey } from "@/hooks/use-api-key";
import { CustomNarratorManager } from "./custom-narrator-manager";

interface ApiKeySettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
	const { apiKey, setApiKey } = useApiKey();
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

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) onClose();
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
				background: "var(--color-surface-overlay)",
				zIndex: 300,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				animation:
					"overlay-in var(--duration-standard) var(--ease-standard) forwards",
			}}
			role="presentation"
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="api-key-settings-title"
				style={{
					background: "var(--color-surface)",
					border: "1px solid var(--color-border-default)",
					borderRadius: "var(--radius-xl)",
					boxShadow: "var(--shadow-xl)",
					width: "100%",
					maxWidth: "var(--container-narrow)",
					maxHeight: "85vh",
					overflowY: "auto",
					padding: "var(--space-6)",
					display: "flex",
					flexDirection: "column",
					gap: "var(--space-5)",
					direction: "rtl",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<h2
						id="api-key-settings-title"
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-lg)",
							fontWeight: "var(--weight-semibold)",
							color: "var(--color-text-primary)",
							margin: 0,
						}}
					>
						الإعدادات
					</h2>
					<button
						type="button"
						className="btn-icon"
						onClick={onClose}
						aria-label="إغلاق"
						style={{ marginInlineStart: "auto" }}
					>
						<X />
					</button>
				</div>

				{/* API key section */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "var(--space-3)",
					}}
				>
					<h3
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							fontWeight: "var(--weight-semibold)",
							color: "var(--color-text-secondary)",
							margin: 0,
						}}
					>
						مفتاح API
					</h3>
					<div className="input-wrapper">
						<label
							htmlFor="api-key-input"
							className="input-label"
							style={{ fontFamily: "var(--font-ui-arabic)" }}
						>
							مفتاح Claude API
						</label>
						{/* TODO: revert type to "password" once API troubleshooting is complete */}
						<input
							ref={inputRef}
							id="api-key-input"
							type="text"
							className="input"
							style={{
								fontFamily: "var(--font-mono)",
								direction: "ltr",
								color: "var(--color-text-primary)",
							}}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder="sk-ant-..."
							autoComplete="off"
						/>
						<p
							className="input-hint"
							style={{ fontFamily: "var(--font-ui-arabic)" }}
						>
							يُحفظ المفتاح محلياً في المتصفح فقط ولا يُرسل إلى أي خادم.
						</p>
					</div>

					<div
						style={{
							display: "flex",
							justifyContent: "flex-start",
							gap: "var(--space-3)",
						}}
					>
						<button
							type="button"
							className="btn-primary"
							style={{ fontFamily: "var(--font-ui-arabic)" }}
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

				{/* Narrator database section */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "var(--space-3)",
					}}
				>
					<h3
						style={{
							fontFamily: "var(--font-ui-arabic)",
							fontSize: "var(--text-sm)",
							fontWeight: "var(--weight-semibold)",
							color: "var(--color-text-secondary)",
							margin: 0,
						}}
					>
						قاعدة الرواة
					</h3>
					<CustomNarratorManager />
				</div>
			</div>
		</div>
	);
}
