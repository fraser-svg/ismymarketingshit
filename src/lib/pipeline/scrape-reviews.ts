import {
  scrapeReviews,
  type ScrapeReviewsResult,
} from "@/lib/services/apify";

/**
 * Pipeline step: scrape reviews for the given domain from third-party
 * review platforms (G2, Trustpilot, etc.) via the Apify service.
 *
 * Returns empty results gracefully when the Apify token is missing or
 * when all scrapers fail.
 */
export async function scrapeReviewsStep(
  domain: string,
): Promise<ScrapeReviewsResult> {
  console.log(`[scrape-reviews] Fetching reviews for ${domain}`);
  return scrapeReviews(domain);
}
