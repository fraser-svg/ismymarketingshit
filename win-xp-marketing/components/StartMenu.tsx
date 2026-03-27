"use client";

import React from "react";
import { XPFolderIcon } from "./DesktopIcon";

interface StartMenuProps {
  onItemClick: (id: string, title: string) => void;
  isOpen: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onItemClick, isOpen }) => {
  if (!isOpen) return null;

  const leftItems = [
    { id: "dont-open", title: "Don't Open!" },
    { id: "marketing", title: "Marketing Analyser" },
    { id: "how-we-think", title: "How We Think" },
    { id: "contact", title: "Contact" },
    { id: "brackets", title: "Brackets (if brave)" },
  ];

  return (
    <div 
      className="absolute bottom-[30px] left-0 bg-[#4282f4] border-x-[2px] border-t-[2px] border-[#0054e3] rounded-t-lg xp-window-shadow w-[380px] z-[999999] flex flex-col"
    >
      {/* Header */}
      <div className="h-[55px] xp-title-bar-gradient bg-gradient-to-r from-[#0058e6] via-[#a0c4ff] to-[#0058e6] flex items-center px-3 gap-3 rounded-t-lg">
        <div className="w-[42px] h-[42px] bg-white rounded-sm border-2 border-white/50 overflow-hidden">
          <div className="w-full h-full bg-blue-400 flex items-center justify-center text-white text-2xl font-bold">W</div>
        </div>
        <span className="text-white font-bold text-sm shadow-sm">Dean & Wiseman</span>
      </div>

      <div className="flex bg-white">
        {/* Left Col */}
        <div className="flex-[1.2] py-1 border-r border-[#91b0df]">
          {leftItems.map((item) => (
            <div 
              key={item.id}
              className="group flex items-center px-2 py-2 gap-3 hover:bg-[#316ac5] cursor-default select-none"
              onClick={() => onItemClick(item.id, item.title)}
            >
              <div className="scale-75 origin-center">
                <XPFolderIcon />
              </div>
              <span className="text-[11px] group-hover:text-white font-medium">{item.title}</span>
            </div>
          ))}
          <div className="h-px bg-[#91b0df] mx-2 my-1" />
          <div className="px-2 py-2 text-gray-500 text-[10px] italic">More programs...</div>
        </div>

        {/* Right Col */}
        <div className="flex-1 bg-[#d3e5fa] py-1">
          <div className="px-3 py-2 text-[#00156e] font-bold text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">My Documents</div>
          <div className="px-3 py-2 text-[#00156e] font-bold text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">My Computer</div>
          <div className="px-3 py-2 text-[#00156e] font-bold text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">My Network Places</div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#91b0df] to-transparent my-1" />
          <div className="px-3 py-2 text-[#00156e] text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">Control Panel</div>
          <div className="px-3 py-2 text-[#00156e] text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">Printers and Faxes</div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#91b0df] to-transparent my-1" />
          <div className="px-3 py-2 text-[#00156e] text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">Help and Support</div>
          <div className="px-3 py-2 text-[#00156e] text-[11px] hover:bg-[#316ac5] hover:text-white cursor-default">Search</div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-[35px] xp-taskbar-gradient bg-gradient-to-b from-[#4282f4] to-[#245edc] flex items-center justify-end px-3 gap-2 border-t border-[#0054e3]">
        <button className="flex items-center gap-1 hover:brightness-110 active:brightness-90 transition-all">
          <div className="w-5 h-5 bg-[#e06000] rounded-sm flex items-center justify-center text-white text-[10px] font-bold">L</div>
          <span className="text-white text-[11px] font-medium shadow-sm">Log Off</span>
        </button>
        <button className="flex items-center gap-1 hover:brightness-110 active:brightness-90 transition-all">
          <div className="w-5 h-5 bg-[#e06000] rounded-sm flex items-center justify-center text-white text-[10px] font-bold">S</div>
          <span className="text-white text-[11px] font-medium shadow-sm">Turn Off Computer</span>
        </button>
      </div>
    </div>
  );
};
