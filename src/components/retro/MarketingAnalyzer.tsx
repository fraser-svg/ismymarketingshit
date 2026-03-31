"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Win98ProgressBar } from "./Win98ProgressBar";
import { Win98Button } from "./Win98Button";
import { Win98Dialog } from "./Win98Dialog";

type Phase = "BOOT" | "INPUT" | "SUBMITTING" | "SCANNING_P1" | "SCANNING_P2" | "SCANNING_P3" | "SCANNING_P4" | "SCORE" | "REDIRECTING" | "ERROR";

interface MarketingAnalyzerProps {
  onPhaseChange?: (phase: string) => void;
  onOpenPopup?: (content: { icon: "warning" | "error"; text: string }) => void;
}

function extractDomain(url: string): string {
  let d = url.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/[/?#].*$/, "");
  return d;
}

export const MarketingAnalyzer: React.FC<MarketingAnalyzerProps> = ({
  onPhaseChange,
  onOpenPopup,
}) => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("BOOT");
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showInputModal, setShowInputModal] = useState(false);
  const [domain, setDomain] = useState("");
  const [errorDialog, setErrorDialog] = useState<{ message: string; icon: "warning" | "error"; title?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [notResponding, setNotResponding] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortedRef = useRef(false);

  const addLine = (text: string) => {
    setLines((prev) => [...prev, text]);
  };

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    return () => {
      abortedRef.current = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  // Boot sequence
  useEffect(() => {
    if (phase === "BOOT") {
      const sequence = async () => {
        await new Promise((r) => setTimeout(r, 800));
        addLine("Initializing diagnostic engine...");
        await new Promise((r) => setTimeout(r, 1000));

        for (let i = 0; i <= 100; i += 8) {
          setProgress(Math.min(i, 100));
          await new Promise((r) => setTimeout(r, 150));
        }

        await new Promise((r) => setTimeout(r, 1000));
        addLine("Loading target...");
        await new Promise((r) => setTimeout(r, 1500));
        addLine("ERROR: NO TARGET SPECIFIED");
        await new Promise((r) => setTimeout(r, 800));
        addLine("The system cannot proceed.");
        await new Promise((r) => setTimeout(r, 500));
        addLine("A website domain is required.");
        await new Promise((r) => setTimeout(r, 1200));
        setPhase("INPUT");
        setShowInputModal(true);
      };
      sequence();
    }
  }, [phase]);

  const startAnalysis = async (target: string) => {
    setShowInputModal(false);
    document.body.style.cursor = "wait";
    setPhase("SUBMITTING");
    setLines([]);
    setProgress(3);

    addLine(`Target acquired: ${target}`);
    await new Promise((r) => setTimeout(r, 800));
    addLine("Dispatching to analysis pipeline...");

    // Fire real API call
    let jobId: string;
    let isExisting = false;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      jobId = data.jobId as string;
      isExisting = !!data.existing;
    } catch (err) {
      document.body.style.cursor = "default";
      setPhase("ERROR");
      addLine("FATAL: Pipeline connection failed");
      setErrorDialog({
        title: "System Error",
        message: err instanceof Error ? err.message : "Connection failed. Try again.",
        icon: "error",
      });
      return;
    }

    // If report already exists, skip straight to it
    if (isExisting) {
      addLine("Report found in cache.");
      await new Promise((r) => setTimeout(r, 500));
      addLine("Redirecting to existing report...");
      await new Promise((r) => setTimeout(r, 800));
      document.body.style.cursor = "default";
      setPhase("REDIRECTING");
      router.push(`/report/${jobId}`);
      return;
    }

    // Start theatrical scanning while polling in background
    addLine("Pipeline engaged. Running diagnostics...");
    await new Promise((r) => setTimeout(r, 500));
    runTheatricalScan(jobId);
  };

  const runTheatricalScan = async (jobId: string) => {
    if (abortedRef.current) return;

    // Start polling in background
    let completed = false;
    let failed = false;
    let failError = "";

    const poll = () => {
      pollingRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/status/${jobId}`);
          if (res.ok) {
            const status = await res.json();
            if (status.status === "completed") {
              completed = true;
              return;
            }
            if (status.status === "failed") {
              failed = true;
              failError = status.error ?? "Analysis failed.";
              return;
            }
          }
        } catch {
          // network blip, keep polling
        }
        if (!abortedRef.current && !completed && !failed) poll();
      }, 3000);
    };
    poll();

    // P1: Surface validation
    setPhase("SCANNING_P1");
    setProgress(15);
    addLine("Beginning scan...");
    await new Promise((r) => setTimeout(r, 2000));
    setProgress(25);
    addLine("Checking structure...");
    await new Promise((r) => setTimeout(r, 800));
    addLine("\u2713 Homepage detected");
    await new Promise((r) => setTimeout(r, 800));
    addLine("\u2713 Headline detected");
    await new Promise((r) => setTimeout(r, 800));
    addLine("\u2713 Call to action detected");
    await new Promise((r) => setTimeout(r, 1000));
    addLine("Status: Functional");

    // P2: The shift
    await new Promise((r) => setTimeout(r, 2500));
    setPhase("SCANNING_P2");
    setProgress(40);
    addLine("Re-evaluating...");
    await new Promise((r) => setTimeout(r, 1000));
    addLine("...");
    await new Promise((r) => setTimeout(r, 1500));

    // Not Responding flicker
    setNotResponding(true);
    document.body.classList.add("flash-bg");
    await new Promise((r) => setTimeout(r, 1500));
    setNotResponding(false);
    document.body.classList.remove("flash-bg");

    await new Promise((r) => setTimeout(r, 1500));
    addLine("This is not good.");

    // P3: Failure cascade
    await new Promise((r) => setTimeout(r, 1000));
    setPhase("SCANNING_P3");
    setProgress(55);
    addLine("Clarity check...");
    await new Promise((r) => setTimeout(r, 1000));
    onOpenPopup?.({ icon: "warning", text: "ERROR: Sounds like everyone else" });
    await new Promise((r) => setTimeout(r, 500));
    addLine("FAIL");

    await new Promise((r) => setTimeout(r, 1000));
    addLine("Differentiation check...");
    await new Promise((r) => setTimeout(r, 1000));
    onOpenPopup?.({ icon: "warning", text: "WARNING: Too many features listed" });
    await new Promise((r) => setTimeout(r, 500));
    addLine("FAIL");

    await new Promise((r) => setTimeout(r, 1500));
    addLine("Emotional resonance...");
    await new Promise((r) => setTimeout(r, 1000));
    onOpenPopup?.({ icon: "error", text: "CRITICAL: No clear outcome for visitors" });
    await new Promise((r) => setTimeout(r, 500));
    addLine("CRITICAL FAILURE");
    setProgress(65);

    // P4: The hook
    await new Promise((r) => setTimeout(r, 2000));
    setPhase("SCANNING_P4");
    setProgress(80);
    addLine("Analyzing message mismatch...");
    await new Promise((r) => setTimeout(r, 1500));
    addLine("Compiling report data...");
    await new Promise((r) => setTimeout(r, 2000));
    addLine("Cross-referencing market positioning...");
    await new Promise((r) => setTimeout(r, 1500));

    // Check if pipeline failed
    if (failed) {
      document.body.style.cursor = "default";
      setPhase("ERROR");
      addLine("FATAL: Pipeline analysis failed");
      setErrorDialog({ title: "System Error", message: failError, icon: "error" });
      return;
    }

    setProgress(90);
    addLine("Waiting for analysis pipeline...");

    // Wait for completion if not yet done
    while (!completed && !failed && !abortedRef.current) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (failed) {
      document.body.style.cursor = "default";
      setPhase("ERROR");
      addLine("FATAL: Pipeline analysis failed");
      setErrorDialog({ title: "System Error", message: failError, icon: "error" });
      return;
    }

    if (abortedRef.current) return;

    // Done
    document.body.style.cursor = "default";
    setPhase("SCORE");
    setProgress(100);
    addLine("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    addLine("ANALYSIS COMPLETE");
    addLine("");
    addLine("Redirecting to full report...");

    await new Promise((r) => setTimeout(r, 1500));
    setPhase("REDIRECTING");
    router.push(`/report/${jobId}`);
  };

  const handleInputSubmit = () => {
    if (!domain.trim()) {
      setErrorDialog({
        title: "Marketing Analyzer",
        message: "INPUT REQUIRED\n\nYou need a website.\n\nPreferably your own.",
        icon: "error",
      });
      return;
    }
    const clean = extractDomain(domain);
    if (!clean.includes(".") || clean.includes(" ") || clean.length <= 3) {
      setErrorDialog({
        title: "Marketing Analyzer",
        message: "INVALID DOMAIN\n\nThat doesn't look like a real website.",
        icon: "error",
      });
      return;
    }
    startAnalysis(clean);
  };

  const handleReset = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current);
    abortedRef.current = false;
    setPhase("INPUT");
    setShowInputModal(true);
    setLines([]);
    setProgress(0);
    setErrorDialog(null);
    setDomain("");
    document.body.style.cursor = "default";
  };

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] font-mono text-[11px] leading-tight overflow-hidden p-1">
      {notResponding && (
        <div className="absolute top-0 left-0 w-full h-5 bg-[#808080] text-white font-bold flex items-center px-1 z-50">
          Marketing Analyzer v1.0 (Not Responding)
        </div>
      )}

      {/* Log Output */}
      <div className="flex-1 p-2 overflow-y-auto bg-white retro-sunken m-1" ref={scrollRef}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`mb-1 ${line.includes("FAIL") ? "text-red-600 font-bold" : ""} ${line.includes("CRITICAL FAILURE") ? "text-red-600 font-bold uppercase" : ""} ${line.includes("ANALYSIS COMPLETE") ? "font-bold text-[12px]" : ""} ${line.includes("FATAL") ? "text-red-600 font-bold" : ""}`}
          >
            {line}
          </div>
        ))}

        {phase === "ERROR" && (
          <div className="mt-4 flex justify-center">
            <Win98Button onClick={handleReset}>Try Again</Win98Button>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      {(phase.startsWith("SCANNING") || phase === "BOOT" || phase === "SUBMITTING" || phase === "SCORE") && (
        <div className="h-8 p-1 flex items-center justify-between gap-4">
          <div className="flex-1">
            <Win98ProgressBar progress={progress} />
          </div>
          <span className="text-[10px] w-8">{progress}%</span>
        </div>
      )}

      {/* Input Modal */}
      {showInputModal && (
        <Win98Dialog
          title="Marketing Analyzer"
          message="Please enter the website you would like to analyze:"
          showInput
          inputValue={domain}
          onInputChange={setDomain}
          onOk={handleInputSubmit}
          onCancel={() =>
            setErrorDialog({
              title: "Marketing Analyzer",
              message: "You cannot cancel this operation.",
              icon: "error",
            })
          }
        />
      )}

      {/* Error Dialogs */}
      {errorDialog && (
        <Win98Dialog
          title={errorDialog.title || "System Error"}
          icon={errorDialog.icon}
          message={errorDialog.message}
          onOk={() => setErrorDialog(null)}
        />
      )}

      <style jsx global>{`
        .flash-bg {
          animation: flash 0.1s linear infinite;
        }
        @keyframes flash {
          0%, 100% { background-color: #c0c0c0; }
          50% { background-color: #ffffff; }
        }
      `}</style>
    </div>
  );
};
