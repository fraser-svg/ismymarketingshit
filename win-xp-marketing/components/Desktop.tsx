"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DesktopIcon } from "./DesktopIcon";
import { Window } from "./Window";
import { WindowContent } from "./WindowContent";
import { MarketingAnalyzer } from "./MarketingAnalyzer";
import { SystemLog } from "./SystemLog";

interface WindowData {
  id: string;
  title: string;
  isOpen: boolean;
  minimized: boolean;
  zIndex: number;
}

const DESKTOP_ICONS = [
  { id: "dont-open", label: "Don't Open!", initialX: 20, initialY: 20 },
  { id: "marketing", label: "Marketing Analyser", initialX: 20, initialY: 100 },
  { id: "how-we-think", label: "How We Think", initialX: 20, initialY: 180 },
  { id: "contact", label: "Contact", initialX: 20, initialY: 260 },
  { id: "brackets", label: "Brackets (if brave)", initialX: 20, initialY: 340 },
];

export const Desktop = () => {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [topZ, setTopZ] = useState(100);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState("BOOT");
  const [chaosPopups, setChaosPopups] = useState<Array<{ id: string; text: string; icon: "warning" | "error" }>>([]);

  // Auto-open Marketing Analyzer on load
  useEffect(() => {
    openWindow("marketing", "Marketing Analyzer v1.0");
  }, []);

  const openWindow = useCallback((id: string, title: string) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        setTopZ((z) => z + 1);
        setActiveWindowId(id);
        return prev.map((w) => 
          w.id === id ? { ...w, isOpen: true, minimized: false, zIndex: topZ + 1 } : w
        );
      }
      const newZ = topZ + 1;
      setTopZ(newZ);
      setActiveWindowId(id);
      return [...prev, { id, title, isOpen: true, minimized: false, zIndex: newZ }];
    });
  }, [topZ]);

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const toggleMinimize = (id: string) => {
    setWindows((prev) => 
      prev.map((w) => w.id === id ? { ...w, minimized: !w.minimized } : w)
    );
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const focusWindow = (id: string) => {
    setTopZ((z) => z + 1);
    setWindows((prev) => 
      prev.map((w) => w.id === id ? { ...w, minimized: false, zIndex: topZ + 1 } : w)
    );
    setActiveWindowId(id);
  };

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIconId(null);
    }
  };

  const handleChaosPopup = (content: { icon: "warning" | "error"; text: string }) => {
    const id = `popup-${Date.now()}`;
    setChaosPopups((prev) => [...prev, { id, ...content }]);
  };

  const closeChaosPopup = (id: string) => {
    setChaosPopups((prev) => prev.filter((p) => p.id !== id));
  };

  const taskbarWindows = useMemo(() => windows.map(w => ({
    id: w.id,
    title: w.title,
    minimized: w.minimized,
    active: activeWindowId === w.id && !w.minimized
  })), [windows, activeWindowId]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden"
      onMouseDown={handleDesktopClick}
    >
      {/* System Log (Always behind if open) */}
      {(currentPhase.startsWith("SCANNING") || currentPhase === "SCORE" || currentPhase === "CTA") && (
        <Window
          id="system-log"
          title="system_log.exe"
          initialX={450}
          initialY={100}
          zIndex={50}
          isActive={activeWindowId === "system-log"}
          onFocus={() => focusWindow("system-log")}
          onClose={() => closeWindow("system-log")}
          onMinimize={() => toggleMinimize("system-log")}
        >
          <SystemLog phase={currentPhase} />
        </Window>
      )}

      {/* Desktop Icons */}
      {DESKTOP_ICONS.map((icon) => (
        <DesktopIcon
          key={icon.id}
          {...icon}
          isSelected={selectedIconId === icon.id}
          onSelect={() => setSelectedIconId(icon.id)}
          onDoubleClick={() => openWindow(icon.id, icon.label)}
          zIndex={10}
        />
      ))}

      {/* Main Windows */}
      {windows.map((win, index) => (
        win.isOpen && !win.minimized && (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            initialX={250 + (index * 30)}
            initialY={50 + (index * 30)}
            zIndex={win.zIndex}
            isActive={activeWindowId === win.id}
            onFocus={() => focusWindow(win.id)}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => toggleMinimize(win.id)}
          >
            {win.id === "marketing" ? (
              <MarketingAnalyzer 
                onPhaseChange={setCurrentPhase}
                onOpenPopup={handleChaosPopup}
                onActivateFixProtocol={() => openWindow("fix", "Fix Protocol")}
              />
            ) : win.id === "fix" ? (
              <div className="p-8 h-full bg-white flex flex-col items-center justify-center text-center gap-4">
                <h2 className="text-xl font-bold">Fix Protocol Activated.</h2>
                <div className="text-left text-[12px] space-y-2">
                  <p>We will:</p>
                  <ul className="list-disc pl-5">
                    <li>Rewrite your positioning</li>
                    <li>Clarify your message</li>
                    <li>Make people understand what you do</li>
                  </ul>
                </div>
                <div className="w-full max-w-[250px] space-y-2 mt-4">
                  <label className="block text-[10px] text-gray-500">Enter email to proceed:</label>
                  <input type="email" className="xp-input w-full" placeholder="email@example.com" />
                  <button className="xp-button w-full py-1 font-bold">Submit</button>
                </div>
              </div>
            ) : (
              <WindowContent id={win.id} onClose={() => closeWindow(win.id)} />
            )}
          </Window>
        )
      ))}

      {/* Chaos Popups (Self-contained modals) */}
      {chaosPopups.map((popup, i) => (
        <div key={popup.id} className="fixed top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center z-[500000]">
          <div className="pointer-events-auto" style={{ transform: `translate(${i * 20}px, ${i * 20}px)` }}>
            <div className="bg-[#ece9d8] border-[3px] border-[#0054e3] rounded-t-lg xp-window-shadow w-[280px] flex flex-col">
              <div className="xp-title-bar h-[25px] flex items-center px-2 justify-between">
                <span className="text-white font-bold text-[11px]">System Warning</span>
                <button 
                  onClick={() => closeChaosPopup(popup.id)}
                  className="w-[18px] h-[18px] bg-[#e06000] border border-white/50 flex items-center justify-center text-white text-[10px] font-bold"
                >
                  X
                </button>
              </div>
              <div className="p-4 flex gap-3 items-center">
                <div className="w-10 h-10 flex-shrink-0">
                  {popup.icon === "error" ? (
                    <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white">X</div>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-full h-full fill-yellow-400 stroke-black stroke-[1px]">
                      <path d="M12 2L2 22h20L12 2z" />
                      <text x="12" y="18" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">!</text>
                    </svg>
                  )}
                </div>
                <p className="text-[11px] font-bold leading-normal">{popup.text}</p>
              </div>
              <div className="p-2 flex justify-center border-t border-gray-300 bg-gray-100">
                <button onClick={() => closeChaosPopup(popup.id)} className="xp-button px-6 text-[11px]">OK</button>
              </div>
            </div>
          </div>
        </div>
      ))}

    </div>
  );
};
