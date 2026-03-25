import type { CompiledReport } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";
import { GapCard } from "./GapCard";

interface ReportViewProps {
  report: CompiledReport;
}

/** Formats an ISO date string to a readable British format. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Format underscore_case gap type to readable label. */
function formatGapType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map scoreDimensions keys to readable labels. */
const dimensionLabels: Record<string, string> = {
  messageClarity: "Message clarity",
  customerAlignment: "Customer alignment",
  differentiation: "Differentiation",
  voiceConsistency: "Voice consistency",
  ctaClarity: "CTA clarity",
};

export function ReportView({ report }: ReportViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center bg-white font-sans">
      <article className="w-full max-w-2xl px-6 py-16 sm:py-24">
        {/* ─── Header ─── */}
        <header className="mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            Voice Gap Analysis
          </p>
          <p className="mt-2 font-mono text-sm text-zinc-400">
            {report.domain}
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            Generated {formatDate(report.generatedAt)}
          </p>
        </header>

        {/* ─── Mirror Line (always prominent) ─── */}
        {report.mirrorLine.trim().length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
              The mirror line
            </h2>
            <blockquote className="border-l-4 border-[#2563eb] pl-5 sm:pl-6">
              <p className="text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-zinc-900">
                {report.mirrorLine}
              </p>
            </blockquote>
          </section>
        )}

        {/* ─── Clarity Score ─── */}
        <section className="mb-16 flex flex-col items-center">
          <ScoreGauge score={report.score} label="Clarity score" />
        </section>

        {/* ─── Score Breakdown ─── */}
        <section className="mb-16">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
            Score breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="pb-2 pr-4 font-semibold text-xs tracking-wide uppercase text-zinc-400">
                    Dimension
                  </th>
                  <th className="pb-2 text-right font-semibold text-xs tracking-wide uppercase text-zinc-400">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.scoreDimensions && Object.entries(report.scoreDimensions).map(([key, dim]) => {
                  const d = dim as { score: number; maxScore: number };
                  const label = dimensionLabels[key] || formatGapType(key);
                  return (
                    <tr
                      key={key}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <td className="py-2 pr-4 text-zinc-700">{label}</td>
                      <td className="py-2 text-right font-mono text-zinc-500">
                        {d.score}/{d.maxScore}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-zinc-200">
                  <td className="pt-2 pr-4 font-semibold text-zinc-900">
                    Total
                  </td>
                  <td className="pt-2 text-right font-mono font-semibold text-zinc-900">
                    {report.score}/100
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Voice Gaps ─── */}
        {report.narrativeGap.gaps.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-6">
              Voice gaps
            </h2>
            <div className="space-y-4">
              {report.narrativeGap.gaps.map((gap, i) => (
                <GapCard key={`${gap.theme}-${i}`} gap={gap} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Report Sections (prose analysis) ─── */}
        {report.sections.filter((s) => s.content.trim().length > 0).length > 0 && (
          <section className="mb-16">
            {report.sections
              .filter((section) => section.content.trim().length > 0)
              .map((section, i) => (
              <div key={`${section.title}-${i}`} className="mb-10 last:mb-0">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-3">
                  {section.title}
                </h2>
                <div className="text-sm leading-relaxed text-zinc-600 whitespace-pre-line">
                  {section.content}
                </div>
                {section.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-100">
                    <p className="text-xs text-zinc-400">
                      {section.citations.map((cite, ci) => (
                        <span key={ci} className="block">
                          {cite}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ─── CTA ─── */}
        <section className="border-t border-zinc-200 pt-10">
          <p className="text-base font-medium text-zinc-900">
            Want to talk about what this means?
          </p>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            This report shows the gap. Closing it is a different conversation.
          </p>
          <a
            href="https://deanwiseman.com/contact"
            className="mt-4 inline-block text-sm font-semibold text-[#2563eb] hover:underline"
          >
            Book a call
          </a>
        </section>

        {/* ─── Footer ─── */}
        <footer className="mt-20 pt-6 border-t border-zinc-100">
          <p className="text-xs text-zinc-300">
            Voice Gap Analysis by Dean &amp; Wiseman. This is an automated
            diagnostic based on publicly available data. It is not a
            substitute for professional advice.
          </p>
        </footer>
      </article>
    </div>
  );
}
