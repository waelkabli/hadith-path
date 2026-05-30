import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const navigate = useNavigate();

	return (
		<div
			style={{
				minHeight: "calc(100vh - 3.5rem)",
				background: "var(--color-canvas)",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Hero section — vertically centered */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "var(--space-16) var(--space-6)",
					gap: "var(--space-6)",
					textAlign: "center",
					direction: "rtl",
				}}
			>
				<h1
					style={{
						fontFamily: "var(--font-display-arabic)",
						fontSize: "var(--text-3xl)",
						fontWeight: "var(--weight-semibold)",
						color: "var(--color-text-primary)",
						margin: 0,
						lineHeight: 1.3,
					}}
				>
					مسار الحديث
				</h1>

				<p
					style={{
						fontFamily: "var(--font-ui-latin)",
						fontSize: "var(--text-lg)",
						color: "var(--color-text-secondary)",
						margin: 0,
						direction: "ltr",
					}}
				>
					Paste a hadith. Trace its chain. Compare its variants.
				</p>

				<p
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-md)",
						color: "var(--color-text-secondary)",
						margin: 0,
						maxWidth: "36rem",
						lineHeight: 1.8,
					}}
				>
					أداة متخصصة لتحليل إسناد الحديث النبوي، واستخراج الرواة، ومقارنة النسخ
					المختلفة من المتن.
				</p>

				<div
					style={{
						display: "flex",
						gap: "var(--space-3)",
						alignItems: "center",
						direction: "rtl",
					}}
				>
					<button
						type="button"
						className="btn-primary"
						style={{ fontFamily: "var(--font-ui-arabic)" }}
						onClick={() => navigate({ to: "/dashboard" })}
					>
						تحليل الحديث
					</button>
					<button
						type="button"
						className="btn-ghost"
						style={{ fontFamily: "var(--font-ui-arabic)" }}
					>
						اقرأ عن المشروع
					</button>
				</div>
			</div>

			{/* Footer hint */}
			<div
				style={{
					padding: "var(--space-6)",
					background: "var(--color-surface-sunken)",
					borderTop: "1px solid var(--color-border-subtle)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "var(--space-2)",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-ui-latin)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-tertiary)",
					}}
				>
					↓ Start analyzing below
				</span>
			</div>
		</div>
	);
}
