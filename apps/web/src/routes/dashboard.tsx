import { createFileRoute } from "@tanstack/react-router";
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";
import { type CSSProperties, useCallback, useRef, useState } from "react";

import { DebugPanel } from "@/components/debug-panel";
import { DiffView } from "@/components/diff-view";
import { ExportToolbar } from "@/components/export-toolbar";
import { HadithInput } from "@/components/hadith-input";
import { HadithSplitView } from "@/components/hadith-split-view";
import { IsnadChainView } from "@/components/isnad-chain-view";
import { NarratorBioCard } from "@/components/narrator-bio-card";
import { NarratorChainView } from "@/components/narrator-chain-view";
import { NarratorDisambiguationPanel } from "@/components/narrator-disambiguation-panel";
import { SplitCorrectionEditor } from "@/components/split-correction-editor";
import { VariantChainView } from "@/components/variant-chain-view";
import { VariantInputPanel } from "@/components/variant-input-panel";
import { useCustomNarrators } from "@/hooks/use-custom-narrators";
import { useExport } from "@/hooks/use-export";
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

	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState<"chain" | "diff">("chain");
	const [bioPanel, setBioPanel] = useState<BioPanelState>({ type: "closed" });
	const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
	const [isInGuidedMode, setIsInGuidedMode] = useState(false);

	const customNarrators = useCustomNarrators();
	const { variants, canAddMore, addVariant, removeVariant, updateVariant } =
		useVariants();

	// Refs for export
	const splitViewRef = useRef<HTMLElement | null>(null);
	const narratorListRef = useRef<HTMLElement | null>(null);
	const chainContainerRef = useRef<HTMLElement | null>(null);
	const diffViewRef = useRef<HTMLElement | null>(null);
	const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

	const exportHook = useExport({
		splitViewRef,
		narratorListRef,
		chainContainerRef,
		diffViewRef,
		rfInstanceRef,
	});

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
		setIsEditing(false);
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

	const cardStyle: CSSProperties = {
		background: "var(--color-surface)",
		border: "1px solid var(--color-border-default)",
		borderRadius: "var(--radius-lg)",
		boxShadow: "var(--shadow-sm)",
	};

	const hasNarrators = (extractor.narrators?.length ?? 0) > 0;

	const vizContent = hasNarrators
		? (() => {
				const primaryAsVariant: Variant = {
					...variants[0],
					narrators: extractor.narrators!,
				};
				const additionalWithNarrators = variants
					.slice(1)
					.filter((v) => v.narrators && v.narrators.length > 0);
				const variantsForGraph = [primaryAsVariant, ...additionalWithNarrators];
				const handleNodeClick = (recordId: string | null) =>
					setBioPanel(
						recordId === null
							? { type: "unknown" }
							: { type: "record", id: recordId },
					);
				const primaryForDiff: Variant = {
					...variants[0],
					rawText: submittedText,
					splitAt: parser.result?.splitAt ?? null,
				};
				const variantsForDiff = [primaryForDiff, ...variants.slice(1)];

				return (
					<div
						style={{
							...cardStyle,
							display: "flex",
							flexDirection: "column",
							height: "100%",
						}}
					>
						{/* Tab bar */}
						<div
							style={{
								borderBottom: "1px solid var(--color-border-subtle)",
								display: "flex",
								direction: "rtl",
							}}
						>
							{(
								[
									{ id: "chain", label: "السلسلة" },
									{ id: "diff", label: "المقارنة" },
								] as const
							).map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id)}
									style={{
										padding: "var(--space-3) var(--space-5)",
										fontFamily: "var(--font-ui-arabic)",
										fontSize: "var(--text-sm)",
										color:
											activeTab === tab.id
												? "var(--color-text-primary)"
												: "var(--color-text-tertiary)",
										background: "transparent",
										border: "none",
										borderBottom:
											activeTab === tab.id
												? "2px solid var(--color-gold-400)"
												: "2px solid transparent",
										cursor: "pointer",
										lineHeight: 1,
										fontWeight:
											activeTab === tab.id
												? "var(--weight-medium)"
												: "var(--weight-regular)",
									}}
								>
									{tab.label}
								</button>
							))}
						</div>

						{activeTab === "chain" ? (
							<div
								ref={(el) => {
									chainContainerRef.current = el;
								}}
								style={{ flex: 1, minHeight: 540 }}
							>
								{variantsForGraph.length >= 2 ? (
									<VariantChainView
										variants={variantsForGraph}
										records={allRecords}
										onNodeClick={handleNodeClick}
										onInit={(inst) => {
											rfInstanceRef.current =
												inst as unknown as ReactFlowInstance<Node, Edge>;
										}}
									/>
								) : (
									<IsnadChainView
										narrators={extractor.narrators!}
										records={allRecords}
										onNodeClick={handleNodeClick}
										onInit={(inst) => {
											rfInstanceRef.current =
												inst as unknown as ReactFlowInstance<Node, Edge>;
										}}
									/>
								)}
							</div>
						) : (
							<div
								ref={(el) => {
									diffViewRef.current = el;
								}}
							>
								<DiffView variants={variantsForDiff} />
							</div>
						)}
					</div>
				);
			})()
		: null;

	return (
		<>
			<div
				style={{
					minHeight: "calc(100vh - 3.5rem)",
					background: "var(--color-canvas)",
					padding: "var(--space-6) var(--space-6)",
					paddingBottom: "var(--space-10)",
				}}
			>
				<div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
					{!parser.result ? (
						/* ── Pre-parse: just the input ── */
						<div style={cardStyle}>
							<HadithInput onSubmit={handleSubmit} onReset={handleReset} />
						</div>
					) : (
						/* ── Post-parse: 2-col outer grid ──
						     direction:rtl → col1 (DOM first) = RIGHT = split view
						                    col2 (DOM second) = LEFT  = main content */
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 2.5fr",
								gap: "var(--space-4)",
								alignItems: "stretch",
								direction: "rtl",
							}}
						>
							{/* RIGHT column: split view — stretches to full grid height */}
							<div style={{ ...cardStyle, direction: "ltr" }}>
								{isEditing ? (
									<SplitCorrectionEditor
										text={submittedText}
										splitAt={parser.result.splitAt}
										llmSplitAt={parser.result.llmSplitAt}
										onConfirm={(newSplitAt) => {
											parser.applyCorrection(newSplitAt);
											setIsEditing(false);
										}}
										onCancel={() => setIsEditing(false)}
									/>
								) : (
									<div
										ref={(el) => {
											splitViewRef.current = el;
										}}
									>
										<HadithSplitView
											text={submittedText}
											splitAt={parser.result.splitAt}
											corrected={parser.result.corrected}
											onEditSplit={() => setIsEditing(true)}
										/>
									</div>
								)}
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
							</div>

							{/* LEFT column: input → export → narrators + viz */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "var(--space-4)",
									direction: "ltr",
								}}
							>
								{/* Input */}
								<div style={cardStyle}>
									<HadithInput onSubmit={handleSubmit} onReset={handleReset} />
								</div>

								{/* Export */}
								{hasNarrators && <ExportToolbar exportHook={exportHook} />}

								{/* Narrators + Viz */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: hasNarrators ? "1fr 2fr" : "1fr",
										gap: "var(--space-4)",
										alignItems: "stretch",
										flex: 1,
									}}
								>
									{/* Narrators */}
									<div style={cardStyle}>
										<div
											ref={(el) => {
												narratorListRef.current = el;
											}}
										>
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
										</div>

										{selectedPosition !== null &&
											extractor.narrators &&
											(() => {
												const nm = extractor.narrators.find(
													(n) => n.position === selectedPosition,
												);
												if (!nm) return null;
												const candidateRecords = nm.topMatches
													.map((m) =>
														allRecords.find((r) => r.id === m.narratorId),
													)
													.filter((r): r is NarratorRecord => r != null);
												return (
													<NarratorDisambiguationPanel
														narratorMatch={nm}
														candidateRecords={candidateRecords}
														onConfirm={(narratorId) => {
															extractor.confirmMatch(
																selectedPosition,
																narratorId,
															);
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
															extractor.confirmMatch(
																selectedPosition,
																newRecord.id,
															);
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
																	(selectedPosition ??
																		Number.POSITIVE_INFINITY),
															)
														}
														hasNext={
															isInGuidedMode &&
															flaggedNarrators
																.filter((n) => n.position !== selectedPosition)
																.some(
																	(n) => n.position > (selectedPosition ?? -1),
																)
														}
														onPrevious={() => {
															const prev = [...flaggedNarrators]
																.reverse()
																.find(
																	(n) =>
																		n.position <
																		(selectedPosition ??
																			Number.POSITIVE_INFINITY),
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

										{hasNarrators && canAddMore && (
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

										{variants.slice(1).map((variant) => (
											<VariantInputPanel
												key={variant.id}
												variant={variant}
												allRecords={allRecords}
												onUpdate={(data) => updateVariant(variant.id, data)}
												onRemove={() => removeVariant(variant.id)}
											/>
										))}
									</div>

									{/* Visualization */}
									{vizContent}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			<DebugPanel />
			{bioPanel.type !== "closed" && (
				<NarratorBioCard
					record={selectedRecord}
					allRecords={allRecords}
					onClose={() => setBioPanel({ type: "closed" })}
				/>
			)}
		</>
	);
}
