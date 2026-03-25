import { searchHackerNews, getHNComments, type HNResult } from "@/lib/services/hackernews";
import {
  getWebArchiveSnapshots,
  type ArchiveSnapshot,
} from "@/lib/services/webarchive";
import { domainToCompanyName } from "@/lib/services/apify";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtrasData {
  techStack: string[];
  pageSpeedMobile?: number;
  pageSpeedDesktop?: number;
  socialBios: Record<string, string>;
  newsArticles: Array<{ title: string; url: string; snippet: string }>;
  archiveSnapshots: ArchiveSnapshot[];
}

// ---------------------------------------------------------------------------
// Google PageSpeed Insights
// ---------------------------------------------------------------------------

interface PageSpeedResult {
  mobile?: number;
  desktop?: number;
}

const PAGESPEED_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const PAGESPEED_TIMEOUT_MS = 15_000;

/**
 * Fetch the Lighthouse performance score for the given domain.
 * Returns undefined scores when the API key is missing or the request fails.
 */
async function fetchPageSpeed(domain: string): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn(
      "[scrape-extras] GOOGLE_API_KEY is not set — skipping PageSpeed",
    );
    return {};
  }

  const targetUrl = `https://${domain}`;

  async function fetchScore(
    strategy: "mobile" | "desktop",
  ): Promise<number | undefined> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        PAGESPEED_TIMEOUT_MS,
      );

      const res = await fetch(
        `${PAGESPEED_API}?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&key=${apiKey}`,
        { signal: controller.signal },
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(
          `[scrape-extras] PageSpeed ${strategy} request failed: ${res.status}`,
        );
        return undefined;
      }

      const json = (await res.json()) as {
        lighthouseResult?: {
          categories?: {
            performance?: { score?: number };
          };
        };
      };

      const score = json.lighthouseResult?.categories?.performance?.score;
      // The API returns a 0-1 float; we normalise to 0-100.
      return score != null ? Math.round(score * 100) : undefined;
    } catch (err) {
      console.warn(
        `[scrape-extras] PageSpeed ${strategy} error: ${err instanceof Error ? err.message : err}`,
      );
      return undefined;
    }
  }

  // Fetch both strategies in parallel.
  const [mobile, desktop] = await Promise.all([
    fetchScore("mobile"),
    fetchScore("desktop"),
  ]);

  return { mobile, desktop };
}

// ---------------------------------------------------------------------------
// Social bios (best-effort)
// ---------------------------------------------------------------------------

/**
 * Attempt to retrieve social media bios for the given domain.
 *
 * TODO: Twitter/X and LinkedIn require authentication or headless scraping.
 * Returning empty for now. In a future iteration we can use platform APIs
 * or a dedicated Apify actor.
 */
function fetchSocialBios(
  _domain: string,
): Record<string, string> {
  // TODO: Implement Twitter/X bio scraping (requires auth or Apify actor).
  // TODO: Implement LinkedIn company bio scraping (requires auth or Apify actor).
  return {};
}

// ---------------------------------------------------------------------------
// Hacker News -> news articles
// ---------------------------------------------------------------------------

/**
 * Search Hacker News for recent stories about the company and convert
 * them into the newsArticles format used by the rest of the pipeline.
 */
async function fetchHackerNewsArticles(
  domain: string,
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const companyName = domainToCompanyName(domain);

  try {
    const results: HNResult[] = await searchHackerNews(companyName);

    // Fetch comments for the top 5 stories (by points) to get actual community voice
    const topStories = [...results]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const storiesWithComments = await Promise.all(
      topStories.map(async (r) => {
        let commentText = "";
        if (r.numComments > 0) {
          const comments = await getHNComments(r.objectID);
          if (comments.length > 0) {
            // Strip HTML tags from comments and take first 500 chars each
            const cleanComments = comments
              .map((c) => c.replace(/<[^>]+>/g, "").trim())
              .filter((c) => c.length > 10)
              .slice(0, 5)
              .map((c) => c.slice(0, 500));
            commentText = cleanComments.length > 0
              ? `\nTop comments:\n${cleanComments.map((c) => `  - ${c}`).join("\n")}`
              : "";
          }
        }
        return {
          title: r.title,
          url: r.url,
          snippet: `${r.points} points | ${r.numComments} comments | by ${r.author} | ${r.createdAt}${commentText}`,
        };
      }),
    );

    // Include remaining stories without comments
    const topIds = new Set(topStories.map((s) => s.objectID));
    const remaining = results
      .filter((r) => !topIds.has(r.objectID))
      .map((r) => ({
        title: r.title,
        url: r.url,
        snippet: `${r.points} points | ${r.numComments} comments | by ${r.author} | ${r.createdAt}`,
      }));

    return [...storiesWithComments, ...remaining];
  } catch (err) {
    console.warn(
      `[scrape-extras] HN search error: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Web Archive snapshots
// ---------------------------------------------------------------------------

/**
 * Fetch historical snapshots of the domain from the Wayback Machine.
 */
async function fetchArchiveSnapshots(
  domain: string,
): Promise<ArchiveSnapshot[]> {
  try {
    return await getWebArchiveSnapshots(domain, { limit: 12 });
  } catch (err) {
    console.warn(
      `[scrape-extras] Web Archive error: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pipeline step: scrape supplementary data sources for the given domain.
 *
 * All sources are best-effort with short timeouts. Missing API keys or
 * network errors result in empty/undefined fields — never thrown errors.
 *
 * Note: Tech stack detection is handled separately in detect-tech-stack.ts
 * and merged during the clean-data step. This module returns an empty
 * techStack array as a placeholder.
 */
export async function scrapeExtras(domain: string): Promise<ExtrasData> {
  console.log(`[scrape-extras] Gathering extra data for ${domain}`);

  // Run all data sources in parallel for speed.
  const [pageSpeed, socialBios, newsArticles, archiveSnapshots] =
    await Promise.all([
      fetchPageSpeed(domain),
      Promise.resolve(fetchSocialBios(domain)),
      fetchHackerNewsArticles(domain),
      fetchArchiveSnapshots(domain),
    ]);

  console.log(
    `[scrape-extras] HN articles: ${newsArticles.length}, Archive snapshots: ${archiveSnapshots.length}`,
  );

  return {
    techStack: [], // Populated later by detect-tech-stack.ts in clean-data step.
    pageSpeedMobile: pageSpeed.mobile,
    pageSpeedDesktop: pageSpeed.desktop,
    socialBios,
    newsArticles,
    archiveSnapshots,
  };
}
