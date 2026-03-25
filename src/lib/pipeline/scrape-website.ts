import { scrapeWebsite } from "@/lib/services/cloudflare";
import type { ScrapedPage } from "@/lib/types";

/**
 * Pipeline step: scrape a website and return structured page data.
 *
 * Thin wrapper around the Cloudflare scraping client, intended to be
 * called from an Inngest step function.
 */
export async function scrapeWebsiteStep(
  domain: string,
): Promise<ScrapedPage[]> {
  return scrapeWebsite(domain);
}
