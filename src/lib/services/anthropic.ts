import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function callClaude(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: params.maxTokens ?? 4096,
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Calls Claude and extracts JSON from the response.
 * Handles cases where the model wraps JSON in markdown code fences.
 */
export async function callClaudeJSON<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<T> {
  const raw = await callClaude(params);
  return parseJSONResponse<T>(raw);
}

/**
 * Extracts JSON from a string that may contain markdown code fences
 * or other surrounding text.
 */
export function parseJSONResponse<T>(raw: string): T {
  // Try direct parse first
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Strip markdown code fences
    const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenced) {
      return JSON.parse(fenced[1]) as T;
    }

    // Try to find the first { ... } or [ ... ] block
    const braceStart = raw.indexOf("{");
    const bracketStart = raw.indexOf("[");
    const start = braceStart === -1
      ? bracketStart
      : bracketStart === -1
        ? braceStart
        : Math.min(braceStart, bracketStart);

    if (start === -1) {
      throw new Error("No JSON found in Claude response");
    }

    const isArray = raw[start] === "[";
    const closer = isArray ? "]" : "}";

    // Find matching closer by counting depth
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === raw[start]) depth++;
      if (raw[i] === closer) depth--;
      if (depth === 0) {
        return JSON.parse(raw.slice(start, i + 1)) as T;
      }
    }

    throw new Error("Malformed JSON in Claude response");
  }
}
