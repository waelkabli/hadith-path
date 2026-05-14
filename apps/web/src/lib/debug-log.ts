// TODO: remove this file before production — dev troubleshooting only

export type LogLevel = "request" | "response" | "error" | "info";

export interface LogEntry {
	id: number;
	ts: string;
	level: LogLevel;
	label: string;
	detail: string;
}

let nextId = 0;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

function timestamp() {
	return new Date().toLocaleTimeString("en-GB", {
		hour12: false,
		fractionalSecondDigits: 3,
	} as Intl.DateTimeFormatOptions);
}

export const debugLog = {
	push(level: LogLevel, label: string, detail: unknown) {
		entries.push({
			id: nextId++,
			ts: timestamp(),
			level,
			label,
			detail:
				typeof detail === "string" ? detail : JSON.stringify(detail, null, 2),
		});
		for (const l of listeners) l();
	},
	getEntries: (): LogEntry[] => [...entries],
	clear() {
		entries.length = 0;
		nextId = 0;
		for (const l of listeners) l();
	},
	subscribe(fn: () => void): () => void {
		listeners.add(fn);
		return () => listeners.delete(fn);
	},
};
