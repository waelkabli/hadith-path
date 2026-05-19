import { useCallback, useMemo, useState } from "react";

const PARSE_RESULT_KEY = "hadith-parse-result";

export function computeWordBoundaries(text: string): number[] {
	const boundaries: number[] = [];
	let inWord = false;
	for (let i = 0; i < text.length; i++) {
		const isWhitespace = /\s/.test(text[i]);
		if (!isWhitespace && !inWord) {
			boundaries.push(i);
			inWord = true;
		} else if (isWhitespace) {
			inWord = false;
		}
	}
	return boundaries;
}

export function snapToNearestBoundary(
	offset: number,
	boundaries: number[],
): number {
	if (boundaries.length === 0) return 0;
	let nearest = boundaries[0];
	let minDist = Math.abs(offset - boundaries[0]);
	for (const b of boundaries) {
		const dist = Math.abs(offset - b);
		if (dist < minDist) {
			minDist = dist;
			nearest = b;
		}
	}
	return nearest;
}

interface UseSplitCorrectionOptions {
	text: string;
	currentSplitAt: number;
	llmSplitAt: number;
	onConfirm: (splitAt: number) => void;
	onCancel: () => void;
}

export interface UseSplitCorrectionReturn {
	draftSplitAt: number;
	wordBoundaries: number[];
	onDrag: (offset: number) => void;
	reset: () => void;
	confirm: () => void;
	cancel: () => void;
}

export function useSplitCorrection({
	text,
	currentSplitAt,
	llmSplitAt,
	onConfirm,
	onCancel,
}: UseSplitCorrectionOptions): UseSplitCorrectionReturn {
	const wordBoundaries = useMemo(() => computeWordBoundaries(text), [text]);

	const [draftSplitAt, setDraftSplitAt] = useState(() =>
		snapToNearestBoundary(currentSplitAt, wordBoundaries),
	);

	const onDrag = useCallback(
		(offset: number) => {
			setDraftSplitAt(snapToNearestBoundary(offset, wordBoundaries));
		},
		[wordBoundaries],
	);

	const reset = useCallback(() => {
		setDraftSplitAt(snapToNearestBoundary(llmSplitAt, wordBoundaries));
	}, [llmSplitAt, wordBoundaries]);

	const confirm = useCallback(() => {
		try {
			const json = localStorage.getItem(PARSE_RESULT_KEY);
			const stored = json ? JSON.parse(json) : {};
			stored.splitAt = draftSplitAt;
			stored.corrected = true;
			localStorage.setItem(PARSE_RESULT_KEY, JSON.stringify(stored));
		} catch {
			// ignore storage errors
		}
		onConfirm(draftSplitAt);
	}, [draftSplitAt, onConfirm]);

	const cancel = useCallback(() => {
		onCancel();
	}, [onCancel]);

	return { draftSplitAt, wordBoundaries, onDrag, reset, confirm, cancel };
}
