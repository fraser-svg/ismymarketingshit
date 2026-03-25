import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { CompiledReport } from "@/lib/types";
import { ReportView } from "@/components/ReportView";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

async function loadReport(id: string): Promise<CompiledReport | null> {
  // Sanitise the ID to prevent path traversal
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId || safeId !== id) return null;

  // Try Vercel Blob first (production)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { retrieveData } = await import("@/lib/services/storage");
      const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? "https://" : ""}`;
      // Use the Vercel Blob list/fetch pattern
      const { list } = await import("@vercel/blob");
      const blobs = await list({ prefix: `voice-gap/reports/${safeId}.json` });
      if (blobs.blobs.length > 0) {
        const report = await retrieveData<CompiledReport>(blobs.blobs[0].url);
        if (report) return report;
      }
    } catch (err) {
      console.warn(`[report-page] Blob lookup failed, trying filesystem: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Filesystem fallback (development)
  const filePath = join(process.cwd(), "data", "reports", `${safeId}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as CompiledReport;
  } catch {
    return null;
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  if (!report) {
    return (
      <div className="flex flex-1 flex-col items-center bg-white font-sans">
        <main className="flex w-full max-w-2xl flex-col px-6 py-20 sm:py-32">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            Voice Gap Analysis
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            Report not found
          </h1>
          <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
            This report does not exist or is still being generated. Reports
            typically take two to three minutes to complete. Check back shortly.
          </p>
          <p className="mt-6 font-mono text-xs text-zinc-300">
            ID: {id}
          </p>
        </main>
      </div>
    );
  }

  return <ReportView report={report} />;
}
