import { describe, it, expect, vi } from "vitest";
import {
  verifyNarrativeGapEvidence,
  extractInlineQuotes,
  escapeRegex,
} from "../verify-narrative-gap";
import type { NarrativeGapResult, AnalysisInput } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers: minimal fixture builders
// ---------------------------------------------------------------------------

function makeAnalysisInput(overrides?: {
  pages?: string[];
  reviews?: string[];
  news?: string[];
}): AnalysisInput {
  return {
    company: { domain: "example.com", name: "Example Co" },
    pages: (overrides?.pages ?? []).map((content) => ({
      url: "https://example.com",
      content,
      scrapedAt: "2026-01-01T00:00:00Z",
      source: "website" as const,
    })),
    reviews: (overrides?.reviews ?? []).map((content) => ({
      url: "https://g2.com/example",
      content,
      scrapedAt: "2026-01-01T00:00:00Z",
      source: "review" as const,
      platform: "g2",
    })),
    extras: {
      techStack: [],
      newsArticles: (overrides?.news ?? []).map((content) => ({
        url: "https://news.example.com",
        content,
        scrapedAt: "2026-01-01T00:00:00Z",
        source: "news" as const,
      })),
    },
    dataQuality: {
      valid: true,
      confidence: "high",
      pageCount: 1,
      reviewCount: 0,
      issues: [],
    },
  };
}

function makeGapResult(overrides?: Partial<NarrativeGapResult>): NarrativeGapResult {
  return {
    mirrorLine: overrides?.mirrorLine ?? "A straightforward mirror line with no quotes.",
    customerThemes: overrides?.customerThemes ?? ["reliability"],
    companyThemes: overrides?.companyThemes ?? ["innovation"],
    gaps: overrides?.gaps ?? [],
    confidence: overrides?.confidence ?? "high",
  };
}

function makeGap(
  companyMessage: string,
  customerPerception: string,
): NarrativeGapResult["gaps"][number] {
  return {
    theme: "trust",
    companyMessage,
    customerPerception,
    severity: "major",
    evidence: {
      companySource: "https://example.com/about",
      customerSource: "https://g2.com/example",
    },
  };
}

// ---------------------------------------------------------------------------
// extractInlineQuotes
// ---------------------------------------------------------------------------

describe("extractInlineQuotes", () => {
  it("extracts curly double quotes", () => {
    const text = "They said \u201cwe deliver world-class results\u201d in their pitch.";
    const result = extractInlineQuotes(text);
    expect(result).toContain("we deliver world-class results");
  });

  it("extracts straight double quotes", () => {
    const text = 'The page states "our platform is enterprise-ready" prominently.';
    const result = extractInlineQuotes(text);
    expect(result).toContain("our platform is enterprise-ready");
  });

  it("extracts curly single quotes", () => {
    const text = "A reviewer noted \u2018the onboarding was painless\u2019 in their feedback.";
    const result = extractInlineQuotes(text);
    expect(result).toContain("the onboarding was painless");
  });

  it("skips quotes shorter than 5 characters", () => {
    const text = 'They said "yes" and \u201cno\u201d and \u2018ok\u2019 throughout.';
    const result = extractInlineQuotes(text);
    expect(result).toEqual([]);
  });

  it("handles mixed quote types in the same text", () => {
    const text =
      'The homepage claims "best-in-class security" while reviewers say ' +
      "\u201cthe product lacks basic safeguards\u201d and one noted " +
      "\u2018it feels unfinished overall\u2019.";
    const result = extractInlineQuotes(text);
    expect(result).toHaveLength(3);
    expect(result).toContain("best-in-class security");
    expect(result).toContain("the product lacks basic safeguards");
    expect(result).toContain("it feels unfinished overall");
  });

  it("returns empty array for text with no quotes", () => {
    const text = "This sentence has no quoted material whatsoever.";
    const result = extractInlineQuotes(text);
    expect(result).toEqual([]);
  });

  it("extracts multiple straight double quotes from same text", () => {
    const text =
      'They promise "seamless integration" and "zero downtime deployments" on the homepage.';
    const result = extractInlineQuotes(text);
    expect(result).toContain("seamless integration");
    expect(result).toContain("zero downtime deployments");
  });
});

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------

describe("escapeRegex", () => {
  it("escapes dots", () => {
    expect(escapeRegex("example.com")).toBe("example\\.com");
  });

  it("escapes asterisks and plus signs", () => {
    expect(escapeRegex("a*b+c")).toBe("a\\*b\\+c");
  });

  it("escapes question marks and carets", () => {
    expect(escapeRegex("why? ^what")).toBe("why\\? \\^what");
  });

  it("escapes dollar signs and curly braces", () => {
    expect(escapeRegex("${value}")).toBe("\\$\\{value\\}");
  });

  it("escapes parentheses and pipes", () => {
    expect(escapeRegex("(a|b)")).toBe("\\(a\\|b\\)");
  });

  it("escapes square brackets and backslashes", () => {
    expect(escapeRegex("[a\\b]")).toBe("\\[a\\\\b\\]");
  });

  it("passes through normal text unchanged", () => {
    expect(escapeRegex("hello world")).toBe("hello world");
    expect(escapeRegex("simple text 123")).toBe("simple text 123");
  });

  it("handles all special characters together", () => {
    const input = ".*+?^${}()|[]\\";
    const escaped = escapeRegex(input);
    // Each character should be escaped with a backslash
    expect(escaped).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
    // The escaped string should be usable as a literal regex pattern
    const regex = new RegExp(escaped);
    expect(regex.test(input)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verifyNarrativeGapEvidence
// ---------------------------------------------------------------------------

describe("verifyNarrativeGapEvidence", () => {
  it("passes through quotes that exist in source corpus", () => {
    const input = makeAnalysisInput({
      pages: ["We deliver world-class results for every client."],
      reviews: ["The onboarding experience was seamless and fast."],
    });

    const gap = makeGap(
      'The company claims "we deliver world-class results" on their homepage.',
      'Customers report "the onboarding experience was seamless and fast" across reviews.',
    );

    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);

    expect(result.gaps[0].companyMessage).toContain(
      '"we deliver world-class results"',
    );
    expect(result.gaps[0].customerPerception).toContain(
      '"the onboarding experience was seamless and fast"',
    );
  });

  it("replaces quotes NOT in corpus with [unverified]", () => {
    // Corpus has nothing matching the quotes
    const input = makeAnalysisInput({
      pages: ["Our product is simple and easy to use."],
    });

    const gap = makeGap(
      'The company says "we are the global leader in innovation" on their about page.',
      'Reviewers state "the platform completely transformed our workflow" consistently.',
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);
    warnSpy.mockRestore();

    expect(result.gaps[0].companyMessage).toContain("[unverified]");
    expect(result.gaps[0].companyMessage).not.toContain(
      "we are the global leader in innovation",
    );
    expect(result.gaps[0].customerPerception).toContain("[unverified]");
    expect(result.gaps[0].customerPerception).not.toContain(
      "the platform completely transformed our workflow",
    );
  });

  it("checks the mirrorLine field for unverified quotes", () => {
    const input = makeAnalysisInput({
      pages: ["We build tools for growing teams."],
    });

    const gapResult = makeGapResult({
      mirrorLine:
        'The mirror reveals that "their messaging promises enterprise scale" ' +
        "but customers see something different.",
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = verifyNarrativeGapEvidence(gapResult, input);
    warnSpy.mockRestore();

    expect(result.mirrorLine).toContain("[unverified]");
    expect(result.mirrorLine).not.toContain(
      "their messaging promises enterprise scale",
    );
  });

  it("preserves mirrorLine quotes that exist in corpus", () => {
    const input = makeAnalysisInput({
      pages: ["We build tools for growing teams that need enterprise scale."],
    });

    const gapResult = makeGapResult({
      mirrorLine:
        'The company says "tools for growing teams that need enterprise scale" and means it.',
    });

    const result = verifyNarrativeGapEvidence(gapResult, input);

    expect(result.mirrorLine).toContain(
      "tools for growing teams that need enterprise scale",
    );
    expect(result.mirrorLine).not.toContain("[unverified]");
  });

  it("handles gaps with no quotes (no change)", () => {
    const input = makeAnalysisInput({
      pages: ["Simple page content."],
    });

    const gap = makeGap(
      "The company focuses heavily on speed and reliability in their messaging.",
      "Customers tend to value the customer support more than the product itself.",
    );

    const gapResult = makeGapResult({ gaps: [gap] });
    const result = verifyNarrativeGapEvidence(gapResult, input);

    expect(result.gaps[0].companyMessage).toBe(gap.companyMessage);
    expect(result.gaps[0].customerPerception).toBe(gap.customerPerception);
  });

  it("performs case-insensitive matching against corpus", () => {
    // Corpus has the text in different case
    const input = makeAnalysisInput({
      pages: ["WE DELIVER WORLD-CLASS RESULTS for every client."],
    });

    const gap = makeGap(
      'They state "we deliver world-class results" on the homepage.',
      "Customers agree the product is solid.",
    );

    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);

    // Should NOT be replaced because it matches case-insensitively
    expect(result.gaps[0].companyMessage).toContain(
      '"we deliver world-class results"',
    );
    expect(result.gaps[0].companyMessage).not.toContain("[unverified]");
  });

  it("handles empty gaps array gracefully", () => {
    const input = makeAnalysisInput({ pages: ["Some content."] });
    const gapResult = makeGapResult({ gaps: [] });

    const result = verifyNarrativeGapEvidence(gapResult, input);
    expect(result.gaps).toEqual([]);
  });

  it("handles empty pages, reviews, and news gracefully", () => {
    const input = makeAnalysisInput({
      pages: [],
      reviews: [],
      news: [],
    });

    const gap = makeGap(
      'They claim "revolutionary artificial intelligence platform" loudly.',
      "Customers see a basic chatbot.",
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);
    warnSpy.mockRestore();

    // With no corpus at all, the quoted text cannot be verified
    expect(result.gaps[0].companyMessage).toContain("[unverified]");
  });

  it("verifies quotes against review content in corpus", () => {
    const input = makeAnalysisInput({
      pages: [],
      reviews: ["The support team responds within minutes every time."],
    });

    const gap = makeGap(
      "The company emphasises responsiveness.",
      'Reviews confirm "the support team responds within minutes every time" consistently.',
    );

    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);

    expect(result.gaps[0].customerPerception).not.toContain("[unverified]");
    expect(result.gaps[0].customerPerception).toContain(
      "the support team responds within minutes every time",
    );
  });

  it("verifies quotes against news articles in corpus", () => {
    const input = makeAnalysisInput({
      pages: [],
      news: ["Example Co raises Series B to expand into European markets."],
    });

    const gapResult = makeGapResult({
      mirrorLine:
        'News reports confirm "expand into european markets" as a strategic priority.',
    });

    const result = verifyNarrativeGapEvidence(gapResult, input);

    // Should match case-insensitively against news content
    expect(result.mirrorLine).not.toContain("[unverified]");
  });

  it("only replaces quotes of 10+ characters, leaving shorter ones intact", () => {
    const input = makeAnalysisInput({
      pages: ["Nothing relevant here."],
    });

    // This quote is >= 5 chars (extracted) but < 10 chars, so below the replacement threshold
    const gap = makeGap(
      'They say "fast tool" on the homepage.',
      "Customers want more.",
    );

    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);

    // "fast tool" is 9 chars -- below the 10-char threshold for replacement
    expect(result.gaps[0].companyMessage).toContain('"fast tool"');
    expect(result.gaps[0].companyMessage).not.toContain("[unverified]");
  });

  it("handles curly quotes in gap fields", () => {
    const input = makeAnalysisInput({
      pages: ["Basic page content only."],
    });

    const gap = makeGap(
      "The company states \u201cwe revolutionise the entire industry\u201d boldly.",
      "Customers feel differently about the product.",
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);
    warnSpy.mockRestore();

    expect(result.gaps[0].companyMessage).toContain("[unverified]");
    expect(result.gaps[0].companyMessage).not.toContain(
      "we revolutionise the entire industry",
    );
  });

  it("handles multiple gaps in a single result", () => {
    const input = makeAnalysisInput({
      pages: ["We provide reliable infrastructure for modern teams."],
      reviews: ["The dashboard is intuitive and well-designed overall."],
    });

    const gap1 = makeGap(
      'They claim "reliable infrastructure for modern teams" on the homepage.',
      'But reviewers note "the uptime has been concerning lately" repeatedly.',
    );
    const gap2 = makeGap(
      'They also say "cutting-edge machine learning capabilities" in their pitch.',
      'Reviewers praise "the dashboard is intuitive and well-designed overall" though.',
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = verifyNarrativeGapEvidence(
      makeGapResult({ gaps: [gap1, gap2] }),
      input,
    );
    warnSpy.mockRestore();

    // gap1: company quote verified, customer quote NOT in corpus
    expect(result.gaps[0].companyMessage).not.toContain("[unverified]");
    expect(result.gaps[0].customerPerception).toContain("[unverified]");

    // gap2: company quote NOT in corpus, customer quote verified
    expect(result.gaps[1].companyMessage).toContain("[unverified]");
    expect(result.gaps[1].customerPerception).not.toContain("[unverified]");
  });

  it("preserves non-quote fields on gap objects", () => {
    const input = makeAnalysisInput({ pages: ["Anything."] });
    const gap = makeGap("No quotes here.", "No quotes here either.");
    gap.theme = "positioning";
    gap.severity = "critical";

    const result = verifyNarrativeGapEvidence(makeGapResult({ gaps: [gap] }), input);

    expect(result.gaps[0].theme).toBe("positioning");
    expect(result.gaps[0].severity).toBe("critical");
    expect(result.gaps[0].evidence).toEqual(gap.evidence);
  });

  it("preserves top-level fields on NarrativeGapResult", () => {
    const input = makeAnalysisInput({ pages: ["Content."] });
    const gapResult = makeGapResult({
      customerThemes: ["support", "pricing"],
      companyThemes: ["innovation", "scale"],
      confidence: "medium",
    });

    const result = verifyNarrativeGapEvidence(gapResult, input);

    expect(result.customerThemes).toEqual(["support", "pricing"]);
    expect(result.companyThemes).toEqual(["innovation", "scale"]);
    expect(result.confidence).toBe("medium");
  });
});
