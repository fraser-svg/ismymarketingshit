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

  return `TASK: Compile the Voice Gap Analysis Report for ${companyName}

You have two analysis passes to work from. Compile them into a single, devastating, evidence-backed report.

Your job: make the reader see something they have been too close to notice. Not to tell them what to do. To show them what IS.

The most powerful finding is always a CONTRAST. What they say vs what customers say. What they emphasise vs what they ignore. What they think they are vs what they actually sound like.

If a finding would not make the founder pause mid-scroll, cut it.
If a finding could apply to any company in their industry, cut it.
If a finding does not cite a specific URL or review, cut it.

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

REPORT STRUCTURE:

1. MIRROR LINE
The headline finding. One or two sentences. Already provided in the narrative gap analysis. You may refine the wording but do not change the substance or weaken it.

2. WHAT YOU SAY ABOUT YOURSELF
Summary of the company's voice with specific evidence. Quote exact copy from specific pages. Name the pages. Show patterns. This is the "inside the jar" label.

3. ${hasReviews ? "WHAT YOUR CUSTOMERS SAY ABOUT YOU" : "WHAT AN OUTSIDER SEES"}
${hasReviews ? "Summary of the customer voice with specific evidence. Quote verbatim from reviews. Name platforms and authors where available. Show what themes emerge. This is the 'outside the jar' label." : "What a cold visitor sees when they land on this website. No context, no warm intro. Assess clarity, specificity, and whether the value proposition is obvious within 5 seconds."}

4. THE GAPS
Each gap finding with evidence from both sides. Use the contrast structure: "You say X. They say Y. That is the gap." Every gap must reference specific sources.

5. CLARITY SCORE
Score from 0 to 100 with dimension breakdown.

${clarityRubric}

Score each dimension individually with a brief justification citing specific evidence. Then sum for the total.

${noReviewScoringGuidance}

6. KEY ISSUES
Specific, actionable issues. Each must cite evidence. Categories:
- Vagueness: where the messaging is too abstract to be useful
- Sameness: where the copy could belong to any competitor
- Unclear ICP: where it is not obvious who this product is for
- Weak value articulation: where the real value is buried or missing

THREE SIGNATURE MOVES (all must appear somewhere in the report):
1. Identity flip: "You think you are X. You actually sound like Y."
2. Cost of the problem: "This makes you easy to ignore."
3. Directional reframe: "This would be stronger if framed as..."

SPECIFICITY IS THE WEAPON:
Not "your messaging could be clearer" but:
- "Your homepage headline says '[exact text]'. This could be any company in any industry."
- "Your top reviewer says '[exact quote]'. Your website never mentions [that concept] once."
- "You have N reviews. The word '[X]' appears in M of them. Your homepage mentions it zero times."

QUANTIFY WHERE POSSIBLE:
- "X of Y reviews mention [theme]. Your website mentions it N times."
- "Your homepage uses N words before stating what you do."
- "Your CTA is N clicks from the homepage."

NAME AND LOCATE:
- "On your /pricing page..." not "on your website..."
- "A Trustpilot reviewer wrote..." not "one of your customers..."
- "Your hero headline reads: '[exact text]'" not "your headline is vague"

IMPORTANT: Each section's "content" field must be SUBSTANTIAL — multiple paragraphs of analysis with specific quotes, evidence, and page references. Do NOT leave content empty or write a single sentence. This is the core deliverable.

RESPOND WITH THIS EXACT JSON STRUCTURE (and ONLY this JSON, no other text):
{
  "mirrorLine": "The refined mirror line. One or two sentences.",
  "sections": [
    {
      "title": "What you say about yourself",
      "content": "Company voice summary with specific evidence. Multiple paragraphs. Quote exact copy from specific pages. Name the pages. Show patterns. This section should be 3-5 paragraphs minimum.",
      "citations": ["https://example.com/about", "https://example.com"]
    },
    {
      "title": "${hasReviews ? "What your customers say about you" : "What an outsider sees"}",
      "content": "${hasReviews ? "Customer voice summary with specific evidence. Quote verbatim from reviews. Name platforms and authors. Show themes. 3-5 paragraphs minimum." : "What a cold visitor sees landing on this website. Assess clarity, specificity, and whether the value proposition is obvious. 3-5 paragraphs minimum."}",
      "citations": ["${hasReviews ? "G2 review by [author]" : "homepage URL"}"]
    },
    {
      "title": "The gaps",
      "content": "Each gap as a contrast. You say X. They say Y. That is the gap. Separate each gap with a blank line. Include all gaps found. 3-5 paragraphs minimum.",
      "citations": ["source for each gap"]
    },
    {
      "title": "Key issues",
      "content": "Specific issues with evidence. Categorised by type (Vagueness, Sameness, Unclear ICP, Weak value articulation). 3-5 paragraphs minimum.",
      "citations": ["source for each issue"]
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

CRITICAL: The "content" field in each section is the most important part. Each must contain multiple paragraphs of detailed analysis with specific quotes and evidence. Empty or single-sentence content fields are a failure. Do NOT include narrativeGap or customerPsych in your response — only the fields shown above.`;
}
