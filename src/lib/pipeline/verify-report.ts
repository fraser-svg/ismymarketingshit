import type {
  CompiledReport,
  AnalysisInput,
  ReportVerification,
  QuoteVerification,
} from "../types";
import { detectSlop } from "../prompts/slop-patterns";

/**
 * Pipeline Step 7a: Report Verification (anti-hallucination gate).
 *
 * Verifies the compiled report against source data:
 * - Quote check: every quoted string must exist in the scraped data
 * - Proximity check: words must appear close together in a single source
 * - Factual claim check: "Your homepage says X" verified against actual pages
 * - Source check: every cited URL should be in the source records
 * - Specificity check: company name should appear in 60%+ of findings
 * - Slop detection: check for prohibited phrases
 * - Hallucination patterns: fabricated statistics, uncited platforms, etc.
 *
 * Returns { valid, issues, hallucinatedQuotes } where issues contains all
 * flagged problems and hallucinatedQuotes lists quotes to strip.
 */
export function verifyReport(
  report: CompiledReport,
  input: AnalysisInput,
): ReportVerification {
  const issues: string[] = [];
  const quoteVerifications: QuoteVerification[] = [];
  const hallucinatedQuotes: string[] = [];

  // Build individual source texts with labels for tracking
  const labeledSources = collectLabeledSources(input);

  // Build set of all known source URLs
  const knownUrls = new Set<string>();
  for (const page of input.pages) {
    knownUrls.add(normaliseUrl(page.url));
  }
  for (const review of input.reviews) {
    knownUrls.add(normaliseUrl(review.url));
  }
  for (const article of input.extras.newsArticles) {
    knownUrls.add(normaliseUrl(article.url));
  }

  // Known review platforms from the data (use platform field, fall back to selector)
  const knownPlatforms = new Set<string>();
  for (const review of input.reviews) {
    const platform = review.platform || review.selector || "";
    if (platform) knownPlatforms.add(platform.toLowerCase());
  }

  const companyName = (input.company.name ?? input.company.domain).toLowerCase();
  const domain = input.company.domain.toLowerCase();

  // Gather all report text (including mirrorLine)
  const allText = gatherReportText(report);

  // 1. Quote check: verify every quoted string exists in scraped data
  const quotes = extractQuotes(allText);

  for (const quote of quotes) {
    // Skip quotes shorter than 5 chars
    if (quote.length < 5) continue;

    const verification = verifyQuote(quote, labeledSources);
    quoteVerifications.push(verification);

    if (!verification.found) {
      hallucinatedQuotes.push(quote);
      issues.push(
        `HALLUCINATED QUOTE: "${quote.slice(0, 100)}${quote.length > 100 ? "..." : ""}" does not appear in any scraped source. This is fabricated content.`,
      );
    }
  }

  // If any quotes are hallucinated, the report fails
  if (hallucinatedQuotes.length > 0) {
    issues.push(
      `CRITICAL: ${hallucinatedQuotes.length} hallucinated quote(s) detected. Report must be corrected.`,
    );
  }

  // 2. Factual claim check: verify "Your homepage says X" style claims
  const factualClaims = extractFactualClaims(allText);
  for (const claim of factualClaims) {
    const verified = verifyFactualClaim(claim, input);
    if (!verified) {
      issues.push(
        `UNVERIFIED CLAIM: "${claim.claim.slice(0, 100)}" references ${claim.pageRef} but content not found in source data.`,
      );
    }
  }

  // 3. Source check: verify cited URLs exist in our source records
  const citedUrls = extractUrls(allText);
  for (const url of citedUrls) {
    const normalised = normaliseUrl(url);
    if (!knownUrls.has(normalised)) {
      const isPartialMatch = [...knownUrls].some(
        (known) => known.includes(normalised) || normalised.includes(known),
      );
      if (!isPartialMatch) {
        issues.push(
          `SOURCE NOT FOUND: URL "${url}" is cited but was not in our scraped data.`,
        );
      }
    }
  }

  // 4. Specificity check: company name or domain should appear in 60%+ of sections
  let specificSections = 0;
  const totalSections = report.sections.length;
  for (const section of report.sections) {
    const contentLower = section.content.toLowerCase();
    if (
      contentLower.includes(companyName) ||
      contentLower.includes(domain)
    ) {
      specificSections++;
    }
  }
  if (totalSections > 0) {
    const specificityRatio = specificSections / totalSections;
    if (specificityRatio < 0.6) {
      issues.push(
        `SPECIFICITY: Only ${Math.round(specificityRatio * 100)}% of sections reference the company by name. Report may be too generic. Target is 60%+.`,
      );
    }
  }

  // 5. Hallucination patterns
  checkHallucinationPatterns(allText, knownPlatforms, input, issues);

  // 6. Slop detection
  const slopResult = detectSlop(allText);
  if (slopResult.found) {
    const slopCount = slopResult.issues.length;
    if (slopCount > 0) {
      issues.push(
        `SLOP: ${slopCount} prohibited patterns found. Too many for acceptable quality. Categories: ${[...new Set(slopResult.issues.map((i) => i.category))].join(", ")}.`,
      );
    }
    for (const issue of slopResult.issues) {
      if (issue.category === "em_dash") {
        issues.push(`EM DASH found: "${issue.context.trim()}"`);
      }
      if (issue.category === "buzzword") {
        issues.push(`BUZZWORD "${issue.pattern}" found: "${issue.context.trim()}"`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    shouldRerun: hallucinatedQuotes.length > 2,
    quoteVerifications,
    hallucinatedQuotes,
  };
}

/**
 * Strips hallucinated content from the report.
 *
 * Takes the report and verification result. Any sentence containing a
 * hallucinated quote is replaced with a placeholder. This is the nuclear
 * option: if we can't verify it, it doesn't ship.
 */
export function stripHallucinatedContent(
  report: CompiledReport,
  verification: ReportVerification,
): CompiledReport {
  const badQuotes = verification.hallucinatedQuotes ?? [];
  if (badQuotes.length === 0) return report;

  const REPLACEMENT = "[Content removed: could not verify against source data]";

  function stripFromText(text: string): string {
    let result = text;
    for (const quote of badQuotes) {
      // Find sentences containing this quote and replace them
      // Split into sentences, check each one
      const sentences = result.split(/(?<=[.!?])\s+/);
      const cleaned = sentences.map((sentence) => {
        const sentenceLower = sentence.toLowerCase();
        const quoteLower = quote.toLowerCase();
        if (sentenceLower.includes(quoteLower)) {
          return REPLACEMENT;
        }
        return sentence;
      });
      result = cleaned.join(" ");
    }
    // Collapse consecutive replacement markers
    const replacementEscaped = REPLACEMENT.replace(/[[\]]/g, "\\$&");
    const collapseRegex = new RegExp(
      `(${replacementEscaped}\\s*)+`,
      "g",
    );
    result = result.replace(collapseRegex, REPLACEMENT + " ");
    return result.trim();
  }

  return {
    ...report,
    mirrorLine: stripFromText(report.mirrorLine),
    sections: report.sections.map((section) => ({
      ...section,
      content: stripFromText(section.content),
      citations: section.citations.map((c) => stripFromText(c)).filter((c) => c !== REPLACEMENT),
    })),
    narrativeGap: {
      ...report.narrativeGap,
      gaps: report.narrativeGap.gaps.map((gap) => ({
        ...gap,
        companyMessage: stripFromText(gap.companyMessage),
        customerPerception: stripFromText(gap.customerPerception),
        evidence: {
          companySource: stripFromText(gap.evidence.companySource),
          customerSource: stripFromText(gap.evidence.customerSource),
        },
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface LabeledSource {
  label: string;
  content: string;
  contentLower: string;
  contentNormalized: string;
  contentStripped: string;
}

/**
 * Collect all individual source texts with labels for tracking which source
 * a quote was found in.
 */
function collectLabeledSources(input: AnalysisInput): LabeledSource[] {
  const sources: LabeledSource[] = [];

  for (const page of input.pages) {
    const content = page.content;
    sources.push({
      label: `page:${page.url}`,
      content,
      contentLower: content.toLowerCase(),
      contentNormalized: normalizeWhitespace(content.toLowerCase()),
      contentStripped: stripPunctuation(normalizeWhitespace(content.toLowerCase())),
    });
  }

  for (const review of input.reviews) {
    const content = review.content;
    sources.push({
      label: `review:${review.source}`,
      content,
      contentLower: content.toLowerCase(),
      contentNormalized: normalizeWhitespace(content.toLowerCase()),
      contentStripped: stripPunctuation(normalizeWhitespace(content.toLowerCase())),
    });
  }

  for (const article of input.extras.newsArticles) {
    const content = article.content;
    sources.push({
      label: `news:${article.url}`,
      content,
      contentLower: content.toLowerCase(),
      contentNormalized: normalizeWhitespace(content.toLowerCase()),
      contentStripped: stripPunctuation(normalizeWhitespace(content.toLowerCase())),
    });
  }

  return sources;
}

/**
 * Verify a single quote against all sources using a tiered strategy:
 * 1. Exact substring match (case-insensitive, whitespace-normalized)
 * 2. Proximity check: 80%+ of words appear IN SEQUENCE within 200 chars
 */
function verifyQuote(
  quote: string,
  sources: LabeledSource[],
): QuoteVerification {
  const quoteLower = quote.toLowerCase();
  const quoteNormalized = normalizeWhitespace(quoteLower);
  const quoteStripped = stripPunctuation(quoteNormalized);

  // Strategy 1: Exact substring match (whitespace-normalized)
  for (const source of sources) {
    if (source.contentNormalized.includes(quoteNormalized)) {
      return { quote, found: true, source: source.label, matchType: "exact" };
    }
    // Also try with punctuation stripped (handles curly quotes, HTML entities)
    if (source.contentStripped.includes(quoteStripped)) {
      return { quote, found: true, source: source.label, matchType: "exact" };
    }
  }

  // Strategy 2: Proximity check - 80%+ of words in sequence within 200-char window
  const words = quoteNormalized.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) {
    return { quote, found: true, matchType: "exact" }; // trivial, let it pass
  }

  for (const source of sources) {
    if (checkWordProximity(words, source.contentLower, 200, 0.8)) {
      return { quote, found: true, source: source.label, matchType: "proximity" };
    }
  }

  return { quote, found: false, matchType: "not_found" };
}

/**
 * Check if a threshold percentage of words from the quote appear within
 * a sliding window of `windowSize` characters in the source text.
 *
 * This ensures words are close together in the same source, not scattered
 * across different parts of the document.
 */
function checkWordProximity(
  words: string[],
  sourceText: string,
  windowSize: number,
  threshold: number,
): boolean {
  if (words.length === 0) return true;

  const requiredMatches = Math.ceil(words.length * threshold);

  // Find all positions of the first word to anchor our search
  const anchorWord = words[0];
  let searchStart = 0;

  while (searchStart < sourceText.length) {
    const anchorPos = sourceText.indexOf(anchorWord, searchStart);
    if (anchorPos === -1) break;

    // Extract window around anchor position
    const windowStart = Math.max(0, anchorPos - 20);
    const windowEnd = Math.min(sourceText.length, anchorPos + windowSize);
    const window = sourceText.slice(windowStart, windowEnd);

    // Count how many words from the quote appear in this window
    let matchCount = 0;
    for (const word of words) {
      if (window.includes(word)) {
        matchCount++;
      }
    }

    if (matchCount >= requiredMatches) {
      return true;
    }

    searchStart = anchorPos + 1;
  }

  // Also try anchoring on other words in case the first word is common
  // or not present in the source
  for (let i = 1; i < Math.min(words.length, 5); i++) {
    const anchor = words[i];
    searchStart = 0;

    while (searchStart < sourceText.length) {
      const pos = sourceText.indexOf(anchor, searchStart);
      if (pos === -1) break;

      const windowStart = Math.max(0, pos - windowSize / 2);
      const windowEnd = Math.min(sourceText.length, pos + windowSize / 2);
      const window = sourceText.slice(windowStart, windowEnd);

      let matchCount = 0;
      for (const word of words) {
        if (window.includes(word)) {
          matchCount++;
        }
      }

      if (matchCount >= requiredMatches) {
        return true;
      }

      searchStart = pos + 1;
    }
  }

  return false;
}

/** Factual claim extracted from the report. */
interface FactualClaim {
  claim: string;
  pageRef: string; // e.g. "homepage", "/packages", "/about"
}

/**
 * Extract factual claims like "Your homepage says X" or "On /packages you list Y".
 */
function extractFactualClaims(text: string): FactualClaim[] {
  const claims: FactualClaim[] = [];

  // Pattern: "Your <page> says/mentions/states/lists/shows X"
  const yourPagePatterns = [
    /your\s+(homepage|home\s+page|about\s+page|pricing\s+page|landing\s+page)\s+(?:says|mentions|states|lists|shows|reads|claims)\s+[""]?([^."\n"]+)/gi,
    /on\s+(?:your\s+)?(?:the\s+)?(\/\w[\w/-]*|homepage|about|pricing|packages)\s+(?:page\s+)?(?:you|it|the\s+site)\s+(?:say|mention|state|list|show|read|claim|write)s?\s+[""]?([^."\n"]+)/gi,
  ];

  for (const pattern of yourPagePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      claims.push({
        claim: match[2].trim(),
        pageRef: match[1].toLowerCase(),
      });
    }
  }

  return claims;
}

/**
 * Verify a factual claim against the source data.
 */
function verifyFactualClaim(claim: FactualClaim, input: AnalysisInput): boolean {
  // Resolve page reference to actual content
  const pageRef = claim.pageRef;
  const relevantPages = input.pages.filter((p) => {
    const urlLower = p.url.toLowerCase();
    const selectorLower = (p.selector ?? "").toLowerCase();
    if (pageRef === "homepage" || pageRef === "home page") {
      return selectorLower === "homepage" || urlLower.endsWith("/") || urlLower.match(/\.\w+\/?$/);
    }
    return urlLower.includes(pageRef) || selectorLower.includes(pageRef);
  });

  // If we can't find the referenced page at all, that's suspect
  if (relevantPages.length === 0) {
    // Check all pages as fallback
    for (const page of input.pages) {
      const pageLower = page.content.toLowerCase();
      const claimLower = normalizeWhitespace(claim.claim.toLowerCase());
      if (pageLower.includes(claimLower)) return true;
      // Check key words
      const words = claimLower.split(/\s+/).filter((w) => w.length > 3);
      if (words.length > 0) {
        const matched = words.filter((w) => pageLower.includes(w)).length;
        if (matched / words.length >= 0.8) return true;
      }
    }
    return false;
  }

  // Check if the claim content appears in the referenced page
  for (const page of relevantPages) {
    const pageLower = page.content.toLowerCase();
    const claimLower = normalizeWhitespace(claim.claim.toLowerCase());
    if (pageLower.includes(claimLower)) return true;

    // Fuzzy: 80% of significant words present
    const words = claimLower.split(/\s+/).filter((w) => w.length > 3);
    if (words.length > 0) {
      const matched = words.filter((w) => pageLower.includes(w)).length;
      if (matched / words.length >= 0.8) return true;
    }
  }

  return false;
}

/**
 * Gathers all text from the report for analysis, including mirrorLine.
 */
function gatherReportText(report: CompiledReport): string {
  const parts = [report.mirrorLine];
  for (const section of report.sections) {
    parts.push(section.content);
    // Also verify citation text — fabricated citations are user-visible
    if (section.citations.length > 0) {
      parts.push(section.citations.join(" "));
    }
  }
  // Verify narrative gap evidence — these render in GapCard components
  if (report.narrativeGap) {
    for (const gap of report.narrativeGap.gaps) {
      parts.push(gap.companyMessage);
      parts.push(gap.customerPerception);
      parts.push(gap.evidence.companySource);
      parts.push(gap.evidence.customerSource);
    }
  }
  return parts.join("\n");
}

/**
 * Extracts ALL quoted strings from text.
 *
 * Matches:
 * - Double curly quotes: \u201c...\u201d
 * - Straight double quotes: "..."
 * - Single curly quotes: \u2018...\u2019
 * - Straight single quotes: '...' (longer strings only, 15+ chars)
 * - Backtick quotes: `...`
 * - Guillemets: \u00ab...\u00bb
 * - Attribution patterns: says: "...", writes: "...", etc.
 *
 * Minimum length: 5 characters.
 */
function extractQuotes(text: string): string[] {
  const quotes: string[] = [];
  const seen = new Set<string>();

  function addQuote(q: string | undefined) {
    if (!q || q.length < 5) return;
    const trimmed = q.trim();
    if (trimmed.length < 5) return;
    // Deduplicate
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    quotes.push(trimmed);
  }

  // Curly double quotes
  for (const m of text.matchAll(/\u201c([^\u201d]+)\u201d/g)) {
    addQuote(m[1]);
  }

  // Straight double quotes (min 5 chars)
  for (const m of text.matchAll(/"([^"]{5,})"/g)) {
    addQuote(m[1]);
  }

  // Curly single quotes
  for (const m of text.matchAll(/\u2018([^\u2019]+)\u2019/g)) {
    addQuote(m[1]);
  }

  // Straight single quotes (15+ chars to avoid contractions)
  for (const m of text.matchAll(/'([^']{15,})'/g)) {
    addQuote(m[1]);
  }

  // Backtick quotes
  for (const m of text.matchAll(/`([^`]{5,})`/g)) {
    addQuote(m[1]);
  }

  // Guillemets
  for (const m of text.matchAll(/\u00ab([^\u00bb]+)\u00bb/g)) {
    addQuote(m[1]);
  }

  // Attribution patterns: says: "text", writes: "text", etc.
  for (const m of text.matchAll(
    /(?:says|writes|states|mentions|notes|explains|adds|observes|comments|argues)[:\s]+[""\u201c]([^""\u201d]+)[""\u201d]/gi,
  )) {
    addQuote(m[1]);
  }

  // HTML entity quotes: &ldquo;...&rdquo; and &quot;...&quot;
  for (const m of text.matchAll(/&(?:ldquo|quot);([^&]{5,})&(?:rdquo|quot);/g)) {
    addQuote(m[1]);
  }

  return quotes;
}

/**
 * Extracts URLs from text.
 */
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>)\]]+/g;
  const matches = text.match(urlRegex);
  return matches ?? [];
}

/**
 * Normalises a URL for comparison (strip trailing slash, lowercase, strip www).
 */
function normaliseUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\/www\./, "https://")
    .replace(/^http:\/\//, "https://");
}

/** Collapse all whitespace to single spaces. */
function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Strip all non-word, non-space characters. */
function stripPunctuation(s: string): string {
  return s.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Checks for common hallucination patterns.
 */
function checkHallucinationPatterns(
  text: string,
  knownPlatforms: Set<string>,
  input: AnalysisInput,
  issues: string[],
): void {
  // Build corpus once for this function
  const corpusParts: string[] = [];
  for (const page of input.pages) corpusParts.push(page.content);
  for (const review of input.reviews) corpusParts.push(review.content);
  for (const article of input.extras.newsArticles) corpusParts.push(article.content);
  const corpus = corpusParts.join("\n");

  // Fabricated statistics: percentages not traceable to data
  const percentRegex = /(\d{1,3})%\s+of\s+(your|their|the|all)/gi;
  let match: RegExpExecArray | null;
  while ((match = percentRegex.exec(text)) !== null) {
    if (!corpus.includes(match[0])) {
      issues.push(
        `POSSIBLE FABRICATION: "${match[0]}" is a statistic not found in source data. Verify this is calculated from real data, not invented.`,
      );
    }
  }

  // Review platforms not in our data
  // Build platform list dynamically from actual scraped data + common platforms
  const commonPlatforms = [
    "g2", "trustpilot", "capterra", "glassdoor", "reddit", "yelp",
    "google reviews", "app store", "play store", "facebook", "twitter",
    "linkedin", "product hunt", "slack", "discord", "appfigures",
    "google play", "hacker news",
  ];
  const platformMentions = [
    ...new Set([...commonPlatforms, ...knownPlatforms]),
  ];
  const textLower = text.toLowerCase();
  for (const platform of platformMentions) {
    if (
      textLower.includes(platform) &&
      !knownPlatforms.has(platform) &&
      !knownPlatforms.has(platform.replace(/\s+/g, ""))
    ) {
      const idx = textLower.indexOf(platform);
      const context = textLower.slice(Math.max(0, idx - 50), idx + platform.length + 50);
      const absenceIndicators = [
        "no listing",
        "not found",
        "no reviews",
        "zero reviews",
        "no presence",
        "could not find",
      ];
      const isAbsenceMention = absenceIndicators.some((a) =>
        context.includes(a),
      );
      if (!isAbsenceMention) {
        issues.push(
          `UNCITED PLATFORM: "${platform}" is referenced but we did not scrape this platform. This may be fabricated.`,
        );
      }
    }
  }

  // Employee names: proper names as employee references
  const employeePatterns = [
    /(?:CEO|CTO|CFO|COO|founder|co-founder|VP|director)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:CEO|CTO|CFO|COO|founder|co-founder|VP|director)/g,
  ];
  for (const pattern of employeePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (!corpus.includes(name)) {
        issues.push(
          `POSSIBLE FABRICATION: Employee name "${name}" not found in source data.`,
        );
      }
    }
  }
}
