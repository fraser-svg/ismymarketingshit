import { sendReportEmail } from "@/lib/services/resend";
import type { CompiledReport } from "@/lib/types";

export async function sendEmailStep(
  email: string,
  report: CompiledReport,
  reportUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const keyFindings = report.sections.slice(0, 3).map((s) => s.title);

  return sendReportEmail({
    to: email,
    domain: report.domain,
    mirrorLine: report.mirrorLine,
    score: report.score,
    reportUrl,
    keyFindings,
  });
}
