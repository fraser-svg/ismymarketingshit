import type {
  CrawlStatus,
  CrawlResultRecord,
  ScrapedPage,
  SourceRecord,
} from "@/lib/types";

function getAccountId(): string {
  return process.env.CLOUDFLARE_ACCOUNT_ID || "";
}

function getApiToken(): string {
  return process.env.CLOUDFLARE_API_TOKEN || "";
}

function getBaseUrl(): string {
  return `https://api.cloudflare.com/client/v4/accounts/${getAccountId()}/browser-rendering/crawl`;
}

interface CrawlOptions {
  limit?: number;
  formats?: string[];
  includePatterns?: string[];
  excludePatterns?: string[];
}

/**
 * The /crawl POST endpoint returns `result` as a plain string (the job ID),
 * not an object. Example: {"success": true, "result": "job-uuid-here"}
 */
interface CrawlInitResponse {
  success: boolean;
  result: string;
  errors?: Array<{ message: string }>;
}

/**
 * Status polling returns the job metadata under `result`.
 */
interface CrawlStatusResponse {
  success: boolean;
  result: {
    status: string;
    finished: number;
    total: number;
  };
  errors?: Array<{ message: string }>;
}

/**
 * Results come back under `result.records` (not `result` directly),
 * with `result.cursor` for pagination.
 */
interface CrawlResultsResponse {
  success: boolean;
  result: {
    records: Array<{
      url: string;
      markdown?: string;
      status: number | string;
    }>;
    cursor?: string;
  };
  errors?: Array<{ message: string }>;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Initiate a crawl job via the Cloudflare Browser Rendering API.
 * Returns the job ID for polling.
 *
 * Note: includePatterns / excludePatterns go inside an `options` object
 * per the API spec, not at the top level.
 */
export async function initiateCrawl(
  url: string,
  options: CrawlOptions = {},
): Promise<string> {
  const { limit = 8, formats = ["markdown"], includePatterns, excludePatterns } =
    options;

  const body: Record<string, unknown> = {
    url,
    limit,
    formats,
  };

  // Patterns belong inside the `options` object
  const crawlOptions: Record<string, unknown> = {};
  if (includePatterns?.length) {
    crawlOptions.includePatterns = includePatterns;
  }
  if (excludePatterns?.length) {
    crawlOptions.excludePatterns = excludePatterns;
  }
  if (Object.keys(crawlOptions).length > 0) {
    body.options = crawlOptions;
  }

  console.log(`[cloudflare] Initiating crawl for ${url} with limit=${limit}`);

  const response = await fetch(getBaseUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Cloudflare crawl initiation failed (${response.status}): ${responseText}`,
    );
  }

  let data: CrawlInitResponse;
  try {
    data = JSON.parse(responseText) as CrawlInitResponse;
  } catch {
    throw new Error(
      `Cloudflare crawl returned unparseable JSON: ${responseText.slice(0, 500)}`,
    );
  }

  console.log(
    `[cloudflare] Crawl initiation response: success=${data.success}, result=${JSON.stringify(data.result)}`,
  );

  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
    throw new Error(`Cloudflare crawl initiation failed: ${msg}`);
  }

  // `result` is the job ID string directly
  const jobId = typeof data.result === "string"
    ? data.result
    : (data.result as unknown as { id: string }).id;

  if (!jobId) {
    throw new Error(
      `Cloudflare crawl returned no job ID. Full response: ${responseText.slice(0, 500)}`,
    );
  }

  console.log(`[cloudflare] Crawl job started: ${jobId}`);
  return jobId;
}

/**
 * Poll the status of an active crawl job.
 * Uses ?limit=1 to minimise payload while checking status.
 */
export async function pollCrawlStatus(jobId: string): Promise<CrawlStatus> {
  const url = `${getBaseUrl()}/${jobId}?limit=1`;

  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Cloudflare crawl status check failed (${response.status}): ${responseText}`,
    );
  }

  let data: CrawlStatusResponse;
  try {
    data = JSON.parse(responseText) as CrawlStatusResponse;
  } catch {
    throw new Error(
      `Cloudflare crawl status returned unparseable JSON: ${responseText.slice(0, 500)}`,
    );
  }

  console.log(
    `[cloudflare] Poll status for ${jobId}: ${JSON.stringify(data.result)}`,
  );

  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
    throw new Error(`Cloudflare crawl status check failed: ${msg}`);
  }

  return {
    status: data.result.status as CrawlStatus["status"],
    finished: data.result.finished,
    total: data.result.total,
  };
}

/**
 * Retrieve all completed crawl results with cursor-based pagination.
 *
 * The results endpoint is the same as the job endpoint but with
 * ?status=completed&limit=50 query params. Records are under
 * `result.records` and the cursor is at `result.cursor`.
 */
export async function getCrawlResults(
  jobId: string,
): Promise<CrawlResultRecord[]> {
  const records: CrawlResultRecord[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      status: "completed",
      limit: "50",
    });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const url = `${getBaseUrl()}/${jobId}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Cloudflare crawl results fetch failed (${response.status}): ${responseText}`,
      );
    }

    let data: CrawlResultsResponse;
    try {
      data = JSON.parse(responseText) as CrawlResultsResponse;
    } catch {
      throw new Error(
        `Cloudflare crawl results returned unparseable JSON: ${responseText.slice(0, 500)}`,
      );
    }

    console.log(
      `[cloudflare] Fetched ${data.result?.records?.length ?? 0} records for job ${jobId}`,
    );

    if (!data.success) {
      const msg =
        data.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
      throw new Error(`Cloudflare crawl results fetch failed: ${msg}`);
    }

    const pageRecords = data.result?.records ?? [];
    if (pageRecords.length === 0) break;

    for (const record of pageRecords) {
      records.push({
        url: record.url,
        markdown: record.markdown ?? "",
        status: typeof record.status === "number" ? record.status : 200,
      });
    }

    cursor = data.result?.cursor ?? undefined;
  } while (cursor);

  return records;
}

/**
 * Infer page type from URL path.
 */
function inferPageType(
  url: string,
): ScrapedPage["type"] {
  const path = new URL(url).pathname.toLowerCase();

  if (path === "/" || path === "") return "homepage";
  if (path.includes("about")) return "about";
  if (path.includes("pricing") || path.includes("plans")) return "pricing";
  if (path.includes("feature")) return "features";
  if (path.includes("blog") || path.includes("post") || path.includes("article"))
    return "blog";

  return "other";
}

/**
 * Wait for the given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract internal links from HTML that look like useful pages.
 * Returns absolute URLs for the same domain.
 */
function extractInternalLinks(html: string, domain: string): string[] {
  const linkRegex = /href=["']([^"']+)["']/gi;
  const seen = new Set<string>();
  const links: string[] = [];

  // Patterns that indicate useful internal pages
  const usefulPatterns = [
    /\/(about|team|company|who-we-are)/i,
    /\/(pricing|plans|packages)/i,
    /\/(features?|product|solutions?|services?)/i,
    /\/(blog|posts?|articles?|news|resources?)/i,
    /\/(contact|support|help)/i,
    /\/(faq|how-it-works|why|mission|values)/i,
    /\/(customers?|testimonials?|case-stud)/i,
    /\/(integrations?|partners?)/i,
  ];

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];

    // Skip anchors, javascript, mailto, tel
    if (
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }

    // Convert relative URLs to absolute
    try {
      const baseUrl = `https://${domain}`;
      const resolved = new URL(href, baseUrl);

      // Only same domain
      if (resolved.hostname !== domain && resolved.hostname !== `www.${domain}`) {
        continue;
      }

      // Remove hash/query for deduplication
      resolved.hash = "";
      resolved.search = "";
      const normalized = resolved.toString().replace(/\/+$/, "");

      if (seen.has(normalized)) continue;
      seen.add(normalized);

      // Check if it matches a useful pattern
      const isUseful = usefulPatterns.some((pattern) =>
        pattern.test(resolved.pathname),
      );
      if (isUseful) {
        links.push(resolved.toString());
      }
    } catch {
      // Malformed URL, skip
    }
  }

  return links;
}

/**
 * Fetch a single page and return its HTML content, or null on failure.
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VoiceGapBot/1.0; +https://voicegap.app)",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[cloudflare] Fallback fetch failed (${response.status}) for ${url}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.warn(
      `[cloudflare] Fallback fetch error for ${url}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Enhanced fallback: fetch the homepage, extract internal links,
 * and fetch additional useful pages (about, pricing, features, blog, etc.).
 */
async function fetchHomepageFallback(domain: string): Promise<ScrapedPage[]> {
  const homepageUrl = `https://${domain}`;
  const pages: ScrapedPage[] = [];
  const now = new Date().toISOString();

  // 1. Fetch homepage
  const homepageHtml = await fetchPage(homepageUrl);
  if (!homepageHtml) {
    console.warn(`[cloudflare] Homepage fallback failed entirely for ${domain}`);
    return [];
  }

  pages.push({
    url: homepageUrl,
    type: "homepage",
    content: homepageHtml,
    sourceRecord: {
      url: homepageUrl,
      content: homepageHtml,
      scrapedAt: now,
      source: "website",
      selector: "fallback-fetch",
    },
  });

  // 2. Extract internal links and fetch up to 7 additional pages
  const internalLinks = extractInternalLinks(homepageHtml, domain);
  console.log(
    `[cloudflare] Fallback found ${internalLinks.length} useful internal links for ${domain}`,
  );

  const maxExtraPages = 7;
  const linksToFetch = internalLinks.slice(0, maxExtraPages);

  // Fetch pages concurrently (but capped)
  const results = await Promise.allSettled(
    linksToFetch.map(async (linkUrl) => {
      const html = await fetchPage(linkUrl);
      if (!html) return null;
      return { url: linkUrl, html };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const { url, html } = result.value;
      const sourceRecord: SourceRecord = {
        url,
        content: html,
        scrapedAt: now,
        source: "website",
        selector: "fallback-fetch",
      };
      pages.push({
        url,
        type: inferPageType(url),
        content: html,
        sourceRecord,
      });
    }
  }

  console.log(
    `[cloudflare] Fallback fetched ${pages.length} total pages for ${domain}`,
  );

  return pages;
}

// ---------------------------------------------------------------------------
// Page filtering & prioritisation
// ---------------------------------------------------------------------------

/** URL path patterns for legal/compliance pages. */
const LEGAL_PATTERNS = [
  /\/(privacy|terms|tos|legal|cookie|gdpr|dmca|disclaimer|acceptable-use)/i,
  /\/(ssa|service-level|sla|data-processing|dpa|compliance|eula)/i,
  /\/(imprint|impressum|agb|datenschutz)/i,
];

/** URL path patterns for high-value pages. */
const HIGH_VALUE_PATTERNS: Array<{ pattern: RegExp; priority: number }> = [
  // Priority 1: About / Team / Company
  { pattern: /\/(about|team|company|who-we-are|our-story|leadership)/i, priority: 1 },
  // Priority 2: Pricing / Plans
  { pattern: /\/(pricing|plans|packages|cost)/i, priority: 2 },
  // Priority 3: Features / Product / Solutions
  { pattern: /\/(features?|product|solutions?|services?|platform|how-it-works)/i, priority: 3 },
  // Priority 4: Blog (we'll cap these separately)
  { pattern: /\/(blog|posts?|articles?|news|resources?)/i, priority: 4 },
  // Priority 5: Contact / Support
  { pattern: /\/(contact|support|help|faq)/i, priority: 5 },
  // Priority 6: Customers / Testimonials / Case studies
  { pattern: /\/(customers?|testimonials?|case-stud|reviews?|success-stor)/i, priority: 6 },
];

/** Check if a URL looks like a non-English page. */
function looksNonEnglish(url: string): boolean {
  const path = new URL(url).pathname;
  // Matches paths starting with a 2-letter language code segment (e.g., /de/, /fr/, /ja/)
  // but excludes common English-language codes
  const langSegment = path.match(/^\/([a-z]{2})(\/|$)/);
  if (!langSegment) return false;
  const code = langSegment[1];
  return !["en", "us", "uk"].includes(code);
}

/** Count the number of path segments (depth) in a URL. */
function pathDepth(url: string): number {
  const path = new URL(url).pathname.replace(/\/+$/, "");
  if (path === "" || path === "/") return 0;
  return path.split("/").filter(Boolean).length;
}

/**
 * Filter and prioritise crawled pages for maximum analysis value.
 *
 * Rules:
 * - Homepage: always kept
 * - High-value pages (about, pricing, features, contact, etc.): kept
 * - Blog posts: keep max 2
 * - Legal/privacy/terms: keep max 1 (for compliance messaging analysis)
 * - Non-English pages: dropped
 * - Deeply nested pages (depth > 3): deprioritised
 */
function filterAndPrioritisePages(pages: ScrapedPage[]): ScrapedPage[] {
  const homepage: ScrapedPage[] = [];
  const highValue: Array<ScrapedPage & { _priority: number }> = [];
  const blogPages: ScrapedPage[] = [];
  const legalPages: ScrapedPage[] = [];
  const otherPages: ScrapedPage[] = [];

  for (const page of pages) {
    const path = new URL(page.url).pathname.toLowerCase();

    // Always keep homepage
    if (path === "/" || path === "") {
      homepage.push(page);
      continue;
    }

    // Drop non-English pages
    if (looksNonEnglish(page.url)) {
      console.log(`[cloudflare] Filtered out non-English page: ${page.url}`);
      continue;
    }

    // Categorise legal pages
    if (LEGAL_PATTERNS.some((p) => p.test(path))) {
      legalPages.push(page);
      continue;
    }

    // Check for high-value patterns
    let matched = false;
    for (const { pattern, priority } of HIGH_VALUE_PATTERNS) {
      if (pattern.test(path)) {
        if (priority === 4) {
          // Blog — goes into its own bucket
          blogPages.push(page);
        } else {
          highValue.push({ ...page, _priority: priority });
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      otherPages.push(page);
    }
  }

  // Sort high-value by priority, then by path depth (shallower first)
  highValue.sort((a, b) => a._priority - b._priority || pathDepth(a.url) - pathDepth(b.url));

  // Sort other pages by depth (shallower = more useful)
  otherPages.sort((a, b) => pathDepth(a.url) - pathDepth(b.url));

  // Build the final list
  const result: ScrapedPage[] = [
    ...homepage,
    ...highValue.map(({ _priority, ...page }) => page as ScrapedPage),
    ...blogPages.slice(0, 2),               // max 2 blog posts
    ...legalPages.slice(0, 1),               // max 1 legal page
    ...otherPages.filter((p) => pathDepth(p.url) <= 3), // skip deeply nested
  ];

  const dropped = pages.length - result.length;
  if (dropped > 0) {
    console.log(
      `[cloudflare] Page filter: kept ${result.length}/${pages.length} pages (dropped ${dropped} low-value pages)`,
    );
  }

  return result;
}

/**
 * Scrape a website using the Cloudflare Browser Rendering crawl API.
 *
 * Orchestrates the full crawl lifecycle:
 * 1. Initiates a crawl job
 * 2. Polls for completion (5s interval, 60s timeout)
 * 3. Retrieves and maps results
 * 4. Falls back to multi-page simple fetch on failure
 */
export async function scrapeWebsite(domain: string): Promise<ScrapedPage[]> {
  const targetUrl = `https://${domain}`;
  const POLL_INTERVAL_MS = 5_000;
  const TIMEOUT_MS = 60_000;

  let jobId: string;

  try {
    jobId = await initiateCrawl(targetUrl, {
      limit: 8,
      formats: ["markdown"],
    });
  } catch (error) {
    console.error(
      `[cloudflare] Failed to initiate crawl for ${domain}:`,
      error instanceof Error ? error.message : error,
    );
    return fetchHomepageFallback(domain);
  }

  // Poll until complete or timeout
  const startTime = Date.now();

  try {
    while (true) {
      await delay(POLL_INTERVAL_MS);

      const status = await pollCrawlStatus(jobId);

      if (status.status === "completed") break;
      if (status.status === "failed") {
        console.warn(`[cloudflare] Crawl job ${jobId} failed for ${domain}`);
        return fetchHomepageFallback(domain);
      }

      if (Date.now() - startTime > TIMEOUT_MS) {
        console.warn(
          `[cloudflare] Crawl job ${jobId} timed out after ${TIMEOUT_MS}ms for ${domain}`,
        );
        return fetchHomepageFallback(domain);
      }
    }
  } catch (error) {
    console.error(
      `[cloudflare] Error polling crawl status for ${domain}:`,
      error instanceof Error ? error.message : error,
    );
    return fetchHomepageFallback(domain);
  }

  // Retrieve results
  let records: CrawlResultRecord[];

  try {
    records = await getCrawlResults(jobId);
  } catch (error) {
    console.error(
      `[cloudflare] Failed to retrieve crawl results for ${domain}:`,
      error instanceof Error ? error.message : error,
    );
    return fetchHomepageFallback(domain);
  }

  if (records.length === 0) {
    console.warn(
      `[cloudflare] Crawl returned 0 results for ${domain}, trying fallback`,
    );
    return fetchHomepageFallback(domain);
  }

  // Map records to ScrapedPage[]
  const now = new Date().toISOString();

  const pages = records.map((record) => {
    const sourceRecord: SourceRecord = {
      url: record.url,
      content: record.markdown,
      scrapedAt: now,
      source: "website",
    };

    return {
      url: record.url,
      type: inferPageType(record.url),
      content: record.markdown,
      sourceRecord,
    };
  });

  return filterAndPrioritisePages(pages);
}
