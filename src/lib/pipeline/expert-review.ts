import type { CompiledReport, AnalysisInput } from "../types";
import { callClaude, parseJSONResponse } from "../services/anthropic";
import { SYSTEM_PROMPT } from "../prompts/system-prompt";
import { buildExpertReviewPrompt } from "../prompts/expert-review";

/**
 * Pipeline Step 7b: Expert Review Panel.
 *
 * Sends the compiled report through five expert lenses:
 * 1. April Dunford (positioning vs messaging)
 * 2. Bob Moesta (jobs to be done)
 * 3. Eugene Schwartz (awareness levels)
 * 4. Joanna Wiebe (conversion copy mechanics)
 * 5. Dave Trott (compression)
 *
 * Returns an enhanced report with expert improvements applied.
 */
export async function expertReviewStep(
  report: CompiledReport,
  input: AnalysisInput,
): Promise<CompiledReport> {
  const userPrompt = buildExpertReviewPrompt(report, input);

  let raw: string;
  try {
    raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 8192,
    });
  } catch (err) {
    console.error(
      "[expert-review] Claude call failed, returning original report:",
      err instanceof Error ? err.message : err,
    );
    return report;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = parseJSONResponse(raw) as any;

    // Log expert feedback for debugging
    const feedback = data.expertFeedback;
    if (feedback) {
      for (const [expert, points] of Object.entries(feedback)) {
        const items = points as string[];
        console.log(`[expert-review] ${expert}: ${items.length} points`);
      }
    }

    const enhanced = data.enhancedReport;
    if (!enhanced || !enhanced.mirrorLine || !Array.isArray(enhanced.sections)) {
      console.warn("[expert-review] Invalid enhanced report structure, keeping original");
      return report;
    }

    // Map enhanced sections
    const sections = enhanced.sections.map((s: { title?: string; content?: string; citations?: string[] }) => ({
      title: s.title ?? "Untitled",
      content: s.content ?? "",
      citations: Array.isArray(s.citations) ? s.citations : [],
    }));

    const score = typeof enhanced.score === "number"
      ? Math.max(0, Math.min(100, Math.round(enhanced.score)))
      : report.score;

    const scoreDimensions = enhanced.scoreDimensions && typeof enhanced.scoreDimensions === "object"
      ? enhanced.scoreDimensions
      : report.scoreDimensions;

    return {
      ...report,
      mirrorLine: enhanced.mirrorLine || report.mirrorLine,
      sections,
      score,
      scoreDimensions,
    };
  } catch (err) {
    console.warn(
      "[expert-review] Failed to parse expert review, keeping original:",
      err instanceof Error ? err.message : err,
    );
    return report;
  }
}
