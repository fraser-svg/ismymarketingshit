/**
 * Quick end-to-end test of the pipeline without Inngest.
 * Usage: npx tsx scripts/test-pipeline.ts stripe.com
 */

// Load env BEFORE any other imports so module-level constants pick up the values
import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "node:fs";
import * as path from "node:path";

import { scrapeWebsite } from "../src/lib/services/cloudflare";
import { cleanContent } from "../src/lib/pipeline/clean-data";
import { detectTechStack } from "../src/lib/pipeline/detect-tech-stack";
import { verifyScrapeData } from "../src/lib/pipeline/verify-scraped-data";
import { analyzeNarrativeGapStep } from "../src/lib/pipeline/analyze-narrative-gap";
import { compileReportStep } from "../src/lib/pipeline/compile-report";
import { generateReportStep } from "../src/lib/pipeline/generate-report-html";
import { scrapeReviewsStep } from "../src/lib/pipeline/scrape-reviews";
import { scrapeExtras } from "../src/lib/pipeline/scrape-extras";
import type { AnalysisInput, SourceRecord, ScrapedPage } from "../src/lib/types";

const domain = process.argv[2] || "stripe.com";

async function main() {
  const output: string[] = [];

  function log(msg: string) {
    console.log(msg);
    output.push(msg);
  }

  log(`\n=== Testing pipeline for ${domain} ===\n`);

  // Step 1: Scrape website
  log("[1/8] Scraping website...");
  const pages = await scrapeWebsite(domain);
  log(`  Got ${pages.length} pages:`);
  for (const p of pages) {
    log(`    ${p.type}: ${p.url} (${p.content.length} chars)`);
  }

  // Step 2: Scrape reviews
  log("\n[2/8] Scraping reviews...");
  const reviewResult = await scrapeReviewsStep(domain);
  log(`  Platforms found: ${reviewResult.platforms.length ? reviewResult.platforms.join(", ") : "none"}`);
  log(`  Total reviews: ${reviewResult.reviews.length}`);
  if (Object.keys(reviewResult.summary).length > 0) {
    log(`  Summary by platform:`);
    for (const [platform, count] of Object.entries(reviewResult.summary)) {
      log(`    ${platform}: ${count} reviews`);
    }
  }
  if (reviewResult.reviews.length > 0) {
    log(`  Sample reviews:`);
    for (const review of reviewResult.reviews.slice(0, 3)) {
      const snippet = review.text.substring(0, 120).replace(/\n/g, " ");
      log(`    [${review.platform}] ${review.rating > 0 ? `${review.rating}/5` : "unrated"} - "${snippet}..."`);
    }
  }

  // Step 3: Scrape extras (HN, archive, etc.)
  log("\n[3/8] Scraping extras (HN, archive, PageSpeed)...");
  const extras = await scrapeExtras(domain);

  log(`  Hacker News stories: ${extras.newsArticles.length}`);
  if (extras.newsArticles.length > 0) {
    for (const article of extras.newsArticles.slice(0, 5)) {
      log(`    - ${article.title}`);
      log(`      ${article.snippet}`);
    }
  }

  log(`  Archive snapshots: ${extras.archiveSnapshots.length}`);
  if (extras.archiveSnapshots.length > 0) {
    for (const snap of extras.archiveSnapshots.slice(0, 5)) {
      log(`    - ${snap.timestamp} -> ${snap.url}`);
    }
  }

  if (extras.pageSpeedMobile != null || extras.pageSpeedDesktop != null) {
    log(`  PageSpeed: mobile=${extras.pageSpeedMobile ?? "n/a"}, desktop=${extras.pageSpeedDesktop ?? "n/a"}`);
  }

  // Step 4: Clean
  log("\n[4/8] Cleaning data...");
  const cleanedPages: ScrapedPage[] = pages.map((p) => ({
    ...p,
    content: cleanContent(p.content),
  }));

  const rawContent = pages.map((p) => p.content).join("\n");
  const techStack = detectTechStack(rawContent);
  log(`  Tech stack: ${techStack.length ? techStack.join(", ") : "none detected"}`);

  // Step 5: Verify
  log("\n[5/8] Verifying data...");
  const verification = verifyScrapeData(
    cleanedPages,
    reviewResult.reviews.map((r) => ({
      url: r.sourceUrl,
      content: r.text,
      scrapedAt: r.date,
      source: "review" as const,
      selector: r.platform,
    })),
    {
      techStack,
      newsArticles: extras.newsArticles.map((a) => ({
        url: a.url,
        content: `${a.title}\n${a.snippet}`,
      })),
    },
    domain,
  );
  log(`  Valid: ${verification.valid}`);
  log(`  Confidence: ${verification.confidence}`);
  if (verification.issues.length) {
    log(`  Issues: ${verification.issues.join("; ")}`);
  }

  if (!verification.valid) {
    log("\n  WARNING: Data verification issues detected. Continuing anyway for testing...");
  }

  // Build AnalysisInput
  const reviewRecords: SourceRecord[] = reviewResult.reviews.map((r) => ({
    url: r.sourceUrl,
    content: r.text,
    scrapedAt: r.date,
    source: "review" as const,
    selector: r.platform,
  }));

  const analysisInput: AnalysisInput = {
    company: {
      domain,
      name: domain.split(".")[0],
    },
    pages: cleanedPages.map((p): SourceRecord => ({
      url: p.url,
      content: p.content,
      scrapedAt: new Date().toISOString(),
      source: "website",
      selector: p.type,
    })),
    reviews: reviewRecords,
    extras: {
      techStack,
      newsArticles: extras.newsArticles.map((a) => ({
        url: a.url,
        content: `${a.title}\n${a.snippet}`,
        scrapedAt: new Date().toISOString(),
        source: "news" as const,
      })),
      archiveSnapshots: extras.archiveSnapshots.map((s) => ({
        url: s.url,
        timestamp: s.timestamp,
        archiveUrl: s.archiveUrl,
      })),
    },
    dataQuality: {
      valid: true,
      confidence: verification.confidence,
      pageCount: cleanedPages.length,
      reviewCount: reviewResult.reviews.length,
      issues: verification.issues,
    },
  };

  // Step 6: Narrative gap analysis
  log("\n[6/8] Running narrative gap analysis (Claude)...");
  const narrativeGap = await analyzeNarrativeGapStep(analysisInput);
  log(`  Mirror Line: ${narrativeGap.mirrorLine}`);
  log(`  Gaps found: ${narrativeGap.gaps.length}`);
  log(`  Confidence: ${narrativeGap.confidence}`);

  // Step 7: Compile report
  log("\n[7/8] Compiling report (Claude)...");
  const report = await compileReportStep(analysisInput, narrativeGap, null);
  log(`  Score: ${report.score}/100`);
  log(`  Sections: ${report.sections.length}`);
  log(`  Mirror Line: ${report.mirrorLine}`);

  // Step 8: Generate HTML report
  const jobId = `test-${Date.now()}`;
  log(`\n[8/8] Storing report as ${jobId}...`);
  const reportUrl = await generateReportStep(jobId, report);
  log(`  URL: ${reportUrl}`);

  // Summary
  log("\n=== REPORT SUMMARY ===\n");
  log(`Mirror Line: ${report.mirrorLine}\n`);
  log(`Score: ${report.score}/100\n`);
  for (const section of report.sections) {
    log(`--- ${section.title} ---`);
    log(section.content);
    log("");
  }

  log(`\nFull report: ${reportUrl}`);
  log("Start dev server with 'npm run dev' to view it.\n");

  // Save full report to text file
  const reportsDir = path.resolve(__dirname, "../data/reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "test-latest.txt");
  fs.writeFileSync(reportPath, output.join("\n"), "utf-8");
  console.log(`\nFull output saved to ${reportPath}`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
