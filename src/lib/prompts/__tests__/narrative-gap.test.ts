import { describe, it, expect } from "vitest";
import { buildNarrativeGapPrompt } from "../narrative-gap";
import type { AnalysisInput } from "../../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeInput(overrides?: Partial<AnalysisInput>): AnalysisInput {
  return {
    company: { domain: "acme.io", name: "Acme Corp" },
    pages: [
      {
        url: "https://acme.io/",
        content: "Acme Corp - The AI-powered platform for modern teams. We help you do more with less.",
        scrapedAt: "2026-03-20T10:00:00Z",
        source: "website",
      },
      {
        url: "https://acme.io/about",
        content: "About Acme Corp. Founded in 2020, we believe in making work simple.",
        scrapedAt: "2026-03-20T10:01:00Z",
        source: "website",
      },
    ],
    reviews: [
      ...Array.from({ length: 5 }, (_, i) => ({
        url: `https://g2.com/acme/review/${i}`,
        content: `Acme saved our team dozens of hours every week. The support is incredible. Review number ${i}.`,
        scrapedAt: "2026-03-20T11:00:00Z",
        source: "review" as const,
        platform: "G2",
        author: `User ${i}`,
      })),
    ],
    extras: {
      techStack: ["React", "Python"],
      newsArticles: [],
      archiveSnapshots: [
        {
          url: "https://acme.io/",
          timestamp: "2024-01-15",
          archiveUrl: "https://web.archive.org/web/20240115/https://acme.io/",
        },
        {
          url: "https://acme.io/",
          timestamp: "2023-06-01",
          archiveUrl: "https://web.archive.org/web/20230601/https://acme.io/",
        },
      ],
    },
    dataQuality: {
      valid: true,
      confidence: "high",
      pageCount: 2,
      reviewCount: 5,
      issues: [],
    },
    ...overrides,
  };
}

function makeNoReviewInput(
  overrides?: Partial<AnalysisInput>,
): AnalysisInput {
  return makeInput({
    reviews: [],
    dataQuality: {
      valid: true,
      confidence: "low",
      pageCount: 2,
      reviewCount: 0,
      issues: ["No reviews found"],
    },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Archive block tests
// ---------------------------------------------------------------------------

describe("buildNarrativeGapPrompt - archive block (with reviews)", () => {
  it("contains the honest disclaimer about not having archive content", () => {
    const prompt = buildNarrativeGapPrompt(makeInput());

    expect(prompt).toContain("You have NOT been given the content");
  });

  it("does NOT contain old analysis instructions for archive snapshots", () => {
    const prompt = buildNarrativeGapPrompt(makeInput());

    expect(prompt).not.toContain("Look for patterns");
    expect(prompt).not.toContain("has the positioning changed");
  });

  it("does NOT contain the old generic language question", () => {
    const prompt = buildNarrativeGapPrompt(makeInput());

    expect(prompt).not.toContain("Has the language stayed generic");
  });

  it("lists archive snapshot URLs with timestamps", () => {
    const prompt = buildNarrativeGapPrompt(makeInput());

    expect(prompt).toContain("2024-01-15: https://web.archive.org/web/20240115/https://acme.io/");
    expect(prompt).toContain("2023-06-01: https://web.archive.org/web/20230601/https://acme.io/");
  });

  it("mentions the snapshot count", () => {
    const prompt = buildNarrativeGapPrompt(makeInput());

    expect(prompt).toContain("2 historical snapshot(s) exist");
  });
});

describe("buildNarrativeGapPrompt - archive block (no reviews / fallback)", () => {
  it("no-review fallback also has the honest disclaimer", () => {
    const input = makeNoReviewInput({
      extras: {
        techStack: [],
        newsArticles: [],
        archiveSnapshots: [
          {
            url: "https://acme.io/",
            timestamp: "2024-06-01",
            archiveUrl: "https://web.archive.org/web/20240601/https://acme.io/",
          },
        ],
      },
    });
    const prompt = buildNarrativeGapPrompt(input);

    expect(prompt).toContain("You have NOT been given the content");
    expect(prompt).not.toContain("Look for patterns");
    expect(prompt).not.toContain("has the positioning changed");
  });
});

// ---------------------------------------------------------------------------
// HN block tests (unchanged behaviour)
// ---------------------------------------------------------------------------

describe("buildNarrativeGapPrompt - HN block", () => {
  it("includes HN discussions when present", () => {
    const input = makeInput({
      extras: {
        techStack: [],
        newsArticles: [
          {
            url: "https://news.ycombinator.com/item?id=12345",
            content: "HN commenter: Acme is basically a better version of OldTool. Very impressed.",
            scrapedAt: "2026-03-18T08:00:00Z",
            source: "news",
          },
        ],
        archiveSnapshots: [],
      },
    });
    const prompt = buildNarrativeGapPrompt(input);

    expect(prompt).toContain("HACKER NEWS DISCUSSIONS:");
    expect(prompt).toContain("HN commenter: Acme is basically a better version of OldTool");
    expect(prompt).toContain("how the tech community perceives Acme Corp");
  });

  it("omits HN block when no HN articles exist", () => {
    const input = makeInput({
      extras: {
        techStack: [],
        newsArticles: [],
        archiveSnapshots: [],
      },
    });
    const prompt = buildNarrativeGapPrompt(input);

    expect(prompt).not.toContain("HACKER NEWS DISCUSSIONS:");
  });
});

// ---------------------------------------------------------------------------
// Review quotes reminder
// ---------------------------------------------------------------------------

describe("buildNarrativeGapPrompt - review quotes reminder", () => {
  it("contains the verbatim quote reminder in with-reviews path", () => {
    const prompt = buildNarrativeGapPrompt(makeInput());

    expect(prompt).toContain(
      "Every quote you write MUST appear verbatim in the data below",
    );
  });

  it("contains the verbatim quote reminder in no-review fallback path", () => {
    const prompt = buildNarrativeGapPrompt(makeNoReviewInput());

    expect(prompt).toContain(
      "Every quote you write MUST appear verbatim in the data below",
    );
  });
});

// ---------------------------------------------------------------------------
// Edge: no archive snapshots
// ---------------------------------------------------------------------------

describe("buildNarrativeGapPrompt - no archive snapshots", () => {
  it("omits archive block entirely when no snapshots exist", () => {
    const input = makeInput({
      extras: {
        techStack: [],
        newsArticles: [],
        archiveSnapshots: [],
      },
    });
    const prompt = buildNarrativeGapPrompt(input);

    expect(prompt).not.toContain("HISTORICAL MESSAGING");
    expect(prompt).not.toContain("Web Archive");
  });
});
