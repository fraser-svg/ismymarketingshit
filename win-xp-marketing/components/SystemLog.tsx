"use client";

import React, { useState, useEffect, useRef } from "react";

interface SystemLogProps {
  phase: string;
}

export const SystemLog: React.FC<SystemLogProps> = ({ phase }) => {
  const [log, setLog] = useState<string[]>(["LOG: system initialized"]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines: Record<string, string[]> = {
      BOOT_ERROR: ["User arrived", "Scanning environment", "Boot sequence ready"],
      AWAITING_INPUT: ["User idle", "Awaiting target domain", "Waiting..."],
      SCANNING_PHASE_1: ["User entered domain", "Target acquired", "Initial analysis started"],
      SCANNING_PHASE_2: ["Surface analysis positive", "Structural check complete"],
      SCANNING_PHASE_3: ["Re-evaluating content", "Heuristic mismatch detected", "This is not good"],
      SCANNING_PHASE_4: ["Diagnosis running", "Confidence decreasing"],
      SCORE: ["Scan complete", "Clarity score calculated", "System indifferent"],
      CTA: ["Presenting fix protocol", "Awaiting user decision"],
      FIX_PROTOCOL: ["User requested fix", "Protocol activated"],
    };

    if (lines[phase]) {
      lines[phase].forEach((line, i) => {
        setTimeout(() => {
          setLog((prev) => [...prev, line]);
        }, i * 2000);
      });
    }
  }, [phase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="w-full h-full bg-[#fdfdfd] p-2 font-mono text-[10px] text-gray-600 overflow-y-auto" ref={scrollRef}>
      {log.map((line, i) => (
        <p key={i} className="mb-1">{line}</p>
      ))}
    </div>
  );
};
