// ---------------------------------------------------------------------------
// Internet Archive / Wayback Machine CDX API (free, no auth required)
// ---------------------------------------------------------------------------

const CDX_API = "https://web.archive.org/cdx/search/cdx";
const ARCHIVE_BASE = "https://web.archive.org/web";
const ARCHIVE_TIMEOUT_MS = 15_000;

export interface ArchiveSnapshot {
  url: string;
  timestamp: string; // YYYYMMDDHHMMSS format
  archiveUrl: string;
  statusCode: string;
}

/**
 * Retrieve historical snapshots of a domain from the Wayback Machine.
 *
 * By default returns up to 12 snapshots (one per month due to collapse)
 * filtered to only HTTP 200 responses.
 */
export async function getWebArchiveSnapshots(
  domain: string,
  options?: { from?: string; to?: string; limit?: number },
): Promise<ArchiveSnapshot[]> {
  const params = new URLSearchParams({
    url: `${domain}/*`,
    output: "json",
    filter: "statuscode:200",
    fl: "original,timestamp,statuscode",
    collapse: "timestamp:6", // One per month
    limit: String(options?.limit || 12),
  });

  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);

  try {
    const res = await fetch(`${CDX_API}?${params}`, {
      signal: AbortSignal.timeout(ARCHIVE_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(
        `[webarchive] CDX request failed: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const rows = (await res.json()) as string[][];

    // First row is the header: ["original", "timestamp", "statuscode"]
    if (!Array.isArray(rows) || rows.length < 2) return [];

    return rows.slice(1).map((row) => ({
      url: row[0],
      timestamp: row[1],
      archiveUrl: `${ARCHIVE_BASE}/${row[1]}id_/${row[0]}`,
      statusCode: row[2],
    }));
  } catch (err) {
    console.warn(
      `[webarchive] CDX error: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}

/**
 * Fetch the raw HTML of an archived page (without the Wayback Machine toolbar).
 *
 * The `id_` modifier in the URL tells Wayback to return the original page
 * content without injecting its toolbar/banner.
 *
 * Returns null on any failure.
 */
export async function fetchArchivedPage(
  url: string,
  timestamp: string,
): Promise<string | null> {
  const archiveUrl = `${ARCHIVE_BASE}/${timestamp}id_/${url}`;

  try {
    const res = await fetch(archiveUrl, {
      signal: AbortSignal.timeout(ARCHIVE_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(
        `[webarchive] Archived page fetch failed: ${res.status} ${res.statusText}`,
      );
      return null;
    }

    return await res.text();
  } catch (err) {
    console.warn(
      `[webarchive] Archived page error: ${err instanceof Error ? err.message : err}`,
    );
    return null;
  }
}
