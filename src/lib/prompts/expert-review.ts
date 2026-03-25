import type { CompiledReport, AnalysisInput } from "../types";

/**
 * Each expert reviews the compiled report and suggests improvements.
 * The improvements are then applied in a final rewrite pass.
 *
 * CRITICAL: Experts can only reference data that exists in the AnalysisInput.
 * They cannot invent quotes, pages, or findings. They can only sharpen,
 * reframe, restructure, or cut what is already there.
 */

interface ExpertLens {
  name: string;
  instruction: string;
}

const EXPERTS: ExpertLens[] = [
  {
    name: "April Dunford (Positioning)",
    instruction: `You are April Dunford reviewing this report. Your expertise is positioning.

Ask these questions of every finding:
1. Is this a MESSAGING problem or a POSITIONING problem? Messaging = right category, wrong words. Positioning = wrong category entirely. This distinction changes everything.
2. What category has the company placed themselves in? Is it the right one? A company in the wrong category cannot fix their problem with better copy.
3. Who are the competitive alternatives? Not just direct competitors. What would the customer do if this company did not exist? That reveals the real positioning.
4. What is the company's unique capability that matters to customers? Is it mentioned anywhere on the site?

If you find a positioning problem the original report missed, flag it clearly. If the report confused messaging with positioning, correct it.

Keep your feedback to 3-5 specific, actionable points. No waffle.`,
  },
  {
    name: "Bob Moesta (Jobs to be Done)",
    instruction: `You are Bob Moesta reviewing this report. Your expertise is Jobs to be Done.

Ask these questions of every finding:
1. What JOB is the customer hiring this product for? Not the functional job. The emotional and social job. "I want to look competent to my board" is a job. "I want reporting software" is not.
2. What was the STRUGGLING MOMENT that made them switch? The best clue is in review language: "I was tired of...", "We kept failing at...", "Every time we had to..."
3. What did the customer FIRE to hire this product? Spreadsheets? A competitor? Manual processes? Doing nothing? Each implies a different message.
4. Does the website speak to the struggling moment or to the solution? Most companies only talk about the solution. The struggling moment is what makes someone lean forward.

If the report missed the real job, name it. If the customer quotes reveal a struggling moment the report overlooked, flag it.

Keep your feedback to 3-5 specific points. Reference actual quotes from the data.`,
  },
  {
    name: "Eugene Schwartz (Awareness Levels)",
    instruction: `You are applying Eugene Schwartz's awareness framework to this report.

Schwartz defined five levels of customer awareness:
1. UNAWARE: Does not know they have a problem.
2. PROBLEM-AWARE: Knows the problem, not the solution.
3. SOLUTION-AWARE: Knows solutions exist, not this specific product.
4. PRODUCT-AWARE: Knows this product, needs convincing.
5. MOST AWARE: Ready to buy, just needs the right offer.

Ask:
1. What awareness level is the homepage written for? What level is the actual visitor likely at?
2. If there is a mismatch, name it. A homepage written for product-aware visitors fails when most traffic is problem-aware.
3. Does the copy move the reader through awareness levels, or does it skip steps? Skipping steps loses people.
4. What specific headline or section is aimed at the wrong awareness level?

If the report missed an awareness level mismatch, flag it with a specific example from the website copy.

Keep your feedback to 3-5 specific points.`,
  },
  {
    name: "Joanna Wiebe (Conversion Copy)",
    instruction: `You are Joanna Wiebe reviewing this report. Your expertise is conversion copywriting.

Ask these questions:
1. What is the specific COPY MECHANISM that is failing? Not "the messaging is unclear." Is it the headline structure? The CTA language? The value prop framing? The proof placement?
2. Where is the highest-friction point on the page? The exact place where a motivated visitor would hesitate or leave.
3. Is the copy using the VOICE OF CUSTOMER or the voice of the company? The best performing copy mirrors exactly how customers describe the product.
4. What is the ONE copy change that would have the biggest impact? Not a rewrite. A single surgical change. Move this testimonial here. Change this headline from feature to outcome. Swap this CTA from "Learn more" to "See how it works."

If the report identified problems but missed the copy mechanics underneath, add them.

Keep your feedback to 3-5 specific, surgical points.`,
  },
  {
    name: "Dave Trott (Compression)",
    instruction: `You are Dave Trott reviewing this report. Your job is simple: make it hit harder in fewer words.

For every section of the report:
1. Find the ONE line that actually matters. The rest is setup.
2. Cut any sentence that a busy founder would skip.
3. If a point takes a paragraph, can it be said in one line? If yes, rewrite it.
4. Flag any section that explains when it should punch. "Your support is your best asset but it is buried on your site" is better than a paragraph explaining why support matters.

Your output should identify:
- Lines to cut (with reason: "setup that delays the hit")
- Lines to compress (with rewrite)
- Lines that already hit (leave these alone)

Be ruthless. If the report is 500 words, it should be 300 after your pass.`,
  },
];

/**
 * Builds the expert review prompt. Sends the compiled report + raw data
 * to all five experts in a single Claude call and asks for a consolidated
 * list of improvements.
 */
export function buildExpertReviewPrompt(
  report: CompiledReport,
  input: AnalysisInput,
): string {
  const reportJSON = JSON.stringify(
    {
      mirrorLine: report.mirrorLine,
      sections: report.sections,
      score: report.score,
      scoreDimensions: report.scoreDimensions,
    },
    null,
    2,
  );

  // Include raw data summary so experts can reference actual content
  // Pass full source data so experts can reference actual content accurately.
  // Up to 4000 chars per page and 1000 chars per review to prevent hallucination
  // from truncated context. Accuracy matters more than token cost.
  const pageSummary = input.pages
    .map((p) => `${p.url}: ${p.content.slice(0, 6000)}`)
    .join("\n\n");

  const reviewSummary = input.reviews
    .filter((r) => r.content.trim().length > 10)
    .slice(0, 30)
    .map((r) => {
      const platform = r.platform || r.selector || r.source;
      const author = r.author ? ` by ${r.author}` : "";
      return `[${platform}${author}] ${r.content.slice(0, 1500)}`;
    })
    .join("\n\n");

  const expertBlocks = EXPERTS.map(
    (e) => `=== ${e.name} ===\n${e.instruction}`,
  ).join("\n\n");

  return `TASK: Expert review panel for Voice Gap Analysis report.

Five experts will review this report and suggest specific improvements. You will then apply ALL valid improvements to produce an enhanced report.

CRITICAL RULES:
- Experts can ONLY reference data that exists in the source material below.
- No expert can invent quotes, statistics, or page content not in the data.
- Every improvement must be grounded in evidence from the source data.
- If an expert suggests adding a finding, the evidence MUST exist in the pages or reviews below.
- Experts may ONLY sharpen, compress, reorder, or cut existing content. They MUST NOT add new quotes or findings. If a suggestion requires new evidence, discard it.

=== THE CURRENT REPORT ===
${reportJSON}

=== SOURCE DATA (pages) ===
${pageSummary}

=== SOURCE DATA (reviews) ===
${reviewSummary.length > 0 ? reviewSummary : "(No substantive reviews)"}

=== EXPERT PANEL ===

${expertBlocks}

=== YOUR TASK ===

1. Run each expert's review mentally. Generate their 3-5 feedback points each.
2. Evaluate each suggestion: is it grounded in the source data? Discard any that require inventing content.
3. Apply ALL valid improvements to produce an enhanced version of the report.
4. Apply Dave Trott's compression pass LAST. Cut everything that does not hit.

RESPOND WITH THIS EXACT JSON STRUCTURE:

{
  "expertFeedback": {
    "dunford": ["point 1", "point 2", "point 3"],
    "moesta": ["point 1", "point 2", "point 3"],
    "schwartz": ["point 1", "point 2", "point 3"],
    "wiebe": ["point 1", "point 2", "point 3"],
    "trott": ["point 1", "point 2", "point 3"]
  },
  "enhancedReport": {
    "mirrorLine": "Improved mirror line (if experts suggested a better one, otherwise keep original)",
    "sections": [
      {
        "title": "section title",
        "content": "Enhanced content with expert improvements applied. Trott-compressed.",
        "citations": ["sources"]
      }
    ],
    "score": 0,
    "scoreDimensions": {
      "messageClarity": { "score": 0, "maxScore": 0, "justification": "..." },
      "differentiation": { "score": 0, "maxScore": 0, "justification": "..." },
      "voiceConsistency": { "score": 0, "maxScore": 0, "justification": "..." },
      "ctaClarity": { "score": 0, "maxScore": 0, "justification": "..." }
    }
  }
}

The enhanced report must be BETTER than the original: sharper insights, tighter writing, more precise diagnosis. But it must not contain anything not supported by the source data.`;
}
