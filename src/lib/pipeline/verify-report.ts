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
  const quotes = extractQuotes(allText);
  for (const quote of quotes) {
    // Skip very short quotes (under 10 chars) as they are likely fragments
    if (quote.length < 10) continue;

    const quoteLower = quote.toLowerCase();
    if (!corpusLower.includes(quoteLower)) {
      // Try a fuzzy match: check if 80%+ of words appear
      const words = quoteLower.split(/\s+/).filter((w) => w.length > 3);
      const matchCount = words.filter((w) => corpusLower.includes(w)).length;
      const matchRatio = words.length > 0 ? matchCount / words.length : 0;

      if (matchRatio < 0.8) {
        issues.push(
          `QUOTE NOT FOUND: "${quote.slice(0, 80)}${quote.length > 80 ? "..." : ""}" does not appear in scraped data. This may be fabricated.`,
        );
      }
    }
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
