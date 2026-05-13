import { createFileRoute } from "@tanstack/react-router";

import { HadithInput } from "@/components/hadith-input";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div
			style={{
				minHeight: "calc(100vh - 3.5rem)",
				background: "var(--color-canvas)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "flex-start",
				padding: "var(--space-12) var(--space-6)",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: "var(--container-prose)",
					background: "var(--color-surface)",
					border: "1px solid var(--color-border-default)",
					borderRadius: "var(--radius-lg)",
					boxShadow: "var(--shadow-sm)",
				}}
			>
				<HadithInput />
			</div>
		</div>
	);
}
