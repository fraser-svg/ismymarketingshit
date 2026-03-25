import type {
  AnalysisInput,
  NarrativeGapResult,
  CustomerPsychResult,
} from "../types";
import { callClaude, parseJSONResponse } from "../services/anthropic";
import { SYSTEM_PROMPT } from "../prompts/system-prompt";
import { buildCustomerPsychologyPrompt } from "../prompts/customer-psychology";

/**
 * Pipeline Step 6: Customer Psychology Analysis.
 *
 * Only meaningful when 3+ reviews exist. Returns null if fewer than 3 reviews.
 * Calls Claude with the customer psychology prompt and maps the response
 * to CustomerPsychResult.
 */
export async function analyzeCustomerPsychologyStep(
  input: AnalysisInput,
  narrativeGap: NarrativeGapResult,
): Promise<CustomerPsychResult | null> {
  // Gate: require 3+ reviews for meaningful psychology analysis
  if (input.dataQuality.reviewCount < 3) {
    return null;
  }

  const userPrompt = buildCustomerPsychologyPrompt(input, narrativeGap);

  let raw: string;
  try {
    raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 4096,
    });
  } catch (err) {
    throw new Error(
      `Customer psychology Claude call failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // First parse attempt
  try {
    return mapToCustomerPsychResult(parseJSONResponse(raw));
  } catch {
    // Retry with stricter instruction
    const retryRaw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt:
        userPrompt +
        "\n\nIMPORTANT: Your previous response was not valid JSON. Respond ONLY with the JSON object. No markdown, no code fences, no commentary.",
      maxTokens: 4096,
    });

    try {
      return mapToCustomerPsychResult(parseJSONResponse(retryRaw));
    } catch (parseErr) {
      throw new Error(
        `Failed to parse customer psychology JSON after retry: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }
  }
}

/**
 * Maps the raw Claude JSON to CustomerPsychResult.
 * Handles field name variations and extracts the fields the type requires.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToCustomerPsychResult(data: any): CustomerPsychResult {
  // Extract buying motivations from multiple possible locations
  const buyingMotivations: string[] = toStringArray(
    data.buyingMotivations ??
      extractMotivations(data),
  );

  // Extract emotional drivers
  const emotionalDrivers: string[] = toStringArray(
    data.emotionalDrivers ?? extractEmotionalDrivers(data),
  );

  // Extract objections
  const objections: string[] = toStringArray(
    data.objections ?? extractObjections(data),
  );

  // Extract loyalty factors
  const loyaltyFactors: string[] = toStringArray(
    data.loyaltyFactors ?? extractLoyaltyFactors(data),
  );

  // Sentiment breakdown
  const sentiment = data.sentimentBreakdown ?? {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  return {
    buyingMotivations,
    emotionalDrivers,
    objections,
    loyaltyFactors,
    sentimentBreakdown: {
      positive: Number(sentiment.positive) || 0,
      neutral: Number(sentiment.neutral) || 0,
      negative: Number(sentiment.negative) || 0,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMotivations(data: any): string[] {
  const results: string[] = [];
  if (data.switchingTrigger?.description) {
    results.push(data.switchingTrigger.description);
  }
  if (data.beforeState?.description) {
    results.push(`Escaping: ${data.beforeState.description}`);
  }
  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEmotionalDrivers(data: any): string[] {
  const results: string[] = [];
  if (data.emotionalPayoff?.primary) {
    results.push(data.emotionalPayoff.primary);
  }
  if (Array.isArray(data.emotionalPayoff?.secondary)) {
    results.push(...data.emotionalPayoff.secondary);
  }
  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractObjections(data: any): string[] {
  if (data.objectionOvercome?.primary) {
    return [data.objectionOvercome.primary];
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLoyaltyFactors(data: any): string[] {
  const results: string[] = [];
  if (Array.isArray(data.recommendationLanguage?.phrases)) {
    results.push(...data.recommendationLanguage.phrases.slice(0, 3));
  }
  return results;
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === "string" ? v : String(v)));
  }
  if (typeof val === "string") return [val];
  return [];
}
