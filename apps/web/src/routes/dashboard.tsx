import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { DebugPanel } from "@/components/debug-panel";
import { HadithInput } from "@/components/hadith-input";
import { HadithSplitView } from "@/components/hadith-split-view";
import { IsnadChainView } from "@/components/isnad-chain-view";
import { NarratorBioCard } from "@/components/narrator-bio-card";
import { NarratorChainView } from "@/components/narrator-chain-view";
import { NarratorDisambiguationPanel } from "@/components/narrator-disambiguation-panel";
import { VariantChainView } from "@/components/variant-chain-view";
import { VariantInputPanel } from "@/components/variant-input-panel";
import { useCustomNarrators } from "@/hooks/use-custom-narrators";
import { useHadithParser } from "@/hooks/use-hadith-parser";
import { useNarratorDatabase } from "@/hooks/use-narrator-database";
import { useNarratorExtraction } from "@/hooks/use-narrator-extraction";
import { useVariants, type Variant } from "@/hooks/use-variants";
import type { NarratorRecord } from "@/lib/narrator-database";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

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
	const { records: allRecords, error: dbError } = useNarratorDatabase();

	const [bioPanel, setBioPanel] = useState<BioPanelState>({ type: "closed" });
	const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
	const [isInGuidedMode, setIsInGuidedMode] = useState(false);

	const customNarrators = useCustomNarrators();
	const { variants, canAddMore, addVariant, removeVariant, updateVariant } =
		useVariants();

	const selectedRecord =
		bioPanel.type === "record"
			? (allRecords.find((r) => r.id === bioPanel.id) ?? null)
			: null;

	const showReExtract =
		(parser.result?.corrected ?? false) && extractor.isStale;

	const flaggedNarrators =
		extractor.narrators?.filter(
			(n) => !n.userOverride && (n.confidence === "low" || n.isAmbiguous),
		) ?? [];

	const handleSubmit = async (text: string) => {
		setSubmittedText(text);
		const result = await parser.parse(text);
		const isnad = text.slice(0, result.splitAt);
		await extractor.extract(isnad, allRecords);
	};

	const handleReset = useCallback(() => {
		parser.reset();
		extractor.reset();
		for (const v of variants.slice(1)) removeVariant(v.id);
	}, [parser, extractor, variants, removeVariant]);

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
		await extractor.extract(isnad, allRecords);
	}, [extractor, submittedText, parser.result, allRecords]);

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

					{/* DB load error banner */}
					{dbError && (
						<div
							style={{
								borderTop: "1px solid var(--color-border-subtle)",
								padding: "var(--space-3) var(--space-5)",
								background: "#fef9c3",
								direction: "rtl",
								display: "flex",
								alignItems: "center",
								gap: "var(--space-3)",
							}}
						>
							<span
								style={{
									fontFamily: "var(--font-ui-arabic)",
									fontSize: "var(--text-sm)",
									color: "#92400e",
									flex: 1,
								}}
							>
								تعذّر تحميل قاعدة بيانات الرواة — المطابقة تعمل على السجلات
								المخصصة فقط
							</span>
						</div>
					)}

					<NarratorChainView
						narrators={extractor.narrators}
						isLoading={extractor.isLoading}
						error={extractor.error}
						isStale={extractor.isStale}
						showReExtract={showReExtract}
						records={allRecords}
						onRetry={() =>
							extractor.extract(
								submittedText.slice(0, parser.result?.splitAt ?? 0),
								allRecords,
							)
						}
						onReExtract={handleReExtract}
						selectedPosition={selectedPosition}
						onSelect={setSelectedPosition}
						onStartGuided={() => {
							if (flaggedNarrators.length === 0) return;
							setIsInGuidedMode(true);
							setSelectedPosition(flaggedNarrators[0].position);
						}}
					/>

					{selectedPosition !== null &&
						extractor.narrators &&
						(() => {
							const nm = extractor.narrators.find(
								(n) => n.position === selectedPosition,
							);
							if (!nm) return null;
							const candidateRecords = nm.topMatches
								.map((m) => allRecords.find((r) => r.id === m.narratorId))
								.filter((r): r is NarratorRecord => r != null);
							return (
								<NarratorDisambiguationPanel
									narratorMatch={nm}
									candidateRecords={candidateRecords}
									onConfirm={(narratorId) => {
										extractor.confirmMatch(selectedPosition, narratorId);
										if (isInGuidedMode) {
											const remaining = flaggedNarrators.filter(
												(n) => n.position !== selectedPosition,
											);
											const next = remaining.find(
												(n) => n.position > selectedPosition,
											);
											if (!next) {
												setIsInGuidedMode(false);
												setSelectedPosition(null);
											} else {
												setSelectedPosition(next.position);
											}
										} else {
											setSelectedPosition(null);
										}
									}}
									onAddCustom={(data) => {
										const newRecord = customNarrators.add(data);
										extractor.confirmMatch(selectedPosition, newRecord.id);
										setIsInGuidedMode(false);
										setSelectedPosition(null);
									}}
									onClose={() => {
										setIsInGuidedMode(false);
										setSelectedPosition(null);
									}}
									isGuided={isInGuidedMode}
									hasPrevious={
										isInGuidedMode &&
										flaggedNarrators.some(
											(n) =>
												n.position <
												(selectedPosition ?? Number.POSITIVE_INFINITY),
										)
									}
									hasNext={
										isInGuidedMode &&
										flaggedNarrators
											.filter((n) => n.position !== selectedPosition)
											.some((n) => n.position > (selectedPosition ?? -1))
									}
									onPrevious={() => {
										const prev = [...flaggedNarrators]
											.reverse()
											.find(
												(n) =>
													n.position <
													(selectedPosition ?? Number.POSITIVE_INFINITY),
											);
										if (prev) setSelectedPosition(prev.position);
									}}
									onNext={() => {
										const next = flaggedNarrators.find(
											(n) => n.position > (selectedPosition ?? -1),
										);
										if (!next) {
											setIsInGuidedMode(false);
											setSelectedPosition(null);
										} else {
											setSelectedPosition(next.position);
										}
									}}
								/>
							);
						})()}

					{/* Add variant button */}
					{parser.result !== null &&
						extractor.narrators !== null &&
						extractor.narrators.length > 0 &&
						canAddMore && (
							<div
								style={{
									borderTop: "1px solid var(--color-border-subtle)",
									padding: "var(--space-3) var(--space-5)",
									display: "flex",
									justifyContent: "flex-end",
									direction: "rtl",
								}}
							>
								<button
									type="button"
									className="btn-secondary btn-sm"
									onClick={addVariant}
									style={{
										fontFamily: "var(--font-ui-arabic)",
										fontSize: "var(--text-sm)",
									}}
								>
									+ إضافة نسخة
								</button>
							</div>
						)}

					{/* Additional variant input panels */}
					{variants.slice(1).map((variant) => (
						<VariantInputPanel
							key={variant.id}
							variant={variant}
							allRecords={allRecords}
							onUpdate={(data) => updateVariant(variant.id, data)}
							onRemove={() => removeVariant(variant.id)}
						/>
					))}

					{/* Chain visualization */}
					{extractor.narrators &&
						extractor.narrators.length > 0 &&
						(() => {
							const primaryAsVariant: Variant | null =
								extractor.narrators && extractor.narrators.length > 0
									? { ...variants[0], narrators: extractor.narrators }
									: null;
							const additionalWithNarrators = variants
								.slice(1)
								.filter((v) => v.narrators && v.narrators.length > 0);
							const variantsForGraph = [
								...(primaryAsVariant ? [primaryAsVariant] : []),
								...additionalWithNarrators,
							];
							const handleNodeClick = (recordId: string | null) =>
								setBioPanel(
									recordId === null
										? { type: "unknown" }
										: { type: "record", id: recordId },
								);
							return (
								<div
									style={{
										borderTop: "1px solid var(--color-border-subtle)",
										display: "flex",
										direction: "ltr",
									}}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										{variantsForGraph.length >= 2 ? (
											<VariantChainView
												variants={variantsForGraph}
												records={allRecords}
												onNodeClick={handleNodeClick}
											/>
										) : (
											<IsnadChainView
												narrators={extractor.narrators}
												records={allRecords}
												onNodeClick={handleNodeClick}
											/>
										)}
									</div>
									{bioPanel.type !== "closed" && (
										<NarratorBioCard
											record={selectedRecord}
											allRecords={allRecords}
											onClose={() => setBioPanel({ type: "closed" })}
										/>
									)}
								</div>
							);
						})()}
				</div>
			</div>
			<DebugPanel />
		</>
	);
}
