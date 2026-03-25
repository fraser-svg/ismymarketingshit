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
      <div className="bg-neutral-100 min-h-screen flex flex-col">
        <nav className="w-full bg-white border-b-4 border-black py-4 z-50">
          <div className="w-full max-w-5xl mx-auto px-4 flex items-center justify-start">
            <a
              href="/"
              className="font-black text-xl md:text-2xl uppercase tracking-tighter hover:text-red-600 transition-colors -ml-2 md:-ml-6"
            >
              💩 ismypositioningshit.com
            </a>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white brutal-border p-8 shadow-[8px_8px_0_0_#000]">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              SYSTEM ERROR
            </p>
            <h1 className="font-black text-3xl uppercase tracking-tighter mb-4">
              Report Not Found
            </h1>
            <p className="font-mono text-sm font-bold uppercase text-gray-600 mb-6">
              This report does not exist or is still being generated. Reports
              typically take 2-3 minutes. Check back shortly.
            </p>
            <p className="font-mono text-xs text-gray-400 mb-6">ID: {id}</p>
            <a
              href="/"
              className="block w-full bg-red-500 text-black brutal-border text-center font-black uppercase py-3 hover:bg-black hover:text-white transition-colors"
            >
              Run Another Diagnostic
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <ReportView report={report} />;
}
