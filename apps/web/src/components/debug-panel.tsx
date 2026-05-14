// TODO: remove before production
import { useEffect, useState } from "react";

import { debugLog, type LogEntry } from "@/lib/debug-log";

const LEVEL_COLORS: Record<LogEntry["level"], string> = {
	request: "#2878C8",
	response: "#1A6B4A",
	error: "#CC2828",
	info: "#625E56",
};

const LEVEL_LABELS: Record<LogEntry["level"], string> = {
	request: "REQ",
	response: "RES",
	error: "ERR",
	info: "INF",
};

export function DebugPanel() {
	const [entries, setEntries] = useState<LogEntry[]>(() =>
		debugLog.getEntries(),
	);
	const [expanded, setExpanded] = useState<Set<number>>(new Set());
	const [open, setOpen] = useState(true);

	useEffect(() => {
		return debugLog.subscribe(() => setEntries(debugLog.getEntries()));
	}, []);

	const toggleEntry = (id: number) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<div
			style={{
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 9999,
				background: "#1C1A17",
				color: "#E8E4DC",
				fontFamily: "var(--font-mono)",
				fontSize: "12px",
				borderTop: "2px solid #D4A017",
				maxHeight: open ? "40vh" : "2.25rem",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header bar */}
			<button
				type="button"
				style={{
					display: "flex",
					alignItems: "center",
					gap: "0.75rem",
					padding: "0.3rem 0.75rem",
					borderBottom: open ? "1px solid #3A3632" : "none",
					flexShrink: 0,
					background: "#252220",
					cursor: "pointer",
					userSelect: "none",
					width: "100%",
					border: "none",
					color: "inherit",
					font: "inherit",
					textAlign: "left",
				}}
				onClick={() => setOpen((v) => !v)}
			>
				<span style={{ color: "#D4A017", fontWeight: 700 }}>⚙ DEBUG TRACE</span>
				<span style={{ color: "#625E56", fontSize: "11px" }}>
					{entries.length} entries
				</span>
				<span style={{ marginLeft: "auto", color: "#625E56" }}>
					{open ? "▼ collapse" : "▲ expand"}
				</span>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						debugLog.clear();
					}}
					style={{
						background: "transparent",
						border: "1px solid #3A3632",
						color: "#9C9890",
						borderRadius: "3px",
						padding: "1px 6px",
						cursor: "pointer",
						fontSize: "11px",
					}}
				>
					clear
				</button>
			</button>

			{/* Log entries */}
			{open && (
				<div style={{ overflowY: "auto", flex: 1 }}>
					{entries.length === 0 && (
						<div style={{ padding: "0.5rem 0.75rem", color: "#625E56" }}>
							No entries yet. Submit a hadith to see the trace.
						</div>
					)}
					{entries.map((entry) => (
						<div key={entry.id} style={{ borderBottom: "1px solid #2A2826" }}>
							<button
								type="button"
								style={{
									display: "flex",
									alignItems: "baseline",
									gap: "0.5rem",
									padding: "0.3rem 0.75rem",
									cursor: "pointer",
									width: "100%",
									background: "none",
									border: "none",
									color: "inherit",
									font: "inherit",
									textAlign: "left",
								}}
								onClick={() => toggleEntry(entry.id)}
							>
								<span style={{ color: "#625E56", minWidth: "8ch" }}>
									{entry.ts}
								</span>
								<span
									style={{
										background: LEVEL_COLORS[entry.level],
										color: "#fff",
										borderRadius: "2px",
										padding: "0 4px",
										fontSize: "10px",
										fontWeight: 700,
										minWidth: "3ch",
										textAlign: "center",
									}}
								>
									{LEVEL_LABELS[entry.level]}
								</span>
								<span style={{ flex: 1, color: "#E8E4DC" }}>{entry.label}</span>
								<span style={{ color: "#625E56", fontSize: "10px" }}>
									{expanded.has(entry.id) ? "▲" : "▼"}
								</span>
							</button>
							{expanded.has(entry.id) && (
								<pre
									style={{
										margin: 0,
										padding: "0.4rem 0.75rem 0.4rem 9rem",
										color: "#B8B0A4",
										whiteSpace: "pre-wrap",
										wordBreak: "break-all",
										background: "#161412",
										fontSize: "11px",
									}}
								>
									{entry.detail}
								</pre>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
