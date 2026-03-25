"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const TERMINAL_LINES = [
  "> Waking THE VC'S GHOSTWRITER...",
  "> Pinging technographics...",
  "> Analyzing Hero H1 structure vs. G2 market positioning...",
  "> Calculating theoretical Jargon Density Threshold...",
  "> ERROR: Threshold exceeded. 'Synergy' detected.",
  "> Bypassing marketing fluff. Isolating pure friction...",
  "> Compiling brutal reality check...",
  "> Dispatching to analysis pipeline...",
];

function extractDomain(url: string): string {
  let d = url.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/[/?#].*$/, "");
  return d;
}

function isValidInput(value: string): boolean {
  const domain = extractDomain(value.trim());
  return domain.includes(".") && !domain.includes(" ") && domain.length > 3;
}

type Phase = "idle" | "running" | "error";

export function SubmitForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [polling, setPolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, []);

  async function handleRoast() {
    if (!isValidInput(url)) {
      alert("Enter a URL first.");
      return;
    }

    const domain = extractDomain(url);
    setPhase("running");
    setTerminalLines([]);
    setPolling(false);

    // Fire API call immediately in background
    const jobIdPromise = fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error ?? `Request failed with status ${res.status}`
        );
      }
      const data = await res.json();
      return data.jobId as string;
    });

    // Play terminal lines
    const lines = [...TERMINAL_LINES];
    lines[1] = `> Pinging ${domain} technographics...`;

    let lineIndex = 0;
    function printNext() {
      if (lineIndex < lines.length) {
        const line = lines[lineIndex++];
        setTerminalLines((prev) => [...prev, line]);
        setTimeout(printNext, Math.random() * 600 + 400);
      }
    }
    setTimeout(printNext, 300);

    // Await API response
    let jobId: string;
    try {
      jobId = await jobIdPromise;
    } catch (err) {
      setPhase("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      return;
    }

    // Start polling
    setPolling(true);

    function poll() {
      pollingTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/status/${jobId}`);
          if (res.ok) {
            const status = await res.json();
            if (status.status === "completed") {
              router.push(`/report/${jobId}`);
              return;
            }
            if (status.status === "failed") {
              setPhase("error");
              setErrorMessage(
                status.error ?? "Analysis failed. Please try again."
              );
              return;
            }
          }
        } catch {
          // network blip — keep polling
        }
        poll();
      }, 3000);
    }

    poll();
  }

  function handleReset() {
    if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    setPhase("idle");
    setUrl("");
    setTerminalLines([]);
    setPolling(false);
    setErrorMessage("");
  }

  return (
    <section className="max-w-4xl mx-auto bg-yellow-300 brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-12 space-y-8 transform hover:-translate-y-1 transition-transform">
      {/* Header */}
      <div className="bg-black text-white px-6 md:px-12 pt-6 md:pt-12 pb-6 md:pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 -mx-6 md:-mx-12 -mt-6 md:-mt-12 border-b-4 border-black">
        <h2 className="font-mono text-4xl md:text-5xl font-black uppercase tracking-tighter shrink-0 text-red-500">
          GET ROASTED.
        </h2>
        <h3 className="font-mono text-base md:text-lg font-bold uppercase tracking-tight md:text-right text-gray-200">
          find out what&apos;s stopping people understanding your business
        </h3>
      </div>

      <div className="space-y-8 pt-4 relative">
        {/* URL input — shown only when idle */}
        {phase === "idle" && (
          <div className="space-y-3">
            <label className="block font-black text-xl md:text-2xl uppercase tracking-tight">
              Enter your website URL
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="https://your-startup.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRoast()}
                className="flex-1 bg-white brutal-border p-5 md:p-6 text-xl md:text-2xl font-mono focus:outline-none focus:bg-black focus:text-white placeholder-gray-400 transition-colors"
              />
              <button
                onClick={handleRoast}
                className="bg-red-500 text-black brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] text-xl md:text-3xl font-black uppercase px-12 py-5 md:py-6 transition-all whitespace-nowrap overflow-hidden"
              >
                🔥 ROAST 🔥
              </button>
            </div>
          </div>
        )}

        {/* Terminal — shown when running */}
        {phase === "running" && (
          <div className="mt-8 bg-black brutal-border p-6 shadow-[8px_8px_0_0_#EF4444] min-h-[220px] flex flex-col justify-end overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
            <div className="font-mono text-green-400 text-sm md:text-base space-y-3 mb-2">
              {terminalLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              {polling && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <span className="animate-pulse inline-block w-2 h-4 bg-yellow-300" />
                  <span>ROASTING IN PROGRESS...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="space-y-4">
            <p className="font-mono text-base font-bold uppercase text-red-700">
              {errorMessage}
            </p>
            <button
              onClick={handleReset}
              className="bg-red-500 text-black brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] font-black uppercase px-8 py-4 text-xl transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
