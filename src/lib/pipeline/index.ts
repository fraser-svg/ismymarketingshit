import { inngest } from "@/lib/inngest/client";
import { redis } from "@/lib/services/redis";
import { scrapeWebsiteStep } from "./scrape-website";
import { scrapeReviewsStep } from "./scrape-reviews";
import { scrapeExtras, type ExtrasData } from "./scrape-extras";
import { cleanContent } from "./clean-data";
import { detectTechStack } from "./detect-tech-stack";
import { verifyScrapeData } from "./verify-scraped-data";
import { analyzeNarrativeGapStep } from "./analyze-narrative-gap";
import { analyzeCustomerPsychologyStep } from "./analyze-customer-psychology";
import { compileReportStep, compileReportWithCorrections } from "./compile-report";
import { verifyReport, stripHallucinatedContent } from "./verify-report";
import { expertReviewStep } from "./expert-review";
import { generateReportStep } from "./generate-report-html";
import { sendEmailStep } from "./send-email";
import { verifyNarrativeGapEvidence } from "./verify-narrative-gap";
import { sendErrorEmail } from "@/lib/services/resend";
import type {
  JobStatus,
  ScrapedPage,
  AnalysisInput,
  SourceRecord,
  CompiledReport,
  NarrativeGapResult,
} from "@/lib/types";
import type { Review } from "@/lib/services/apify";

/**
 * Update the job status in Redis with the current step information.
 */
async function updateJobStatus(
  jobId: string,
  patch: Partial<JobStatus>,
): Promise<void> {
  try {
    const existing = await redis.get<JobStatus>(`job:${jobId}`);
    if (!existing) return;

    await redis.set(`job:${jobId}`, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Redis failures should not block the pipeline.
    console.warn(`[pipeline] Failed to update job status for ${jobId}`);
  }
}

/**
 * Build the AnalysisInput from cleaned pipeline data.
 */
function buildAnalysisInput(
  domain: string,
  cleanedPages: ScrapedPage[],
  reviews: Review[],
  extras: ExtrasData,
  confidence: "high" | "medium" | "low",
): AnalysisInput {
  const pages: SourceRecord[] = cleanedPages.map((p) => ({
    url: p.url,
    content: p.content,
    scrapedAt: new Date().toISOString(),
    source: "website" as const,
    selector: p.type,
  }));

  // After Inngest JSON serialization, reviews are plain objects.
  // Build SourceRecords and filter out any reviews with no meaningful text content.
  const reviewRecords: SourceRecord[] = reviews
    .map((r) => ({
      url: r.sourceUrl || "",
      content: [r.text, r.pros ? `Pros: ${r.pros}` : "", r.cons ? `Cons: ${r.cons}` : ""]
        .filter(Boolean)
        .join("\n"),
      scrapedAt: r.date || new Date().toISOString(),
      source: "review" as const,
      selector: r.platform,
      platform: r.platform,
      author: r.author || undefined,
      category: r.category || undefined,
      rating: r.rating ?? undefined,
    }))
    .filter((r) => r.content.trim().length > 10);

  // Extract company name from homepage title or first heading
  const homepage = cleanedPages.find((p) => p.type === "homepage");
  const nameMatch = homepage?.content.match(/^#\s+(.+)/m);
  const companyName = nameMatch?.[1] || domain.split(".")[0];

  return {
    company: {
      domain,
      name: companyName,
    },
    pages,
    reviews: reviewRecords,
    extras: {
      techStack: extras.techStack,
      newsArticles: extras.newsArticles.map((a) => ({
        url: a.url,
        content: `${a.title}\n${a.snippet}`,
        scrapedAt: new Date().toISOString(),
        source: "news" as const,
      })),
      archiveSnapshots: extras.archiveSnapshots?.map((s) => ({
        url: s.url,
        timestamp: s.timestamp,
        archiveUrl: s.archiveUrl,
      })),
    },
    dataQuality: {
      valid: true,
      confidence,
      pageCount: cleanedPages.length,
      reviewCount: reviews.length,
      issues: [],
    },
  };
}

export const voiceGapPipeline = inngest.createFunction(
  {
    id: "voice-gap-pipeline",
    retries: 1,
    triggers: [{ event: "analysis/requested" }],
  },
  async ({ event, step }) => {
    const { domain, email = "", jobId } = event.data as {
      domain: string;
      email?: string;
      jobId: string;
    };

    await updateJobStatus(jobId, {
      status: "running",
      currentStep: "scrape-website",
    });

    // Step 1: Scrape website
    const websiteData = await step.run("scrape-website", async () => {
      console.log(`[scrape-website] Scraping ${domain}`);
      return scrapeWebsiteStep(domain);
    });

    await updateJobStatus(jobId, { currentStep: "scrape-reviews" });

    // Step 2: Scrape reviews
    const reviewData = await step.run("scrape-reviews", async () => {
      return scrapeReviewsStep(domain);
    });

    await updateJobStatus(jobId, { currentStep: "scrape-extras" });

    // Step 3: Scrape extras
    const extrasData: ExtrasData = await step.run("scrape-extras", async () => {
      return scrapeExtras(domain);
    });

    await updateJobStatus(jobId, { currentStep: "clean-data" });

    // Step 4: Clean data + detect tech stack
    const cleanedData = await step.run("clean-data", async () => {
      console.log("[clean-data] Cleaning scraped content");

      const pages = (websiteData as ScrapedPage[]);
      const cleanedPages: ScrapedPage[] = pages.map((page) => ({
        ...page,
        content: cleanContent(page.content),
      }));

      const allRawContent = pages.map((p) => p.content).join("\n");
      const techStack = detectTechStack(allRawContent);

      // After Inngest JSON serialization, reviewData is a plain object.
      // Safely extract the reviews array, falling back to empty array.
      const reviewDataObj = reviewData as { reviews?: Review[]; platforms?: string[] };
      const reviews = Array.isArray(reviewDataObj?.reviews) ? reviewDataObj.reviews : [];
      const platforms = Array.isArray(reviewDataObj?.platforms) ? reviewDataObj.platforms : [];

      console.log(`[clean-data] ${reviews.length} reviews from ${platforms.length} platforms`);

      return {
        pages: cleanedPages,
        reviews,
        platforms,
        extras: {
          ...(extrasData as ExtrasData),
          techStack,
        },
      };
    });

    await updateJobStatus(jobId, { currentStep: "verify-scraped-data" });

    // Step 4a: Verify scraped data meets minimum thresholds
    const verification = await step.run("verify-scraped-data", async () => {
      console.log("[verify-scraped-data] Validating data quality");

      const pages = cleanedData.pages as ScrapedPage[];
      const reviews = (cleanedData.reviews as Review[]).map((r) => ({
        url: r.sourceUrl || "",
        content: [r.text, r.pros, r.cons].filter(Boolean).join("\n"),
      }));

      return verifyScrapeData(
        pages,
        reviews,
        { techStack: (cleanedData.extras as ExtrasData).techStack, newsArticles: [] },
        domain,
      );
    });

    // If verification fails hard (no homepage), abort and notify user
    if (!verification.valid) {
      await updateJobStatus(jobId, {
        status: "failed",
        error: `Data verification failed: ${(verification.issues as string[]).join(", ")}`,
      });

      console.error(
        `[pipeline] Aborting: data verification failed for ${domain}`,
        verification.issues,
      );

      if (email) {
        await step.run("send-error-email", async () => {
          return sendErrorEmail({
            to: email,
            domain,
            reason: "We weren't able to access enough content from your website to produce a meaningful analysis. This can happen if the site blocks automated access, has very little public content, or is behind a login wall.",
          });
        });
      }

      return { jobId, error: "insufficient_data", issues: verification.issues };
    }

    // Build the AnalysisInput for Claude
    const analysisInput = buildAnalysisInput(
      domain,
      cleanedData.pages as ScrapedPage[],
      cleanedData.reviews as Review[],
      cleanedData.extras as ExtrasData,
      verification.confidence as "high" | "medium" | "low",
    );

    await updateJobStatus(jobId, { currentStep: "analyze-narrative-gap" });

    // Step 5: Narrative gap analysis via Claude
    let narrativeGap = await step.run("analyze-narrative-gap", async () => {
      console.log("[analyze-narrative-gap] Running Claude analysis");
      return analyzeNarrativeGapStep(analysisInput);
    });

    // Step 5a: Verify narrative gap evidence against source data
    narrativeGap = await step.run("verify-narrative-gap", async () => {
      console.log("[verify-narrative-gap] Checking gap evidence against source corpus");
      return verifyNarrativeGapEvidence(narrativeGap, analysisInput);
    });

    await updateJobStatus(jobId, { currentStep: "analyze-psychology" });

    // Step 6: Customer psychology analysis (conditional on review count)
    const customerPsych = await step.run("analyze-psychology", async () => {
      return analyzeCustomerPsychologyStep(
        analysisInput,
        narrativeGap,
      );
    });

    await updateJobStatus(jobId, { currentStep: "compile-report" });

    // Step 7: Compile final report via Claude
    let report = await step.run("compile-report", async () => {
      console.log("[compile-report] Compiling report");
      return compileReportStep(analysisInput, narrativeGap, customerPsych);
    });

    // Step 7a: Verify report against source material
    const reportVerification = await step.run("verify-report", async () => {
      console.log("[verify-report] Running anti-hallucination checks");
      return verifyReport(report, analysisInput);
    });

    // If verification failed, retry compilation with corrections
    if (!reportVerification.valid) {
      report = await step.run("compile-report-retry", async () => {
        console.log("[compile-report-retry] Re-compiling with corrections");
        return compileReportWithCorrections(
          analysisInput,
          narrativeGap,
          customerPsych,
          reportVerification.issues as string[],
        );
      });

      // Re-verify the retried report
      const retryVerification = await step.run("verify-report-retry", async () => {
        console.log("[verify-report-retry] Re-verifying corrected report");
        return verifyReport(report as CompiledReport, analysisInput);
      });

      // If still hallucinated after retry, strip before expert review
      if (!retryVerification.valid && (retryVerification.hallucinatedQuotes ?? []).length > 0) {
        report = await step.run("strip-hallucinations-pre-expert", async () => {
          console.log(
            `[strip-hallucinations-pre-expert] Stripping ${(retryVerification.hallucinatedQuotes ?? []).length} remaining hallucinated quote(s)`,
          );
          return stripHallucinatedContent(
            report as CompiledReport,
            retryVerification,
          );
        });

        // Re-verify after stripping to confirm report is clean
        const postStripVerification = await step.run("verify-post-strip", async () => {
          console.log("[verify-post-strip] Re-verifying after hallucination strip");
          return verifyReport(report as CompiledReport, analysisInput);
        });

        if (!postStripVerification.valid) {
          console.warn(
            `[pipeline] Report still invalid after pre-expert strip for ${domain}`,
            postStripVerification.issues,
          );
        }
      }
    }

    await updateJobStatus(jobId, { currentStep: "expert-review" });

    // Step 7b: Expert review panel (Dunford, Moesta, Schwartz, Wiebe, Trott)
    report = await step.run("expert-review", async () => {
      console.log("[expert-review] Running expert panel review");
      return expertReviewStep(report as CompiledReport, analysisInput);
    });

    // Step 7c: Verify expert-reviewed report (anti-hallucination gate #2)
    let finalVerification = await step.run("verify-final", async () => {
      console.log("[verify-final] Running post-expert-review anti-hallucination checks");
      return verifyReport(report as CompiledReport, analysisInput);
    });

    // If expert review introduced hallucinations, strip them
    if (!finalVerification.valid && (finalVerification.hallucinatedQuotes ?? []).length > 0) {
      report = await step.run("strip-hallucinations", async () => {
        console.log(
          `[strip-hallucinations] Stripping ${(finalVerification.hallucinatedQuotes ?? []).length} hallucinated quote(s)`,
        );
        return stripHallucinatedContent(
          report as CompiledReport,
          finalVerification,
        );
      });

      // Re-verify after stripping
      finalVerification = await step.run("verify-after-strip", async () => {
        console.log("[verify-after-strip] Re-verifying after final hallucination strip");
        return verifyReport(report as CompiledReport, analysisInput);
      });
    }

    // HARD GATE: Do not ship invalid reports
    if (!finalVerification.valid) {
      const criticalIssues = (finalVerification.issues as string[]).filter(
        (i) => i.startsWith("HALLUCINATED") || i.startsWith("CRITICAL") || i.startsWith("UNCITED"),
      );

      if (criticalIssues.length > 0) {
        // Critical issues: abort pipeline entirely
        await updateJobStatus(jobId, {
          status: "failed",
          error: `Report failed verification: ${criticalIssues.length} critical issue(s)`,
        });

        console.error(
          `[pipeline] Aborting: report failed final verification for ${domain}`,
          finalVerification.issues,
        );

        if (email) {
          await step.run("send-verification-failure-email", async () => {
            return sendErrorEmail({
              to: email,
              domain,
              reason:
                "We completed the analysis but our quality checks flagged issues we could not resolve automatically. " +
                "We would rather not send you a report with unverified claims. " +
                "Please reply to this email and we will look into it.",
            });
          });
        }

        return { jobId, error: "verification_failed", issues: finalVerification.issues };
      }

      // Non-critical issues (specificity, minor slop): log warning but allow
      console.warn(
        `[pipeline] Report has non-critical verification issues for ${domain}:`,
        finalVerification.issues,
      );
    }

    await updateJobStatus(jobId, { currentStep: "generate-report" });

    // Step 8: Generate report JSON and store
    const reportUrl = await step.run("generate-report", async () => {
      console.log("[generate-report] Storing report");
      return generateReportStep(jobId, report as CompiledReport);
    });

    // Mark job as completed
    await updateJobStatus(jobId, {
      status: "completed",
      reportUrl,
      currentStep: undefined,
    });

    return { jobId, reportUrl };
  },
);
