"use client";

import React, { useState, useEffect, useRef } from "react";
import { Win98ProgressBar } from "./Win98ProgressBar";
import { Win98Button } from "./Win98Button";
import { Win98Dialog } from "./Win98Dialog";

type Phase = "BOOT" | "INPUT" | "SCANNING_P1" | "SCANNING_P2" | "SCANNING_P3" | "SCANNING_P4" | "SCANNING_P5" | "SCORE" | "SHAREABLE" | "CTA" | "FIX_PROTOCOL" | "COMPLETE";

interface MarketingAnalyzerProps {
  onPhaseChange?: (phase: string) => void;
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
  const [errorDialog, setErrorDialog] = useState<{message: string, icon: "warning" | "error", title?: string, okText?: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [notResponding, setNotResponding] = useState(false);

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
        await new Promise(r => setTimeout(r, 800));
        addLine("Initializing diagnostic engine...");
        await new Promise(r => setTimeout(r, 1000));
        
        // Progress bar simulation (block by block)
        for (let i = 0; i <= 100; i += 8) {
          setProgress(Math.min(i, 100));
          await new Promise(r => setTimeout(r, 150));
        }
        
        await new Promise(r => setTimeout(r, 1000));
        addLine("Loading target...");
        await new Promise(r => setTimeout(r, 1500));
        addLine("ERROR: NO TARGET SPECIFIED");
        
        await new Promise(r => setTimeout(r, 800));
        addLine("The system cannot proceed.");
        await new Promise(r => setTimeout(r, 500));
        addLine("A website domain is required.");
        
        await new Promise(r => setTimeout(r, 1200));
        setPhase("INPUT");
        setShowInputModal(true);
      };
      sequence();
    }
  }, [phase]);

  const startScan = async (target: string) => {
    setShowInputModal(false);
    document.body.style.cursor = "wait"; 
    setPhase("SCANNING_P1");
    setLines([]);
    setProgress(3);
    
    addLine("Target acquired.");
    await new Promise(r => setTimeout(r, 1000));
    addLine("Beginning scan...");
    
    // P2: Surface Validation
    await new Promise(r => setTimeout(r, 2000));
    setProgress(25);
    addLine("Checking structure...");
    await new Promise(r => setTimeout(r, 800));
    addLine("✓ Homepage detected");
    await new Promise(r => setTimeout(r, 800));
    addLine("✓ Headline detected");
    await new Promise(r => setTimeout(r, 800));
    addLine("✓ Call to action detected");
    await new Promise(r => setTimeout(r, 1000));
    addLine("Status: Functional");
    
    // P3: The Shift
    await new Promise(r => setTimeout(r, 2500));
    setPhase("SCANNING_P2");
    setProgress(40);
    addLine("Re-evaluating...");
    await new Promise(r => setTimeout(r, 1000));
    
    // Ellipsis animation simulated
    addLine("...");
    await new Promise(r => setTimeout(r, 1500));
    
    // Not Responding Flicker
    setNotResponding(true);
    document.body.classList.add("flash-bg");
    await new Promise(r => setTimeout(r, 1500));
    setNotResponding(false);
    document.body.classList.remove("flash-bg");
    
    await new Promise(r => setTimeout(r, 1500));
    addLine("This is not good.");
    
    // P4: Failure Cascade
    await new Promise(r => setTimeout(r, 1000));
    setPhase("SCANNING_P3");
    setProgress(55);
    addLine("Clarity check...");
    await new Promise(r => setTimeout(r, 1000));
    onOpenPopup?.({ icon: "warning", text: "ERROR: Sounds like everyone else" });
    await new Promise(r => setTimeout(r, 500));
    addLine("FAIL");
    
    await new Promise(r => setTimeout(r, 1000));
    addLine("Differentiation check...");
    await new Promise(r => setTimeout(r, 1000));
    onOpenPopup?.({ icon: "warning", text: "WARNING: Too many features listed" });
    await new Promise(r => setTimeout(r, 500));
    addLine("FAIL");

    await new Promise(r => setTimeout(r, 1500));
    addLine("Emotional resonance...");
    await new Promise(r => setTimeout(r, 1000));
    onOpenPopup?.({ icon: "error", text: "CRITICAL: No clear outcome for visitors" });
    await new Promise(r => setTimeout(r, 500));
    addLine("CRITICAL FAILURE");
    setProgress(65);

    // P5: The Hook
    await new Promise(r => setTimeout(r, 2000));
    setPhase("SCANNING_P4");
    setProgress(80);
    addLine("Analyzing message...");
    await new Promise(r => setTimeout(r, 1500));
    addLine("You say:");
    addLine("\"AI-powered platform for...\"");
    await new Promise(r => setTimeout(r, 2000));
    addLine("Customer hears:");
    await new Promise(r => setTimeout(r, 1000));
    addLine("\"I don't understand this.\"");
    await new Promise(r => setTimeout(r, 1500));
    addLine("Mismatch detected.");
    await new Promise(r => setTimeout(r, 1000));
    addLine("This is why people don't buy.");
    addLine("This is costing you money.");

    // Score
    await new Promise(r => setTimeout(r, 1500));
    document.body.style.cursor = "default";
    setPhase("SCORE");
    setProgress(100);
    addLine("─────────────────────────");
    addLine("FINAL REPORT");
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
      await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 1000));
    setProgress(100);
  };

  const handleInputSubmit = () => {
    if (!domain.trim()) {
      setErrorDialog({ title: "Marketing Analyzer", message: "INPUT REQUIRED\n\nYou need a website.\n\nPreferably your own.", icon: "error" });
      return;
    }
    startScan(domain);
  };

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] font-mono text-[11px] leading-tight overflow-hidden p-1">
      {/* Title Bar handled by parent Window */}
      {notResponding && (
        <div className="absolute top-0 left-0 w-full h-5 bg-[#808080] text-white font-bold flex items-center px-1 z-50">
          Marketing Analyzer v1.0 (Not Responding)
        </div>
      )}

      {/* Log Output */}
      <div className="flex-1 p-2 overflow-y-auto bg-white retro-sunken m-1" ref={scrollRef}>
        {lines.map((line, i) => (
          <div key={i} className={`mb-1 ${line.includes("FAIL") ? "text-red-600 font-bold" : ""} ${line.includes("CRITICAL FAILURE") ? "text-red-600 font-bold uppercase" : ""} ${line.includes("38/100") ? "text-red-600 text-[16px] font-bold my-2" : ""} ${line.includes("FINAL REPORT") ? "font-bold text-[12px]" : ""}`}>
            {line}
          </div>
        ))}

        {phase === "SHAREABLE" && progress === 100 && (
          <div className="mt-4 p-4 retro-sunken bg-white flex flex-col items-center">
            <p className="italic text-center text-[12px] mb-4">
              "Your marketing isn't bad. It's forgettable."
            </p>
            <div className="flex justify-center gap-2">
              <Win98Button onClick={() => navigator.clipboard.writeText("Your marketing isn't bad. It's forgettable.")}>
                Copy
              </Win98Button>
              <Win98Button onClick={() => setErrorDialog({ title: "System Error", message: "Share service not available. Try telling someone yourself.", icon: "error" })}>
                Share
              </Win98Button>
            </div>
          </div>
        )}

        {phase === "SHAREABLE" && progress === 100 && (
          <div className="mt-8">
            <Win98Button 
              onClick={() => setPhase("CTA")}
              className="w-full py-2 font-bold"
            >
              System Analysis Complete. Proceed to solution?
            </Win98Button>
          </div>
        )}

        {phase === "COMPLETE" && (
          <div className="mt-4 text-[#808080]">Noted. Good luck.</div>
        )}
      </div>

      {/* Progress Footer */}
      {(phase.startsWith("SCANNING") || phase === "BOOT" || phase === "SHAREABLE") && (
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
          onCancel={() => setErrorDialog({ title: "Marketing Analyzer", message: "You cannot cancel this operation.", icon: "error", okText: "Try Again" })}
        />
      )}

      {/* Error Dialogs */}
      {errorDialog && (
        <Win98Dialog
          title={errorDialog.title || "System Error"}
          icon={errorDialog.icon}
          message={errorDialog.message}
          okText={errorDialog.message.includes("cancel") ? "Try Again" : "OK"}
          onOk={() => setErrorDialog(null)}
        />
      )}

      {/* CTA Modal */}
      {phase === "CTA" && (
        <Win98Dialog
          title="Marketing Analyzer"
          message="Would you like to fix this?"
          okText="Yes, fix it"
          cancelText="No, I'll keep it"
          onOk={() => {
            onActivateFixProtocol?.();
            setPhase("FIX_PROTOCOL");
          }}
          onCancel={() => {
            setPhase("COMPLETE");
            setTimeout(() => {
              setErrorDialog({ 
                title: "Are you sure?", 
                message: "Most people who click \"No\"\ncome back within 48 hours.", 
                icon: "warning" 
              });
            }, 3000);
          }}
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
