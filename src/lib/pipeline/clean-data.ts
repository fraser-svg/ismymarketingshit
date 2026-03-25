/**
 * Data cleaning pipeline step.
 *
 * Ports the logic from clean-data.sh to TypeScript, removing boilerplate,
 * navigation chrome, cookie banners, legal text, and HTML artifacts from
 * scraped markdown/HTML content.
 */

/** Pattern for pipe-separated navigation links (e.g. "Home | About | Contact"). */
const NAV_LINK_PATTERN = /^(?:\s*\[?[\w\s&/'-]+\]?\s*\|\s*){2,}.*$/gm;

/** Cookie consent / banner boilerplate phrases. */
const COOKIE_PATTERNS = [
  /^.*\bcookie(?:s)?\s+(?:consent|policy|notice|preferences|settings|banner).*$/gim,
  /^.*\bwe\s+use\s+cookies\b.*$/gim,
  /^.*\baccept\s+(?:all\s+)?cookies\b.*$/gim,
  /^.*\bcookie\s+(?:policy|preferences)\b.*$/gim,
  /^.*\bmanage\s+(?:cookie|consent)\s+preferences\b.*$/gim,
  /^.*\bby\s+(?:continuing|using)\s+(?:this|our)\s+(?:site|website)\b.*cookies.*$/gim,
];

/** Privacy policy / terms of service boilerplate phrases. */
const LEGAL_PATTERNS = [
  /^.*\bprivacy\s+policy\b.*$/gim,
  /^.*\bterms\s+(?:of\s+service|and\s+conditions|of\s+use)\b.*$/gim,
  /^.*\bdata\s+(?:protection|processing)\s+(?:policy|agreement|notice)\b.*$/gim,
  /^.*\bgdpr\s+compliance\b.*$/gim,
  /^.*\bdo\s+not\s+sell\s+my\s+(?:personal\s+)?(?:data|information)\b.*$/gim,
];

/** HTML tag artifacts that may survive markdown conversion. */
const HTML_TAG_PATTERN =
  /<\/?\s*(?:div|span|script|style|link|meta|noscript|iframe|header|footer|nav|aside|form|input|button|select|option|textarea|label|table|thead|tbody|tfoot|tr|td|th|ul|ol|li|dl|dt|dd|figure|figcaption|picture|source|video|audio|canvas|svg|path|rect|circle|g|defs|use|symbol|embed|object|param)\b[^>]*\/?>/gi;

/** Lines that consist entirely of HTML tags (with optional whitespace). */
const HTML_ONLY_LINE_PATTERN = /^\s*(?:<[^>]+>\s*)+\s*$/;

/** Footer boilerplate patterns. */
const FOOTER_PATTERNS = [
  /^.*(?:copyright|\u00a9|©)\s*(?:\d{4}|\d{4}\s*[-–]\s*\d{4}).*$/gim,
  /^.*\bregistered\s+in\b.*$/gim,
  /^.*\bcompany\s+no\.?\b.*$/gim,
  /^.*\bvat\s+no\.?\b.*$/gim,
  /^.*\ball\s+rights\s+reserved\b.*$/gim,
];

/**
 * Remove all lines matching a set of RegExp patterns from the text.
 */
function removePatternLines(text: string, patterns: RegExp[]): string {
  let result = text;
  for (const pattern of patterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    result = result.replace(pattern, "");
  }
  return result;
}

/**
 * Clean raw scraped content by removing boilerplate, HTML artifacts,
 * and normalising whitespace.
 *
 * Cleaning steps (applied in order):
 * 1. Remove navigation link lines (pipe-separated nav items)
 * 2. Remove cookie consent boilerplate
 * 3. Remove privacy policy / terms of service boilerplate
 * 4. Remove HTML tag artifacts
 * 5. Remove footer patterns
 * 6. Strip leading/trailing whitespace from each line
 * 7. Collapse multiple blank lines to a single blank line
 * 8. Remove lines that are just HTML tags
 */
export function cleanContent(content: string): string {
  if (!content) return "";

  let text = content;

  // Pre-step: if this is HTML (contains significant tags), strip tags first
  // to convert to plain text before applying line-based cleaning.
  const htmlTagCount = (text.match(/<[^>]+>/g) || []).length;
  const isHtml = htmlTagCount > 10 || text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html");
  if (isHtml) {
    // Remove script and style blocks entirely (including content)
    text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
    // Replace block-level tags with newlines to restore document structure
    text = text.replace(/<\/(?:div|p|h[1-6]|li|tr|td|th|section|article|header|footer|nav|aside|blockquote|br)\s*>/gi, "\n");
    text = text.replace(/<(?:br|hr)\s*\/?>/gi, "\n");
    // Strip remaining tags
    text = text.replace(/<[^>]+>/g, " ");
    // Decode common HTML entities
    text = text.replace(/&amp;/g, "&");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, " ");
    // Clean up excessive whitespace within lines
    text = text.replace(/[ \t]{2,}/g, " ");
  }

  // 1. Remove navigation link lines
  text = text.replace(NAV_LINK_PATTERN, "");

  // 2. Remove cookie consent boilerplate
  text = removePatternLines(text, COOKIE_PATTERNS);

  // 3. Remove privacy policy / terms of service boilerplate
  text = removePatternLines(text, LEGAL_PATTERNS);

  // 4. Remove HTML tag artifacts
  // Only strip tags if content is primarily markdown (not raw HTML).
  // If more than 30% of lines start with '<', treat it as HTML and do a
  // basic tag strip that preserves text content.
  const totalLines = text.split("\n").length;
  const htmlLines = text.split("\n").filter((l) => l.trimStart().startsWith("<")).length;
  const isRawHtml = totalLines > 0 && htmlLines / totalLines > 0.3;

  if (isRawHtml) {
    // Strip all tags but keep text content
    text = text.replace(/<[^>]+>/g, " ");
    // Clean up excessive whitespace from tag removal
    text = text.replace(/\s{2,}/g, " ");
  } else {
    text = text.replace(HTML_TAG_PATTERN, "");
  }

  // 5. Remove footer patterns
  text = removePatternLines(text, FOOTER_PATTERNS);

  // 6. Strip leading/trailing whitespace from each line
  const lines = text.split("\n").map((line) => line.trim());

  // 7 & 8. Collapse blank lines and remove HTML-only lines
  const cleaned: string[] = [];
  let prevBlank = false;

  for (const line of lines) {
    // 8. Skip lines that are just HTML tags
    if (HTML_ONLY_LINE_PATTERN.test(line)) {
      continue;
    }

    const isBlank = line === "";

    // 7. Collapse multiple blank lines
    if (isBlank) {
      if (!prevBlank) {
        cleaned.push("");
      }
      prevBlank = true;
    } else {
      cleaned.push(line);
      prevBlank = false;
    }
  }

  // Trim leading/trailing blank lines from the final output
  let start = 0;
  while (start < cleaned.length && cleaned[start] === "") start++;
  let end = cleaned.length - 1;
  while (end >= start && cleaned[end] === "") end--;

  return cleaned.slice(start, end + 1).join("\n");
}
