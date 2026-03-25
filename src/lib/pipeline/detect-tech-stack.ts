/**
 * Tech stack detection pipeline step.
 *
 * Ports the logic from detect-tech-stack.sh to TypeScript, scanning
 * scraped content for known tool signatures.
 */

interface ToolSignature {
  name: string;
  patterns: string[];
}

const TOOL_SIGNATURES: ToolSignature[] = [
  {
    name: "Facebook Pixel",
    patterns: ["fbq("],
  },
  {
    name: "Google Analytics",
    patterns: ["gtag(", "google-analytics", "ga.js"],
  },
  {
    name: "Google Tag Manager",
    patterns: ["GTM-", "googletagmanager.com/gtm"],
  },
  {
    name: "LinkedIn Insight Tag",
    patterns: ["linkedin.com/px", "_linkedin_partner_id"],
  },
  {
    name: "HubSpot",
    patterns: ["hs-script", "js.hs-scripts", "hbspt"],
  },
  {
    name: "Intercom",
    patterns: ["intercomSettings", "widget.intercom.io"],
  },
  {
    name: "Drift",
    patterns: ["drift.com", "js.driftt.com"],
  },
  {
    name: "Hotjar",
    patterns: ["hotjar"],
  },
  {
    name: "FullStory",
    patterns: ["fullstory"],
  },
  {
    name: "Segment",
    patterns: ["segment.com", "analytics.js"],
  },
  {
    name: "Mixpanel",
    patterns: ["mixpanel"],
  },
  {
    name: "Heap",
    patterns: ["heap-api"],
  },
  {
    name: "Cookiebot",
    patterns: ["cookiebot"],
  },
  {
    name: "OneTrust",
    patterns: ["onetrust"],
  },
];

/**
 * Detect marketing/analytics tools present in scraped content.
 *
 * Scans the provided content string for known tool signatures and
 * returns an array of tool names that were detected.
 */
export function detectTechStack(content: string): string[] {
  if (!content) return [];

  const lowerContent = content.toLowerCase();
  const detected: string[] = [];

  for (const tool of TOOL_SIGNATURES) {
    const found = tool.patterns.some((pattern) =>
      lowerContent.includes(pattern.toLowerCase()),
    );

    if (found) {
      detected.push(tool.name);
    }
  }

  return detected;
}
