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
      BOOT: ["Kernel loading...", "Ready"],
      INPUT: ["Awaiting target...", "User idle"],
      SCANNING_P1: ["User entered domain", "Target acquired", "Initial analysis started"],
      SCANNING_P2: ["Re-evaluating content", "Heuristic mismatch detected", "Confidence decreasing"],
      SCANNING_P3: ["Failure cascade triggered", "Resource exhaustion imminent", "Warning user"],
      SCANNING_P4: ["Diagnosis running", "Mismatch confirmed", "This is why they don't buy"],
      SCORE: ["Scan complete", "Clarity score calculated", "System indifferent"],
      CTA: ["Presenting fix protocol", "Awaiting user decision"],
      FIX_PROTOCOL: ["User requested fix", "Protocol activated"],
    };

    if (lines[phase]) {
      lines[phase].forEach((line, i) => {
        setTimeout(() => {
          setLog((prev) => [...prev, line]);
        }, i * 3000);
      });
    }
  }, [phase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="w-full h-full bg-white p-2 font-mono text-[10px] text-gray-600 overflow-y-auto retro-sunken" ref={scrollRef}>
      <p className="mb-2 font-bold text-black border-b border-gray-300">SYSTEM LOG</p>
      {log.map((line, i) => (
        <p key={i} className="mb-1 leading-tight">{line}</p>
      ))}
    </div>
  );
};
