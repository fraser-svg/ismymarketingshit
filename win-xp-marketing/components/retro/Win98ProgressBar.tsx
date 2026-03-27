"use client";

import React from "react";

interface Win98ProgressBarProps {
  progress: number; // 0 to 100
}

export const Win98ProgressBar: React.FC<Win98ProgressBarProps> = ({ progress }) => {
  // A standard Win95 bar has about 12-18 blocks total.
  const totalBlocks = 18;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);

  return (
    <div className="retro-sunken bg-white h-5 flex p-[1px] gap-[1px]">
      {Array.from({ length: totalBlocks }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 ${i < filledBlocks ? "bg-[#000080]" : "bg-transparent"}`}
        />
      ))}
    </div>
  );
};
