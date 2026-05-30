import { useCallback, useRef, useState } from "react";

import { useSplitCorrection } from "@/hooks/use-split-correction";

interface SplitCorrectionEditorProps {
	text: string;
	splitAt: number;
	llmSplitAt: number;
	onConfirm: (splitAt: number) => void;
	onCancel: () => void;
}

export function SplitCorrectionEditor({
	text,
	splitAt,
	llmSplitAt,
	onConfirm,
	onCancel,
}: SplitCorrectionEditorProps) {
	const { draftSplitAt, onDrag, reset, confirm, cancel } = useSplitCorrection({
		text,
		currentSplitAt: splitAt,
		llmSplitAt,
		onConfirm,
		onCancel,
	});

	const containerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const getOffsetAtPoint = useCallback(
		(x: number, y: number): number | null => {
			const container = containerRef.current;
			if (!container) return null;

			let textNode: Text | null = null;
			let localOffset = 0;

			if ("caretRangeFromPoint" in document) {
				const range = document.caretRangeFromPoint(x, y);
				if (range?.startContainer.nodeType === Node.TEXT_NODE) {
					textNode = range.startContainer as Text;
					localOffset = range.startOffset;
				}
			} else {
				const pos = (
					document as unknown as {
						caretPositionFromPoint?: (
							x: number,
							y: number,
						) => { offsetNode: Node; offset: number } | null;
					}
				).caretPositionFromPoint?.(x, y);
				if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) {
					textNode = pos.offsetNode as Text;
					localOffset = pos.offset;
				}
			}

			if (!textNode) return null;

			const isnadSpan = container.querySelector("[data-part='isnad']");
			const matnSpan = container.querySelector("[data-part='matn']");
			if (!isnadSpan || !matnSpan) return null;

			if (isnadSpan.contains(textNode)) {
				let off = 0;
				const walker = document.createTreeWalker(
					isnadSpan,
					NodeFilter.SHOW_TEXT,
				);
				for (
					let node = walker.nextNode();
					node !== null;
					node = walker.nextNode()
				) {
					if (node === textNode) return off + localOffset;
					off += (node as Text).length;
				}
				return null;
			}

			if (matnSpan.contains(textNode)) {
				const isnadLen = isnadSpan.textContent?.length ?? 0;
				let off = 0;
				const walker = document.createTreeWalker(
					matnSpan,
					NodeFilter.SHOW_TEXT,
				);
				for (
					let node = walker.nextNode();
					node !== null;
					node = walker.nextNode()
				) {
					if (node === textNode) return isnadLen + off + localOffset;
					off += (node as Text).length;
				}
				return null;
			}

			return null;
		},
		[],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			setIsDragging(true);
			e.currentTarget.setPointerCapture(e.pointerId);
			const offset = getOffsetAtPoint(e.clientX, e.clientY);
			if (offset !== null) onDrag(offset);
		},
		[getOffsetAtPoint, onDrag],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!isDragging) return;
			const offset = getOffsetAtPoint(e.clientX, e.clientY);
			if (offset !== null) onDrag(offset);
		},
		[isDragging, getOffsetAtPoint, onDrag],
	);

	const handlePointerUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const isnad = text.slice(0, draftSplitAt);
	const matn = text.slice(draftSplitAt);

	return (
		<div
			style={{
				borderTop: "1px solid var(--color-border-subtle)",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header row */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					direction: "rtl",
					padding: "var(--space-3) var(--space-5)",
					background: "var(--color-surface)",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						fontWeight: "var(--weight-medium)",
						color: "var(--color-text-tertiary)",
						letterSpacing: "0.07em",
					}}
				>
					تعديل نقطة الفصل
				</span>
				<span
					style={{
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-tertiary)",
					}}
				>
					انقر أو اسحب لتحريك نقطة الفصل
				</span>
			</div>

			{/* Interactive text block */}
			<div
				ref={containerRef}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				style={{
					fontFamily: "var(--font-display-arabic)",
					fontSize: "var(--text-lg)",
					lineHeight: "1.95",
					direction: "rtl",
					textAlign: "right",
					cursor: isDragging ? "col-resize" : "pointer",
					userSelect: "none",
					margin: "0 var(--space-5)",
					padding: "var(--space-4)",
					background: "var(--color-surface-sunken)",
					borderRadius: "var(--radius-lg)",
					border: `1px solid ${isDragging ? "var(--color-teal-400)" : "var(--color-border-default)"}`,
					transition: "border-color var(--duration-fast) var(--ease-standard)",
				}}
			>
				<span
					data-part="isnad"
					style={{
						background: "rgba(45, 168, 156, 0.12)",
						borderRadius: "2px",
						padding: "1px 0",
					}}
				>
					{isnad}
				</span>
				{/* Draggable divider handle */}
				<span
					aria-hidden="true"
					style={{
						display: "inline-block",
						width: "2px",
						height: "1.1em",
						background: "var(--color-teal-400)",
						margin: "0 2px",
						verticalAlign: "-0.1em",
						borderRadius: "1px",
						cursor: "col-resize",
						flexShrink: 0,
					}}
				/>
				<span data-part="matn">{matn}</span>
			</div>

			{/* Legend */}
			<div
				style={{
					display: "flex",
					gap: "var(--space-4)",
					direction: "rtl",
					alignItems: "center",
					padding: "0 var(--space-5) var(--space-3)",
				}}
			>
				<span
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-1)",
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-tertiary)",
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "12px",
							height: "12px",
							background: "rgba(45, 168, 156, 0.2)",
							border: "1px solid var(--color-teal-400)",
							borderRadius: "2px",
						}}
					/>
					السند
				</span>
				<span
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--space-1)",
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-tertiary)",
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "12px",
							height: "12px",
							background: "var(--color-surface-sunken)",
							border: "1px solid var(--color-border-default)",
							borderRadius: "2px",
						}}
					/>
					المتن
				</span>
			</div>

			{/* Action buttons */}
			<div
				style={{
					display: "flex",
					gap: "var(--space-2)",
					direction: "rtl",
					borderTop: "1px solid var(--color-border-subtle)",
					padding: "var(--space-3) var(--space-5)",
					background: "var(--color-surface)",
				}}
			>
				<button
					type="button"
					className="btn-primary"
					style={{ fontFamily: "var(--font-ui-arabic)" }}
					onClick={confirm}
				>
					تأكيد
				</button>
				<button
					type="button"
					style={{
						display: "inline-flex",
						alignItems: "center",
						padding: "var(--space-3) var(--space-5)",
						background: "var(--color-surface)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-default)",
						borderRadius: "var(--radius-md)",
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-md)",
						fontWeight: "var(--weight-medium)",
						cursor: "pointer",
						lineHeight: 1,
					}}
					onClick={reset}
				>
					إعادة تعيين
				</button>
				<button
					type="button"
					style={{
						display: "inline-flex",
						alignItems: "center",
						padding: "var(--space-3) var(--space-5)",
						background: "transparent",
						color: "var(--color-text-secondary)",
						border: "1px solid transparent",
						borderRadius: "var(--radius-md)",
						fontFamily: "var(--font-ui-arabic)",
						fontSize: "var(--text-md)",
						cursor: "pointer",
						lineHeight: 1,
					}}
					onClick={cancel}
				>
					إلغاء
				</button>
			</div>
		</div>
	);
}
