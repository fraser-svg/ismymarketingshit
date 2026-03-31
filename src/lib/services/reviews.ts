/**
 * Direct review scraping module — replaces Apify dependency.
 *
 * Each scraper fetches HTML/JSON directly and parses it without external
 * dependencies (no cheerio — uses regex/string parsing).  Every individual
 * scraper catches all errors and returns an empty array on failure.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HTTP_TIMEOUT_MS = 30_000;
const BROWSER_TIMEOUT_MS = 60_000;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BOT_UA = "ismypositioningshit/1.0";

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

export interface ScrapeReviewsResult {
  reviews: Review[];
  platforms: string[];
  summary: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const raw = stripped.split(".")[0];
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
 * Extract a field value from a record, trying multiple possible field names.
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

// ---------------------------------------------------------------------------
// Timeout wrapper
// ---------------------------------------------------------------------------

/**
 * Run a scraper with a hard timeout. Returns empty array on any failure.
 */
async function runWithTimeout(
  name: string,
  fn: () => Promise<Review[]>,
  timeoutMs: number,
): Promise<Review[]> {
  try {
    return await Promise.race([
      fn(),
      new Promise<Review[]>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${name} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  } catch (error) {
    console.warn(
      `[reviews] ${name} failed:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Individual scrapers
// ---------------------------------------------------------------------------

// ---- Trustpilot (customer_review) ----

async function scrapeTrustpilotReviews(domain: string): Promise<Review[]> {
  try {
    const cleanDomain = domain.replace(/^www\./, "");
    const url = `https://www.trustpilot.com/review/${cleanDomain}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[reviews] Trustpilot returned ${res.status} for ${cleanDomain}`);
      return [];
    }

    const html = await res.text();

    // Extract __NEXT_DATA__ JSON
    const nextDataMatch = html.match(
      /<script\s+id="__NEXT_DATA__"\s+type="application\/json">\s*([\s\S]*?)\s*<\/script>/,
    );

    if (!nextDataMatch?.[1]) {
      console.warn("[reviews] Trustpilot: __NEXT_DATA__ not found");
      return [];
    }

    let nextData: Record<string, unknown>;
    try {
      nextData = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
    } catch {
      console.warn("[reviews] Trustpilot: failed to parse __NEXT_DATA__");
      return [];
    }

    // Navigate to reviews array — typically at props.pageProps.reviews
    const props = nextData.props as Record<string, unknown> | undefined;
    const pageProps = props?.pageProps as Record<string, unknown> | undefined;
    const reviews = pageProps?.reviews as Array<Record<string, unknown>> | undefined;

    if (!Array.isArray(reviews) || reviews.length === 0) {
      console.warn("[reviews] Trustpilot: no reviews found in __NEXT_DATA__");
      return [];
    }

    return reviews
      .map((r): Review | null => {
        // Author may be nested under consumer object
        const consumer = r.consumer as Record<string, unknown> | undefined;
        const author =
          (consumer?.displayName as string) ??
          extractField(r, ["author", "name", "reviewerName"], "Anonymous");

        const dates = r.dates as Record<string, unknown> | undefined;
        const date =
          (dates?.publishedDate as string) ??
          (dates?.experiencedDate as string) ??
          extractField(r, ["date", "datePublished", "createdAt"]);

        const rating = extractNumber(r, ["rating", "stars", "score"]);

        const title = extractField(r, ["title"]);
        const body = extractField(r, ["text", "reviewBody"]);
        const text = [title, body].filter(Boolean).join("\n");

        if (!text.trim()) return null;

        const reviewId = extractField(r, ["id"]);
        const sourceUrl = reviewId
          ? `https://www.trustpilot.com/reviews/${reviewId}`
          : `https://www.trustpilot.com/review/${cleanDomain}`;

        return {
          platform: "trustpilot",
          category: "customer_review",
          author: author || "Anonymous",
          date: date || "",
          rating,
          text,
          sourceUrl,
        };
      })
      .filter((r): r is Review => r !== null);
  } catch (error) {
    console.warn(
      "[reviews] Trustpilot scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Reddit (social_mention) ----

async function scrapeRedditMentions(domain: string): Promise<Review[]> {
  try {
    const companyName = domainToCompanyName(domain);
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(companyName)}&sort=relevance&limit=10`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BOT_UA,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[reviews] Reddit returned ${res.status}`);
      return [];
    }

    const json = (await res.json()) as Record<string, unknown>;
    const data = json.data as Record<string, unknown> | undefined;
    const children = data?.children as Array<Record<string, unknown>> | undefined;

    if (!Array.isArray(children) || children.length === 0) {
      console.warn("[reviews] Reddit: no results found");
      return [];
    }

    return children
      .map((child): Review | null => {
        const post = child.data as Record<string, unknown> | undefined;
        if (!post) return null;

        const author = String(post.author ?? "Anonymous");
        const createdUtc = post.created_utc as number | undefined;
        const date = createdUtc
          ? new Date(createdUtc * 1000).toISOString()
          : "";

        const title = String(post.title ?? "");
        const selftext = String(post.selftext ?? "");
        const text = [title, selftext].filter(Boolean).join("\n\n");

        if (!text.trim()) return null;

        const permalink = post.permalink as string | undefined;
        const sourceUrl = permalink
          ? `https://www.reddit.com${permalink}`
          : "";

        return {
          platform: "reddit",
          category: "social_mention",
          author: author === "[deleted]" ? "Anonymous" : author,
          date,
          rating: 0,
          text,
          sourceUrl,
        };
      })
      .filter((r): r is Review => r !== null);
  } catch (error) {
    console.warn(
      "[reviews] Reddit scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Yelp (customer_review) ----

async function scrapeYelpReviews(domain: string): Promise<Review[]> {
  try {
    const slug = companyHyphenSlug(domain);
    const url = `https://www.yelp.com/biz/${slug}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[reviews] Yelp returned ${res.status} for ${slug}`);
      return [];
    }

    const html = await res.text();

    // Yelp embeds review data in server-rendered HTML.
    // Look for JSON-LD review data first.
    const jsonLdMatches = html.match(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonStr = match.replace(
          /<script\s+type="application\/ld\+json">/,
          "",
        ).replace(/<\/script>/, "");

        try {
          const ld = JSON.parse(jsonStr) as Record<string, unknown>;

          // Look for LocalBusiness or Organization with review array
          const reviewArray = ld.review as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(reviewArray) && reviewArray.length > 0) {
            return reviewArray
              .slice(0, 20)
              .map((r): Review | null => {
                const authorObj = r.author as Record<string, unknown> | undefined;
                const author = String(
                  authorObj?.name ?? r.author ?? "Anonymous",
                );
                const date = String(r.datePublished ?? "");
                const ratingValue = r.reviewRating as Record<string, unknown> | undefined;
                const rating = Number(ratingValue?.ratingValue ?? 0);
                const text = String(r.description ?? r.reviewBody ?? "");

                if (!text.trim()) return null;

                return {
                  platform: "yelp",
                  category: "customer_review",
                  author,
                  date,
                  rating,
                  text,
                  sourceUrl: `https://www.yelp.com/biz/${slug}`,
                };
              })
              .filter((r): r is Review => r !== null);
          }
        } catch {
          // Not valid JSON or not the right LD block, continue
        }
      }
    }

    // Fallback: try to extract review text from HTML using regex patterns
    // Yelp renders review comments inside specific markup patterns
    const reviewPattern =
      /<p[^>]*(?:class="[^"]*comment[^"]*")[^>]*>([\s\S]*?)<\/p>/gi;
    const reviews: Review[] = [];
    let match: RegExpExecArray | null;

    while ((match = reviewPattern.exec(html)) !== null && reviews.length < 20) {
      const rawText = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .trim();

      if (rawText.length > 20) {
        reviews.push({
          platform: "yelp",
          category: "customer_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text: rawText,
          sourceUrl: `https://www.yelp.com/biz/${slug}`,
        });
      }
    }

    return reviews;
  } catch (error) {
    console.warn(
      "[reviews] Yelp scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- LinkedIn (company_profile) ----

async function scrapeLinkedInProfile(domain: string): Promise<Review[]> {
  try {
    const slug = companyHyphenSlug(domain);
    const url = `https://www.linkedin.com/company/${slug}/`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[reviews] LinkedIn returned ${res.status} for ${slug}`);
      return [];
    }

    const html = await res.text();

    // Look for application/ld+json containing Organization schema
    const jsonLdMatches = html.match(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );

    if (!jsonLdMatches) {
      console.warn("[reviews] LinkedIn: no ld+json found");
      return [];
    }

    for (const match of jsonLdMatches) {
      const jsonStr = match
        .replace(/<script\s+type="application\/ld\+json">/, "")
        .replace(/<\/script>/, "");

      try {
        const ld = JSON.parse(jsonStr) as Record<string, unknown>;

        // Check for Organization or similar type
        const type = String(ld["@type"] ?? "");
        if (
          !type.includes("Organization") &&
          !type.includes("Corporation") &&
          !type.includes("LocalBusiness")
        ) {
          continue;
        }

        const name = String(ld.name ?? "");
        const description = String(ld.description ?? "");
        const industry = extractField(
          ld as Record<string, unknown>,
          ["industry", "knowsAbout"],
        );

        const parts = [
          name ? `Company: ${name}` : "",
          description ? description : "",
          industry ? `Industry: ${industry}` : "",
        ].filter(Boolean);

        if (parts.length === 0) continue;

        return [
          {
            platform: "linkedin",
            category: "company_profile" as const,
            author: "",
            date: "",
            rating: 0,
            text: parts.join("\n"),
            sourceUrl: `https://www.linkedin.com/company/${slug}/`,
          },
        ];
      } catch {
        // Not valid JSON, continue
      }
    }

    console.warn("[reviews] LinkedIn: no Organization ld+json found");
    return [];
  } catch (error) {
    console.warn(
      "[reviews] LinkedIn scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cloudflare Browser Rendering helper
// ---------------------------------------------------------------------------

const ALLOWED_RENDER_HOSTS = new Set([
  "www.g2.com",
  "www.capterra.com",
  "www.google.com",
  "www.facebook.com",
  "www.glassdoor.com",
]);

async function renderWithCloudflare(url: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    console.warn("[reviews] Cloudflare credentials not set — skipping browser render");
    return "";
  }

  // SSRF prevention: only render URLs on known review platforms
  try {
    const hostname = new URL(url).hostname;
    if (!ALLOWED_RENDER_HOSTS.has(hostname)) {
      console.warn(`[reviews] Blocked render for disallowed host: ${hostname}`);
      return "";
    }
  } catch {
    console.warn(`[reviews] Invalid URL passed to renderWithCloudflare: ${url}`);
    return "";
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/content`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, renderJs: true }),
      signal: AbortSignal.timeout(BROWSER_TIMEOUT_MS),
    },
  );

  if (!res.ok) {
    console.warn(`[reviews] Cloudflare render failed (${res.status}) for ${url}`);
    return "";
  }

  return res.text();
}

// ---------------------------------------------------------------------------
// Browser-rendered scrapers (Cloudflare Browser Rendering)
// ---------------------------------------------------------------------------

/** Strip HTML tags and decode common entities. */
function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ---- G2 (customer_review) ----

async function scrapeG2Reviews(domain: string): Promise<Review[]> {
  try {
    const slug = companyHyphenSlug(domain);
    const url = `https://www.g2.com/products/${slug}/reviews`;
    const html = await renderWithCloudflare(url);
    if (!html) return [];

    const reviews: Review[] = [];

    // Try JSON-LD first — G2 sometimes embeds structured review data
    const jsonLdMatches = html.match(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match
            .replace(/<script\s+type="application\/ld\+json">/, "")
            .replace(/<\/script>/, "");
          const ld = JSON.parse(jsonStr) as Record<string, unknown>;
          const reviewArray = ld.review as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(reviewArray) && reviewArray.length > 0) {
            for (const r of reviewArray.slice(0, 20)) {
              const authorObj = r.author as Record<string, unknown> | undefined;
              const author = String(authorObj?.name ?? r.author ?? "Anonymous");
              const date = String(r.datePublished ?? "");
              const ratingObj = r.reviewRating as Record<string, unknown> | undefined;
              const rating = Number(ratingObj?.ratingValue ?? 0);
              const body = String(r.reviewBody ?? r.description ?? "");
              if (!body.trim()) continue;
              reviews.push({
                platform: "g2",
                category: "customer_review",
                author,
                date,
                rating,
                text: body,
                sourceUrl: url,
              });
            }
            if (reviews.length > 0) return reviews;
          }
        } catch {
          // Not valid JSON, continue
        }
      }
    }

    // Fallback: parse HTML review blocks
    // G2 review cards contain star ratings, titles, and pros/cons sections
    const reviewBlockPattern =
      /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*review|$)/gi;

    // Simpler approach: look for star rating + review text patterns
    // G2 uses data-star attributes or aria-label for ratings
    const starPattern = /(?:data-star|aria-label)[=:]["']?\s*(\d(?:\.\d)?)\s*(?:out of 5|stars?|\/5)?["']?/gi;
    const titlePattern = /<[^>]*class="[^"]*review[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi;

    // Try to extract review sections by looking for pros/cons markers
    const prosConsPattern =
      /(?:What do you like best|Pros|Like)[^<]*?[>:]\s*([\s\S]*?)(?:What do you dislike|Cons|Dislike)[^<]*?[>:]\s*([\s\S]*?)(?:What problems|Recommendations|<div[^>]*class)/gi;

    let pcMatch: RegExpExecArray | null;
    while (
      (pcMatch = prosConsPattern.exec(html)) !== null &&
      reviews.length < 20
    ) {
      const pros = stripHtml(pcMatch[1]).slice(0, 1000);
      const cons = stripHtml(pcMatch[2]).slice(0, 1000);
      if (pros.length < 10 && cons.length < 10) continue;

      reviews.push({
        platform: "g2",
        category: "customer_review",
        author: "Anonymous",
        date: "",
        rating: 0,
        text: `Pros: ${pros}\nCons: ${cons}`,
        pros,
        cons,
        sourceUrl: url,
      });
    }

    // If pros/cons extraction didn't work, try generic review text blocks
    if (reviews.length === 0) {
      const genericReviewPattern =
        /<[^>]*class="[^"]*(?:review-body|review-content|review__body)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|span)>/gi;
      let gMatch: RegExpExecArray | null;
      while (
        (gMatch = genericReviewPattern.exec(html)) !== null &&
        reviews.length < 20
      ) {
        const text = stripHtml(gMatch[1]);
        if (text.length < 30) continue;
        reviews.push({
          platform: "g2",
          category: "customer_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text,
          sourceUrl: url,
        });
      }
    }

    return reviews;
  } catch (error) {
    console.warn(
      "[reviews] G2 scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Capterra (customer_review) ----

async function scrapeCapterraReviews(domain: string): Promise<Review[]> {
  try {
    const slug = companyHyphenSlug(domain);
    const url = `https://www.capterra.com/reviews/${slug}`;
    const html = await renderWithCloudflare(url);
    if (!html) return [];

    const reviews: Review[] = [];

    // Try JSON-LD structured data first
    const jsonLdMatches = html.match(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match
            .replace(/<script\s+type="application\/ld\+json">/, "")
            .replace(/<\/script>/, "");
          const ld = JSON.parse(jsonStr) as Record<string, unknown>;
          const reviewArray = ld.review as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(reviewArray) && reviewArray.length > 0) {
            for (const r of reviewArray.slice(0, 20)) {
              const authorObj = r.author as Record<string, unknown> | undefined;
              const author = String(authorObj?.name ?? r.author ?? "Anonymous");
              const date = String(r.datePublished ?? "");
              const ratingObj = r.reviewRating as Record<string, unknown> | undefined;
              const rating = Number(ratingObj?.ratingValue ?? 0);
              const body = String(r.reviewBody ?? r.description ?? "");
              if (!body.trim()) continue;
              reviews.push({
                platform: "capterra",
                category: "customer_review",
                author,
                date,
                rating,
                text: body,
                sourceUrl: url,
              });
            }
            if (reviews.length > 0) return reviews;
          }
        } catch {
          // continue
        }
      }
    }

    // Fallback: Capterra renders review cards with pros/cons
    const prosConsPattern =
      /(?:Pros|Advantages|What I like)[^<]*?[>:]\s*([\s\S]*?)(?:Cons|Disadvantages|What I don't like)[^<]*?[>:]\s*([\s\S]*?)(?:Overall|Reasons for choosing|Switched from|<div[^>]*class)/gi;

    let pcMatch: RegExpExecArray | null;
    while (
      (pcMatch = prosConsPattern.exec(html)) !== null &&
      reviews.length < 20
    ) {
      const pros = stripHtml(pcMatch[1]).slice(0, 1000);
      const cons = stripHtml(pcMatch[2]).slice(0, 1000);
      if (pros.length < 10 && cons.length < 10) continue;

      reviews.push({
        platform: "capterra",
        category: "customer_review",
        author: "Anonymous",
        date: "",
        rating: 0,
        text: `Pros: ${pros}\nCons: ${cons}`,
        pros,
        cons,
        sourceUrl: url,
      });
    }

    // Try generic review content blocks
    if (reviews.length === 0) {
      const reviewPattern =
        /<[^>]*class="[^"]*(?:review-content|review-body|review-text)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|span)>/gi;
      let rMatch: RegExpExecArray | null;
      while (
        (rMatch = reviewPattern.exec(html)) !== null &&
        reviews.length < 20
      ) {
        const text = stripHtml(rMatch[1]);
        if (text.length < 30) continue;
        reviews.push({
          platform: "capterra",
          category: "customer_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text,
          sourceUrl: url,
        });
      }
    }

    return reviews;
  } catch (error) {
    console.warn(
      "[reviews] Capterra scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Google Business (customer_review) ----

async function scrapeGoogleBusinessReviews(domain: string): Promise<Review[]> {
  try {
    const companyName = domainToCompanyName(domain);
    const url = `https://www.google.com/maps/search/${encodeURIComponent(companyName)}`;
    const html = await renderWithCloudflare(url);
    if (!html) return [];

    const reviews: Review[] = [];

    // Google Maps embeds review data in deeply nested HTML.
    // Look for aria-label patterns that contain star ratings and review text.

    // Pattern 1: Review blocks with star ratings in aria-label
    const ratingTextPattern =
      /aria-label="(\d)\s*stars?"[^>]*>[\s\S]*?(?:class="[^"]*(?:review-text|comment-text|MyEned)[^"]*"[^>]*>)([\s\S]*?)<\//gi;
    let rtMatch: RegExpExecArray | null;
    while (
      (rtMatch = ratingTextPattern.exec(html)) !== null &&
      reviews.length < 20
    ) {
      const rating = Number(rtMatch[1]);
      const text = stripHtml(rtMatch[2]);
      if (text.length < 15) continue;
      reviews.push({
        platform: "google_business",
        category: "customer_review",
        author: "Anonymous",
        date: "",
        rating,
        text,
        sourceUrl: url,
      });
    }

    // Pattern 2: Look for review text blocks near star indicators
    if (reviews.length === 0) {
      // Google Maps often has review snippets in spans with specific data attributes
      const snippetPattern =
        /(?:class="[^"]*(?:review|comment)[^"]*")[^>]*>([\s\S]*?)<\/(?:span|div|p)>/gi;
      let sMatch: RegExpExecArray | null;
      while (
        (sMatch = snippetPattern.exec(html)) !== null &&
        reviews.length < 20
      ) {
        const text = stripHtml(sMatch[1]);
        // Filter out very short or clearly non-review text
        if (text.length < 30 || text.length > 3000) continue;
        // Skip common non-review fragments
        if (/^(Write a review|Sort by|Most relevant|Newest|Highest)/i.test(text)) continue;
        reviews.push({
          platform: "google_business",
          category: "customer_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text,
          sourceUrl: url,
        });
      }
    }

    // Pattern 3: Extract from JSON data embedded in the page
    if (reviews.length === 0) {
      // Google Maps sometimes embeds review data in script tags as arrays
      const jsonDataPattern = /\["([^"]{30,500})","[^"]*",(\d),/g;
      let jMatch: RegExpExecArray | null;
      while (
        (jMatch = jsonDataPattern.exec(html)) !== null &&
        reviews.length < 15
      ) {
        const text = jMatch[1];
        const rating = Number(jMatch[2]);
        if (rating < 1 || rating > 5) continue;
        // Unescape basic sequences
        const cleaned = text.replace(/\\n/g, "\n").replace(/\\"/g, '"');
        if (cleaned.length < 15) continue;
        reviews.push({
          platform: "google_business",
          category: "customer_review",
          author: "Anonymous",
          date: "",
          rating,
          text: cleaned,
          sourceUrl: url,
        });
      }
    }

    return reviews;
  } catch (error) {
    console.warn(
      "[reviews] Google Business scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Facebook (customer_review) ----

async function scrapeFacebookReviews(domain: string): Promise<Review[]> {
  try {
    const slug = companySlug(domain);
    const url = `https://www.facebook.com/${slug}/reviews/`;
    const html = await renderWithCloudflare(url);
    if (!html) return [];

    // Facebook usually shows a login wall for reviews — detect it early
    if (
      html.includes("log in") ||
      html.includes("Log In") ||
      html.includes("Create new account") ||
      html.includes("login_form")
    ) {
      console.warn("[reviews] Facebook: login wall detected, skipping");
      // Still try to extract whatever is visible before the wall
    }

    const reviews: Review[] = [];

    // Try JSON-LD first
    const jsonLdMatches = html.match(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match
            .replace(/<script\s+type="application\/ld\+json">/, "")
            .replace(/<\/script>/, "");
          const ld = JSON.parse(jsonStr) as Record<string, unknown>;
          const reviewArray = ld.review as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(reviewArray) && reviewArray.length > 0) {
            for (const r of reviewArray.slice(0, 20)) {
              const authorObj = r.author as Record<string, unknown> | undefined;
              const author = String(authorObj?.name ?? r.author ?? "Anonymous");
              const date = String(r.datePublished ?? "");
              const ratingObj = r.reviewRating as Record<string, unknown> | undefined;
              const rating = Number(ratingObj?.ratingValue ?? 0);
              const body = String(r.reviewBody ?? r.description ?? "");
              if (!body.trim()) continue;
              reviews.push({
                platform: "facebook",
                category: "customer_review",
                author,
                date,
                rating,
                text: body,
                sourceUrl: url,
              });
            }
            if (reviews.length > 0) return reviews;
          }
        } catch {
          // continue
        }
      }
    }

    // Facebook renders recommendations/reviews in user-generated content divs
    // Look for recommendation text blocks
    const recommendPattern =
      /(?:recommends|doesn't recommend)\s*[^<]*<[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi;
    let recMatch: RegExpExecArray | null;
    while (
      (recMatch = recommendPattern.exec(html)) !== null &&
      reviews.length < 20
    ) {
      const text = stripHtml(recMatch[1]);
      if (text.length < 15) continue;
      const isPositive = recMatch[0].toLowerCase().includes("recommends") &&
        !recMatch[0].toLowerCase().includes("doesn't");
      reviews.push({
        platform: "facebook",
        category: "customer_review",
        author: "Anonymous",
        date: "",
        rating: isPositive ? 5 : 1,
        text,
        sourceUrl: url,
      });
    }

    // Try to find review text in userContent divs
    if (reviews.length === 0) {
      const userContentPattern =
        /<div[^>]*(?:data-ad-preview|class="[^"]*userContent[^"]*")[^>]*>([\s\S]*?)<\/div>/gi;
      let ucMatch: RegExpExecArray | null;
      while (
        (ucMatch = userContentPattern.exec(html)) !== null &&
        reviews.length < 20
      ) {
        const text = stripHtml(ucMatch[1]);
        if (text.length < 30) continue;
        reviews.push({
          platform: "facebook",
          category: "customer_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text,
          sourceUrl: url,
        });
      }
    }

    return reviews;
  } catch (error) {
    console.warn(
      "[reviews] Facebook scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Glassdoor (employee_review) ----

async function scrapeGlassdoorReviews(domain: string): Promise<Review[]> {
  try {
    const slug = companyHyphenSlug(domain);
    const url = `https://www.glassdoor.com/Reviews/${slug}-reviews.htm`;
    const html = await renderWithCloudflare(url);
    if (!html) return [];

    const reviews: Review[] = [];

    // Try JSON-LD structured data
    const jsonLdMatches = html.match(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match
            .replace(/<script\s+type="application\/ld\+json">/, "")
            .replace(/<\/script>/, "");
          const ld = JSON.parse(jsonStr) as Record<string, unknown>;
          const reviewArray = ld.review as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(reviewArray) && reviewArray.length > 0) {
            for (const r of reviewArray.slice(0, 20)) {
              const authorObj = r.author as Record<string, unknown> | undefined;
              const author = String(authorObj?.name ?? r.author ?? "Anonymous");
              const date = String(r.datePublished ?? "");
              const ratingObj = r.reviewRating as Record<string, unknown> | undefined;
              const rating = Number(ratingObj?.ratingValue ?? 0);
              const body = String(r.reviewBody ?? r.description ?? "");
              if (!body.trim()) continue;
              reviews.push({
                platform: "glassdoor",
                category: "employee_review",
                author,
                date,
                rating,
                text: body,
                sourceUrl: url,
              });
            }
            if (reviews.length > 0) return reviews;
          }
        } catch {
          // continue
        }
      }
    }

    // Glassdoor review titles — often visible without login
    // Review titles use specific heading patterns
    const titleRatingPattern =
      /class="[^"]*(?:review-title|reviewTitle|review__title)[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>[\s\S]*?(?:class="[^"]*(?:stars|rating|StarRating)[^"]*"[^>]*(?:aria-label|title)=["']?\s*(\d(?:\.\d)?)\s*)/gi;
    let trMatch: RegExpExecArray | null;
    while (
      (trMatch = titleRatingPattern.exec(html)) !== null &&
      reviews.length < 20
    ) {
      const title = stripHtml(trMatch[1]);
      const rating = Number(trMatch[2] || 0);
      if (title.length < 5) continue;
      reviews.push({
        platform: "glassdoor",
        category: "employee_review",
        author: "Anonymous",
        date: "",
        rating,
        text: title,
        sourceUrl: url,
      });
    }

    // Fallback: Glassdoor pros/cons pattern
    if (reviews.length === 0) {
      const prosConsPattern =
        /(?:Pros|What I like)[^<]*?[>:]\s*([\s\S]*?)(?:Cons|What I dislike|What I don't like)[^<]*?[>:]\s*([\s\S]*?)(?:Advice|Continue reading|<div[^>]*class="[^"]*(?:review|gdReview))/gi;
      let pcMatch: RegExpExecArray | null;
      while (
        (pcMatch = prosConsPattern.exec(html)) !== null &&
        reviews.length < 20
      ) {
        const pros = stripHtml(pcMatch[1]).slice(0, 1000);
        const cons = stripHtml(pcMatch[2]).slice(0, 1000);
        if (pros.length < 10 && cons.length < 10) continue;
        reviews.push({
          platform: "glassdoor",
          category: "employee_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text: `Pros: ${pros}\nCons: ${cons}`,
          pros,
          cons,
          sourceUrl: url,
        });
      }
    }

    // Last resort: extract any visible review snippet text
    if (reviews.length === 0) {
      const snippetPattern =
        /<[^>]*class="[^"]*(?:review-snippet|reviewSnippet|review__snippet|truncateThis)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi;
      let snMatch: RegExpExecArray | null;
      while (
        (snMatch = snippetPattern.exec(html)) !== null &&
        reviews.length < 20
      ) {
        const text = stripHtml(snMatch[1]);
        if (text.length < 20) continue;
        reviews.push({
          platform: "glassdoor",
          category: "employee_review",
          author: "Anonymous",
          date: "",
          rating: 0,
          text,
          sourceUrl: url,
        });
      }
    }

    return reviews;
  } catch (error) {
    console.warn(
      "[reviews] Glassdoor scraper error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- App Store (customer_review) ----

async function scrapeAppStoreReviews(domain: string): Promise<Review[]> {
  try {
    const store = (await import("app-store-scraper")).default;
    const companyName = domainToCompanyName(domain);

    const searchResults = await store.search({ term: companyName, num: 1 });
    if (!searchResults || searchResults.length === 0) {
      console.warn(`[reviews] app_store: no app found for "${companyName}"`);
      return [];
    }

    const app = searchResults[0];
    const reviews = await store.reviews({
      appId: app.appId,
      sort: store.sort.RECENT,
      num: 20,
    });

    return (reviews || []).map(
      (r: Record<string, unknown>): Review => ({
        platform: "app_store",
        category: "customer_review",
        author: String(r.userName ?? r.author ?? "Anonymous"),
        date: r.date ? new Date(r.date as string | number).toISOString() : "",
        rating: Number(r.score ?? r.rating ?? 0),
        text: String(r.text ?? r.title ?? ""),
        sourceUrl: String(r.url ?? ""),
      }),
    );
  } catch (error) {
    console.warn(
      "[reviews] app_store scraper failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Google Play (customer_review) ----

async function scrapeGooglePlayReviews(domain: string): Promise<Review[]> {
  try {
    const gplay = (await import("google-play-scraper")).default;
    const companyName = domainToCompanyName(domain);

    const searchResults = await gplay.search({ term: companyName, num: 1 });
    if (!searchResults || searchResults.length === 0) {
      console.warn(`[reviews] google_play: no app found for "${companyName}"`);
      return [];
    }

    const app = searchResults[0];
    const result = await gplay.reviews({
      appId: app.appId,
      sort: gplay.sort.NEWEST,
      num: 20,
    });

    const reviews = Array.isArray(result) ? result : result?.data ?? [];

    return (reviews as Array<Record<string, unknown>>).map(
      (r): Review => ({
        platform: "google_play",
        category: "customer_review",
        author: String(r.userName ?? r.author ?? "Anonymous"),
        date: r.date ? new Date(r.date as string | number).toISOString() : "",
        rating: Number(r.score ?? r.rating ?? 0),
        text: String(r.text ?? r.content ?? ""),
        sourceUrl: String(r.url ?? ""),
      }),
    );
  } catch (error) {
    console.warn(
      "[reviews] google_play scraper failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Product Hunt (company_profile) ----

async function scrapeProductHunt(domain: string): Promise<Review[]> {
  try {
    const slug = companySlug(domain);
    const url = `https://www.producthunt.com/products/${slug}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[reviews] producthunt: HTTP ${res.status} for ${url}`);
      return [];
    }

    const html = await res.text();

    const titleMatch =
      html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ??
      html.match(/<title>([^<]+)<\/title>/i);
    const name = titleMatch?.[1]?.trim() ?? "";

    const descMatch =
      html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ??
      html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const description = descMatch?.[1]?.trim() ?? "";

    const taglineMatch = html.match(
      /<h2[^>]*class="[^"]*tagline[^"]*"[^>]*>([^<]+)<\/h2>/i,
    );
    const tagline = taglineMatch?.[1]?.trim() ?? "";

    const votesMatch = html.match(/(\d[\d,]*)\s*(?:upvotes?|votes?)/i);
    const votes = votesMatch?.[1]?.replace(/,/g, "") ?? "";

    if (!name && !description) {
      console.warn(`[reviews] producthunt: no useful content found for ${slug}`);
      return [];
    }

    const parts = [
      name ? `Product: ${name}` : "",
      tagline ? `Tagline: ${tagline}` : "",
      description || "",
      votes ? `Votes: ${votes}` : "",
    ].filter(Boolean);

    return [
      {
        platform: "producthunt",
        category: "company_profile" as const,
        author: "",
        date: "",
        rating: 0,
        text: parts.join("\n"),
        sourceUrl: url,
      },
    ];
  } catch (error) {
    console.warn(
      "[reviews] producthunt scraper failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---- Twitter/X (social_mention, via Nitter fallback) ----

const NITTER_INSTANCES = ["https://nitter.net", "https://xcancel.com"] as const;

function parseNitterHtml(html: string): Array<{
  author: string;
  text: string;
  date: string;
  url: string;
}> {
  const tweets: Array<{ author: string; text: string; date: string; url: string }> = [];
  const tweetBlocks = html.split(/class="timeline-item\b/);

  for (let i = 1; i < tweetBlocks.length && tweets.length < 20; i++) {
    const block = tweetBlocks[i];
    const usernameMatch = block.match(/class="username"[^>]*>@?([^<]+)</i);
    const author = usernameMatch?.[1]?.trim() ?? "Anonymous";

    const contentMatch = block.match(/class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    let text = contentMatch?.[1] ?? "";
    text = text.replace(/<[^>]+>/g, "").trim();

    const dateMatch = block.match(/title="([^"]*\d{4}[^"]*)"/);
    const date = dateMatch?.[1]?.trim() ?? "";

    const linkMatch =
      block.match(/class="tweet-link"[^>]*href="([^"]+)"/i) ??
      block.match(/href="(\/[^/]+\/status\/\d+[^"]*)"/i);
    const tweetPath = linkMatch?.[1] ?? "";

    if (text) {
      tweets.push({
        author,
        text,
        date,
        url: tweetPath
          ? `https://twitter.com${tweetPath.startsWith("/") ? "" : "/"}${tweetPath}`
          : "",
      });
    }
  }

  return tweets;
}

async function scrapeTwitterMentions(domain: string): Promise<Review[]> {
  try {
    const companyName = domainToCompanyName(domain);
    const query = encodeURIComponent(companyName);

    for (const instance of NITTER_INSTANCES) {
      try {
        const searchUrl = `${instance}/search?f=tweets&q=${query}&since=&until=&near=`;
        const res = await fetch(searchUrl, {
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });

        if (!res.ok) {
          console.warn(`[reviews] twitter: ${instance} returned HTTP ${res.status}`);
          continue;
        }

        const html = await res.text();
        const parsed = parseNitterHtml(html);

        if (parsed.length === 0) {
          console.warn(`[reviews] twitter: no tweets found on ${instance} for "${companyName}"`);
          continue;
        }

        return parsed.map(
          (t): Review => ({
            platform: "twitter",
            category: "social_mention",
            author: t.author,
            date: t.date,
            rating: 0,
            text: t.text,
            sourceUrl: t.url,
          }),
        );
      } catch (instanceError) {
        console.warn(
          `[reviews] twitter: ${instance} failed:`,
          instanceError instanceof Error ? instanceError.message : instanceError,
        );
        continue;
      }
    }

    console.warn(`[reviews] twitter: all Nitter instances failed for "${companyName}"`);
    return [];
  } catch (error) {
    console.warn(
      "[reviews] twitter scraper failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scrape reviews from multiple platforms for a given domain.
 *
 * All platforms run in parallel via Promise.allSettled. Individual scraper
 * failures are caught and logged — they never bubble up.
 */
export async function scrapeReviews(
  domain: string,
): Promise<ScrapeReviewsResult> {
  const scrapers: Array<{
    name: string;
    fn: () => Promise<Review[]>;
    timeout: number;
  }> = [
    // Review platforms (customer_review)
    {
      name: "g2",
      fn: () => scrapeG2Reviews(domain),
      timeout: BROWSER_TIMEOUT_MS,
    },
    {
      name: "trustpilot",
      fn: () => scrapeTrustpilotReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "capterra",
      fn: () => scrapeCapterraReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "google_business",
      fn: () => scrapeGoogleBusinessReviews(domain),
      timeout: BROWSER_TIMEOUT_MS,
    },
    {
      name: "facebook",
      fn: () => scrapeFacebookReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "yelp",
      fn: () => scrapeYelpReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "app_store",
      fn: () => scrapeAppStoreReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "google_play",
      fn: () => scrapeGooglePlayReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    // Social mentions (social_mention)
    {
      name: "reddit",
      fn: () => scrapeRedditMentions(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "twitter",
      fn: () => scrapeTwitterMentions(domain),
      timeout: BROWSER_TIMEOUT_MS,
    },
    // Employee voice (employee_review)
    {
      name: "glassdoor",
      fn: () => scrapeGlassdoorReviews(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    // Company profiles (company_profile)
    {
      name: "producthunt",
      fn: () => scrapeProductHunt(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
    {
      name: "linkedin",
      fn: () => scrapeLinkedInProfile(domain),
      timeout: HTTP_TIMEOUT_MS,
    },
  ];

  const results = await Promise.allSettled(
    scrapers.map(async (scraper) => {
      const reviews = await runWithTimeout(
        scraper.name,
        scraper.fn,
        scraper.timeout,
      );
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
      console.log(`[reviews] ${name}: ${reviews.length} results`);
    } else {
      console.warn(`[reviews] Platform scraper failed: ${result.reason}`);
    }
  }

  console.log(
    `[reviews] Scraping complete: ${allReviews.length} total results from ${succeededPlatforms.length}/${scrapers.length} platforms`,
  );
  console.log(
    `[reviews] Platforms with results: ${succeededPlatforms.join(", ") || "none"}`,
  );

  return { reviews: allReviews, platforms: succeededPlatforms, summary };
}
