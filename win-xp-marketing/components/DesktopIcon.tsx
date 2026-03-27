"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface DesktopIconProps {
  id: string;
  label: string;
  initialX: number;
  initialY: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  zIndex: number;
}

export const XPFolderIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10C4 8.89543 4.89543 8 6 8H14L18 12H26C27.1046 12 28 12.8954 28 14V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V10Z" fill="url(#folder_grad)" stroke="#C9A608" strokeWidth="0.5" />
    <path d="M4 14H28V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V14Z" fill="url(#folder_front_grad)" />
    <defs>
      <linearGradient id="folder_grad" x1="4" y1="8" x2="4" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FEE489" />
        <stop offset="1" stopColor="#F7C735" />
      </linearGradient>
      <linearGradient id="folder_front_grad" x1="4" y1="14" x2="4" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFF2C0" />
        <stop offset="1" stopColor="#F9D768" />
      </linearGradient>
    </defs>
  </svg>
);

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  label,
  initialX,
  initialY,
  isSelected,
  onSelect,
  onDoubleClick,
  onPositionChange,
  zIndex
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    onSelect?.();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange?.(pos.x, pos.y);
    }
  }, [isDragging, onPositionChange, pos]);

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
      className="absolute cursor-default select-none group"
      style={{
        left: pos.x,
        top: pos.y,
        width: 75,
        height: 75,
        zIndex: isDragging ? 9999 : zIndex,
        userSelect: "none"
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex flex-col items-center justify-center p-1 w-full h-full text-center">
        <div className={`p-1 mb-1 relative flex items-center justify-center rounded-sm transition-colors ${isSelected ? "bg-[#316ac544]" : ""}`}>
          <XPFolderIcon />
        </div>
        <div className="relative">
          <span
            className={`
              block text-[11px] leading-tight px-1 py-[1px] font-medium transition-colors border border-transparent
              ${isSelected 
                ? "bg-[#316ac5] text-white border-dotted border-white/50" 
                : "text-white [text-shadow:1px_1px_1px_rgba(0,0,0,0.8)]"}
            `}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
