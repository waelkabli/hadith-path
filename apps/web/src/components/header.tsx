import { Settings } from "lucide-react";
import { useState } from "react";

import { ApiKeySettings } from "./api-key-settings";

export default function Header() {
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<header
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				height: "3.5rem",
				padding: "0 var(--space-6)",
				background: "var(--color-surface)",
				borderBottom: "1px solid var(--color-border-subtle)",
				flexShrink: 0,
			}}
		>
			{/* Logo group — left side */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "var(--space-2)",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-display-arabic)",
						fontSize: "var(--text-lg)",
						fontWeight: "var(--weight-semibold)",
						color: "var(--color-gold-500)",
						lineHeight: 1,
					}}
				>
					مسار الحديث
				</span>
				<span
					style={{
						fontFamily: "var(--font-ui-latin)",
						fontSize: "var(--text-md)",
						fontWeight: "var(--weight-medium)",
						color: "var(--color-text-primary)",
						lineHeight: 1,
					}}
				>
					Hadith Path
				</span>
			</div>

			{/* Nav links + settings — right side */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "var(--space-1)",
				}}
			>
				{(["About", "Guide"] as const).map((label) => (
					<button
						key={label}
						type="button"
						className="btn-ghost"
						style={{
							fontFamily: "var(--font-ui-latin)",
							fontSize: "var(--text-sm)",
							padding: "var(--space-2) var(--space-3)",
						}}
					>
						{label}
					</button>
				))}
				<button
					type="button"
					className="btn-icon"
					onClick={() => setSettingsOpen(true)}
					aria-label="الإعدادات"
				>
					<Settings size={16} strokeWidth={1.75} />
				</button>
			</div>

			<ApiKeySettings
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
			/>
		</header>
	);
}
