import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { DebugPanel } from "@/components/debug-panel";
import { HadithInput } from "@/components/hadith-input";
import { HadithSplitView } from "@/components/hadith-split-view";
import { IsnadChainView } from "@/components/isnad-chain-view";
import { NarratorBioCard } from "@/components/narrator-bio-card";
import { NarratorChainView } from "@/components/narrator-chain-view";
import { useHadithParser } from "@/hooks/use-hadith-parser";
import { useNarratorExtraction } from "@/hooks/use-narrator-extraction";
import { getNarratorDatabase } from "@/lib/narrator-database";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

const narratorDatabase = getNarratorDatabase();

// Discriminated union so "no selection", "unknown narrator", and "identified
// narrator" are all distinct — avoids null-as-sentinel ambiguity.
type BioPanelState =
	| { type: "closed" }
	| { type: "unknown" }
	| { type: "record"; id: string };

function RouteComponent() {
	const parser = useHadithParser();
	const [submittedText, setSubmittedText] = useState(() => {
		try {
			return localStorage.getItem("hadith-input-raw") ?? "";
		} catch {
			return "";
		}
	});

	const currentIsnad = parser.result
		? submittedText.slice(0, parser.result.splitAt)
		: undefined;

	const extractor = useNarratorExtraction(currentIsnad);

	const [bioPanel, setBioPanel] = useState<BioPanelState>({ type: "closed" });

	const selectedRecord =
		bioPanel.type === "record"
			? (narratorDatabase.find((r) => r.id === bioPanel.id) ?? null)
			: null;

	const showReExtract =
		(parser.result?.corrected ?? false) && extractor.isStale;

	const handleSubmit = async (text: string) => {
		setSubmittedText(text);
		const result = await parser.parse(text);
		const isnad = text.slice(0, result.splitAt);
		await extractor.extract(isnad);
	};

	const handleReset = useCallback(() => {
		parser.reset();
		extractor.reset();
	}, [parser, extractor]);

	const handleReExtract = useCallback(async () => {
		const hasUserOverrides =
			extractor.narrators?.some((n) => n.userOverride) ?? false;
		if (hasUserOverrides) {
			const confirmed = window.confirm(
				"ستُفقد التعديلات اليدوية على رواة السند — هل تريد المتابعة؟",
			);
			if (!confirmed) return;
		}
		extractor.reset();
		const isnad = submittedText.slice(0, parser.result?.splitAt ?? 0);
		await extractor.extract(isnad);
	}, [extractor, submittedText, parser.result]);

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
					<HadithInput onSubmit={handleSubmit} onReset={handleReset} />
					{parser.result && (
						<HadithSplitView
							text={submittedText}
							splitAt={parser.result.splitAt}
						/>
					)}
					<NarratorChainView
						narrators={extractor.narrators}
						isLoading={extractor.isLoading}
						error={extractor.error}
						isStale={extractor.isStale}
						showReExtract={showReExtract}
						onRetry={() =>
							extractor.extract(
								submittedText.slice(0, parser.result?.splitAt ?? 0),
							)
						}
						onReExtract={handleReExtract}
					/>
					{extractor.narrators && extractor.narrators.length > 0 && (
						<div
							style={{
								borderTop: "1px solid var(--color-border-subtle)",
								display: "flex",
								direction: "ltr",
							}}
						>
							<div style={{ flex: 1, minWidth: 0 }}>
								<IsnadChainView
									narrators={extractor.narrators}
									records={narratorDatabase}
									onNodeClick={(recordId) =>
										setBioPanel(
											recordId === null
												? { type: "unknown" }
												: { type: "record", id: recordId },
										)
									}
								/>
							</div>
							{bioPanel.type !== "closed" && (
								<NarratorBioCard
									record={selectedRecord}
									allRecords={narratorDatabase}
									onClose={() => setBioPanel({ type: "closed" })}
								/>
							)}
						</div>
					)}
				</div>
			</div>
			<DebugPanel />
		</>
	);
}
