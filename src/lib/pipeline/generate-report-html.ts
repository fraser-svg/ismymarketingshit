import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import type { CompiledReport } from "@/lib/types";
import { storeData } from "@/lib/services/storage";

/**
 * Stores the compiled report as JSON so the report page can read it.
 *
 * Production: uploads to Vercel Blob for persistent storage.
 * Development: writes to `data/reports/{jobId}.json` as fallback.
 */
export async function generateReportStep(
  jobId: string,
  report: CompiledReport,
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const reportPageUrl = `${baseUrl}/report/${jobId}`;

  // Use Vercel Blob in production (when BLOB_READ_WRITE_TOKEN is set)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobUrl = await storeData(`reports/${jobId}.json`, report);
      console.log(`[generate-report] Stored to Vercel Blob: ${blobUrl}`);
      return reportPageUrl;
    } catch (err) {
      console.error(
        `[generate-report] Vercel Blob upload failed, falling back to filesystem: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Fall through to filesystem
    }
  }

  // Filesystem fallback (development or Blob failure)
  const reportsDir = join(process.cwd(), "data", "reports");
  await mkdir(reportsDir, { recursive: true });

  const filePath = join(reportsDir, `${jobId}.json`);
  await writeFile(filePath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`[generate-report] Stored to filesystem: ${filePath}`);

  return reportPageUrl;
}
