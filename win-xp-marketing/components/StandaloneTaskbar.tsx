"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export const StandaloneTaskbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [time, setTime] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        startBtnRef.current &&
        !startBtnRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const XPFolderIcon = () => (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10C4 8.89543 4.89543 8 6 8H14L18 12H26C27.1046 12 28 12.8954 28 14V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V10Z" fill="#F7C735" stroke="#C9A608" strokeWidth="0.5" />
    </svg>
  );

  const XPWindowsFlag = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="7" height="7" fill="#F65314" />
      <rect x="8" width="7" height="7" fill="#7CBB00" />
      <rect y="8" width="7" height="7" fill="#00A1F1" />
      <rect x="8" y="8" width="7" height="7" fill="#FFBB00" />
    </svg>
  );

  const XPUserIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="4" fill="white" fillOpacity="0.8" />
      <circle cx="16" cy="12" r="6" fill="#2A60CE" />
      <path d="M16 18C10 18 6 22 6 26H26C26 22 22 18 16 18Z" fill="#2A60CE" />
    </svg>
  );

  const XPSpeakerIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );

  return (
    <>
      {/* Start Menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="xp-start-menu fixed bottom-[30px] left-0 w-[380px] bg-[#ece9d8] border-[1px] border-[#0054e3] rounded-t-lg z-[9999] overflow-hidden flex flex-col"
          style={{ boxShadow: "2px 2px 12px rgba(0,0,0,0.4)" }}
        >
          {/* Top Banner */}
          <div className="h-[55px] flex items-center px-3 gap-3" style={{ background: "linear-gradient(90deg, #2A60CE, #3C7BEB)" }}>
            <div className="w-[42px] h-[42px] border-2 border-white/50 rounded-sm overflow-hidden flex items-center justify-center">
              <XPUserIcon />
            </div>
            <span className="text-white font-bold text-[13px] [text-shadow:1px_1px_1px_rgba(0,0,0,0.3)]">Dean & Wiseman</span>
          </div>

          <div className="flex bg-white">
            {/* Left Col (Navigation) */}
            <div className="flex-[1.2] py-1 border-r border-[#91b0df]">
              {[
                { label: "Don't Open!", href: "/dont-open" },
                { label: "Marketing Analyser", href: "/marketing-analyser" },
                { label: "How We Think", href: "/how-we-think" },
                { label: "Contact", href: "/contact" },
                { label: "Brackets (if brave)", href: "/brackets" }
              ].map((item, i) => (
                <Link key={i} href={item.href} className="flex items-center px-2 py-2 gap-3 hover:bg-[#316ac5] group">
                  <XPFolderIcon />
                  <span className="text-[11px] font-medium group-hover:text-white">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Col (Decorative) */}
            <div className="flex-1 bg-[#d3e5fa] py-2 flex flex-col gap-1">
              {["My Documents", "My Computer", "My Network Places", "Control Panel", "Printers and Faxes", "Search"].map((item, i) => (
                <div key={i} className="px-3 py-1.5 text-[#00156e] text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="h-[35px] border-t border-[#0054e3] flex items-center justify-end px-3 gap-2" style={{ background: "linear-gradient(180deg, #4282f4, #245edc)" }}>
            <div className="flex items-center gap-1 hover:brightness-110 active:brightness-90 cursor-default opacity-80">
              <div className="w-[18px] h-[18px] bg-[#e06000] border border-white/40 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">L</div>
              <span className="text-white text-[11px] font-medium [text-shadow:1px_1px_1px_rgba(0,0,0,0.3)]">Log Off</span>
            </div>
            <div className="flex items-center gap-1 hover:brightness-110 active:brightness-90 cursor-default opacity-80">
              <div className="w-[18px] h-[18px] bg-[#e06000] border border-white/40 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">S</div>
              <span className="text-white text-[11px] font-medium [text-shadow:1px_1px_1px_rgba(0,0,0,0.3)]">Turn Off Computer</span>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[30px] z-[9999] flex items-center"
        style={{ background: "linear-gradient(180deg, #4580E6 0%, #245EDC 5%, #245EDC 95%, #1941A5 100%)", boxShadow: "0 -1px 0 #4580E6 inset" }}
      >
        {/* Start Button */}
        <button 
          ref={startBtnRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`
            relative flex items-center gap-2 px-4 ml-[2px] h-[110%] -mt-[2px] 
            border-[1px] border-[#217A21]/40 rounded-tr-[10px] rounded-br-[10px]
            hover:brightness-110 active:brightness-90 transition-all group
            ${isMenuOpen ? "brightness-90 shadow-inner" : "shadow-[1px_-1px_3px_rgba(0,0,0,0.4)]"}
          `}
          style={{ 
            background: isMenuOpen 
              ? "linear-gradient(180deg, #2D8E2D, #40AC40)" 
              : "linear-gradient(180deg, #40AC40 0%, #309530 10%, #2D8E2D 45%, #2D8E2D 100%)" 
          }}
        >
          <XPWindowsFlag />
          <span className="text-white font-bold italic text-[14px] leading-none [text-shadow:1px_1px_1px_rgba(0,0,0,0.5)] lowercase">start</span>
        </button>

        {/* Separator - recessed divider */}
        <div className="w-[2px] h-[22px] border-l border-black/20 border-r border-white/20 mx-1 ml-2"></div>

        {/* Quick Launch Icons */}
        <div className="flex gap-1.5 px-2">
          <div className="w-5 h-5 flex items-center justify-center cursor-default hover:brightness-125 opacity-70">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="white"><path d="M1 1h14v10H1V1zm1 1v8h12V2H2z" /></svg>
          </div>
          <div className="w-5 h-5 flex items-center justify-center cursor-default hover:brightness-125 opacity-70">
            <div className="w-3.5 h-3.5 bg-blue-500 rounded-full border border-white/30 flex items-center justify-center text-[8px] font-bold italic text-white">e</div>
          </div>
        </div>

        <div className="flex-1"></div>

        {/* System Tray */}
        <div 
          className="h-full px-4 flex items-center gap-2 border-l border-[#1040B5] shadow-inner" 
          style={{ background: "linear-gradient(180deg, #0997FB, #0081E5)" }}
        >
          <XPSpeakerIcon />
          <span className="text-white text-[11px] font-medium [text-shadow:1px_1px_1px_rgba(0,0,0,0.3)]">{time}</span>
        </div>
      </div>
      <style jsx global>{`
        body {
          padding-bottom: 32px !important;
        }
      `}</style>
    </>
  );
};
