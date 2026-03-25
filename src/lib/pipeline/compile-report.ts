import type {
  AnalysisInput,
  NarrativeGapResult,
  CustomerPsychResult,
  CompiledReport,
  ReportSection,
} from "../types";
import { callClaude, parseJSONResponse } from "../services/anthropic";
import { SYSTEM_PROMPT } from "../prompts/system-prompt";
import { buildReportCompilationPrompt } from "../prompts/report-compilation";

/**
 * Pipeline Step 7: Report Compilation.
 *
 * Takes narrative gap analysis, customer psychology (if available), and
 * raw input data. Calls Claude to compile the final report.
 * Returns a structured CompiledReport ready for rendering and verification.
 */
export async function compileReportStep(
  input: AnalysisInput,
  narrativeGap: NarrativeGapResult,
  customerPsych: CustomerPsychResult | null,
): Promise<CompiledReport> {
  const userPrompt = buildReportCompilationPrompt(
    input,
    narrativeGap,
    customerPsych,
  );

  let raw: string;
  try {
    raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 6144,
    });
  } catch (err) {
    throw new Error(
      `Report compilation Claude call failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // First parse attempt
  try {
    return mapToCompiledReport(parseJSONResponse(raw), narrativeGap, customerPsych, input);
  } catch {
    // Retry with stricter instruction
    const retryRaw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt:
        userPrompt +
        "\n\nIMPORTANT: Your previous response was not valid JSON. Respond ONLY with the JSON object. No markdown, no code fences, no commentary.",
      maxTokens: 6144,
    });

    try {
      return mapToCompiledReport(
        parseJSONResponse(retryRaw),
        narrativeGap,
        customerPsych,
        input,
      );
    } catch (parseErr) {
      throw new Error(
        `Failed to parse report compilation JSON after retry: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }
  }
}

/**
 * Compiles a report with corrections injected from verification failures.
 * Used when verify-report flags issues and the report needs regeneration.
 */
export async function compileReportWithCorrections(
  input: AnalysisInput,
  narrativeGap: NarrativeGapResult,
  customerPsych: CustomerPsychResult | null,
  corrections: string[],
): Promise<CompiledReport> {
  const basePrompt = buildReportCompilationPrompt(
    input,
    narrativeGap,
    customerPsych,
  );

  const correctionBlock = corrections
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const userPrompt = `${basePrompt}

CORRECTIONS FROM VERIFICATION (you MUST fix all of these):
${correctionBlock}

These issues were found in a previous attempt. Do not repeat them. If a quote was flagged as fabricated, either find the real quote in the data or remove the finding entirely.`;

  const raw = await callClaude({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 6144,
  });

  return mapToCompiledReport(parseJSONResponse(raw), narrativeGap, customerPsych, input);
}

/**
 * Maps raw Claude JSON to CompiledReport, ensuring all required fields exist.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToCompiledReport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  narrativeGap: NarrativeGapResult,
  customerPsych: CustomerPsychResult | null,
  input?: AnalysisInput,
): CompiledReport {
  const mirrorLine: string =
    data.mirrorLine ?? narrativeGap.mirrorLine ?? "";

  const sections: ReportSection[] = Array.isArray(data.sections)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.sections.map((s: any) => ({
        title: s.title ?? "Untitled",
        content: s.content ?? "",
        citations: Array.isArray(s.citations) ? s.citations : [],
      }))
    : [];

  const score = typeof data.score === "number"
    ? Math.max(0, Math.min(100, Math.round(data.score)))
    : 0;

  const dataSources = input
    ? {
        pageCount: input.pages.length,
        reviewCount: input.reviews.filter((r) => r.content.trim().length > 10).length,
        hnDiscussionCount: input.extras.newsArticles.filter(
          (a) => a.url.includes("news.ycombinator.com") || a.source === "news",
        ).length,
        archiveSnapshotCount: (input.extras.archiveSnapshots ?? []).length,
      }
    : undefined;

  return {
    mirrorLine,
    sections,
    score,
    generatedAt: data.generatedAt ?? new Date().toISOString(),
    domain: data.domain ?? "",
    narrativeGap,
    customerPsych,
    ...(dataSources ? { dataSources } : {}),
  };
}
