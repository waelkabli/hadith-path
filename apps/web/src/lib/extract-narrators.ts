const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert in classical Islamic hadith sciences. Given the isnad (chain of narrators) of a hadith, extract every narrator name in the exact order they appear.

Rules:
1. Extract narrator names only — skip transmission verbs (حَدَّثَنَا، أَخْبَرَنَا، قَالَ، عَنْ، سَمِعْتُ، رَوَى).
2. Preserve the complete name as it appears (including كنية, لقب, نسب — e.g. "عَبْدُ اللَّهِ بْنُ يُوسُفَ").
3. position is 0-indexed in the order narrators appear (the first narrator who transmits is position 0).
4. mentionStart and mentionEnd are Unicode code-unit offsets in the isnad string (mentionEnd is exclusive).
5. Return narrators sorted ascending by position.`;

const FEW_SHOT = [
	// Example 1: simple chain with عن
	{
		role: "user" as const,
		content: "مالك عن نافع عن ابن عمر",
	},
	{
		role: "assistant" as const,
		content: [
			{
				type: "tool_use",
				id: "toolu_ex1",
				name: "report_narrators",
				input: {
					narrators: [
						{ name: "مالك", position: 0, mentionStart: 0, mentionEnd: 4 },
						{ name: "نافع", position: 1, mentionStart: 8, mentionEnd: 12 },
						{ name: "ابن عمر", position: 2, mentionStart: 16, mentionEnd: 23 },
					],
				},
			},
		],
	},
	// Example 2: chain beginning with حدثنا / أخبرنا
	{
		role: "user" as const,
		content: "حدثنا يحيى بن سعيد قال أخبرنا مالك عن نافع",
	},
	{
		role: "assistant" as const,
		content: [
			{
				type: "tool_use",
				id: "toolu_ex2",
				name: "report_narrators",
				input: {
					narrators: [
						{
							name: "يحيى بن سعيد",
							position: 0,
							mentionStart: 7,
							mentionEnd: 20,
						},
						{ name: "مالك", position: 1, mentionStart: 31, mentionEnd: 35 },
						{ name: "نافع", position: 2, mentionStart: 39, mentionEnd: 43 },
					],
				},
			},
		],
	},
	// Example 3: chain ending with a Companion narrator
	{
		role: "user" as const,
		content: "أخبرنا شعبة عن قتادة عن أنس بن مالك",
	},
	{
		role: "assistant" as const,
		content: [
			{
				type: "tool_use",
				id: "toolu_ex3",
				name: "report_narrators",
				input: {
					narrators: [
						{ name: "شعبة", position: 0, mentionStart: 8, mentionEnd: 12 },
						{ name: "قتادة", position: 1, mentionStart: 16, mentionEnd: 21 },
						{
							name: "أنس بن مالك",
							position: 2,
							mentionStart: 25,
							mentionEnd: 36,
						},
					],
				},
			},
		],
	},
];

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
			messages: [...FEW_SHOT, { role: "user", content: isnad }],
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
