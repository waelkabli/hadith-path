export type ValidationResult =
	| { valid: true }
	| { valid: false; error: "empty" | "non-arabic" | "too-long" };

export function validateHadithText(text: string): ValidationResult {
	const trimmed = text.trim();
	if (!trimmed) return { valid: false, error: "empty" };

	const chars = [...trimmed].filter((c) => !/\s/.test(c));
	const arabicCount = chars.filter((c) => /[؀-ۿ]/.test(c)).length;
	if (chars.length === 0 || arabicCount / chars.length <= 0.5) {
		return { valid: false, error: "non-arabic" };
	}

	const wordCount = trimmed.split(/\s+/).length;
	if (wordCount > 3000) return { valid: false, error: "too-long" };

	return { valid: true };
}
