import type {
  CompiledReport,
  AnalysisInput,
  ReportVerification,
} from "../types";
import { detectSlop } from "../prompts/slop-patterns";

/**
 * Pipeline Step 7a: Report Verification (anti-hallucination gate).
 *
 * Verifies the compiled report against source data:
 * - Quote check: every quoted string should exist in the scraped data
 * - Source check: every cited URL should be in the source records
 * - Specificity check: company name should appear in 60%+ of findings
 * - Slop detection: check for prohibited phrases
 * - Hallucination patterns: fabricated statistics, uncited platforms, etc.
 *
 * Returns { valid, issues } where issues contains all flagged problems.
 */
export function verifyReport(
  report: CompiledReport,
  input: AnalysisInput,
): ReportVerification {
  const issues: string[] = [];

  // Build corpus of all scraped text for quote verification
  const corpus = buildCorpus(input);
  const corpusLower = corpus.toLowerCase();

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

  // Known review platforms from the data
  const knownPlatforms = new Set<string>();
  for (const review of input.reviews) {
    knownPlatforms.add(review.source.toLowerCase());
  }

  const companyName = (input.company.name ?? input.company.domain).toLowerCase();
  const domain = input.company.domain.toLowerCase();

  // Gather all report text
  const allText = gatherReportText(report);

  // 1. Quote check: verify quoted strings exist in scraped data
  //    This is the primary anti-hallucination gate. Every quoted string in the
  //    report must be traceable to at least one scraped page, review, or article.
  const quotes = extractQuotes(allText);
  let hallucinatedQuoteCount = 0;

  for (const quote of quotes) {
    // Skip very short quotes (under 10 chars) as they are likely fragments
    if (quote.length < 10) continue;

    const quoteLower = quote.toLowerCase().trim();

    // Strategy 1: Exact substring match across all source pages
    const exactMatch = corpusLower.includes(quoteLower);

    if (!exactMatch) {
      // Strategy 2: Try matching against each individual page/review/article
      //             using a sliding window approach for fuzzy substring matching
      const foundInSource = findQuoteInSources(quoteLower, input);

      if (!foundInSource) {
        // Strategy 3: Check if 90%+ of significant words appear in a single
        //             source page (not spread across pages, which would be a
        //             Frankenstein quote)
        const frankensteinCheck = checkFrankensteinQuote(quoteLower, input);

        if (!frankensteinCheck) {
          hallucinatedQuoteCount++;
          issues.push(
            `HALLUCINATED QUOTE: "${quote.slice(0, 100)}${quote.length > 100 ? "..." : ""}" does not appear in any scraped source. This is fabricated content.`,
          );
        }
      }
    }
  }

  // If more than 2 quotes are hallucinated, the report is fundamentally unreliable
  if (hallucinatedQuoteCount > 2) {
    issues.push(
      `CRITICAL: ${hallucinatedQuoteCount} hallucinated quotes detected. Report is unreliable and must be regenerated.`,
    );
  }

  // 2. Source check: verify cited URLs exist in our source records
  const citedUrls = extractUrls(allText);
  for (const url of citedUrls) {
    const normalised = normaliseUrl(url);
    if (!knownUrls.has(normalised)) {
      // Check if it is a partial match (e.g., /about vs full URL)
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

  // 3. Specificity check: company name or domain should appear in 60%+ of sections
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

  // 4. Hallucination patterns
  checkHallucinationPatterns(allText, knownPlatforms, input, issues);

  // 5. Slop detection
  const slopResult = detectSlop(allText);
  if (slopResult.found) {
    const slopCount = slopResult.issues.length;
    if (slopCount > 5) {
      issues.push(
        `SLOP: ${slopCount} prohibited patterns found. Too many for acceptable quality. Categories: ${[...new Set(slopResult.issues.map((i) => i.category))].join(", ")}.`,
      );
    }
    // Add individual slop issues for em dashes and buzzwords (zero tolerance)
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
    shouldRerun: hallucinatedQuoteCount > 2,
  };
}

/**
 * Concatenates all scraped content into a single searchable corpus.
 */
function buildCorpus(input: AnalysisInput): string {
  const parts: string[] = [];
  for (const page of input.pages) {
    parts.push(page.content);
  }
  for (const review of input.reviews) {
    parts.push(review.content);
  }
  for (const article of input.extras.newsArticles) {
    parts.push(article.content);
  }
  return parts.join("\n");
}

/**
 * Collect all individual source texts (pages, reviews, articles) as separate entries.
 */
function collectSourceTexts(input: AnalysisInput): string[] {
  const sources: string[] = [];
  for (const page of input.pages) {
    sources.push(page.content);
  }
  for (const review of input.reviews) {
    sources.push(review.content);
  }
  for (const article of input.extras.newsArticles) {
    sources.push(article.content);
  }
  return sources;
}

/**
 * Search for a quote across individual source pages/reviews/articles.
 *
 * Uses fuzzy substring matching: normalises whitespace and allows for minor
 * punctuation differences between the quote and the source text.
 */
function findQuoteInSources(quoteLower: string, input: AnalysisInput): boolean {
  const sources = collectSourceTexts(input);
  // Normalise the quote: collapse whitespace, strip edge punctuation
  const normalisedQuote = quoteLower.replace(/\s+/g, " ").trim();

  for (const source of sources) {
    const normalisedSource = source.toLowerCase().replace(/\s+/g, " ");

    // Direct substring match after normalisation
    if (normalisedSource.includes(normalisedQuote)) {
      return true;
    }

    // Try matching with punctuation stripped (handles curly quotes, apostrophes, etc.)
    const stripPunct = (s: string) => s.replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
    if (stripPunct(normalisedSource).includes(stripPunct(normalisedQuote))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if 90%+ of a quote's significant words appear in a SINGLE source.
 *
 * This catches quotes that are close paraphrases of actual content in one source,
 * while rejecting "Frankenstein quotes" stitched together from multiple sources.
 */
function checkFrankensteinQuote(quoteLower: string, input: AnalysisInput): boolean {
  const words = quoteLower.split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return true; // trivial quote, let it pass

  const sources = collectSourceTexts(input);

  for (const source of sources) {
    const sourceLower = source.toLowerCase();
    const matchCount = words.filter((w) => sourceLower.includes(w)).length;
    const matchRatio = matchCount / words.length;

    // 90% of significant words must appear in a single source
    if (matchRatio >= 0.9) {
      return true;
    }
  }

  return false;
}

/**
 * Gathers all text from the report for analysis.
 */
function gatherReportText(report: CompiledReport): string {
  const parts = [report.mirrorLine];
  for (const section of report.sections) {
    parts.push(section.content);
  }
  return parts.join("\n");
}

/**
 * Extracts quoted strings from text (both single and double quotes).
 */
function extractQuotes(text: string): string[] {
  const quotes: string[] = [];

  // Double quotes
  const doubleQuoteRegex = /\u201c([^\u201d]+)\u201d|"([^"]{10,})"/g;
  let match: RegExpExecArray | null;
  while ((match = doubleQuoteRegex.exec(text)) !== null) {
    quotes.push(match[1] ?? match[2]);
  }

  // Single quotes used for quoting (longer strings only)
  const singleQuoteRegex = /\u2018([^\u2019]+)\u2019|'([^']{15,})'/g;
  while ((match = singleQuoteRegex.exec(text)) !== null) {
    quotes.push(match[1] ?? match[2]);
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

/**
 * Checks for common hallucination patterns.
 */
function checkHallucinationPatterns(
  text: string,
  knownPlatforms: Set<string>,
  input: AnalysisInput,
  issues: string[],
): void {
  // Fabricated statistics: percentages not traceable to data
  const percentRegex = /(\d{1,3})%\s+of\s+(your|their|the|all)/gi;
  let match: RegExpExecArray | null;
  while ((match = percentRegex.exec(text)) !== null) {
    // Check if this percentage appears in the source data
    const corpus = buildCorpus(input);
    if (!corpus.includes(match[0])) {
      issues.push(
        `POSSIBLE FABRICATION: "${match[0]}" is a statistic not found in source data. Verify this is calculated from real data, not invented.`,
      );
    }
  }

  // Review platforms not in our data
  const platformMentions = [
    "g2",
    "trustpilot",
    "capterra",
    "glassdoor",
    "reddit",
    "yelp",
    "google reviews",
    "app store",
    "play store",
  ];
  const textLower = text.toLowerCase();
  for (const platform of platformMentions) {
    if (
      textLower.includes(platform) &&
      !knownPlatforms.has(platform) &&
      !knownPlatforms.has(platform.replace(/\s+/g, ""))
    ) {
      // Check if the mention is about absence (which is fine)
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

  // Employee names: we do not scrape employee data, so any proper name
  // appearing as an employee reference is suspect. This is a heuristic check.
  const employeePatterns = [
    /(?:CEO|CTO|CFO|COO|founder|co-founder|VP|director)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:CEO|CTO|CFO|COO|founder|co-founder|VP|director)/g,
  ];
  for (const pattern of employeePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      const corpus = buildCorpus(input);
      if (!corpus.includes(name)) {
        issues.push(
          `POSSIBLE FABRICATION: Employee name "${name}" not found in source data.`,
        );
      }
    }
  }
}
