import type { AnalysisInput, NarrativeGapResult } from "../types";
import { callClaude, parseJSONResponse } from "../services/anthropic";
import { SYSTEM_PROMPT } from "../prompts/system-prompt";
import { buildNarrativeGapPrompt } from "../prompts/narrative-gap";

/**
 * Pipeline Step 5: Narrative Gap Analysis.
 *
 * Calls Claude with the narrative gap prompt, parses the structured JSON
 * response, and maps it to the NarrativeGapResult type.
 *
 * If JSON parsing fails, retries once with an explicit "respond only in JSON"
 * instruction appended.
 */
export async function analyzeNarrativeGapStep(
  input: AnalysisInput,
): Promise<NarrativeGapResult> {
  const userPrompt = buildNarrativeGapPrompt(input);

  let raw: string;
  try {
    raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 4096,
    });
  } catch (err) {
    throw new Error(
      `Narrative gap analysis Claude call failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // First parse attempt
  try {
    return mapToNarrativeGapResult(parseJSONResponse(raw));
  } catch {
    // Retry with stricter instruction
    const retryRaw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt:
        userPrompt +
        "\n\nIMPORTANT: Your previous response was not valid JSON. Respond ONLY with the JSON object. No markdown, no code fences, no commentary before or after the JSON.",
      maxTokens: 4096,
    });

    try {
      return mapToNarrativeGapResult(parseJSONResponse(retryRaw));
    } catch (parseErr) {
      throw new Error(
        `Failed to parse narrative gap JSON after retry: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }
  }
}

/**
 * Maps the raw Claude JSON response to the NarrativeGapResult type.
 * Handles variations in field naming from the model.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToNarrativeGapResult(data: any): NarrativeGapResult {
  const mirrorLine: string = data.mirrorLine ?? "";

  // Map customer themes to string array
  const customerThemes: string[] = Array.isArray(data.customerThemes)
    ? data.customerThemes.map((t: unknown) =>
        typeof t === "string" ? t : (t as { theme: string }).theme ?? String(t),
      )
    : [];

  // Map company themes to string array
  const companyThemes: string[] = Array.isArray(data.companyThemes)
    ? data.companyThemes.map((t: unknown) =>
        typeof t === "string" ? t : (t as { theme: string }).theme ?? String(t),
      )
    : [];

  // Map gaps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gaps = Array.isArray(data.gaps)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.gaps.map((g: any) => ({
        theme: g.theme ?? "Unnamed gap",
        companyMessage: g.companyMessage ?? g.company_says ?? "",
        customerPerception: g.customerPerception ?? g.customer_says ?? "",
        severity: validateSeverity(g.severity),
        evidence: {
          companySource:
            g.evidence?.companySource ?? g.evidence?.company_source ?? "",
          customerSource:
            g.evidence?.customerSource ?? g.evidence?.customer_source ?? "",
        },
      }))
    : [];

  const confidence = validateConfidence(data.confidence);

  return {
    mirrorLine,
    customerThemes,
    companyThemes,
    gaps,
    confidence,
  };
}

function validateSeverity(
  val: unknown,
): "critical" | "major" | "minor" {
  if (val === "critical" || val === "major" || val === "minor") return val;
  return "major";
}

function validateConfidence(val: unknown): "high" | "medium" | "low" {
  if (val === "high" || val === "medium" || val === "low") return val;
  return "medium";
}
