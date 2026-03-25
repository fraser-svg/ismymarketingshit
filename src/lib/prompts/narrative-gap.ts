import type { AnalysisInput } from "../types";

/**
 * Builds the narrative gap analysis prompt.
 *
 * Adapted from PatrickVersion 02-narrative-gap.md.
 * Requests structured JSON matching NarrativeGapResult.
 *
 * When reviews are empty, pivots to "outsider clarity analysis"
 * assessing messaging clarity to a cold visitor.
 */
/**
 * Build the DATA COVERAGE section that lists exactly which page types
 * were and were not scraped. This prevents the AI from making claims
 * about pages it hasn't seen.
 */
function buildDataCoverageBlock(input: AnalysisInput): string {
  const pageTypes = new Map<string, string[]>();

  for (const page of input.pages) {
    const path = new URL(page.url).pathname.toLowerCase();
    let label = "other";
    if (path === "/" || path === "") label = "homepage";
    else if (/\/(about|company|team|who-we-are|our-story|leadership)/i.test(path)) label = "about";
    else if (/\/(pricing|plans|packages)/i.test(path)) label = "pricing";
    else if (/\/(features?|products?|solutions?|services?|platform)/i.test(path)) label = "products/features";
    else if (/\/(blog|posts?|articles?|news|resources?)/i.test(path)) label = "blog";
    else if (/\/(testimonials?|reviews?|customers?|case-stud|success-stor)/i.test(path)) label = "testimonials/reviews";
    else if (/\/(contact|support|help|faq)/i.test(path)) label = "contact/support";

    if (!pageTypes.has(label)) pageTypes.set(label, []);
    pageTypes.get(label)!.push(page.url);
  }

  const scraped = [...pageTypes.entries()]
    .map(([type, urls]) => `${type} (${urls.length}): ${urls.join(", ")}`)
    .join("\n  ");

  const criticalTypes = ["homepage", "about", "pricing", "products/features", "testimonials/reviews"];
  const missingTypes = criticalTypes.filter((t) => !pageTypes.has(t));

  const lines = [
    "DATA COVERAGE (read this carefully before writing anything):",
    `  PAGES SCRAPED:\n  ${scraped}`,
  ];

  if (missingTypes.length > 0) {
    lines.push(
      `  PAGES NOT SCRAPED: ${missingTypes.join(", ")}`,
      `  WARNING: You have NO data for the page types listed above. Do NOT make claims about what those pages contain or do not contain. If you need to reference a missing page type, write: "We did not analyse [page type] for this report."`,
    );
  } else {
    lines.push("  All critical page types were scraped.");
  }

  return lines.join("\n");
}

export function buildNarrativeGapPrompt(input: AnalysisInput): string {
  // Check for reviews with actual text content, not just non-empty array.
  // Reviews can be empty objects or have trivial content after serialization.
  const substantiveReviews = input.reviews.filter(
    (r) => r.content.trim().length > 10,
  );
  const hasReviews = substantiveReviews.length >= 3;
  const companyName = input.company.name ?? input.company.domain;

  const pagesBlock = input.pages
    .map(
      (p) =>
        `--- PAGE: ${p.url} ---\n${p.content.slice(0, 6000)}\n--- END PAGE ---`,
    )
    .join("\n\n");

  const reviewsBlock = hasReviews
    ? substantiveReviews
        .map(
          (r) =>
            `--- REVIEW (${r.source}, ${r.url}) ---\n${r.content}\n--- END REVIEW ---`,
        )
        .join("\n\n")
    : "";

  // Separate HN stories from other news articles
  const hnArticles = input.extras.newsArticles.filter(
    (a) => a.url.includes("news.ycombinator.com") || a.source === "news",
  );
  const otherNews = input.extras.newsArticles.filter(
    (a) => !a.url.includes("news.ycombinator.com") && a.source !== "news",
  );

  const hnBlock = hnArticles.length > 0
    ? `HACKER NEWS DISCUSSIONS:\nThese show how the tech community perceives ${companyName}. HN comments are unfiltered and often reveal how developers and operators really talk about products.\n${hnArticles.map((a) => `--- HN: ${a.url} ---\n${a.content.slice(0, 1500)}\n--- END HN ---`).join("\n\n")}`
    : "";

  const archiveSnapshots = input.extras.archiveSnapshots ?? [];
  const archiveBlock = archiveSnapshots.length > 0
    ? `HISTORICAL MESSAGING (Web Archive):\nThese snapshots show how ${companyName}'s messaging has evolved over time. Look for patterns: has the positioning changed? Has the language stayed generic for years? Did they pivot their messaging?\n${archiveSnapshots.map((s) => `  ${s.timestamp}: ${s.archiveUrl}`).join("\n")}`
    : "";

  const extrasBlock = [
    input.extras.techStack.length > 0
      ? `Tech stack detected: ${input.extras.techStack.join(", ")}`
      : null,
    otherNews.length > 0
      ? otherNews
          .map((a) => `News: ${a.url}\n${a.content.slice(0, 500)}`)
          .join("\n")
      : null,
    hnBlock || null,
    archiveBlock || null,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (hasReviews) {
    return buildWithReviews(companyName, pagesBlock, reviewsBlock, extrasBlock, input);
  }
  return buildNoReviewFallback(companyName, pagesBlock, extrasBlock, input);
}

function buildWithReviews(
  companyName: string,
  pagesBlock: string,
  reviewsBlock: string,
  extrasBlock: string,
  input: AnalysisInput,
): string {
  const dataCoverage = buildDataCoverageBlock(input);

  return `TASK: Narrative Gap Analysis for ${companyName}

${dataCoverage}

Find the gap between how this company describes itself and how its customers describe it.

You are reading two labels on the same jar. The company wrote the inside label. The customers wrote the outside label. Document where they diverge.

RORY SUTHERLAND LENS: Before you analyse, ask these questions:
1. What does the company think they sell? What do customers actually buy? (These are rarely the same thing.)
2. What is the costly signal in their messaging? What does their choice of words reveal about their real priorities?
3. Where is the asymmetric opportunity? What could they say, using evidence already in their testimonials, that would transform their positioning at zero cost?
4. What is the perception gap? The product might be excellent. The messaging might make it sound ordinary. That is the gap.
5. Is the company solving the stated problem or the real problem? Customers rarely buy what companies think they are selling.

REMINDER: Every quote you write MUST appear verbatim in the data below. Do not invent quotes. Do not paraphrase and present as a quote. If you cannot find an exact quote to support a point, describe the content without quoting.

DATA QUALITY: ${input.dataQuality.confidence} confidence. ${input.dataQuality.pageCount} pages scraped, ${input.dataQuality.reviewCount} reviews found.
${input.dataQuality.issues.length > 0 ? `Known issues: ${input.dataQuality.issues.join("; ")}` : ""}

=== WEBSITE PAGES ===
${pagesBlock}

=== CUSTOMER REVIEWS ===
${reviewsBlock}

${extrasBlock ? `=== ADDITIONAL DATA ===\n${extrasBlock}` : ""}

---

HOW TO FIND CUSTOMER THEMES:
Go through every review. Look for:
- Repeated words across reviews: "relief", "finally", "saved", "peace of mind". These are the real value proposition.
- Emotional language: not "workflow automation" but "I stopped dreading Mondays".
- Before/after stories: the "before" state reveals the real pain.
- Unexpected use cases: customers using the product for something the company does not promote.
- Comparison language: "Unlike [competitor]..." reveals competitive positioning from the customer side.

A theme needs at least 2 occurrences to count. Record frequency and pull verbatim quotes.

HOW TO FIND COMPANY THEMES:
Go through all website copy. Look for:
- Hero headlines: what the homepage says first. This is what the company thinks matters most.
- Feature vs benefit vs outcome language.
- Category claims: "platform", "solution", "tool", "software".
- Adjective patterns: "AI-powered", "intelligent", "modern". Aspirational, not descriptive.
- CTA language: what the buttons say.

Record where each theme appears (homepage hero, features page, about page).

HOW TO FIND GAPS:
Compare customer themes to company themes. Five gap types:

1. emotion_vs_feature: Customers describe an emotional outcome. Company describes a technical feature. Example: customers say "I finally sleep at night", website says "automated compliance monitoring".

2. outcome_vs_process: Customers describe what they achieved. Company describes how the product works. Example: customers say "we passed our audit first time", website says "streamlined workflow with 14-step process".

3. praised_but_unmentioned: Customers consistently praise something the company never mentions. Example: every review mentions the support team, website has no mention of support quality.

4. promoted_but_uncited: Company heavily promotes something customers never mention. Example: website leads with "AI-powered" but no review mentions AI.

5. tone_mismatch: The emotional register differs. Example: customers are passionate and evangelical, website is corporate and cautious.

CRITICAL: Assess spirit, not vocabulary. A gap exists when the CONCEPT is absent, not when a specific word is missing. Do not write "the word 'caring' appears 12 times in reviews and 0 times on your website." A company can communicate caring without that word. Report gaps in meaning, not gaps in dictionary terms.

Each gap must have specific evidence from both sides. Not "customers are more emotional". Rather: "Customers say 'this saved our business' (G2, 4 reviews). Website says 'enterprise-grade solution for modern teams'."

THE MIRROR LINE:
This is the single most important output. One or two sentences capturing the core gap. It must:

1. Pass the pub test. Could you say this to the founder over a pint and they would lean in?
2. Be specific to THIS company. Not transplantable to any other company.
3. Be slightly uncomfortable but true. A small jolt of recognition.
4. Make the founder want to show their co-founder.

Good examples:
- "Your customers say 'relief'. Your website says 'platform'. Forty-seven people described the moment they stopped worrying, and your homepage does not mention the word once."
- "Your G2 reviewers describe a different company than your homepage does. They talk about your team. You talk about your technology."

Bad examples:
- "Your messaging doesn't align with customer sentiment." (generic, no evidence)
- "There is a clear gap between review language and website copy." (obvious, could apply to anyone)

Provide 2 mirror line alternatives approaching the same gap from different angles. All three must pass the pub test.

DATA CONFIDENCE:
- High: 10+ reviews across 2+ platforms, comprehensive website data, consistent patterns.
- Medium: 5-10 reviews or single platform dominance, some data missing, patterns visible but not overwhelming.
- Low: Under 5 reviews, significant data gaps, patterns suggestive but not conclusive.

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "mirrorLine": "The primary mirror line. One or two sentences.",
  "mirrorLineAlternatives": ["Alternative angle 1", "Alternative angle 2"],
  "customerThemes": [
    {
      "theme": "theme name",
      "frequency": 0,
      "exampleQuotes": ["verbatim quote 1", "verbatim quote 2"],
      "platforms": ["G2", "Trustpilot"]
    }
  ],
  "companyThemes": [
    {
      "theme": "theme name",
      "frequency": 0,
      "locations": ["homepage hero", "features page"],
      "exactCopy": "the actual words from the website"
    }
  ],
  "gaps": [
    {
      "theme": "descriptive name for this gap",
      "companyMessage": "what the company says, with specific evidence",
      "customerPerception": "what customers say, with specific evidence",
      "severity": "critical",
      "gapType": "emotion_vs_feature",
      "evidence": {
        "companySource": "specific URL or page where this appears",
        "customerSource": "specific platform, author, or review reference"
      }
    }
  ],
  "practicalImplications": [
    "First implication grounded in specific evidence from the gaps above",
    "Second implication"
  ],
  "confidence": "high",
  "confidenceReason": "Explanation of data quality assessment"
}`;
}

function buildNoReviewFallback(
  companyName: string,
  pagesBlock: string,
  extrasBlock: string,
  input: AnalysisInput,
): string {
  // Check for HN discussions that can serve as proxy community perception
  const hnArticles = input.extras.newsArticles.filter(
    (a) => a.url.includes("news.ycombinator.com") || a.source === "news",
  );
  const hasHN = hnArticles.length > 0;

  const archiveSnapshots = input.extras.archiveSnapshots ?? [];
  const hasArchive = archiveSnapshots.length > 0;

  // Build the HN community perception section
  const hnSection = hasHN
    ? `\n=== COMMUNITY PERCEPTION (Hacker News) ===
Even without formal customer reviews, Hacker News discussions provide unfiltered community perception. HN commenters are typically developers, operators, and technical decision-makers — exactly the audience most B2B companies are trying to reach.

Analyse these discussions as you would customer reviews. Look for:
- How the community describes the product (vs how the company describes it)
- Praise, criticism, and indifference — all are signals
- Whether commenters understand what the product does
- Comparison language: "this is like X but for Y"
- Emotional reactions: excitement, scepticism, confusion

${hnArticles.map((a) => `--- HN DISCUSSION: ${a.url} ---\n${a.content.slice(0, 2000)}\n--- END HN ---`).join("\n\n")}`
    : "";

  // Build the Web Archive messaging evolution section
  const archiveSection = hasArchive
    ? `\n=== MESSAGING EVOLUTION (Web Archive) ===
These historical snapshots show how ${companyName}'s public messaging has changed over time. Analyse:
- Has the positioning changed significantly or stayed stagnant?
- Did they pivot from one audience to another?
- Has the language become more or less specific over time?
- Are they still using the same generic phrases from years ago?

${archiveSnapshots.map((s) => `  ${s.timestamp}: ${s.archiveUrl}`).join("\n")}`
    : "";

  // Determine confidence level based on available data
  const confidenceLevel = hasHN ? "medium" : "low";
  const confidenceExplanation = [
    "No customer reviews available.",
    hasHN ? `${hnArticles.length} Hacker News discussion(s) provide community perspective.` : null,
    hasArchive ? `${archiveSnapshots.length} Web Archive snapshot(s) show messaging history.` : null,
    `Analysis based on ${input.dataQuality.pageCount} website pages.`,
  ].filter(Boolean).join(" ");

  // Determine the "outside voice" framing based on available data
  const outsideVoiceLabel = hasHN
    ? "WHAT THE COMMUNITY SAYS"
    : "WHAT AN OUTSIDER SEES";
  const outsideVoiceInstructions = hasHN
    ? "Use Hacker News comments as a proxy for external perception. Quote specific comments. Note the tone — is the community excited, confused, or indifferent? Compare what HN commenters say the product does vs what the website says it does."
    : "What a cold visitor sees when they land on this website. No context, no warm intro. Assess clarity, specificity, and whether the value proposition is obvious within 5 seconds.";

  const dataCoverage = buildDataCoverageBlock(input);

  return `TASK: Outsider Clarity Analysis for ${companyName}

${dataCoverage}

No customer reviews were found for this company. ${hasHN ? "However, Hacker News discussions provide community perception data. Use these as a proxy for external voice." : "Instead of a narrative gap analysis, perform an outsider clarity analysis: assess how clear this company's messaging is to a cold visitor who knows nothing about them."}

REMINDER: Every quote you write MUST appear verbatim in the data below. Do not invent quotes. Do not paraphrase and present as a quote. If you cannot find an exact quote to support a point, describe the content without quoting.

You are a sharp, experienced operator visiting this website for the first time. You have no context. No warm intro. No idea what this company does. Assess what a stranger sees.

CRITICAL INSTRUCTIONS — BALANCED ASSESSMENT:
- Base your assessment on what the website content shows${hasHN ? " and how the community discusses this company" : ""}. Do not assume the company has a messaging problem just because you do not have customer data.
- If the homepage clearly states what the company does and for whom, say so and score it accordingly. Not all companies have unclear messaging.
- You are scoring messaging CLARITY, not marketing effectiveness. A clear message that explains what the company does earns high marks, even without customer validation.
- If the website clearly explains the product, its audience, and its value proposition, acknowledge that. Only flag vagueness where it actually exists.
- The absence of reviews is NOT evidence of a messaging problem. Many excellent companies lack public reviews.

DATA QUALITY: ${input.dataQuality.confidence} confidence. ${input.dataQuality.pageCount} pages scraped, 0 reviews found.${hasHN ? ` ${hnArticles.length} HN discussions found.` : ""}${hasArchive ? ` ${archiveSnapshots.length} archive snapshots found.` : ""}
${input.dataQuality.issues.length > 0 ? `Known issues: ${input.dataQuality.issues.join("; ")}` : ""}

=== WEBSITE PAGES ===
${pagesBlock}
${hnSection}${archiveSection}

${extrasBlock ? `=== ADDITIONAL DATA ===\n${extrasBlock}` : ""}

---

OUTSIDER CLARITY ASSESSMENT:

1. The 5-second test: Within 5 seconds of landing on the homepage, can a stranger answer: "What does this company do?" and "Why should I care?" Quote the exact hero headline and assess. If it passes, say so clearly.

2. The doorman test: Could you explain what this company does to someone outside the industry? Take the homepage copy and assess whether a non-expert would understand the value.

3. Category clarity: What category does this company place itself in? Is it clear, or could this be any of 10 different things?

4. Differentiation: If you covered the company name, could this be any competitor's website? What, if anything, is specific to THIS company?

5. CTA clarity: Does the visitor know what to do next? Is the next step obvious and compelling?

6. Jargon density: How much industry jargon appears without explanation? Count specific instances. If jargon is minimal, note that as a strength.

7. Claim vs proof: How many claims are made vs how many are supported with evidence (numbers, names, case studies)?
${hasHN ? `
8. Community perception: How does the Hacker News community describe this product? Does the community's description match what the website says? Are HN commenters confused, excited, or indifferent?
` : ""}${hasArchive ? `
${hasHN ? "9" : "8"}. Messaging evolution: How has the homepage messaging changed over time? Is the company iterating on its positioning or stuck with the same generic copy from years ago?
` : ""}

THE MIRROR LINE (no-review version):
Since there are no formal reviews, the mirror line should capture ${hasHN ? "the gap between how the company describes itself and how the community discusses it" : "what an outsider sees"}. This can be POSITIVE or NEGATIVE depending on the actual website clarity. Do not force a negative finding.

Good mirror line examples (note: these can be positive OR negative):
- NEGATIVE: "A stranger lands on your homepage and cannot tell what you do for thirty seconds. That is thirty seconds you do not have."
- NEGATIVE: "Your homepage uses 47 words before saying what the product does. By word 10, the visitor is gone."
${hasHN ? '- HN-INFORMED: "Hacker News commenters describe you as \'X\'. Your homepage describes you as \'Y\'. The community gets it. Your website does not."\n- HN-INFORMED: "An HN thread about your product generated 200 comments about Z. Your homepage never mentions Z."' : '- POSITIVE: "Your homepage tells a stranger exactly what you do in one sentence. The gap is not clarity — it is proof. No case studies, no numbers, no named customers."'}
- POSITIVE: "An outsider knows what you do within five seconds. What they cannot tell is why you are different from the dozen competitors who say the same thing."

The mirror line must be specific to THIS company. It must be honest — do not manufacture problems that do not exist.

Provide 2 alternatives.

COMPANY THEMES:
Analyse the website copy as in the standard analysis. Look for hero headlines, feature vs benefit language, category claims, adjective patterns, CTA language.

${outsideVoiceLabel}:
${outsideVoiceInstructions}

GAPS (${hasHN ? "community-informed" : "no-review"} version):
${hasHN ? "With HN discussions available, you can identify gaps between company messaging and community perception. Look for:" : "Without reviews, gaps become clarity gaps. Only report gaps where genuine problems exist. Assess:"}
- clarity_gap: Where the messaging fails to communicate clearly to an outsider. If the messaging IS clear, do not fabricate this gap.
- specificity_gap: Where claims are generic and could apply to any company.
- proof_gap: Where claims are made without supporting evidence.
- jargon_gap: Where industry terminology excludes non-expert visitors.
- action_gap: Where the visitor does not know what to do next.
${hasHN ? `- community_gap: Where the community describes the product differently than the website does.
- perception_gap: Where the community values something the website does not emphasise.` : ""}

Each gap must cite the specific page and specific copy that demonstrates the problem. Do NOT report a gap unless you can cite specific evidence. It is acceptable to report fewer gaps if the website is genuinely clear.

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "mirrorLine": "The primary mirror line about outsider clarity.",
  "mirrorLineAlternatives": ["Alternative angle 1", "Alternative angle 2"],
  "customerThemes": [${hasHN ? `
    {
      "theme": "theme from HN discussions",
      "frequency": 0,
      "exampleQuotes": ["verbatim HN comment"],
      "platforms": ["Hacker News"]
    }` : ""}
  ],
  "companyThemes": [
    {
      "theme": "theme name",
      "frequency": 0,
      "locations": ["homepage hero", "features page"],
      "exactCopy": "the actual words from the website"
    }
  ],
  "gaps": [
    {
      "theme": "descriptive name for this ${hasHN ? "perception" : "clarity"} gap",
      "companyMessage": "what the company says, with specific copy quoted",
      "customerPerception": "what ${hasHN ? "HN commenters say or " : ""}an outsider would actually understand or feel",
      "severity": "critical",
      "gapType": "${hasHN ? "community_gap" : "clarity_gap"}",
      "evidence": {
        "companySource": "specific URL where this appears",
        "customerSource": "${hasHN ? "HN discussion URL" : "outsider clarity assessment"}"
      }
    }
  ],
  "practicalImplications": [
    "First implication with specific evidence",
    "Second implication"
  ],
  "confidence": "${confidenceLevel}",
  "confidenceReason": "${confidenceExplanation}"
}`;
}
