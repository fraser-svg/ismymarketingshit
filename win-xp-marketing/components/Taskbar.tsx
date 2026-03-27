"use client";

import React, { useState, useEffect } from "react";

interface TaskbarProps {
  onStartClick: () => void;
  isStartMenuOpen: boolean;
  windows: Array<{ id: string; title: string; minimized: boolean; active: boolean }>;
  onWindowClick: (id: string) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ 
  onStartClick, 
  isStartMenuOpen, 
  windows, 
  onWindowClick 
}) => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[30px] xp-taskbar-gradient border-t border-white/20 flex items-center z-[9999999]">
      {/* Start Button */}
      <button 
        onClick={onStartClick}
        className={`
          relative flex items-center gap-2 px-6 h-[110%] -mt-[2px] 
          xp-start-button-gradient border-2 border-white/10 rounded-tr-[12px] 
          shadow-[2px_-2px_4px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 transition-all
          ${isStartMenuOpen ? "brightness-90" : ""}
        `}
      >
        <div className="flex flex-col gap-[1px]">
          <div className="flex gap-[1px]">
            <div className="w-[4px] h-[4px] bg-[#f65314] rounded-sm"></div>
            <div className="w-[4px] h-[4px] bg-[#7cbb00] rounded-sm"></div>
          </div>
          <div className="flex gap-[1px]">
            <div className="w-[4px] h-[4px] bg-[#00a1f1] rounded-sm"></div>
            <div className="w-[4px] h-[4px] bg-[#ffbb00] rounded-sm"></div>
          </div>
        </div>
        <span className="text-white font-bold italic text-[14px] leading-none [text-shadow:1px_1px_1px_rgba(0,0,0,0.5)]">start</span>
      </button>

      {/* Separator */}
      <div className="w-[2px] h-[20px] bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2"></div>

      {/* Window Tasks */}
      <div className="flex-1 flex gap-1 h-[22px] overflow-hidden px-1">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => onWindowClick(win.id)}
            className={`
              flex items-center px-3 gap-2 min-w-[120px] max-w-[180px] overflow-hidden rounded-sm
              h-full text-white border border-white/10 shadow-sm
              ${win.active ? "bg-[#3169cf] brightness-125" : "bg-[#3c81f3] brightness-90 hover:brightness-100"}
              active:brightness-110 transition-all
            `}
          >
            <div className="w-3 h-3 bg-white/20 rounded-sm flex-shrink-0"></div>
            <span className={`text-[11px] truncate ${win.active ? "font-bold" : ""} [text-shadow:1px_1px_1px_rgba(0,0,0,0.3)]`}>
              {win.title}
            </span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="flex items-center px-4 h-full border-l border-white/10 [background:linear-gradient(180deg,#1d9dfa_0%,#0c86e0_100%)] shadow-inner">
        <span className="text-white text-[11px] font-medium [text-shadow:1px_1px_1px_rgba(0,0,0,0.3)]">{time}</span>
      </div>
    </div>
  );
};
