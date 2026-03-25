import type { VoiceGap } from "@/lib/types";

interface GapCardProps {
  gap: VoiceGap;
}

const severityStyles: Record<
  VoiceGap["severity"],
  { bg: string; text: string; label: string }
> = {
  critical: { bg: "bg-red-50", text: "text-red-700", label: "Critical" },
  major: { bg: "bg-amber-50", text: "text-amber-700", label: "Major" },
  minor: { bg: "bg-zinc-100", text: "text-zinc-600", label: "Minor" },
};

export function GapCard({ gap }: GapCardProps) {
  const severity = severityStyles[gap.severity];

  return (
    <div className="border border-zinc-200 rounded-lg p-5 sm:p-6">
      {/* Severity badge */}
      <span
        className={`inline-block text-xs font-semibold tracking-wide uppercase px-2 py-0.5 rounded ${severity.bg} ${severity.text}`}
      >
        {severity.label}
      </span>

      {/* Theme heading */}
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900">
        {gap.theme.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </h3>

      {/* Two-column contrast */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-zinc-400 mb-1.5">
            What you say
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            {gap.companyMessage}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-zinc-400 mb-1.5">
            What an outsider sees
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            {gap.customerPerception}
          </p>
        </div>
      </div>

      {/* Evidence */}
      {(gap.evidence.companySource || gap.evidence.customerSource) && (
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-400 leading-relaxed">
            {gap.evidence.companySource && (
              <span className="block">
                <span className="font-medium text-zinc-500">Source:</span>{" "}
                {gap.evidence.companySource}
              </span>
            )}
            {gap.evidence.customerSource && (
              <span className="block mt-0.5">
                <span className="font-medium text-zinc-500">Evidence:</span>{" "}
                {gap.evidence.customerSource}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
