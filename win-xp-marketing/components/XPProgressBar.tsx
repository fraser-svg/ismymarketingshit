"use client";

import React from "react";

interface XPProgressBarProps {
  progress: number; // 0 to 100
  animated?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({ progress, animated = true }) => {
  const blocks = Math.floor(progress / 5); // Each block represents 5%
  
  return (
    <div className="xp-progress-track flex items-center">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`${
            i < blocks ? "xp-progress-block" : "bg-transparent w-2 mr-[2px]"
          } ${animated && i < blocks ? "animate-pulse" : ""}`}
          style={{ 
            animationDelay: `${i * 0.1}s`,
            animationDuration: "1.5s"
          }}
        />
      ))}
    </div>
  );
};
