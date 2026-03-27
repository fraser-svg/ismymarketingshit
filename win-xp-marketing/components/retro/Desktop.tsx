"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DesktopIcon } from "./DesktopIcon";
import { Win98Window } from "./Win98Window";
import { Taskbar, StartMenu } from "./Taskbar";
import { MarketingAnalyzer } from "./MarketingAnalyzer";
import { SystemLog } from "./SystemLog";
import { Win98Dialog } from "./Win98Dialog";
import { Win98Button } from "./Win98Button";
import { PixelIcon, IconType } from "./PixelIcon";

interface WindowData {
  id: string;
  title: string;
  isOpen: boolean;
  zIndex: number;
}

const DESKTOP_ICONS: Array<{ id: string, label: string, iconType: IconType, initialX: number, initialY: number }> = [
  { id: "my-computer", label: "My Computer", iconType: "computer", initialX: 20, initialY: 20 },
  { id: "network", label: "Network Neighborhood", iconType: "network", initialX: 20, initialY: 100 },
  { id: "recycle", label: "Recycle Bin", iconType: "recycle", initialX: 20, initialY: 180 },
  { id: "dont-open", label: "Don't Open!", iconType: "folder", initialX: 20, initialY: 260 },
  { id: "marketing", label: "Marketing Analyser", iconType: "folder", initialX: 100, initialY: 20 },
  { id: "how-we-think", label: "How We Think", iconType: "folder", initialX: 100, initialY: 100 },
  { id: "contact", label: "Contact", iconType: "folder", initialX: 100, initialY: 180 },
  { id: "brackets", label: "Brackets (if brave)", iconType: "folder", initialX: 100, initialY: 260 },
];

export const Desktop = () => {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [topZ, setTopZ] = useState(100);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("BOOT");
  const [chaosPopups, setChaosPopups] = useState<Array<{ id: string; text: string; icon: "warning" | "error" }>>([]);

  // Auto-open Marketing Analyzer for theatrical start
  useEffect(() => {
    // Small delay to let the wallpaper/desktop settle as per spec
    setTimeout(() => {
      openWindow("marketing", "Marketing Analyzer v1.0");
    }, 500);
  }, []);

  const openWindow = useCallback((id: string, title: string) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        setTopZ((z) => z + 1);
        setActiveWindowId(id);
        return prev.map((w) => 
          w.id === id ? { ...w, isOpen: true, zIndex: topZ + 1 } : w
        );
      }
      const newZ = topZ + 1;
      setTopZ(newZ);
      setActiveWindowId(id);
      setIsStartMenuOpen(false);
      return [...prev, { id, title, isOpen: true, zIndex: newZ }];
    });
  }, [topZ]);

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const focusWindow = (id: string) => {
    setTopZ((z) => z + 1);
    setWindows((prev) => 
      prev.map((w) => w.id === id ? { ...w, zIndex: topZ + 1 } : w)
    );
    setActiveWindowId(id);
    setIsStartMenuOpen(false);
  };

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIconId(null);
      setIsStartMenuOpen(false);
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
    active: activeWindowId === w.id
  })), [windows, activeWindowId]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden pointer-events-auto bg-transparent"
      onMouseDown={handleDesktopClick}
    >
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
        win.isOpen && (
          <Win98Window
            key={win.id}
            id={win.id}
            title={win.title}
            initialX={250 + (index * 25)}
            initialY={50 + (index * 25)}
            zIndex={win.zIndex}
            isActive={activeWindowId === win.id}
            onFocus={() => focusWindow(win.id)}
            onClose={() => closeWindow(win.id)}
            width={win.id === "marketing" ? 500 : 400}
            height={win.id === "marketing" ? 400 : 300}
          >
            {win.id === "marketing" ? (
              <MarketingAnalyzer 
                onPhaseChange={setCurrentPhase}
                onOpenPopup={handleChaosPopup}
                onActivateFixProtocol={() => openWindow("fix", "Fix Protocol")}
              />
            ) : win.id === "system-log" ? (
              <SystemLog phase={currentPhase} />
            ) : win.id === "fix" ? (
              <div className="p-4 flex flex-col items-center justify-center text-center gap-4 h-full bg-[#c0c0c0]">
                <h2 className="font-bold underline text-[12px]">Fix Protocol Activated.</h2>
                <div className="text-left text-[11px] p-2 bg-white retro-sunken w-full">
                  <p>Protocol Steps:</p>
                  <ul className="list-disc pl-5">
                    <li>Analyze clarity mismatch</li>
                    <li>Restructure emotional resonance</li>
                    <li>Clarify differentiation vectors</li>
                  </ul>
                </div>
                <div className="w-full max-w-[200px] flex flex-col gap-2">
                  <span className="text-[10px] text-gray-600 block text-left">Email address:</span>
                  <input className="retro-sunken bg-white p-1 text-[11px]" />
                  <Win98Button>Submit</Win98Button>
                </div>
              </div>
            ) : (
              <div className="p-8 h-full bg-[#c0c0c0] flex flex-col items-center justify-center text-center">
                <h2 className="text-lg font-bold mb-4">{win.title}</h2>
                <div className="p-4 bg-white retro-sunken">
                  <span className="text-[11px]">System placeholder for: {win.title}</span>
                </div>
              </div>
            )}
          </Win98Window>
        )
      ))}

      {/* System Log BEHIND the analyzer */}
      {(currentPhase.startsWith("SCANNING") || currentPhase === "SCORE") && (
        <Win98Window
          id="system-log"
          title="system_log.exe"
          initialX={40}
          initialY={400}
          zIndex={50}
          isActive={activeWindowId === "system-log"}
          onFocus={() => focusWindow("system-log")}
          onClose={() => {}} // Non-closable or handle
        >
          <SystemLog phase={currentPhase} />
        </Win98Window>
      )}

      {/* Chaos Popups */}
      {chaosPopups.map((popup, i) => (
        <div key={popup.id} className="fixed top-0 left-0 w-full h-full pointer-events-none z-[500000]">
          <div 
            className="absolute pointer-events-auto" 
            style={{ 
              left: `calc(50% + ${i * 40}px - 100px)`, 
              top: `calc(50% + ${i * 40}px - 50px)` 
            }}
          >
            <Win98Dialog
              title={popup.icon === "error" ? "System Error" : "System Warning"}
              icon={popup.icon}
              message={popup.text}
              onOk={() => closeChaosPopup(popup.id)}
            />
          </div>
        </div>
      ))}

      {/* Taskbar & Menu */}
      <StartMenu 
        isOpen={isStartMenuOpen} 
        onItemClick={(id, title) => openWindow(id, title)} 
      />
      <Taskbar
        isStartMenuOpen={isStartMenuOpen}
        onStartClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
        windows={taskbarWindows}
        onWindowClick={(id) => focusWindow(id)}
      />
    </div>
  );
};
