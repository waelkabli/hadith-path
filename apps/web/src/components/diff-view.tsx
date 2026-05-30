import { useState } from "react";

import type { Variant } from "@/hooks/use-variants";
import type { DiffToken } from "@/lib/compute-diff";
import { computeDiff } from "@/lib/compute-diff";

const DIFF_LAYOUT_KEY = "hadith-diff-layout";

function getMatn(v: Variant): string {
	if (v.splitAt === null || v.splitAt === 0) return v.rawText;
	return v.rawText.slice(v.splitAt);
}

// ── InlineDiffView ────────────────────────────────────────────────────────────

interface InlineDiffViewProps {
	tokens: DiffToken[];
	variants: Variant[];
}

function InlineDiffView({ tokens, variants }: InlineDiffViewProps) {
	return (
		<div
			style={{
				fontFamily: "var(--font-display-arabic)",
				fontSize: "var(--text-lg)",
				lineHeight: "2.4",
				direction: "rtl",
				textAlign: "right",
			}}
		>
			{tokens.map((token) => {
				if (token.allMatch) {
					return (
						<span key={token.position} style={{ marginLeft: "0.3em" }}>
							{token.baseText}
						</span>
					);
				}

				const diffAnnotations = token.variants
					.slice(1)
					.filter((entry) => entry.status !== "match");

				return (
					<span
						key={token.position}
						style={{
							display: "inline-flex",
							flexDirection: "column",
							alignItems: "center",
							margin: "0 0.25em",
							verticalAlign: "middle",
							gap: "2px",
						}}
					>
						{/* Base word */}
						<span
							style={{
								background: "var(--color-warning-bg)",
								border: "1px solid var(--color-warning-border)",
								borderRadius: "var(--radius-sm)",
								padding: "0 4px",
								color: "var(--color-warning-text)",
							}}
						>
							{token.baseText ?? "—"}
						</span>
						{/* Per-variant annotations */}
						{diffAnnotations.length > 0 && (
							<span
								style={{
									display: "flex",
									gap: "2px",
									flexWrap: "wrap",
									justifyContent: "center",
								}}
							>
								{token.variants.slice(1).map((entry, j) => {
									if (entry.status === "match") return null;
									const v = variants[j + 1];
									if (!v) return null;
									return (
										<span
											key={v.id}
											style={{
												fontSize: "0.7em",
												color: v.color,
												background: `${v.color}18`,
												border: `1px solid ${v.color}40`,
												borderRadius: "var(--radius-sm)",
												padding: "0 3px",
												whiteSpace: "nowrap",
												fontFamily: "var(--font-ui-arabic)",
											}}
										>
											{v.label}: {entry.text !== null ? entry.text : "—"}
										</span>
									);
								})}
							</span>
						)}
					</span>
				);
			})}
		</div>
	);
}

// ── SideBySideDiffView ────────────────────────────────────────────────────────

interface SideBySideDiffViewProps {
	tokens: DiffToken[];
	variants: Variant[];
}

function SideBySideDiffView({ tokens, variants }: SideBySideDiffViewProps) {
	return (
		<div
			style={{
				display: "flex",
				overflowX: "auto",
				gap: "1px",
				background: "var(--color-border-subtle)",
				borderRadius: "var(--radius-lg)",
				overflow: "hidden",
			}}
		>
			{variants.map((variant, varIdx) => (
				<div
					key={variant.id}
					style={{
						flex: "1 1 0",
						minWidth: "180px",
						background: "var(--color-surface)",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{/* Column header */}
					<div
						style={{
							padding: "var(--space-2) var(--space-3)",
							borderBottom: "1px solid var(--color-border-subtle)",
							display: "flex",
							alignItems: "center",
							gap: "var(--space-2)",
							direction: "rtl",
							background: "var(--color-surface-sunken)",
							flexShrink: 0,
						}}
					>
						<div
							style={{
								width: 10,
								height: 10,
								background: variant.color,
								borderRadius: 2,
								flexShrink: 0,
							}}
						/>
						<span
							style={{
								fontFamily: "var(--font-ui-arabic)",
								fontSize: "var(--text-xs)",
								fontWeight: "var(--weight-medium)",
								color: "var(--color-text-secondary)",
							}}
						>
							{variant.label}
						</span>
					</div>

					{/* Column content */}
					<div
						style={{
							padding: "var(--space-3)",
							direction: "rtl",
							fontFamily: "var(--font-display-arabic)",
							fontSize: "var(--text-base)",
							lineHeight: "2.2",
							display: "flex",
							flexWrap: "wrap",
							alignContent: "flex-start",
						}}
					>
						{tokens.map((token) => {
							const entry = token.variants[varIdx];
							if (!entry) return null;

							if (varIdx === 0) {
								// Base column — always neutral
								return (
									<span key={token.position} style={{ marginLeft: "0.35em" }}>
										{token.baseText ?? "—"}
									</span>
								);
							}

							if (entry.status === "deleted") {
								return (
									<span
										key={token.position}
										style={{
											marginLeft: "0.35em",
											color: "var(--color-text-tertiary)",
											textDecoration: "line-through",
											fontStyle: "italic",
										}}
									>
										—
									</span>
								);
							}

							if (entry.status === "match") {
								return (
									<span key={token.position} style={{ marginLeft: "0.35em" }}>
										{entry.text}
									</span>
								);
							}

							// Added or substituted
							return (
								<span
									key={token.position}
									style={{
										marginLeft: "0.35em",
										background: `${variant.color}20`,
										color: variant.color,
										borderRadius: "var(--radius-sm)",
										padding: "0 2px",
									}}
								>
									{entry.text}
								</span>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}

// ── DiffView (parent) ─────────────────────────────────────────────────────────

interface DiffViewProps {
	variants: Variant[];
}

export function DiffView({ variants }: DiffViewProps) {
	const [layout, setLayout] = useState<"inline" | "sidebyside">(() => {
		try {
			const stored = sessionStorage.getItem(DIFF_LAYOUT_KEY);
			return stored === "sidebyside" ? "sidebyside" : "inline";
		} catch {
			return "inline";
		}
	});

	const analyzed = variants.filter((v) => getMatn(v).trim() !== "");

	if (analyzed.length < 2) {
		return (
			<div
				style={{
					padding: "var(--space-10) var(--space-5)",
					direction: "rtl",
					textAlign: "center",
					color: "var(--color-text-tertiary)",
					fontFamily: "var(--font-ui-arabic)",
					fontSize: "var(--text-sm)",
				}}
			>
				أضف نسخة ثانية للمقارنة بين المتون
			</div>
		);
	}

	const matns = analyzed.map(getMatn);
	const tokens = computeDiff(matns);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "var(--space-4)",
				padding: "var(--space-5)",
			}}
		>
			{/* Layout toggle */}
			<div style={{ display: "flex", justifyContent: "flex-end" }}>
				<div
					style={{
						display: "inline-flex",
						background: "var(--color-surface-sunken)",
						border: "1px solid var(--color-border-default)",
						borderRadius: "var(--radius-md)",
						overflow: "hidden",
					}}
				>
					{(
						[
							{ id: "inline", label: "Unified" },
							{ id: "sidebyside", label: "Split" },
						] as const
					).map((opt) => (
						<button
							key={opt.id}
							type="button"
							onClick={() => {
								setLayout(opt.id);
								try {
									sessionStorage.setItem(DIFF_LAYOUT_KEY, opt.id);
								} catch {
									// ignore
								}
							}}
							style={{
								padding: "var(--space-2) var(--space-3)",
								background:
									layout === opt.id ? "var(--color-surface)" : "transparent",
								color:
									layout === opt.id
										? "var(--color-text-primary)"
										: "var(--color-text-secondary)",
								border: "none",
								fontFamily: "var(--font-ui)",
								fontSize: "var(--text-xs)",
								fontWeight:
									layout === opt.id
										? "var(--weight-medium)"
										: "var(--weight-regular)",
								cursor: "pointer",
								lineHeight: 1,
								boxShadow:
									layout === opt.id ? "0 1px 2px rgba(28,26,23,0.08)" : "none",
							}}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{layout === "inline" ? (
				<InlineDiffView tokens={tokens} variants={analyzed} />
			) : (
				<SideBySideDiffView tokens={tokens} variants={analyzed} />
			)}
		</div>
	);
}
