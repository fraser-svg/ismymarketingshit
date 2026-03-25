import { describe, it, expect } from "vitest";
import { buildReportCompilationPrompt } from "../report-compilation";
import type {
  AnalysisInput,
  NarrativeGapResult,
  CustomerPsychResult,
} from "../../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeInput(overrides?: Partial<AnalysisInput>): AnalysisInput {
  return {
    company: {
      domain: "acme.io",
      name: "Acme Corp",
      industry: "B2B SaaS",
    },
    pages: [
      {
        url: "https://acme.io",
        content:
          "We help teams ship faster with our platform. Trusted by 500+ companies worldwide. Start your free trial today.",
        scrapedAt: "2026-03-20T10:00:00Z",
        source: "website",
        selector: "homepage",
      },
      {
        url: "https://acme.io/about",
        content:
          "Founded in 2019, Acme Corp believes every team deserves great tools. Our mission is to make shipping software effortless.",
        scrapedAt: "2026-03-20T10:01:00Z",
        source: "website",
        selector: "about",
      },
    ],
    reviews: [
      {
        url: "https://g2.com/products/acme/reviews/123",
        content:
          "Great product but onboarding took three weeks. Support was unresponsive until we escalated to our account manager.",
        scrapedAt: "2026-03-20T11:00:00Z",
        source: "review",
        selector: "g2",
      },
      {
        url: "https://g2.com/products/acme/reviews/456",
        content:
          "The integrations are solid but the pricing is opaque. We had to get on a call just to find out what we would pay.",
        scrapedAt: "2026-03-20T11:01:00Z",
        source: "review",
        selector: "g2",
      },
      {
        url: "https://trustpilot.com/review/acme.io/789",
        content:
          "Switched from Competitor X and the migration was painful. Took two months. But the product itself is genuinely better.",
        scrapedAt: "2026-03-20T11:02:00Z",
        source: "review",
        selector: "trustpilot",
      },
    ],
    extras: {
      techStack: ["React", "Node.js"],
      newsArticles: [],
    },
    dataQuality: {
      valid: true,
      confidence: "high",
      pageCount: 2,
      reviewCount: 3,
      issues: [],
    },
    ...overrides,
  };
}

function makeNarrativeGap(): NarrativeGapResult {
  return {
    mirrorLine:
      "Acme says shipping is effortless. Customers say onboarding took three weeks.",
    customerThemes: ["slow onboarding", "opaque pricing", "painful migration"],
    companyThemes: ["ship faster", "trusted by 500+", "effortless"],
    gaps: [
      {
        theme: "Onboarding speed",
        companyMessage: "Ship faster with our platform",
        customerPerception: "Onboarding took three weeks",
        severity: "critical",
        evidence: {
          companySource: "https://acme.io",
          customerSource: "https://g2.com/products/acme/reviews/123",
        },
      },
    ],
    confidence: "high",
  };
}

function makeCustomerPsych(): CustomerPsychResult {
  return {
    buyingMotivations: ["better tooling", "team velocity"],
    emotionalDrivers: ["frustration with legacy tools", "desire for speed"],
    objections: ["opaque pricing", "slow onboarding", "migration pain"],
    loyaltyFactors: ["product quality", "integrations"],
    sentimentBreakdown: { positive: 0.5, neutral: 0.2, negative: 0.3 },
  };
}

// ---------------------------------------------------------------------------
// 1. Page content is included
// ---------------------------------------------------------------------------

describe("page content inclusion", () => {
  it("includes actual page text in the output", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    // Actual content from the fixture pages should appear verbatim
    expect(output).toContain(
      "We help teams ship faster with our platform. Trusted by 500+ companies worldwide.",
    );
    expect(output).toContain(
      "Founded in 2019, Acme Corp believes every team deserves great tools.",
    );
  });

  it("truncates pages longer than 4000 chars with [truncated] marker", () => {
    const longContent = "A".repeat(5000);
    const input = makeInput({
      pages: [
        {
          url: "https://acme.io/long",
          content: longContent,
          scrapedAt: "2026-03-20T10:00:00Z",
          source: "website",
          selector: "features",
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    // Should contain the first 4000 chars
    expect(output).toContain("A".repeat(4000));
    // Should NOT contain the full 5000 chars as a contiguous block
    expect(output).not.toContain("A".repeat(4001));
    // Truncation marker present
    expect(output).toContain("[...truncated]");
  });

  it("does not add [truncated] marker for short pages", () => {
    const input = makeInput({
      pages: [
        {
          url: "https://acme.io/tiny",
          content: "Short page.",
          scrapedAt: "2026-03-20T10:00:00Z",
          source: "website",
          selector: "homepage",
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("Short page.");
    expect(output).not.toContain("[...truncated]");
  });

  it("includes page labels with selector/type", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("--- PAGE: https://acme.io (homepage) ---");
    expect(output).toContain("--- PAGE: https://acme.io/about (about) ---");
  });

  it("falls back to 'page' label when selector is absent", () => {
    const input = makeInput({
      pages: [
        {
          url: "https://acme.io/unknown",
          content: "Some content here.",
          scrapedAt: "2026-03-20T10:00:00Z",
          source: "website",
          // no selector
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("--- PAGE: https://acme.io/unknown (page) ---");
  });

  it("includes all pages from the input", () => {
    const pages = Array.from({ length: 5 }, (_, i) => ({
      url: `https://acme.io/page-${i}`,
      content: `Content for page ${i} goes here.`,
      scrapedAt: "2026-03-20T10:00:00Z",
      source: "website" as const,
      selector: `section-${i}`,
    }));

    const input = makeInput({ pages });
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    for (let i = 0; i < 5; i++) {
      expect(output).toContain(`Content for page ${i} goes here.`);
      expect(output).toContain(
        `--- PAGE: https://acme.io/page-${i} (section-${i}) ---`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Review content is included
// ---------------------------------------------------------------------------

describe("review content inclusion", () => {
  it("includes actual review text in the output", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("Great product but onboarding took three weeks.");
    expect(output).toContain("The integrations are solid but the pricing is opaque.");
    expect(output).toContain(
      "Switched from Competitor X and the migration was painful.",
    );
  });

  it("truncates reviews longer than 1500 chars with [truncated] marker", () => {
    const longReview = "B".repeat(2000);
    const input = makeInput({
      reviews: [
        {
          url: "https://g2.com/review/long1",
          content: longReview,
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          selector: "g2",
        },
        {
          url: "https://g2.com/review/long2",
          content: "C".repeat(2000),
          scrapedAt: "2026-03-20T11:01:00Z",
          source: "review",
          selector: "g2",
        },
        {
          url: "https://g2.com/review/long3",
          content: "D".repeat(2000),
          scrapedAt: "2026-03-20T11:02:00Z",
          source: "review",
          selector: "g2",
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("B".repeat(1500));
    expect(output).not.toContain("B".repeat(1501));
    expect(output).toContain("[...truncated]");
  });

  it("includes platform labels on reviews", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("--- REVIEW (g2)");
    expect(output).toContain("--- REVIEW (trustpilot)");
  });

  it("caps reviews at 30", () => {
    const reviews = Array.from({ length: 40 }, (_, i) => ({
      url: `https://g2.com/review/${i}`,
      content: `This is review number ${i} with enough text to pass the threshold easily.`,
      scrapedAt: "2026-03-20T11:00:00Z",
      source: "review" as const,
      selector: "g2",
    }));

    const input = makeInput({ reviews });
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    // Count REVIEW blocks
    const reviewBlocks = output.match(/--- REVIEW \(/g);
    expect(reviewBlocks).not.toBeNull();
    expect(reviewBlocks!.length).toBeLessThanOrEqual(30);
  });

  it("excludes reviews with 10 or fewer chars of content", () => {
    const input = makeInput({
      reviews: [
        {
          url: "https://g2.com/review/short1",
          content: "Good.",
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          selector: "g2",
        },
        {
          url: "https://g2.com/review/short2",
          content: "   tiny   ",
          scrapedAt: "2026-03-20T11:01:00Z",
          source: "review",
          selector: "g2",
        },
        {
          url: "https://g2.com/review/ok1",
          content: "This product is genuinely excellent and I would recommend it.",
          scrapedAt: "2026-03-20T11:02:00Z",
          source: "review",
          selector: "g2",
        },
        {
          url: "https://g2.com/review/ok2",
          content: "Really solid onboarding experience, took only a few hours.",
          scrapedAt: "2026-03-20T11:03:00Z",
          source: "review",
          selector: "g2",
        },
        {
          url: "https://g2.com/review/ok3",
          content: "Support team responds quickly and integrations work out of the box.",
          scrapedAt: "2026-03-20T11:04:00Z",
          source: "review",
          selector: "g2",
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    // Short reviews should be excluded from review content blocks
    expect(output).not.toContain("--- REVIEW (g2) https://g2.com/review/short1 ---");
    expect(output).not.toContain("--- REVIEW (g2) https://g2.com/review/short2 ---");
    // Substantive reviews should be present
    expect(output).toContain(
      "This product is genuinely excellent and I would recommend it.",
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Source material constraint instructions
// ---------------------------------------------------------------------------

describe("source material constraint", () => {
  it('includes "quote ONLY from this text" instruction', () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("quote ONLY from this text");
  });

  it('includes "MUST appear verbatim in the source material" instruction', () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("MUST appear verbatim in the source material");
  });
});

// ---------------------------------------------------------------------------
// 4. Legacy metadata still present
// ---------------------------------------------------------------------------

describe("legacy metadata summary", () => {
  it("includes page URLs and char counts in summary", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    // The summary section lists URL + char count
    for (const page of input.pages) {
      expect(output).toContain(`${page.url} (${page.content.length} chars)`);
    }
  });

  it("includes review count summary", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain(
      `${input.dataQuality.reviewCount} reviews from:`,
    );
  });

  it("includes page count in data sources header", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain(`Pages scraped (${input.pages.length} pages)`);
  });
});

// ---------------------------------------------------------------------------
// 5. Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it('shows "No reviews available" when hasReviews is false (fewer than 3 substantive)', () => {
    const input = makeInput({
      reviews: [
        {
          url: "https://g2.com/review/1",
          content: "Only one substantive review here, that is all we have.",
          scrapedAt: "2026-03-20T11:00:00Z",
          source: "review",
          selector: "g2",
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      null,
    );

    expect(output).toContain("No reviews available.");
  });

  it("omits [truncated] marker for short pages", () => {
    const input = makeInput({
      pages: [
        {
          url: "https://acme.io/small",
          content: "Just a small page.",
          scrapedAt: "2026-03-20T10:00:00Z",
          source: "website",
          selector: "homepage",
        },
      ],
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).not.toContain("[...truncated]");
  });

  it("handles empty extras gracefully", () => {
    const input = makeInput({
      extras: {
        techStack: [],
        newsArticles: [],
        // no archiveSnapshots
      },
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    // Should not throw and should still produce a valid prompt
    expect(output).toContain("Voice Gap Analysis for Acme Corp");
    // No HN block or archive block
    expect(output).not.toContain("Hacker News discussions:");
    expect(output).not.toContain("Web Archive snapshots");
  });

  it("handles null customerPsych gracefully", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      null,
    );

    expect(output).toContain(
      "null (fewer than 3 reviews, customer psychology analysis was skipped)",
    );
  });

  it("falls back to domain when company name is missing", () => {
    const input = makeInput({
      company: { domain: "acme.io" },
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("Voice Gap Analysis for acme.io");
  });

  it("includes HN discussions when present in extras", () => {
    const input = makeInput({
      extras: {
        techStack: [],
        newsArticles: [
          {
            url: "https://news.ycombinator.com/item?id=12345",
            content:
              "Interesting thread about Acme Corp and their developer tooling approach in the market.",
            scrapedAt: "2026-03-20T12:00:00Z",
            source: "news",
          },
        ],
      },
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("Hacker News discussions:");
    expect(output).toContain("news.ycombinator.com/item?id=12345");
  });

  it("includes Web Archive snapshots when present", () => {
    const input = makeInput({
      extras: {
        techStack: [],
        newsArticles: [],
        archiveSnapshots: [
          {
            url: "https://acme.io",
            timestamp: "2024-01-15",
            archiveUrl: "https://web.archive.org/web/20240115/https://acme.io",
          },
        ],
      },
    });

    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("Web Archive snapshots (1 historical captures)");
    expect(output).toContain(
      "https://web.archive.org/web/20240115/https://acme.io",
    );
  });

  it("uses no-review scoring rubric when reviews are insufficient", () => {
    const input = makeInput({ reviews: [] });
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      null,
    );

    // No-review rubric redistributes points
    expect(output).toContain("Message clarity    | 35");
    expect(output).toContain("Differentiation    | 30");
    expect(output).toContain("CTA clarity        | 20");
    // No "Customer alignment" row in the rubric table (the skip note is fine)
    expect(output).not.toContain("Customer alignment | 25");
  });

  it("uses standard scoring rubric when reviews are present", () => {
    const input = makeInput();
    const output = buildReportCompilationPrompt(
      input,
      makeNarrativeGap(),
      makeCustomerPsych(),
    );

    expect(output).toContain("Message clarity    | 25");
    expect(output).toContain("Customer alignment | 25");
    expect(output).toContain("Differentiation    | 20");
    expect(output).toContain("CTA clarity        | 15");
  });
});
