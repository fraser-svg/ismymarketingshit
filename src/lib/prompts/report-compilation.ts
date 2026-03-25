import type {
  AnalysisInput,
  NarrativeGapResult,
  CustomerPsychResult,
} from "../types";

/**
 * Builds the report compilation prompt.
 *
 * Takes narrative gap + psychology + raw data and compiles the final report.
 * The report IS the product. Voice, specificity, and evidence are everything.
 */
export function buildReportCompilationPrompt(
  input: AnalysisInput,
  narrativeGap: NarrativeGapResult,
  customerPsych: CustomerPsychResult | null,
): string {
  const companyName = input.company.name ?? input.company.domain;
  // Check for reviews with actual text content, matching the narrative-gap threshold.
  const substantiveReviews = input.reviews.filter(
    (r) => r.content.trim().length > 10,
  );
  const hasReviews = substantiveReviews.length >= 3;
  const hasCustomerPsych = customerPsych !== null;

  // Build data sources summary
  const sourceSummary = input.pages
    .map((p) => `  ${p.url} (${p.content.length} chars)`)
    .join("\n");

  const reviewSummary = hasReviews
    ? `  ${input.dataQuality.reviewCount} reviews from: ${[...new Set(input.reviews.map((r) => r.source))].join(", ")}`
    : "  No reviews found.";

  // Build HN discussions block
  const hnArticles = input.extras.newsArticles.filter(
    (a) => a.url.includes("news.ycombinator.com") || a.source === "news",
  );
  const hnBlock = hnArticles.length > 0
    ? `\nHacker News discussions:\n${hnArticles.map((a) => `  ${a.url}\n  ${a.content.slice(0, 800)}`).join("\n\n")}`
    : "";

  // Build Web Archive block
  const archiveSnapshots = input.extras.archiveSnapshots ?? [];
  const archiveBlock = archiveSnapshots.length > 0
    ? `\nWeb Archive snapshots (${archiveSnapshots.length} historical captures):\n${archiveSnapshots.map((s) => `  ${s.timestamp}: ${s.archiveUrl}`).join("\n")}`
    : "";

  // Serialize analysis results for the prompt
  const narrativeGapJSON = JSON.stringify(narrativeGap, null, 2);
  const customerPsychJSON = hasCustomerPsych
    ? JSON.stringify(customerPsych, null, 2)
    : "null (fewer than 3 reviews, customer psychology analysis was skipped)";

  // Clarity score rubric
  const clarityRubric = hasReviews
    ? `CLARITY SCORE RUBRIC (0-100):
| Dimension          | Points | What it measures                              |
|--------------------|--------|-----------------------------------------------|
| Message clarity    | 25     | Is the value prop clear to an outsider?       |
| Customer alignment | 25     | Does messaging match what customers say?      |
| Differentiation    | 20     | Could this be any competitor's site?          |
| Voice consistency  | 15     | Does the website speak with one voice?        |
| CTA clarity        | 15     | Does the visitor know what to do?             |`
    : `CLARITY SCORE RUBRIC (0-100, no-review redistribution):
| Dimension          | Points | What it measures                              |
|--------------------|--------|-----------------------------------------------|
| Message clarity    | 35     | Is the value prop clear to an outsider?       |
| Differentiation    | 30     | Could this be any competitor's site?          |
| Voice consistency  | 15     | Does the website speak with one voice?        |
| CTA clarity        | 20     | Does the visitor know what to do?             |
(Customer alignment skipped: no reviews to compare against.)`;

  const noReviewScoringGuidance = !hasReviews
    ? "IMPORTANT — FAIR SCORING WITHOUT REVIEWS:\n" +
      "The absence of customer reviews should NOT automatically result in a low score. " +
      "You are scoring messaging CLARITY based on what the website shows. A company with clear, " +
      "specific, well-differentiated messaging should score well even without review data. " +
      "The no-review rubric redistributes the 25 customer alignment points to other dimensions — " +
      "use the full range of each dimension fairly. A company with a clear homepage, specific " +
      "value proposition, and obvious CTAs can score 70+ even without reviews. " +
      "Do not penalise for the absence of data you do not have."
    : "";

  return `TASK: Voice Gap Analysis for ${companyName}

Write a brutally honest diagnosis. Not a report. A diagnosis.

RULES:
- Short sentences. Max 12 to 15 words each.
- No fluff. No corporate language. No hedging.
- Use sharp contrasts: "You say: [X]. They feel: [Y]."
- Prioritise punch over completeness. Say the sharpest thing. Move on.
- Make it slightly uncomfortable. If it feels too harsh, keep it.
- Write like a diagnosis, not a report.
- If anything sounds like a consultant wrote it, rewrite it.

SUTHERLAND LENS:
Find the non-obvious truth. What does the company think they sell? What do customers actually buy? Where is the asymmetric opportunity hiding in plain sight?

BEFORE YOU RESPOND:
Review every line. Delete anything that:
- Tells the reader something they already know
- Could apply to any company in this industry
- Contains no evidence and no insight
- Invites skimming

If a sentence has no quote, no number, and no reframe, it is filler. Cut it.

=== DATA SOURCES ===
Pages scraped:
${sourceSummary}

Reviews:
${reviewSummary}
${hnBlock}${archiveBlock}

Data confidence: ${input.dataQuality.confidence}

=== NARRATIVE GAP ANALYSIS ===
${narrativeGapJSON}

=== CUSTOMER PSYCHOLOGY ===
${customerPsychJSON}

---

REPORT SECTIONS:

1. THE MIRROR
The headline finding. Max two sentences. Already in the narrative gap analysis. Sharpen the wording. Do not weaken it.

2. WHAT YOU SAY
Quote exact copy from specific pages. Name the pages. Show the pattern. Short paragraphs. Lead with the most revealing quote.

3. ${hasReviews ? "WHAT THEY SAY" : "WHAT AN OUTSIDER SEES"}
${hasReviews ? "Quote verbatim from reviews. Name platforms and authors. Show the themes that keep repeating. These are the words your customers use when you are not in the room." : "What a stranger sees landing cold on this site. No context. Five seconds. What do they understand? What confuses them?"}

4. THE GAP
Each gap as a contrast. Two lines max per gap.
"You say: [exact quote from site]. They feel: [exact quote from review or outsider observation]."
Every gap must cite a specific source.

5. WHY THIS MATTERS
What this gap costs them. One to two paragraphs. Be specific about consequences: lost visitors, confused buyers, wasted spend.

6. BOTTOM LINE
One brutal truth. Two to three sentences max. This is the line they will remember.

SCORING:

${clarityRubric}

Score each dimension. One sentence justification each. Sum for total.

${noReviewScoringGuidance}

SPECIFICITY IS THE WEAPON:
- "Your hero reads: '[exact text]'. Swap in any competitor name. Still works."
- "Your reviewer says '[exact quote]'. Your site never mentions it."
- "N of your reviews use the word '[X]'. Your homepage uses it zero times."

NAME EVERYTHING:
- "On /about you say..." not "on your website..."
- "A testimonial from [name] at [school]..." not "a customer..."

Each section's "content" must be substantial. Multiple short paragraphs with specific quotes and evidence. No section can be a single sentence. This is the deliverable.

RESPOND WITH THIS EXACT JSON STRUCTURE (and ONLY this JSON, no other text):
{
  "mirrorLine": "Max two sentences. The sharpest thing you can say.",
  "sections": [
    {
      "title": "What you say",
      "content": "Short paragraphs. Exact quotes from specific pages. Name the pages. Show the pattern. Lead with the most revealing quote.",
      "citations": ["page URLs"]
    },
    {
      "title": "${hasReviews ? "What they say" : "What an outsider sees"}",
      "content": "${hasReviews ? "Verbatim quotes from reviews. Name platforms and authors. Show repeating themes." : "What a stranger sees in five seconds. What they understand. What confuses them."}",
      "citations": ["sources"]
    },
    {
      "title": "The gap",
      "content": "Each gap as a two-line contrast. You say: [X]. They feel: [Y]. Cite sources for each.",
      "citations": ["sources"]
    },
    {
      "title": "Why this matters",
      "content": "What this costs them. Specific consequences. Lost visitors, confused buyers, wasted spend.",
      "citations": ["sources"]
    },
    {
      "title": "Bottom line",
      "content": "One brutal truth. Two to three sentences. The line they will remember.",
      "citations": []
    }
  ],
  "score": 0,
  "scoreDimensions": {
    "messageClarity": { "score": 0, "maxScore": ${hasReviews ? 25 : 35}, "justification": "..." },
    ${hasReviews ? '"customerAlignment": { "score": 0, "maxScore": 25, "justification": "..." },' : ""}
    "differentiation": { "score": 0, "maxScore": ${hasReviews ? 20 : 30}, "justification": "..." },
    "voiceConsistency": { "score": 0, "maxScore": 15, "justification": "..." },
    "ctaClarity": { "score": 0, "maxScore": ${hasReviews ? 15 : 20}, "justification": "..." }
  },
  "generatedAt": "${new Date().toISOString()}",
  "domain": "${input.company.domain}"
}

CRITICAL: Each "content" field must have substance. Short paragraphs, but multiple of them. Specific quotes and evidence in every one. Empty content is a failure.

Do NOT include narrativeGap or customerPsych in your response. Only the fields shown above.

Final check before responding: read every sentence. If a consultant would write it, rewrite it. If it feels too harsh, keep it.`;
}
