// Strips diacritics (tashkeel), tatweel, and collapses whitespace.
export function normalizeArabic(text: string): string {
	return text
		.replace(/[ؐ-ًؚ-ٰٟ]/g, "")
		.replace(/ـ/g, "")
		.replace(/\s+/g, " ")
		.trim();
}
