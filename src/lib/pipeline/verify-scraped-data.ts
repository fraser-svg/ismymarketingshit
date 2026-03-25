import { createHash } from "crypto";
import type {
  SourceRecord,
  VerifiedSourceRecord,
  ScrapeVerificationResult,
} from "@/lib/types";

/** Minimum character count for a page to be considered valid content. */
const MIN_CONTENT_CHARS = 200;

/** Minimum character count for the homepage specifically. */
const MIN_HOMEPAGE_CHARS = 500;

/** Error indicator strings that suggest a failed scrape. Only checked on short pages (< 5000 chars). */
const ERROR_INDICATORS = [
  "403 Forbidden",
  "Access Denied",
  "Please verify you are human",
  "Page not found",
  "404 Not Found",
  "404 - Page Not Found",
] as const;

/**
 * Compute a SHA-256 content hash for deduplication and verification.
 */
function computeContentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Build a VerifiedSourceRecord from a SourceRecord with verification metadata.
 */
function toVerifiedRecord(
  record: SourceRecord,
  platform: string,
  status: VerifiedSourceRecord["status"],
): VerifiedSourceRecord {
  return {
    ...record,
    platform,
    contentHash: computeContentHash(record.content),
    charCount: record.content.length,
    status,
  };
}

/**
 * Check whether content contains error indicators that suggest a
 * blocked or failed page scrape.
 */
function containsErrorIndicator(content: string): string | null {
  // Only check for error indicators on short pages. Real error pages
  // are typically < 5000 chars. Longer pages contain real content
  // that may incidentally include phrases like "404".
  if (content.length > 5000) return null;

  for (const indicator of ERROR_INDICATORS) {
    if (content.includes(indicator)) {
      return indicator;
    }
  }
  return null;
}

/**
 * Extract the bare domain name (without TLD) for company validation.
 * e.g. "acme.co.uk" -> "acme", "my-startup.com" -> "my-startup"
 */
function extractDomainName(domain: string): string {
  const parts = domain.split(".");
  // Handle cases like co.uk, com.au by taking the first part
  return parts[0].toLowerCase();
}

interface ScrapedPageInput {
  url: string;
  type: string;
  content: string;
  sourceRecord: SourceRecord;
}

interface ReviewInput {
  url: string;
  content: string;
}

interface ExtrasInput {
  techStack: string[];
  newsArticles: Array<{ url: string; content: string }>;
}

/**
 * Verify scraped data meets minimum quality thresholds before analysis.
 *
 * Performs the following checks:
 * - Content validation: rejects pages with < 200 chars or error indicators
 * - Company validation: at least one page should contain the domain name
 * - Minimum threshold: homepage (500+ chars) required, at least 1 additional page
 * - Source tagging: creates VerifiedSourceRecord with hash, charCount, status
 */
export function verifyScrapeData(
  pages: ScrapedPageInput[],
  reviews: ReviewInput[],
  extras: ExtrasInput,
  domain?: string,
): ScrapeVerificationResult {
  const issues: string[] = [];
  const verifiedPages: VerifiedSourceRecord[] = [];
  const verifiedReviews: VerifiedSourceRecord[] = [];

  // --- Validate pages ---
  let homepageFound = false;
  let validPageCount = 0;
  let domainMentionFound = false;

  const domainName = domain ? extractDomainName(domain) : null;

  for (const page of pages) {
    const content = page.content ?? "";
    const charCount = content.length;

    // Check for error indicators
    const errorMatch = containsErrorIndicator(content);
    if (errorMatch) {
      issues.push(
        `Page ${page.url} contains error indicator: "${errorMatch}"`,
      );
      verifiedPages.push(
        toVerifiedRecord(page.sourceRecord, "website", "failed"),
      );
      continue;
    }

    // Check minimum content length
    if (charCount < MIN_CONTENT_CHARS) {
      issues.push(
        `Page ${page.url} has insufficient content (${charCount} chars, minimum ${MIN_CONTENT_CHARS})`,
      );
      verifiedPages.push(
        toVerifiedRecord(page.sourceRecord, "website", "partial"),
      );
      continue;
    }

    // Check homepage specifically. The first page in the array is treated
    // as the homepage even if its type is "other" (e.g. after a region redirect
    // like stripe.com -> stripe.com/gb).
    const isFirstPage = pages.indexOf(page) === 0;
    const isHomepage = page.type === "homepage" || isFirstPage;
    if (isHomepage) {
      if (charCount >= MIN_HOMEPAGE_CHARS) {
        homepageFound = true;
      } else {
        issues.push(
          `Homepage has insufficient content (${charCount} chars, minimum ${MIN_HOMEPAGE_CHARS})`,
        );
        verifiedPages.push(
          toVerifiedRecord(page.sourceRecord, "website", "partial"),
        );
        continue;
      }
    }

    // Check for domain name mention (company validation)
    if (domainName && content.toLowerCase().includes(domainName)) {
      domainMentionFound = true;
    }

    validPageCount++;
    verifiedPages.push(
      toVerifiedRecord(page.sourceRecord, "website", "verified"),
    );
  }

  // --- Validate reviews ---
  for (const review of reviews) {
    const content = review.content ?? "";
    const charCount = content.length;

    const errorMatch = containsErrorIndicator(content);
    if (errorMatch) {
      issues.push(
        `Review from ${review.url} contains error indicator: "${errorMatch}"`,
      );
      const record: SourceRecord = {
        url: review.url,
        content: review.content,
        scrapedAt: new Date().toISOString(),
        source: "review",
      };
      verifiedReviews.push(toVerifiedRecord(record, "review", "failed"));
      continue;
    }

    if (charCount < MIN_CONTENT_CHARS) {
      const record: SourceRecord = {
        url: review.url,
        content: review.content,
        scrapedAt: new Date().toISOString(),
        source: "review",
      };
      verifiedReviews.push(toVerifiedRecord(record, "review", "partial"));
      continue;
    }

    const record: SourceRecord = {
      url: review.url,
      content: review.content,
      scrapedAt: new Date().toISOString(),
      source: "review",
    };
    verifiedReviews.push(toVerifiedRecord(record, "review", "verified"));
  }

  // --- Threshold checks ---
  if (!homepageFound) {
    issues.push("Homepage not found or has insufficient content (minimum 500 chars)");
  }

  // At least 1 additional page beyond homepage
  const additionalPages = validPageCount - (homepageFound ? 1 : 0);
  if (additionalPages < 1) {
    issues.push(
      "At least 1 additional page beyond the homepage is required",
    );
  }

  // Company validation
  if (domainName && !domainMentionFound && pages.length > 0) {
    issues.push(
      `No page contains the domain name "${domainName}" — content may not belong to this company`,
    );
  }

  // --- Determine overall validity and confidence ---
  const valid = homepageFound && additionalPages >= 1;

  const verifiedReviewCount = verifiedReviews.filter(
    (r) => r.status === "verified",
  ).length;

  // Warn (but don't block) when zero reviews are found
  if (reviews.length === 0) {
    issues.push(
      "No customer reviews found — analysis will rely on website content only (outsider clarity mode)",
    );
  } else if (verifiedReviewCount === 0 && reviews.length > 0) {
    issues.push(
      `${reviews.length} reviews scraped but none met quality thresholds — analysis will rely on website content only`,
    );
  }

  let confidence: ScrapeVerificationResult["confidence"];
  if (valid && validPageCount >= 5 && verifiedReviewCount >= 10) {
    confidence = "high";
  } else if (valid && validPageCount >= 2 && verifiedReviewCount >= 1) {
    confidence = "medium";
  } else if (valid && validPageCount >= 2 && verifiedReviewCount === 0) {
    // No reviews: cap confidence at "low" to signal reduced data availability
    confidence = "low";
  } else {
    confidence = "low";
  }

  return {
    valid,
    confidence,
    issues,
    verifiedPages,
    verifiedReviews,
  };
}
