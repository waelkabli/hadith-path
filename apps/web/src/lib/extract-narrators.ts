const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT =
	"You are an expert in hadith sciences. Extract each narrator from the isnad (chain of narrators) in the given Arabic text.";

const NARRATORS_TOOL = {
	name: "report_narrators" as const,
	description: "Report the ordered list of narrators extracted from the isnad.",
	input_schema: {
		type: "object" as const,
		properties: {
			narrators: {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: { type: "string" },
						position: { type: "integer" },
						mentionStart: { type: "integer" },
						mentionEnd: { type: "integer" },
					},
					required: ["name", "position", "mentionStart", "mentionEnd"],
				},
			},
		},
		required: ["narrators"],
	},
};

export interface ExtractedNarrator {
	name: string;
	position: number;
	mentionStart: number;
	mentionEnd: number;
}

interface ToolUseBlock {
	type: "tool_use";
	id: string;
	name: string;
	input: Record<string, unknown>;
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
			max_tokens: 2048,
			system: SYSTEM_PROMPT,
			tools: [NARRATORS_TOOL],
			tool_choice: { type: "tool", name: "report_narrators" },
			messages: [{ role: "user", content: isnad }],
		}),
	});

	if (!response.ok) {
		throw new Error(`Claude API error: ${response.status}`);
	}

	const data = await response.json();
	const toolUse = (data?.content as ToolUseBlock[] | undefined)?.find(
		(b) => b.type === "tool_use" && b.name === "report_narrators",
	);

	if (!toolUse) {
		throw new Error("No tool_use block in Claude response");
	}

	if (!Array.isArray((toolUse.input as { narrators?: unknown })?.narrators)) {
		throw new Error("Claude response missing narrators array");
	}

	return (toolUse.input as { narrators: ExtractedNarrator[] }).narrators
		.slice()
		.sort((a, b) => a.position - b.position);
}
