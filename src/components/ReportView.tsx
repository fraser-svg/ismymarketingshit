"use client";

import Script from "next/script";
import type { CompiledReport } from "@/lib/types";

interface ReportViewProps {
  report: CompiledReport;
}

function getScoreLabel(score: number): string {
  if (score <= 30) return "TERMINAL";
  if (score <= 55) return "FAILING";
  if (score <= 70) return "STRUGGLING";
  if (score <= 85) return "POOR";
  return "PASSING";
}

function getStatusLabel(score: number): string {
  if (score <= 55) return "CRITICAL FAILURE";
  if (score <= 70) return "POOR PERFORMANCE";
  if (score <= 85) return "BELOW AVERAGE";
  return "ADEQUATE";
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const months = [
      "JAN","FEB","MAR","APR","MAY","JUN",
      "JUL","AUG","SEP","OCT","NOV","DEC",
    ];
    const mon = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${mon} ${day}, ${year} ${hh}:${mm}:${ss}`;
  } catch {
    return iso;
  }
}

function getSeverityBadge(severity: string): string {
  const s = severity.toUpperCase();
  if (s === "CRITICAL") return "ERR";
  if (s === "MAJOR") return "WARN";
  return "INFO";
}

export function ReportView({ report }: ReportViewProps) {
  const scoreLabel = getScoreLabel(report.score);
  const statusLabel = getStatusLabel(report.score);
  const timestamp = formatTimestamp(report.generatedAt);
  const gaps = report.narrativeGap?.gaps ?? [];

  function downloadBoardroomPDF() {
    const element = document.getElementById("pdf-content");
    if (!element) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) return;

    document.body.classList.add("pdf-export-mode");

    const opt = {
      margin: 15,
      filename: `Strategic_Messaging_Audit_${report.domain}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        document.body.classList.remove("pdf-export-mode");
      });
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        strategy="lazyOnload"
      />

      {/* PDF export styles */}
      <style>{`
        .pdf-export-mode { background-color: #fff !important; }
        .pdf-export-mode .print-hidden { display: none !important; }
        .pdf-export-mode .print-block { display: block !important; }
        .pdf-export-mode .brutal-border,
        .pdf-export-mode .border-4 { border-width: 1px !important; border-color: #ddd !important; }
        .pdf-export-mode .brutal-shadow,
        .pdf-export-mode .brutal-shadow-sm { box-shadow: none !important; }
        .print-block { display: none; }
      `}</style>

      {/* Nav */}
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

      <div className="p-4 md:p-8 flex-grow flex justify-center bg-neutral-100 min-h-screen">
        <div
          className="w-full max-w-2xl bg-white brutal-border p-6 md:p-10 shadow-[12px_12px_0_0_#000]"
          id="pdf-content"
        >
          {/* PDF Cover Page (hidden on web) */}
          <div className="print-block w-full border-b text-left mb-12">
            <span className="font-mono text-sm uppercase font-bold text-gray-400 mb-6 tracking-widest block">
              PRIVATE &amp; CONFIDENTIAL
            </span>
            <h1 className="font-sans text-5xl md:text-6xl font-black uppercase tracking-tighter text-black leading-tight max-w-lg mb-10">
              STRATEGIC MESSAGING AUDIT
            </h1>
            <div className="font-mono text-sm uppercase space-y-3 text-gray-500 font-bold">
              <p className="text-black">TARGET: {report.domain.toUpperCase()}</p>
              <p className="text-black">DATE OF ANALYSIS: {timestamp}</p>
              <p className="text-black">PREPARED BY: DEAN &amp; WISEMAN CONSULTING</p>
            </div>
          </div>

          {/* Receipt Header */}
          <div className="border-b-4 border-black border-dashed pb-6 mb-6 text-center">
            <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tighter print-hidden">
              * CLARITY AUDIT *
            </h1>
            <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tighter print-block">
              * MESSAGING FRICTION ANALYSIS *
            </h1>
            <p className="font-mono text-sm uppercase font-bold mt-2 text-gray-500 print-hidden">
              TERMINAL: 04-B // OP: ismypositioningshit
            </p>
          </div>

          {/* Metadata */}
          <div className="font-mono text-sm font-bold uppercase space-y-2 border-b-2 border-black border-dashed pb-6 mb-6">
            <div className="flex justify-between">
              <span>TARGET:</span>
              <span>{report.domain}</span>
            </div>
            <div className="flex justify-between">
              <span>TIMESTAMP:</span>
              <span>{timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="text-red-600">{statusLabel}</span>
            </div>
          </div>

          {/* Scorecard */}
          <div className="border-b-4 border-black border-dashed pb-6 mb-6 text-center">
            <h2 className="font-mono text-xl font-bold uppercase mb-2">
              ++ DIAGNOSTIC SCORE ++
            </h2>
            <div className="animate-pulse text-7xl md:text-8xl font-black text-black tracking-tighter my-4">
              {report.score}
              <span className="text-3xl text-gray-400">/100</span>
            </div>
            <div className="inline-block bg-black text-white font-mono font-bold text-sm px-4 py-1 uppercase mb-8">
              {scoreLabel}
            </div>
          </div>

          {/* Overview */}
          <div className="border-b-2 border-black border-dashed pb-6 mb-6">
            <h2 className="font-mono text-lg font-bold uppercase mb-4">
              &gt; OVERVIEW_
            </h2>
            <p className="font-mono text-base md:text-xl font-black uppercase leading-relaxed text-black">
              {report.mirrorLine}
            </p>
          </div>

          {/* Detected Anomalies */}
          {gaps.length > 0 && (
            <div className="border-b-4 border-black border-dashed pb-6 mb-6 space-y-8">
              <h2 className="font-mono text-lg font-bold uppercase">
                &gt; DETECTED ANOMALIES_
              </h2>
              {gaps.map((gap, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="bg-black text-white font-mono text-xs px-2 py-1 font-bold shrink-0">
                      {getSeverityBadge(gap.severity)}:{String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-mono text-base font-black uppercase underline">
                      {gap.theme}
                    </h3>
                  </div>
                  <div className="pl-0 md:pl-10 space-y-2">
                    <p className="font-mono text-sm uppercase">
                      <span className="font-bold">INPUT:</span> &quot;
                      {gap.companyMessage}&quot;
                    </p>
                    <p className="font-mono text-sm uppercase text-red-600">
                      <span className="font-bold">EXPECTED:</span> &quot;
                      {gap.customerPerception}&quot;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Verbose Logs */}
          {report.sections.length > 0 && (
            <div className="border-b-4 border-black border-dashed pb-6 mb-6 space-y-8">
              <h2 className="font-mono text-lg font-bold uppercase">
                &gt; VERBOSE LOGS_
              </h2>
              {report.sections.map((section, i) => {
                const isBottomLine = i === report.sections.length - 1;
                return (
                  <div
                    key={i}
                    className={`space-y-2${isBottomLine ? " focus-fix relative" : ""}`}
                  >
                    {isBottomLine && (
                      <div className="absolute -inset-2 bg-red-100 -z-10" />
                    )}
                    <h4
                      className={`font-mono text-base font-black uppercase${
                        isBottomLine ? " text-red-600 md:text-lg" : ""
                      }`}
                    >
                      {i + 1}. {section.title.toUpperCase()}
                    </h4>
                    <p
                      className={`font-mono text-base md:text-lg uppercase font-bold leading-tight${
                        isBottomLine
                          ? " text-black mt-2"
                          : " text-gray-700"
                      }`}
                    >
                      {section.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Social Card */}
          <div className="border-b-4 border-black border-dashed pb-6 mb-6 print-hidden">
            <h2 className="font-mono text-lg font-bold uppercase mb-4">
              &gt; SHAREABLE ASSET_
            </h2>
            <div className="aspect-square bg-black brutal-border p-8 flex flex-col justify-between max-w-sm mx-auto shadow-[8px_8px_0_0_#ef4444] relative overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex justify-between items-start z-10">
                <span className="font-mono text-yellow-300 text-xs uppercase font-bold tracking-widest">
                  ismypositioningshit.com
                </span>
                <span className="font-mono text-white text-xs uppercase font-bold">
                  @{report.domain.replace(/\./g, "_")}
                </span>
              </div>
              <div className="space-y-4 z-10 text-center">
                <p className="text-sm font-mono text-red-500 font-bold uppercase">
                  &quot;MY MESSAGING IS A MYSTERY&quot;
                </p>
                <div className="text-8xl font-black text-white tracking-tighter leading-none">
                  {report.score}
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <p className="font-mono text-xs uppercase font-bold bg-white text-black inline-block px-2 py-1">
                  {scoreLabel} DIAGNOSIS
                </p>
              </div>
              <p className="font-mono text-sm md:text-base font-bold text-white text-center leading-tight z-10">
                {report.mirrorLine.length > 80
                  ? report.mirrorLine.slice(0, 77) + "..."
                  : report.mirrorLine}
              </p>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600 rounded-full blur-3xl opacity-20" />
            </div>
            <p className="font-mono text-xs font-bold text-center text-gray-500 uppercase mt-4">
              Click to copy image for social
            </p>
          </div>

          {/* Footer actions */}
          <div className="text-center pt-4 print-hidden">
            <p className="font-mono text-sm font-bold text-gray-500 uppercase mb-6">
              *** END OF REPORT ***
            </p>

            {/* Share buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <button className="bg-[#1DA1F2] text-white font-mono font-bold text-xs md:text-sm uppercase py-4 brutal-border hover:bg-black transition-colors flex justify-center items-center gap-2">
                EXPOSE MY SCORE
              </button>
              <button className="bg-[#0A66C2] text-white font-mono font-bold text-xs md:text-sm uppercase py-4 brutal-border hover:bg-black transition-colors flex justify-center items-center gap-2">
                SHARE TO LINKEDIN
              </button>
              <button className="bg-yellow-300 text-black font-mono font-bold text-xs md:text-sm uppercase py-4 brutal-border shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex justify-center items-center gap-2">
                ROAST A RIVAL
              </button>
            </div>

            {/* PDF Download */}
            <button
              onClick={downloadBoardroomPDF}
              className="w-full bg-white text-black border-4 border-black px-6 py-4 mb-8 font-mono font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex justify-center items-center gap-2 group"
            >
              <svg
                className="w-5 h-5 group-hover:animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              DOWNLOAD BOARDROOM PDF
            </button>

            {/* CTA */}
            <div className="p-6 bg-red-500 brutal-border mt-4">
              <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight mb-4 text-black">
                Ready to stop confusing people?
              </h2>
              <button className="w-full bg-black text-white brutal-border shadow-[4px_4px_0_0_#FFF] text-xl font-black uppercase py-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                [ STOP THE BLEEDING ]
              </button>
              <p className="font-mono text-xs font-bold text-black uppercase mt-4">
                14-day intensive teardown
              </p>
            </div>
          </div>

          {/* Barcode */}
          <a
            href="/"
            className="mt-8 flex flex-col justify-center items-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer group print-hidden"
          >
            <div className="h-12 w-full max-w-[200px] flex items-end justify-between space-x-1">
              <div className="w-1 h-full bg-black" />
              <div className="w-3 h-full bg-black" />
              <div className="w-1 h-full bg-black" />
              <div className="w-2 h-full bg-black" />
              <div className="w-1 h-full bg-black" />
              <div className="w-4 h-full bg-black" />
              <div className="w-1 h-full bg-black" />
              <div className="w-2 h-full bg-black" />
              <div className="w-3 h-full bg-black" />
              <div className="w-1 h-full bg-black" />
              <div className="w-2 h-full bg-black" />
              <div className="w-1 h-full bg-black" />
            </div>
            <p className="font-mono text-[10px] uppercase font-bold text-gray-500 mt-2 tracking-widest group-hover:text-black">
              RUN ANOTHER DIAGNOSTIC
            </p>
          </a>
        </div>
      </div>
    </>
  );
}
