import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DebugPanel } from "@/components/debug-panel";
import { HadithInput } from "@/components/hadith-input";
import { HadithSplitView } from "@/components/hadith-split-view";
import { useHadithParser } from "@/hooks/use-hadith-parser";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const parser = useHadithParser();
	const [submittedText, setSubmittedText] = useState(() => {
		try {
			return localStorage.getItem("hadith-input-raw") ?? "";
		} catch {
			return "";
		}
	});

	const handleSubmit = async (text: string) => {
		setSubmittedText(text);
		await parser.parse(text);
	};

	return (
		<>
			<div
				style={{
					minHeight: "calc(100vh - 3.5rem)",
					background: "var(--color-canvas)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "flex-start",
					padding: "var(--space-12) var(--space-6)",
					paddingBottom: "calc(var(--space-12) + 40vh)",
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
					<HadithInput onSubmit={handleSubmit} onReset={parser.reset} />
					{parser.result && (
						<HadithSplitView
							text={submittedText}
							splitAt={parser.result.splitAt}
						/>
					)}
				</div>
			</div>
			<DebugPanel />
		</>
	);
}
