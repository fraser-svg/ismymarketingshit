import type { NarrativeGapResult, AnalysisInput } from "@/lib/types";

/** Escape special regex characters in a string. */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extract quoted strings from text (straight and curly quotes). */
export function extractInlineQuotes(text: string): string[] {
  const quotes: string[] = [];
  // Curly double quotes
  for (const m of text.matchAll(/\u201c([^\u201d]+)\u201d/g)) {
    if (m[1] && m[1].length >= 5) quotes.push(m[1]);
  }
  // Straight double quotes
  for (const m of text.matchAll(/"([^"]{5,})"/g)) {
    if (m[1]) quotes.push(m[1]);
  }
  // Single curly quotes
  for (const m of text.matchAll(/\u2018([^\u2019]+)\u2019/g)) {
    if (m[1] && m[1].length >= 5) quotes.push(m[1]);
  }
  return quotes;
}

/**
 * Verify narrative gap evidence against source data.
 * Strips gap quotes that cannot be found in the source corpus.
 */
export function verifyNarrativeGapEvidence(
  narrativeGap: NarrativeGapResult,
  input: AnalysisInput,
): NarrativeGapResult {
  const corpus = [
    ...input.pages.map((p) => p.content.toLowerCase()),
    ...input.reviews.map((r) => r.content.toLowerCase()),
    ...input.extras.newsArticles.map((a) => a.content.toLowerCase()),
  ].join("\n");

  const verifiedGaps = narrativeGap.gaps.map((gap) => {
    // Check if companyMessage quotes exist in source
    const companyQuotes = extractInlineQuotes(gap.companyMessage);
    const customerQuotes = extractInlineQuotes(gap.customerPerception);

    let cleanCompanyMessage = gap.companyMessage;
    let cleanCustomerPerception = gap.customerPerception;

    for (const quote of companyQuotes) {
      if (quote.length >= 10 && !corpus.includes(quote.toLowerCase())) {
        console.warn(`[verify-narrative-gap] Unverified company quote: "${quote.slice(0, 60)}..."`);
        cleanCompanyMessage = cleanCompanyMessage.replace(
          new RegExp(`["\u201c]${escapeRegex(quote)}["\u201d]`, "g"),
          "[unverified]",
        );
      }
    }

    for (const quote of customerQuotes) {
      if (quote.length >= 10 && !corpus.includes(quote.toLowerCase())) {
        console.warn(`[verify-narrative-gap] Unverified customer quote: "${quote.slice(0, 60)}..."`);
        cleanCustomerPerception = cleanCustomerPerception.replace(
          new RegExp(`["\u201c]${escapeRegex(quote)}["\u201d]`, "g"),
          "[unverified]",
        );
      }
    }

    return {
      ...gap,
      companyMessage: cleanCompanyMessage,
      customerPerception: cleanCustomerPerception,
    };
  });

  // Also verify mirror line quotes
  let cleanMirrorLine = narrativeGap.mirrorLine;
  const mirrorQuotes = extractInlineQuotes(narrativeGap.mirrorLine);
  for (const quote of mirrorQuotes) {
    if (quote.length >= 10 && !corpus.includes(quote.toLowerCase())) {
      console.warn(`[verify-narrative-gap] Unverified mirror quote: "${quote.slice(0, 60)}..."`);
      cleanMirrorLine = cleanMirrorLine.replace(
        new RegExp(`["\u201c]${escapeRegex(quote)}["\u201d]`, "g"),
        "[unverified]",
      );
    }
  }

  return {
    ...narrativeGap,
    mirrorLine: cleanMirrorLine,
    gaps: verifiedGaps,
  };
}
