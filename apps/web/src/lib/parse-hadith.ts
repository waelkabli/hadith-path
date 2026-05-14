import { debugLog } from "./debug-log";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert in classical Islamic hadith sciences. Given a raw Arabic hadith text, identify the exact character offset where the isnad (chain of narrators) ends and the matn (the reported content) begins.

Definitions:
- ISNAD: The complete chain of transmission — all narrator names, transmission verbs (حَدَّثَنَا، أَخْبَرَنَا، قَالَ، سَمِعْتُ، عَنْ، رَوَى, etc.), their qualifications, and the contextual framing up to the point where the final narrator's own report begins.
- MATN: Everything from the point where the final human narrator begins to relate what they personally heard or witnessed — typically starting with a phrase like "سَمِعْتُ رَسُولَ اللَّهِ" or directly with the Prophet's words.

Critical rules:
1. splitAt must point to the first character of the first word of the matn — it must always be preceded by a space, colon, or comma. Never return an offset that falls in the middle of a word or name.
2. Narrator names are always in the isnad. Never cut through a name.
3. The split typically falls just after the last "قَالَ:" that introduces the final narrator's direct report before the Prophet's statement begins.
4. splitAt is a Unicode code-unit index (JavaScript string index), not a byte offset.

Return ONLY valid JSON with no explanation: {"splitAt": <number>}`;

const FEW_SHOT = [
	{
		role: "user" as const,
		content:
			"حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ، قَالَ: حَدَّثَنَا سُفْيَانُ، قَالَ: حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الأَنْصَارِيُّ، قَالَ: أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ، يَقُولُ: سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا، أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.",
	},
	{
		role: "assistant" as const,
		// isnad ends: "...الْمِنْبَرِ قَالَ: "
		// matn starts: "سَمِعْتُ رَسُولَ اللَّهِ..."
		content: '{"splitAt": 347}',
	},
];

function snapToWordStart(text: string, offset: number): number {
	if (offset <= 0) return 0;
	if (offset >= text.length) return text.length;
	// Walk back until we are at the start of a word
	let i = offset;
	while (i > 0 && text[i - 1] !== " " && text[i - 1] !== "\n") i--;
	return i;
}

export async function parseHadith(
	text: string,
	apiKey: string,
): Promise<{ splitAt: number }> {
	const requestBody = {
		model: "claude-sonnet-4-6",
		max_tokens: 64,
		system: SYSTEM_PROMPT,
		messages: [...FEW_SHOT, { role: "user", content: text }],
	};

	debugLog.push("request", "POST api.anthropic.com/v1/messages", {
		model: requestBody.model,
		apiKeyPrefix: `${apiKey.slice(0, 14)}...`,
		textLength: text.length,
		textPreview: `${text.slice(0, 80)}…`,
	});

	let response: Response;
	try {
		response = await fetch(CLAUDE_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"anthropic-dangerous-direct-browser-access": "true",
			},
			body: JSON.stringify(requestBody),
		});
	} catch (networkErr) {
		const msg =
			networkErr instanceof Error ? networkErr.message : String(networkErr);
		debugLog.push("error", "Network failure", msg);
		throw networkErr;
	}

	if (!response.ok) {
		const body = await response.text().catch(() => "(unreadable)");
		debugLog.push("error", `HTTP ${response.status}`, body);
		throw new Error(`Claude API error: ${response.status}`);
	}

	const data = await response.json();
	const rawText = data?.content?.[0]?.text;

	if (typeof rawText !== "string") {
		debugLog.push("error", "Unexpected response shape", data);
		throw new Error("Unexpected response format from Claude");
	}

	// Try direct parse first; fall back to extracting JSON from reasoning text
	let parsed: unknown;
	const jsonMatch = rawText.match(/\{"splitAt"\s*:\s*-?\d+\s*\}/);
	try {
		parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
	} catch {
		debugLog.push("error", "Response not valid JSON", rawText);
		throw new Error("Claude response was not valid JSON");
	}

	if (typeof (parsed as Record<string, unknown>)?.splitAt !== "number") {
		debugLog.push("error", "Missing splitAt field", parsed);
		throw new Error("Claude response missing splitAt field");
	}

	const rawOffset = (parsed as { splitAt: number }).splitAt;
	const splitAt = snapToWordStart(text, rawOffset);

	debugLog.push(
		"response",
		`HTTP ${response.status} — splitAt ${rawOffset} → ${splitAt}`,
		{
			rawOffset,
			snappedSplitAt: splitAt,
			rawResponse: rawText,
		},
	);

	// TODO: dispatch to additional providers (Gemini, OpenAI) here
	return { splitAt };
}
