import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/services/redis";
import type { JobStatus } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "Missing job ID" },
        { status: 400 },
      );
    }

    const job = await redis.get<JobStatus>(`job:${jobId}`);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: job.status,
      currentStep: job.currentStep,
      ...(job.reportUrl ? { reportUrl: job.reportUrl } : {}),
      ...(job.error ? { error: job.error } : {}),
    });
  } catch (error) {
    console.error("[GET /api/status/[id]] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
