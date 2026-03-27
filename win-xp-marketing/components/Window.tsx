"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
}

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  children,
  initialX,
  initialY,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  isActive
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
    // Start drag only if clicking header
    if ((e.target as HTMLElement).closest(".window-header")) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y
      };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`absolute xp-window-shadow border-[3px] border-[#0054e3] rounded-t-lg pointer-events-auto flex flex-col bg-[#ece9d8]`}
      style={{
        left: pos.x,
        top: pos.y,
        minWidth: 400,
        minHeight: 300,
        zIndex: zIndex,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
      }}
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div 
        className={`h-[28px] window-header flex items-center justify-between px-2 cursor-default xp-title-bar`}
        onMouseDown={handleMouseDown}
      >
        <span className="text-white font-bold font-['Trebuchet_MS'] shadow-sm text-[13px] leading-none mb-[2px] truncate max-w-[80%] select-none">
          {title}
        </span>
        <div className="flex gap-[2px] items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-[21px] h-[21px] bg-[#3a7af2] border border-white/50 rounded-sm flex items-center justify-center hover:brightness-110 active:brightness-90 transition-shadow shadow-inner"
          >
            <div className="w-[8px] h-[3px] bg-white mt-1 border border-black/20"></div>
          </button>
          <button 
            className="w-[21px] h-[21px] bg-[#3a7af2] border border-white/50 rounded-sm flex items-center justify-center hover:brightness-110 active:brightness-90 transition-shadow shadow-inner"
          >
            <div className="w-[9px] h-[9px] border-2 border-white border-t-4 border-black/10"></div>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-[21px] h-[21px] bg-[#e06000] border border-white/50 rounded-sm flex items-center justify-center hover:bg-[#ff7000] active:bg-[#c05000] font-bold text-white text-[11px] shadow-sm"
          >
            X
          </button>
        </div>
      </div>

      {/* Frame Content */}
      <div className="flex-1 bg-white relative overflow-hidden flex flex-col m-[1px] border border-[#d6d3c1]">
        {children}
      </div>
    </div>
  );
};
