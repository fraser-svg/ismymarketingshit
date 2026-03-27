"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { XPProgressBar } from "./XPProgressBar";
import { XPDialog } from "./XPDialog";

type Phase = "BOOT" | "INPUT" | "SCANNING_P1" | "SCANNING_P2" | "SCANNING_P3" | "SCANNING_P4" | "SCORE" | "SHAREABLE" | "CTA" | "FIX_PROTOCOL" | "COMPLETE";

interface MarketingAnalyzerProps {
  onPhaseChange?: (phase: Phase) => void;
  onOpenPopup?: (content: { icon: "warning" | "error"; text: string }) => void;
  onActivateFixProtocol?: () => void;
}

export const MarketingAnalyzer: React.FC<MarketingAnalyzerProps> = ({ 
  onPhaseChange,
  onOpenPopup,
  onActivateFixProtocol 
}) => {
  const [phase, setPhase] = useState<Phase>("BOOT");
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showInputModal, setShowInputModal] = useState(false);
  const [domain, setDomain] = useState("");
  const [errorDialog, setErrorDialog] = useState<{message: string, icon: "warning" | "error"} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Phase Control
  useEffect(() => {
    if (phase === "BOOT") {
      const sequence = async () => {
        await new Promise(r => setTimeout(r, 500));
        addLine("Initializing diagnostic engine...");
        await new Promise(r => setTimeout(r, 1000));
        
        // Progress bar simulation
        for (let i = 0; i <= 100; i += 2) {
          setProgress(i);
          await new Promise(r => setTimeout(r, 20));
        }
        
        await new Promise(r => setTimeout(r, 500));
        addLine("Loading target...");
        await new Promise(r => setTimeout(r, 1000));
        addLine("ERROR: NO TARGET SPECIFIED");
        await new Promise(r => setTimeout(r, 500));
        addLine("The system cannot proceed.");
        addLine("A website domain is required.");
        
        await new Promise(r => setTimeout(r, 1000));
        setPhase("INPUT");
        setShowInputModal(true);
      };
      sequence();
    }
  }, [phase]);

  const startScan = async (target: string) => {
    setShowInputModal(false);
    setPhase("SCANNING_P1");
    setLines([]);
    setProgress(3);
    
    addLine("Target acquired.");
    addLine("Beginning scan...");
    
    // P1: Surface Approval
    await new Promise(r => setTimeout(r, 2000));
    setProgress(25);
    addLine("Checking structure...");
    await new Promise(r => setTimeout(r, 800));
    addLine("✓ Homepage detected");
    await new Promise(r => setTimeout(r, 800));
    addLine("✓ Headline detected");
    await new Promise(r => setTimeout(r, 800));
    addLine("✓ Call to action detected");
    await new Promise(r => setTimeout(r, 500));
    addLine("Status: Functional");
    
    // P2: The Shift
    await new Promise(r => setTimeout(r, 2000));
    setPhase("SCANNING_P2");
    setProgress(40);
    addLine("Re-evaluating...");
    await new Promise(r => setTimeout(r, 2000));
    addLine("This is not good.");
    
    // P3: Diagnosis
    await new Promise(r => setTimeout(r, 1000));
    setPhase("SCANNING_P3");
    setProgress(55);
    addLine("Clarity check...");
    await new Promise(r => setTimeout(r, 500));
    onOpenPopup?.({ icon: "warning", text: "ERROR: Sounds like everyone else" });
    await new Promise(r => setTimeout(r, 500));
    addLine("FAIL");
    
    await new Promise(r => setTimeout(r, 1000));
    addLine("Differentiation check...");
    await new Promise(r => setTimeout(r, 500));
    onOpenPopup?.({ icon: "warning", text: "WARNING: Too many features listed" });
    await new Promise(r => setTimeout(r, 500));
    addLine("FAIL");

    await new Promise(r => setTimeout(r, 1000));
    addLine("Emotional resonance...");
    await new Promise(r => setTimeout(r, 500));
    onOpenPopup?.({ icon: "error", text: "CRITICAL: No clear outcome for visitors" });
    await new Promise(r => setTimeout(r, 500));
    addLine("CRITICAL FAILURE");
    setProgress(65);

    // P4: The Hook
    await new Promise(r => setTimeout(r, 2000));
    setPhase("SCANNING_P4");
    setProgress(80);
    addLine("Analyzing message...");
    await new Promise(r => setTimeout(r, 1000));
    addLine("You say:");
    addLine("\"AI-powered platform for...\"");
    await new Promise(r => setTimeout(r, 2000));
    addLine("Customer hears:");
    addLine("\"I don't understand this.\"");
    await new Promise(r => setTimeout(r, 1500));
    addLine("Mismatch detected.");
    addLine("This is why people don't buy.");

    // Score
    await new Promise(r => setTimeout(r, 1500));
    setPhase("SCORE");
    setProgress(100);
    addLine("");
    addLine("Clarity Score: 38/100");
    addLine("");
    addLine("Recommendation:");
    addLine("Do not show this to investors.");

    // Shareable
    await new Promise(r => setTimeout(r, 2000));
    setPhase("SHAREABLE");
    addLine("Generating summary...");
    for (let i = 0; i <= 78; i += 5) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 50));
    }
    await new Promise(r => setTimeout(r, 500));
    setProgress(100);
  };

  const handleInputSubmit = () => {
    if (!domain.trim()) {
      setErrorDialog({ message: "ERROR: INPUT REQUIRED. You need a website. Preferably your own.", icon: "error" });
      return;
    }
    startScan(domain);
  };

  return (
    <div className="flex flex-col h-full bg-white font-mono text-[11px] leading-tight overflow-hidden">
      {/* Log Output */}
      <div className="flex-1 p-4 overflow-y-auto scroll-smooth" ref={scrollRef}>
        {lines.map((line, i) => (
          <div key={i} className={`mb-1 ${line.includes("FAIL") ? "text-red-600 font-bold" : ""} ${line.includes("CRITICAL FAILURE") ? "text-red-600 font-bold uppercase" : ""} ${line.includes("38/100") ? "text-red-600 text-lg font-bold my-2" : ""}`}>
            {line}
          </div>
        ))}

        {phase === "SCANNING_P2" && lines.length > 5 && (
          <div className="text-gray-400">...</div>
        )}

        {phase === "SHAREABLE" && progress === 100 && (
          <div className="mt-4 p-4 border-2 border-[#7f9db9] bg-[#f0f0f0] rounded-sm xp-window-shadow">
            <p className="italic text-center font-serif text-[13px] mb-4">
              "Your marketing isn't bad. It's forgettable."
            </p>
            <div className="flex justify-center gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("Your marketing isn't bad. It's forgettable.");
                  alert("Copied to clipboard");
                }}
                className="xp-button text-[10px]"
              >
                Copy
              </button>
              <button className="xp-button text-[10px]">Share</button>
            </div>
          </div>
        )}

        {phase === "SHAREABLE" && progress === 100 && (
          <div className="mt-8">
            <button 
              onClick={() => setPhase("CTA")}
              className="xp-button w-full py-2 font-bold"
            >
              System Analysis Complete. Proceed to solution?
            </button>
          </div>
        )}

        {phase === "COMPLETE" && (
          <div className="mt-4 text-gray-500">Noted. Good luck.</div>
        )}
      </div>

      {/* Progress Footer */}
      {(phase.startsWith("SCANNING") || phase === "BOOT" || phase === "SHAREABLE") && (
        <div className="h-8 border-t border-[#7f9db9] bg-[#f0f0f0] p-1 px-4 flex items-center justify-between">
          <div className="w-1/2">
            <XPProgressBar progress={progress} />
          </div>
          <span className="text-[10px]">{progress}%</span>
        </div>
      )}

      {/* Input Modal */}
      {showInputModal && (
        <XPDialog
          title="Marketing Analyzer"
          message="Please enter the website you would like to analyze:"
          showInput
          inputValue={domain}
          onInputChange={setDomain}
          onOk={handleInputSubmit}
          onCancel={() => setErrorDialog({ message: "You cannot cancel this operation.", icon: "error" })}
        />
      )}

      {/* Error Dialogs */}
      {errorDialog && (
        <XPDialog
          title="System Error"
          icon={errorDialog.icon}
          message={errorDialog.message}
          okText={errorDialog.message.includes("cancel") ? "Try Again" : "OK"}
          onOk={() => setErrorDialog(null)}
        />
      )}

      {/* CTA Modal */}
      {phase === "CTA" && (
        <XPDialog
          title="Marketing Analyzer"
          message="Would you like to fix this?"
          okText="Yes, fix it"
          cancelText="No, I'll keep it"
          onOk={() => {
            onActivateFixProtocol?.();
            setPhase("FIX_PROTOCOL");
          }}
          onCancel={() => setPhase("COMPLETE")}
        />
      )}
    </div>
  );
};
