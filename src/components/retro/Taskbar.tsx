"use client";

import React, { useState, useEffect } from "react";
import { Win98Button } from "./Win98Button";
import { FolderIcon } from "./FolderIcon";

interface TaskbarProps {
  onStartClick: () => void;
  isStartMenuOpen: boolean;
  windows: Array<{ id: string; title: string; active: boolean }>;
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
    <div 
      className="fixed left-0 right-0 w-full !w-screen h-[28px] bg-[#c0c0c0] win98-raised !border-none flex items-center px-1 gap-1 z-[9999999]"
      style={{ bottom: 0, top: "auto" }}
    >
      {/* Start Button - Robust 2px Bevel */}
      <button 
        onClick={onStartClick}
        className={`flex items-center gap-1.5 px-1 pb-[1px] h-[22px] min-w-[58px] ${isStartMenuOpen ? "win98-sunken" : "win98-raised"} border-[1px] active:pt-[1px] active:pl-[1px]`}
        style={{ borderWidth: "2px" }}
      >
        <div className="flex items-center shrink-0">
          <svg width="16" height="15" viewBox="0 0 16 15" style={{ shapeRendering: "crispEdges" }}>
            {/* Outline */}
            <rect x="1" y="2" width="14" height="11" fill="black" />
            {/* Color panels */}
            <rect x="2" y="3" width="6" height="4" fill="#ff0000" />
            <rect x="9" y="3" width="6" height="4" fill="#00ff00" />
            <rect x="2" y="8" width="6" height="4" fill="#0000ff" />
            <rect x="9" y="8" width="6" height="4" fill="#ffff00" />
          </svg>
        </div>
        <span className="font-bold text-[11px] leading-none" style={{ letterSpacing: "-0.2px" }}>Start</span>
      </button>

      <div className="w-[2px] h-[18px] bg-[#808080] border-r border-white mx-0.5"></div>

      {/* Task Buttons */}
      <div className="flex-1 flex gap-1 h-full py-[2px] overflow-hidden">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => onWindowClick(win.id)}
            className={`
              flex items-center px-1 gap-1 min-w-[120px] max-w-[160px] overflow-hidden h-full text-[11px] 
              ${win.active ? "win98-sunken font-bold bg-[#d0d0d0]" : "win98-raised"}
            `}
          >
            <div className="w-3 h-3 flex-shrink-0" style={win.active ? { transform: "translate(1px, 1px)" } : {}}>
               <FolderIcon size={12} />
            </div>
            <span className="truncate" style={win.active ? { transform: "translate(1px, 1px)" } : {}}>{win.title}</span>
          </button>
        ))}
      </div>

      {/* Tray - Authentic Sunken Design */}
      <div className="win98-sunken flex items-center h-[22px] px-2 gap-2 mr-1">
        <div className="flex items-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="black">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </div>
        <span className="text-[11px] whitespace-nowrap pt-[1px]">{time}</span>
      </div>
    </div>
  );
};

interface StartMenuProps {
  onItemClick: (id: string, title: string) => void;
  isOpen: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onItemClick, isOpen }) => {
  if (!isOpen) return null;

  const items = [
    { id: "dont-open", title: "Don't Open!" },
    { id: "marketing", title: "Marketing Analyser" },
    { id: "how-we-think", title: "How We Think" },
    { id: "contact", title: "Contact" },
    { id: "brackets", title: "Brackets (if brave)" },
  ];

  return (
    <div 
      className="fixed bottom-[28px] left-0 w-[180px] bg-[#c0c0c0] win98-raised z-[999998] flex"
    >
      {/* Sidebar - Windows 98 Horizontal Gradient Bar */}
      <div 
        className="w-[24px] flex items-end justify-center pb-2"
        style={{ background: "linear-gradient(0deg, #000080 0%, #1084d0 100%)" }}
      >
        <span 
          className="text-white font-bold text-[14px] whitespace-nowrap"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", textShadow: "1px 1px 1px rgba(0,0,0,0.5)" }}
        >
          Windows 98
        </span>
      </div>

      {/* Menu Area */}
      <div className="flex-1 py-1">
        {items.map((item) => (
          <div 
            key={item.id}
            className="flex items-center px-3 py-1.5 gap-3 hover:bg-[#000080] hover:text-white cursor-default group"
            onClick={() => onItemClick(item.id, item.title)}
          >
            <FolderIcon size={20} />
            <span className="text-[11px] truncate font-medium">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
