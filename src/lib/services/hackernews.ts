// ---------------------------------------------------------------------------
// Hacker News Search via Algolia API (free, no auth required)
// ---------------------------------------------------------------------------

const HN_SEARCH_API = "https://hn.algolia.com/api/v1/search";
const HN_TIMEOUT_MS = 10_000;

export interface HNResult {
  title: string;
  url: string;
  author: string;
  points: number;
  numComments: number;
  createdAt: string;
  objectID: string;
}

/**
 * Search Hacker News for stories mentioning the given company name.
 * Returns up to 20 stories from the last 30 days.
 */
export async function searchHackerNews(
  companyName: string,
): Promise<HNResult[]> {
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000,
  );

  const params = new URLSearchParams({
    query: companyName,
    tags: "story",
    numericFilters: `created_at_i>${thirtyDaysAgo}`,
    hitsPerPage: "20",
  });

  try {
    const res = await fetch(`${HN_SEARCH_API}?${params}`, {
      signal: AbortSignal.timeout(HN_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(
        `[hackernews] Search request failed: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const data = (await res.json()) as {
      hits: Array<{
        title?: string;
        url?: string;
        author?: string;
        points?: number;
        num_comments?: number;
        created_at?: string;
        objectID?: string;
      }>;
    };

    return data.hits.map((hit) => ({
      title: hit.title || "",
      url:
        hit.url ||
        `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author || "",
      points: hit.points || 0,
      numComments: hit.num_comments || 0,
      createdAt: hit.created_at || "",
      objectID: hit.objectID || "",
    }));
  } catch (err) {
    console.warn(
      `[hackernews] Search error: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}

/**
 * Fetch the top comments for a given HN story.
 * Returns up to 10 comment texts.
 */
export async function getHNComments(storyId: string): Promise<string[]> {
  const params = new URLSearchParams({
    tags: `comment,story_${storyId}`,
    hitsPerPage: "10",
  });

  try {
    const res = await fetch(`${HN_SEARCH_API}?${params}`, {
      signal: AbortSignal.timeout(HN_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(
        `[hackernews] Comments request failed: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const data = (await res.json()) as {
      hits: Array<{ comment_text?: string }>;
    };

    return data.hits
      .map((hit) => hit.comment_text || "")
      .filter((text) => text.trim().length > 0);
  } catch (err) {
    console.warn(
      `[hackernews] Comments error: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}
