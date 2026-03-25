const APIFY_BASE_URL = "https://api.apify.com/v2";

/** Polling interval and timeout for Apify actor runs. */
const POLL_INTERVAL_MS = 3_000;
const RUN_TIMEOUT_MS = 30_000;
/** Extended timeout for actors known to be slower (G2, Google Business). */
const EXTENDED_TIMEOUT_MS = 60_000;

/** Actor IDs for each review platform (verified against Apify store). */
const ACTORS = {
  g2: "zen-studio/g2-reviews-scraper",
  trustpilot: "agents/trustpilot-reviews",
  capterra: "imadjourney/capterra-reviews-scraper",
  googleBusiness: "compass/Google-Maps-Reviews-Scraper",
  reddit: "trudax/reddit-scraper-lite",
  twitter: "apidojo/tweet-scraper",
  glassdoor: "memo23/apify-glassdoor-reviews-scraper",
  facebook: "apify/facebook-reviews-scraper",
  yelp: "tri_angle/yelp-scraper",
  productHunt: "danpoletaev/product-hunt-scraper",
  appStore: "agents/appstore-reviews",
  googlePlay: "neatrat/google-play-store-reviews-scraper",
  linkedin: "bebity/linkedin-premium-actor",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewCategory =
  | "customer_review"
  | "social_mention"
  | "employee_review"
  | "company_profile";

export interface Review {
  platform: string;
  category: ReviewCategory;
  author: string;
  date: string;
  rating: number; // 0 for unrated (reddit, twitter, linkedin, product hunt)
  text: string;
  pros?: string;
  cons?: string;
  sourceUrl: string;
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyRunStatusResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiToken(): string | undefined {
  return process.env.APIFY_API_TOKEN;
}

/**
 * Derive a human-readable company name from a domain.
 *
 * Examples:
 *   stripe.com        -> "Stripe"
 *   hubspot.com       -> "Hubspot"
 *   my-company.co.uk  -> "My Company"
 *   www.acme-corp.com -> "Acme Corp"
 */
export function domainToCompanyName(domain: string): string {
  const stripped = domain.replace(/^www\./, "");
  // Take the part before the first dot
  const raw = stripped.split(".")[0];
  // Split on hyphens and underscores, capitalize each word
  return raw
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Derive a URL-safe slug from the domain (e.g. "acme.com" -> "acme"). */
function companySlug(domain: string): string {
  return domain.replace(/^www\./, "").split(".")[0].toLowerCase();
}

/** Derive a hyphenated slug from the domain (e.g. "my-company.com" -> "my-company"). */
function companyHyphenSlug(domain: string): string {
  return domain.replace(/^www\./, "").split(".")[0].toLowerCase();
}

/**
 * Extract a field value from an Apify result item, trying multiple possible field names.
 * Returns the first non-empty match, or the fallback.
 */
function extractField(
  item: Record<string, unknown>,
  fields: string[],
  fallback: string = "",
): string {
  for (const field of fields) {
    const val = item[field];
    if (val != null && String(val).trim() !== "") return String(val);
  }
  return fallback;
}

function extractNumber(
  item: Record<string, unknown>,
  fields: string[],
  fallback: number = 0,
): number {
  for (const field of fields) {
    const val = item[field];
    if (val != null) {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
  }
  return fallback;
}

/** Start an Apify actor run and return the run ID + dataset ID. */
async function startActorRun(
  actorId: string,
  input: Record<string, unknown>,
): Promise<{ runId: string; datasetId: string }> {
  const token = getApiToken();
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const res = await fetch(
    `${APIFY_BASE_URL}/acts/${actorId.replace("/", "~")}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Apify startActorRun failed: ${res.status} ${res.statusText}`,
    );
  }

  const json = (await res.json()) as ApifyRunResponse;
  return {
    runId: json.data.id,
    datasetId: json.data.defaultDatasetId,
  };
}

/** Poll until the actor run succeeds, fails, or the timeout elapses. */
async function waitForRun(
  runId: string,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<string> {
  const token = getApiToken();
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`,
    );

    if (!res.ok) {
      throw new Error(
        `Apify waitForRun failed: ${res.status} ${res.statusText}`,
      );
    }

    const json = (await res.json()) as ApifyRunStatusResponse;
    const { status } = json.data;

    if (status === "SUCCEEDED") return json.data.defaultDatasetId;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${runId} ended with status: ${status}`);
    }

    // Still running — wait before polling again.
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Apify run ${runId} timed out after ${timeoutMs}ms`);
}

/** Fetch all items from an Apify dataset. */
async function getDatasetItems<T = Record<string, unknown>>(
  datasetId: string,
): Promise<T[]> {
  const token = getApiToken();
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const res = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`,
  );

  if (!res.ok) {
    throw new Error(
      `Apify getDatasetItems failed: ${res.status} ${res.statusText}`,
    );
  }

  return (await res.json()) as T[];
}

/**
 * Run a scraper with a hard timeout. Returns empty array on any failure.
 */
async function runWithTimeout(
  name: string,
  fn: () => Promise<Review[]>,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<Review[]> {
  return Promise.race([
    fn(),
    new Promise<Review[]>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Platform-specific scrapers
// ---------------------------------------------------------------------------

// ---- Review Platforms (customer_review) ----

async function scrapeG2Reviews(domain: string): Promise<Review[]> {
  const slug = companyHyphenSlug(domain);
  // zen-studio actor expects `url` field, not `startUrls`
  const input = {
    url: `https://www.g2.com/products/${slug}/reviews`,
    maxReviews: 50,
  };

  const { runId } = await startActorRun(ACTORS.g2, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "g2",
    category: "customer_review" as const,
    // zen-studio actor: reviewerName, date, starRating, text, markdownContent
    author: extractField(item, ["reviewerName", "reviewer_name", "author"], "Anonymous"),
    date: extractField(item, ["date", "publish_date", "datePublished"]),
    rating: extractNumber(item, ["starRating", "review_rating", "rating"]),
    text: extractField(item, ["text", "markdownContent", "review_content", "reviewText"]),
    pros: extractField(item, ["pros"]) || undefined,
    cons: extractField(item, ["cons"]) || undefined,
    sourceUrl: extractField(item, ["url", "review_link", "link"], `https://www.g2.com/products/${slug}/reviews`),
  })).filter((r) => r.text.trim().length > 0);
}

async function scrapeTrustpilotReviews(domain: string): Promise<Review[]> {
  const cleanDomain = domain.replace(/^www\./, "");
  const input = {
    startUrls: [
      { url: `https://www.trustpilot.com/review/${cleanDomain}` },
    ],
    maxReviews: 50,
  };

  const { runId } = await startActorRun(ACTORS.trustpilot, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "trustpilot",
    category: "customer_review" as const,
    author: extractField(item, ["author", "name", "reviewerName"], "Anonymous"),
    date: extractField(item, ["date", "datePublished", "createdAt"]),
    rating: extractNumber(item, ["rating", "stars", "score"]),
    text: extractField(item, ["text", "reviewBody", "title"]),
    pros: extractField(item, ["pros"]) || undefined,
    cons: extractField(item, ["cons"]) || undefined,
    sourceUrl: extractField(
      item,
      ["url", "link"],
      `https://www.trustpilot.com/review/${cleanDomain}`,
    ),
  }));
}

async function scrapeCapterraReviews(domain: string): Promise<Review[]> {
  const slug = companySlug(domain);
  const input = {
    startUrls: [{ url: `https://www.capterra.com/p/${slug}/reviews` }],
    maxReviews: 50,
  };

  const { runId } = await startActorRun(ACTORS.capterra, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "capterra",
    category: "customer_review" as const,
    author: extractField(item, ["author", "reviewerName", "user_name"], "Anonymous"),
    date: extractField(item, ["date", "datePublished", "createdAt"]),
    rating: extractNumber(item, ["rating", "overallRating", "score"]),
    text: extractField(item, ["text", "reviewText", "title", "body"]),
    pros: extractField(item, ["pros"]) || undefined,
    cons: extractField(item, ["cons"]) || undefined,
    sourceUrl: extractField(
      item,
      ["url", "link"],
      `https://www.capterra.com/p/${slug}/reviews`,
    ),
  }));
}

async function scrapeGoogleBusinessReviews(domain: string): Promise<Review[]> {
  const companyName = domainToCompanyName(domain);
  const input = {
    startUrls: [{ url: `https://www.google.com/maps/search/${encodeURIComponent(companyName)}` }],
    maxReviewsPerPlace: 20,
    reviewsSortBy: "newest",
  };

  const { runId } = await startActorRun(ACTORS.googleBusiness, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "google_business",
    category: "customer_review" as const,
    author: extractField(item, ["reviewerName", "author", "name"], "Anonymous"),
    date: extractField(item, ["publishedAtDate", "date", "publishAt"]),
    rating: extractNumber(item, ["stars", "rating", "score"]),
    text: extractField(item, ["text", "reviewText", "snippet"]),
    sourceUrl: extractField(item, ["reviewUrl", "url"]),
  })).filter((r) => r.text.trim().length > 0);
}

async function scrapeFacebookReviews(domain: string): Promise<Review[]> {
  const slug = companySlug(domain);
  // apify/facebook-reviews-scraper requires trailing slash on URLs
  const input = {
    startUrls: [{ url: `https://www.facebook.com/${slug}/reviews/` }],
  };

  const { runId } = await startActorRun(ACTORS.facebook, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "facebook",
    category: "customer_review" as const,
    author: String(item.reviewerName ?? item.author ?? "Anonymous"),
    date: String(item.date ?? item.timestamp ?? ""),
    rating: Number(item.rating ?? 0),
    text: String(item.text ?? item.reviewText ?? ""),
    sourceUrl: String(item.url ?? `https://www.facebook.com/${slug}/reviews`),
  }));
}

async function scrapeYelpReviews(domain: string): Promise<Review[]> {
  const slug = companyHyphenSlug(domain);
  const input = {
    startUrls: [{ url: `https://www.yelp.com/biz/${slug}` }],
    maxItems: 20,
  };

  const { runId } = await startActorRun(ACTORS.yelp, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "yelp",
    category: "customer_review" as const,
    author: String(item.reviewerName ?? item.author ?? "Anonymous"),
    date: String(item.date ?? item.datePublished ?? ""),
    rating: Number(item.rating ?? 0),
    text: String(item.text ?? item.reviewText ?? ""),
    sourceUrl: String(item.url ?? `https://www.yelp.com/biz/${slug}`),
  }));
}

async function scrapeAppStoreReviews(domain: string): Promise<Review[]> {
  const companyName = domainToCompanyName(domain);
  const input = {
    searchTerm: companyName,
    maxReviews: 20,
  };

  const { runId } = await startActorRun(ACTORS.appStore, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "app_store",
    category: "customer_review" as const,
    author: String(item.author ?? item.userName ?? "Anonymous"),
    date: String(item.date ?? item.updated ?? ""),
    rating: Number(item.rating ?? item.score ?? 0),
    text: String(item.text ?? item.review ?? item.content ?? ""),
    sourceUrl: String(item.url ?? ""),
  }));
}

async function scrapeGooglePlayReviews(domain: string): Promise<Review[]> {
  const companyName = domainToCompanyName(domain);
  // neatrat actor expects `appIdOrUrl` field
  const input = {
    appIdOrUrl: `https://play.google.com/store/search?q=${encodeURIComponent(companyName)}&c=apps`,
  };

  const { runId } = await startActorRun(ACTORS.googlePlay, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "google_play",
    category: "customer_review" as const,
    author: String(item.author ?? item.userName ?? "Anonymous"),
    date: String(item.date ?? item.at ?? ""),
    rating: Number(item.score ?? item.rating ?? 0),
    text: String(item.text ?? item.content ?? ""),
    sourceUrl: String(item.url ?? ""),
  }));
}

// ---- Social Mentions (social_mention) ----

async function scrapeRedditMentions(domain: string): Promise<Review[]> {
  const companyName = domainToCompanyName(domain);
  const input = {
    searchTerm: companyName,
    maxPostCount: 10,
    maxComments: 5,
  };

  const { runId } = await startActorRun(ACTORS.reddit, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => {
    const comments = Array.isArray(item.comments)
      ? (item.comments as Array<Record<string, unknown>>)
          .slice(0, 5)
          .map((c) => String(c.text ?? c.body ?? ""))
          .filter(Boolean)
          .join("\n---\n")
      : "";

    const bodyText = String(item.body ?? item.selftext ?? item.text ?? "");
    const title = String(item.title ?? "");
    const fullText = [title, bodyText, comments ? `Top comments:\n${comments}` : ""]
      .filter(Boolean)
      .join("\n\n");

    return {
      platform: "reddit",
      category: "social_mention" as const,
      author: String(item.author ?? item.username ?? "Anonymous"),
      date: String(item.createdAt ?? item.date ?? ""),
      rating: 0,
      text: fullText,
      sourceUrl: String(item.url ?? item.permalink ?? ""),
    };
  });
}

async function scrapeTwitterMentions(domain: string): Promise<Review[]> {
  const companyName = domainToCompanyName(domain);
  const input = {
    searchTerms: [companyName],
    maxTweets: 20,
    sort: "Latest",
  };

  const { runId } = await startActorRun(ACTORS.twitter, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "twitter",
    category: "social_mention" as const,
    author: String(item.author ?? item.userName ?? item.screen_name ?? "Anonymous"),
    date: String(item.createdAt ?? item.date ?? item.timestamp ?? ""),
    rating: 0,
    text: String(item.text ?? item.full_text ?? item.tweet ?? ""),
    sourceUrl: String(item.url ?? item.tweetUrl ?? ""),
  }));
}

// ---- Employee Voice (employee_review) ----

async function scrapeGlassdoorReviews(domain: string): Promise<Review[]> {
  const slug = companyHyphenSlug(domain);
  const input = {
    companyUrls: [`https://www.glassdoor.com/Reviews/${slug}-reviews.htm`],
    maxReviews: 20,
  };

  const { runId } = await startActorRun(ACTORS.glassdoor, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => ({
    platform: "glassdoor",
    category: "employee_review" as const,
    author: String(item.jobTitle ?? item.author ?? "Employee"),
    date: String(item.date ?? item.datePublished ?? ""),
    rating: Number(item.overallRating ?? item.rating ?? 0),
    text: String(item.summary ?? item.text ?? item.reviewText ?? ""),
    pros: item.pros ? String(item.pros) : undefined,
    cons: item.cons ? String(item.cons) : undefined,
    sourceUrl: String(
      item.url ?? `https://www.glassdoor.com/Reviews/${slug}-reviews.htm`,
    ),
  }));
}

// ---- Company Profile (company_profile) ----

async function scrapeProductHunt(domain: string): Promise<Review[]> {
  const slug = companyHyphenSlug(domain);
  const input = {
    startUrls: [{ url: `https://www.producthunt.com/products/${slug}` }],
  };

  const { runId } = await startActorRun(ACTORS.productHunt, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => {
    const parts = [
      item.name ? `Product: ${String(item.name)}` : "",
      item.tagline ? `Tagline: ${String(item.tagline)}` : "",
      item.description ? String(item.description) : "",
      item.votesCount ? `Votes: ${String(item.votesCount)}` : "",
    ].filter(Boolean);

    return {
      platform: "producthunt",
      category: "company_profile" as const,
      author: String(item.makerName ?? item.author ?? ""),
      date: String(item.featuredAt ?? item.date ?? ""),
      rating: 0,
      text: parts.join("\n"),
      sourceUrl: String(item.url ?? `https://www.producthunt.com/products/${slug}`),
    };
  });
}

async function scrapeLinkedInProfile(domain: string): Promise<Review[]> {
  const slug = companyHyphenSlug(domain);
  const input = {
    urls: [`https://www.linkedin.com/company/${slug}`],
  };

  const { runId } = await startActorRun(ACTORS.linkedin, input);
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems<Record<string, unknown>>(datasetId);

  return items.map((item) => {
    const parts = [
      item.name ? `Company: ${String(item.name)}` : "",
      item.tagline ? `Tagline: ${String(item.tagline)}` : "",
      item.description ? String(item.description) : "",
      item.industry ? `Industry: ${String(item.industry)}` : "",
      item.employeeCount ? `Employees: ${String(item.employeeCount)}` : "",
      item.specialties ? `Specialties: ${String(item.specialties)}` : "",
    ].filter(Boolean);

    return {
      platform: "linkedin",
      category: "company_profile" as const,
      author: "",
      date: "",
      rating: 0,
      text: parts.join("\n"),
      sourceUrl: String(item.url ?? `https://www.linkedin.com/company/${slug}`),
    };
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScrapeReviewsResult {
  reviews: Review[];
  platforms: string[];
  summary: Record<string, number>;
}

/**
 * Scrape reviews from multiple platforms for a given domain.
 *
 * Returns empty results gracefully when APIFY_API_TOKEN is not set or when
 * individual platform scrapers fail. All platforms run in parallel.
 */
export async function scrapeReviews(
  domain: string,
): Promise<ScrapeReviewsResult> {
  const token = getApiToken();
  if (!token) {
    console.warn(
      "[apify] APIFY_API_TOKEN is not set — skipping review scraping",
    );
    return { reviews: [], platforms: [], summary: {} };
  }

  // All platform scrapers, grouped by category for clarity but run in parallel.
  // Some actors (G2, Google Business) are slower and get an extended timeout.
  const scrapers: Array<{ name: string; fn: () => Promise<Review[]>; timeout: number }> = [
    // Review platforms (customer_review)
    { name: "g2", fn: () => scrapeG2Reviews(domain), timeout: EXTENDED_TIMEOUT_MS },
    { name: "trustpilot", fn: () => scrapeTrustpilotReviews(domain), timeout: RUN_TIMEOUT_MS },
    { name: "capterra", fn: () => scrapeCapterraReviews(domain), timeout: RUN_TIMEOUT_MS },
    { name: "google_business", fn: () => scrapeGoogleBusinessReviews(domain), timeout: EXTENDED_TIMEOUT_MS },
    { name: "facebook", fn: () => scrapeFacebookReviews(domain), timeout: RUN_TIMEOUT_MS },
    { name: "yelp", fn: () => scrapeYelpReviews(domain), timeout: RUN_TIMEOUT_MS },
    { name: "app_store", fn: () => scrapeAppStoreReviews(domain), timeout: RUN_TIMEOUT_MS },
    { name: "google_play", fn: () => scrapeGooglePlayReviews(domain), timeout: RUN_TIMEOUT_MS },
    // Social mentions (social_mention)
    { name: "reddit", fn: () => scrapeRedditMentions(domain), timeout: RUN_TIMEOUT_MS },
    { name: "twitter", fn: () => scrapeTwitterMentions(domain), timeout: EXTENDED_TIMEOUT_MS },
    // Employee voice (employee_review)
    { name: "glassdoor", fn: () => scrapeGlassdoorReviews(domain), timeout: RUN_TIMEOUT_MS },
    // Company profiles (company_profile)
    { name: "producthunt", fn: () => scrapeProductHunt(domain), timeout: RUN_TIMEOUT_MS },
    { name: "linkedin", fn: () => scrapeLinkedInProfile(domain), timeout: RUN_TIMEOUT_MS },
  ];

  const results = await Promise.allSettled(
    scrapers.map(async (scraper) => {
      const reviews = await runWithTimeout(scraper.name, scraper.fn, scraper.timeout);
      return { name: scraper.name, reviews };
    }),
  );

  const allReviews: Review[] = [];
  const succeededPlatforms: string[] = [];
  const summary: Record<string, number> = {};

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { name, reviews } = result.value;
      summary[name] = reviews.length;
      allReviews.push(...reviews);
      if (reviews.length > 0) {
        succeededPlatforms.push(name);
      }
      console.log(`[apify] ${name}: ${reviews.length} results`);
    } else {
      // Find which scraper this was from the error message or index
      console.warn(`[apify] Platform scraper failed: ${result.reason}`);
    }
  }

  console.log(
    `[apify] Scraping complete: ${allReviews.length} total results from ${succeededPlatforms.length}/${scrapers.length} platforms`,
  );
  console.log(
    `[apify] Platforms with results: ${succeededPlatforms.join(", ") || "none"}`,
  );

  return { reviews: allReviews, platforms: succeededPlatforms, summary };
}
