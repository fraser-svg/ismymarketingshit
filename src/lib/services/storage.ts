import { put, del, head, list } from "@vercel/blob";

const PIPELINE_PREFIX = "voice-gap";

/**
 * Store pipeline data (JSON-serialisable) in Vercel Blob.
 * Returns the public URL of the stored blob.
 */
export async function storeData(
  key: string,
  data: unknown,
  contentType = "application/json",
): Promise<string> {
  const pathname = `${PIPELINE_PREFIX}/${key}`;
  const body =
    contentType === "application/json" ? JSON.stringify(data) : (data as string);

  const blob = await put(pathname, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

/**
 * Store a rendered HTML report in Vercel Blob.
 * Returns the public URL.
 */
export async function storeReport(
  jobId: string,
  html: string,
): Promise<string> {
  return storeData(`reports/${jobId}.html`, html, "text/html");
}

/**
 * Retrieve JSON data from Vercel Blob by URL.
 * Returns null if the blob does not exist.
 */
export async function retrieveData<T = unknown>(
  url: string,
): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Check whether a blob exists at the given URL.
 */
export async function exists(url: string): Promise<boolean> {
  try {
    const meta = await head(url);
    return meta !== null;
  } catch {
    return false;
  }
}

/**
 * Delete a blob by URL.
 */
export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}

/**
 * List blobs under a given prefix.
 */
export async function listBlobs(prefix?: string) {
  const fullPrefix = prefix
    ? `${PIPELINE_PREFIX}/${prefix}`
    : PIPELINE_PREFIX;

  return list({ prefix: fullPrefix });
}
