/**
 * AI slop detection patterns.
 *
 * These arrays define prohibited language that makes text sound
 * machine-generated. Used by verify-report.ts to flag and reject
 * AI-sounding output.
 */

export const EM_DASH_PATTERNS = ["\u2014", "\u2013", " - "] as const;

export const HEDGING_PHRASES = [
  "it seems like",
  "it seems that",
  "perhaps",
  "it could be argued",
  "it could be said",
  "it may be",
  "it might be",
  "one could say",
  "arguably",
  "to some extent",
  "in some ways",
] as const;

export const FILLER_PHRASES = [
  "it's worth noting",
  "it's important to remember",
  "it's important to note",
  "it should be noted",
  "it bears mentioning",
  "needless to say",
  "at the end of the day",
  "moving forward",
  "going forward",
  "in today's",
  "in the world of",
  "when it comes to",
  "in terms of",
  "at its core",
  "first and foremost",
  "last but not least",
] as const;

export const BUZZWORDS = [
  "robust",
  "holistic",
  "cutting-edge",
  "best-in-class",
  "leverage",
  "utilize",
  "utilise",
  "facilitate",
  "streamline",
  "synergy",
  "align",
  "delve",
  "innovative",
  "next-generation",
  "game-changing",
  "paradigm",
  "ecosystem",
  "scalable",
  "world-class",
  "bleeding-edge",
  "disruptive",
  "empower",
  "actionable",
  "proactive",
  "deep dive",
] as const;

export const FILLER_OPENINGS = [
  "great question",
  "that's interesting",
  "that's a great point",
  "absolutely",
  "certainly",
  "indeed",
  "of course",
  "without a doubt",
] as const;

export const PERFORMATIVE_ENTHUSIASM = [
  "excited to share",
  "thrilled to announce",
  "proud to present",
  "pleased to report",
  "happy to say",
  "delighted to",
] as const;

export const UNNECESSARY_QUALIFIERS = [
  "quite",
  "rather",
  "somewhat",
  "fairly",
  "pretty much",
  "more or less",
  "a bit",
  "kind of",
  "sort of",
] as const;

/** Maximum acceptable sentence length in words before flagging. */
export const MAX_SENTENCE_WORDS = 25;

export interface SlopIssue {
  pattern: string;
  category:
    | "em_dash"
    | "hedging"
    | "filler"
    | "buzzword"
    | "filler_opening"
    | "enthusiasm"
    | "qualifier"
    | "long_sentence";
  context: string;
}

/**
 * Scans text for prohibited AI slop patterns.
 * Returns found issues with their category and surrounding context.
 */
export function detectSlop(text: string): {
  found: boolean;
  issues: SlopIssue[];
} {
  const issues: SlopIssue[] = [];
  const lower = text.toLowerCase();

  // Em dashes
  for (const pattern of EM_DASH_PATTERNS) {
    let idx = text.indexOf(pattern);
    while (idx !== -1) {
      issues.push({
        pattern,
        category: "em_dash",
        context: text.slice(Math.max(0, idx - 30), idx + 30),
      });
      idx = text.indexOf(pattern, idx + 1);
    }
  }

  // Helper for phrase matching
  const checkPhrases = (
    phrases: readonly string[],
    category: SlopIssue["category"],
  ) => {
    for (const phrase of phrases) {
      let idx = lower.indexOf(phrase);
      while (idx !== -1) {
        // Ensure word boundary (not mid-word match)
        const before = idx > 0 ? lower[idx - 1] : " ";
        const after =
          idx + phrase.length < lower.length
            ? lower[idx + phrase.length]
            : " ";
        const isBoundary =
          /[\s.,;:!?"'()\-]/.test(before) && /[\s.,;:!?"'()\-]/.test(after);
        if (isBoundary || idx === 0) {
          issues.push({
            pattern: phrase,
            category,
            context: text.slice(Math.max(0, idx - 20), idx + phrase.length + 20),
          });
        }
        idx = lower.indexOf(phrase, idx + 1);
      }
    }
  };

  checkPhrases(HEDGING_PHRASES, "hedging");
  checkPhrases(FILLER_PHRASES, "filler");
  checkPhrases(BUZZWORDS, "buzzword");
  checkPhrases(FILLER_OPENINGS, "filler_opening");
  checkPhrases(PERFORMATIVE_ENTHUSIASM, "enthusiasm");

  // Qualifiers need special handling: only flag as standalone words
  for (const qualifier of UNNECESSARY_QUALIFIERS) {
    const regex = new RegExp(`\\b${qualifier}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        pattern: qualifier,
        category: "qualifier",
        context: text.slice(
          Math.max(0, match.index - 20),
          match.index + qualifier.length + 20,
        ),
      });
    }
  }

  // Long sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    if (words.length > MAX_SENTENCE_WORDS) {
      issues.push({
        pattern: `${words.length} words`,
        category: "long_sentence",
        context:
          sentence.trim().slice(0, 80) +
          (sentence.trim().length > 80 ? "..." : ""),
      });
    }
  }

  return { found: issues.length > 0, issues };
}
