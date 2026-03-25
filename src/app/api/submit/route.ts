import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/services/redis";
import { inngest } from "@/lib/inngest/client";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { checkSSRF } from "@/lib/utils/validation";
import type { JobStatus } from "@/lib/types";

/**
 * Normalise a domain string: strip protocol, www prefix, trailing slashes,
 * and convert to lowercase.
 */
function normaliseDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/\/+$/, "");
  return d;
}

/**
 * Basic domain validation: must contain a dot, no spaces, non-empty after
 * normalisation.
 */
function isValidDomain(domain: string): boolean {
  if (!domain || domain.length === 0) return false;
  if (/\s/.test(domain)) return false;
  if (!domain.includes(".")) return false;
  // Reject domains that are just a dot or have empty labels
  const parts = domain.split(".");
  return parts.every((p) => p.length > 0);
}

/**
 * Basic email format check.
 */
function isValidEmail(email: string): boolean {
  // Intentionally simple — more thorough validation happens at delivery time.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain: rawDomain, email, website: honeypot } = body as {
      domain?: string;
      email?: string;
      website?: string;
    };

    // --- Honeypot check (bot detection) ---
    if (honeypot) {
      // Bots fill in the hidden "website" field. Silently reject with a
      // fake success response so they don't know they were caught.
      console.warn("[POST /api/submit] Honeypot triggered — rejecting bot submission");
      return NextResponse.json(
        { jobId: "ok", message: "Analysis started" },
        { status: 202 },
      );
    }

    // --- Validate inputs ---
    if (!rawDomain || typeof rawDomain !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'domain' field" },
        { status: 400 },
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'email' field" },
        { status: 400 },
      );
    }

    const domain = normaliseDomain(rawDomain);

    if (!isValidDomain(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format. Provide a domain like 'example.com'" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // --- SSRF protection ---
    const ssrfCheck = await checkSSRF(domain);
    if (!ssrfCheck.safe) {
      console.warn(
        `[POST /api/submit] SSRF check blocked domain "${domain}": ${ssrfCheck.reason}`,
      );
      return NextResponse.json(
        { error: "Invalid domain format. Provide a domain like 'example.com'" },
        { status: 400 },
      );
    }

    // --- Rate limiting ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateCheck = await checkRateLimit({
      email: email.trim(),
      domain,
      ip,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        {
          status: 429,
          headers: rateCheck.retryAfter
            ? { "Retry-After": String(rateCheck.retryAfter) }
            : undefined,
        },
      );
    }

    // --- Create job ---
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();

    const jobStatus: JobStatus = {
      status: "queued",
      domain,
      email: email.trim(),
      createdAt: now,
    };

    await redis.set(`job:${jobId}`, jobStatus);

    // --- Emit Inngest event ---
    await inngest.send({
      name: "analysis/requested",
      data: {
        domain,
        email: email.trim(),
        jobId,
      },
    });

    return NextResponse.json(
      { jobId, message: "Analysis started" },
      { status: 202 },
    );
  } catch (error) {
    console.error("[POST /api/submit] Unhandled error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
