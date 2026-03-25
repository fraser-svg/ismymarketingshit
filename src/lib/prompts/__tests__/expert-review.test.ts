import { describe, it, expect } from "vitest";
import { buildExpertReviewPrompt } from "../expert-review";
import type { CompiledReport, AnalysisInput } from "../../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeReport(overrides?: Partial<CompiledReport>): CompiledReport {
  return {
    mirrorLine: "Your customers say relief. Your website says platform.",
    sections: [
      {
        title: "The Core Gap",
        content: "Customers describe emotional outcomes; website lists features.",
        citations: ["https://example.com", "G2 review by Jane"],
      },
    ],
    score: 62,
    generatedAt: "2026-03-20T12:00:00Z",
    domain: "example.com",
    narrativeGap: {
      mirrorLine: "Your customers say relief. Your website says platform.",
      customerThemes: ["relief", "peace of mind"],
      companyThemes: ["AI-powered", "enterprise-grade"],
      gaps: [],
      confidence: "high",
    },
    customerPsych: null,
    scoreDimensions: {
      messageClarity: { score: 14, maxScore: 25, justification: "Unclear hero" },
      differentiation: { score: 12, maxScore: 25, justification: "Generic claims" },
      voiceConsistency: { score: 18, maxScore: 25, justification: "Decent consistency" },
      ctaClarity: { score: 18, maxScore: 25, justification: "Clear CTA" },
    },
    ...overrides,
  };
}

function makeInput(overrides?: Partial<AnalysisInput>): AnalysisInput {
  return {
    company: { domain: "example.com", name: "Example Co" },
    pages: [
      {
        url: "https://example.com/",
        content: "A".repeat(8000), // longer than 6000 to test truncation
        scrapedAt: "2026-03-20T10:00:00Z",
        source: "website",
      },
      {
        url: "https://example.com/about",
        content: "About page content here that describes the team and mission.",
        scrapedAt: "2026-03-20T10:01:00Z",
        source: "website",
      },
    ],
    reviews: [
      ...Array.from({ length: 35 }, (_, i) => ({
        url: `https://g2.com/review/${i}`,
        content: `review-${i}: This product gave me ${"peace of mind ".repeat(120)}and saved our business from chaos`,
        scrapedAt: "2026-03-20T11:00:00Z",
        source: "review" as const,
        platform: "G2",
        author: `Reviewer ${i}`,
      })),
    ],
    extras: {
      techStack: ["React", "Node.js"],
      newsArticles: [],
    },
    dataQuality: {
      valid: true,
      confidence: "high",
      pageCount: 2,
      reviewCount: 35,
      issues: [],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildExpertReviewPrompt", () => {
  it("truncates page content at 6000 characters", () => {
    const input = makeInput();
    // First page has 8000 'A' chars -- should be sliced to 6000
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    // The prompt should contain exactly 6000 A's from the first page, not 8000
    const match = prompt.match(/https:\/\/example\.com\/: (A+)/);
    expect(match).not.toBeNull();
    expect(match![1].length).toBe(6000);
  });

  it("caps reviews at 30", () => {
    const input = makeInput(); // 35 reviews
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    // Reviews 0-29 should appear, review-30 through review-34 should not
    expect(prompt).toContain("review-0");
    expect(prompt).toContain("review-29");
    expect(prompt).not.toContain("review-30");
    expect(prompt).not.toContain("review-34");
  });

  it("truncates individual review content at 1500 characters", () => {
    const input = makeInput();
    // Each review content is well over 1500 chars (peace of mind * 120 + suffix)
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    // Extract one review block and check its content length
    const reviewPattern = /\[G2 by Reviewer 0\] ([\s\S]+?)(?=\n\n\[|$)/;
    const reviewMatch = prompt.match(reviewPattern);
    expect(reviewMatch).not.toBeNull();
    expect(reviewMatch![1].length).toBe(1500);
  });

  it("includes platform and author in review labels", () => {
    const prompt = buildExpertReviewPrompt(makeReport(), makeInput());

    expect(prompt).toContain("[G2 by Reviewer 0]");
    expect(prompt).toContain("[G2 by Reviewer 5]");
  });

  it("omits author from label when not available", () => {
    const input = makeInput({
      reviews: [
        {
          url: "https://trustpilot.com/review/1",
          content: "Great product that solved all our problems nicely",
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          platform: "Trustpilot",
          // no author
        },
      ],
    });
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    expect(prompt).toContain("[Trustpilot]");
    expect(prompt).not.toContain("[Trustpilot by");
  });

  it("falls back to selector or source for platform label", () => {
    const input = makeInput({
      reviews: [
        {
          url: "https://reddit.com/r/saas/comment/1",
          content: "Found this tool last week and it changed everything for us",
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          selector: "reddit-thread",
          // no platform, no author
        },
      ],
    });
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    expect(prompt).toContain("[reddit-thread]");
  });

  it("contains the rewrite-only constraint", () => {
    const prompt = buildExpertReviewPrompt(makeReport(), makeInput());

    expect(prompt).toContain("MUST NOT add new quotes or findings");
  });

  it("includes all five expert instructions", () => {
    const prompt = buildExpertReviewPrompt(makeReport(), makeInput());

    expect(prompt).toContain("=== April Dunford (Positioning) ===");
    expect(prompt).toContain("=== Bob Moesta (Jobs to be Done) ===");
    expect(prompt).toContain("=== Eugene Schwartz (Awareness Levels) ===");
    expect(prompt).toContain("=== Joanna Wiebe (Conversion Copy) ===");
    expect(prompt).toContain("=== Dave Trott (Compression) ===");
  });

  it("filters out reviews with trivial content", () => {
    const input = makeInput({
      reviews: [
        {
          url: "https://g2.com/review/empty",
          content: "   ok   ", // 2 chars trimmed -- under 10
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          platform: "G2",
          author: "Trivial Author",
        },
        {
          url: "https://g2.com/review/real",
          content: "This product completely transformed our workflow and saved hours",
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          platform: "G2",
          author: "Real User",
        },
      ],
    });
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    expect(prompt).toContain("[G2 by Real User]");
    expect(prompt).not.toContain("Trivial Author");
  });

  it("shows fallback text when no substantive reviews exist", () => {
    const input = makeInput({
      reviews: [
        {
          url: "https://g2.com/review/empty",
          content: "ok",
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
        },
      ],
    });
    const prompt = buildExpertReviewPrompt(makeReport(), input);

    expect(prompt).toContain("(No substantive reviews)");
  });
});
