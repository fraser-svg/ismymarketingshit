import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import type { CompiledReport } from "@/lib/types";

/**
 * Stores the compiled report as JSON so the report page can read it.
 *
 * Local development: writes to `data/reports/{jobId}.json`.
 * Production: TODO wire up Vercel Blob for persistent storage.
 */
export async function generateReportStep(
  jobId: string,
  report: CompiledReport,
): Promise<string> {
  const reportsDir = join(process.cwd(), "data", "reports");

  // Ensure directory exists
  await mkdir(reportsDir, { recursive: true });

  const filePath = join(reportsDir, `${jobId}.json`);
  await writeFile(filePath, JSON.stringify(report, null, 2), "utf-8");

  // TODO: production — upload to Vercel Blob instead of local filesystem
  // import { put } from "@vercel/blob";
  // const blob = await put(`reports/${jobId}.json`, JSON.stringify(report), {
  //   contentType: "application/json",
  //   access: "public",
  // });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/report/${jobId}`;
}
