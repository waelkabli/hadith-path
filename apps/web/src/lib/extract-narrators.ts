const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert in hadith sciences. Extract each narrator from the isnad (chain of narrators) in the given Arabic text.

Return ONLY valid JSON in this exact format:
{"narrators": [{"name": "<Arabic name>", "position": <0-based index>, "mentionStart": <char offset>, "mentionEnd": <char offset>}]}`;

export interface ExtractedNarrator {
	name: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
}

export async function extractNarrators(
	isnad: string,
	apiKey: string,
): Promise<ExtractedNarrator[]> {
	const response = await fetch(CLAUDE_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"anthropic-dangerous-direct-browser-access": "true",
		},
		body: JSON.stringify({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 1024,
			system: SYSTEM_PROMPT,
			messages: [{ role: "user", content: isnad }],
		}),
	});

	if (!response.ok) {
		throw new Error(`Claude API error: ${response.status}`);
	}

	const data = await response.json();
	const rawText = data?.content?.[0]?.text;

	if (typeof rawText !== "string") {
		throw new Error("Unexpected response format from Claude");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawText);
	} catch {
		throw new Error("Claude response was not valid JSON");
	}

	if (!Array.isArray((parsed as Record<string, unknown>)?.narrators)) {
		throw new Error("Claude response missing narrators array");
	}

	return (parsed as { narrators: ExtractedNarrator[] }).narrators
		.slice()
		.sort((a, b) => a.position - b.position);
}
