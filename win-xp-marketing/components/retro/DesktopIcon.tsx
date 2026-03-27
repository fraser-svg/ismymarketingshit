"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PixelIcon, IconType } from "./PixelIcon";

interface DesktopIconProps {
  id: string;
  label: string;
  iconType?: IconType;
  initialX: number;
  initialY: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  zIndex: number;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  label,
  iconType = "folder",
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
      className="absolute cursor-default select-none group w-[80px] h-[80px]"
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: isDragging ? 999999 : zIndex,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex flex-col items-center justify-center p-1 w-full h-full text-center">
        <div className="relative mb-1">
          <PixelIcon type={iconType} size={32} />
          {isSelected && (
            <div className="absolute inset-0 bg-[#000080] opacity-40 mix-blend-multiply"></div>
          )}
        </div>
        <div className="relative px-[2px]">
          <span
            className={`
              block text-[11px] leading-tight px-1 py-[1px]
              ${isSelected 
                ? "bg-[#000080] text-white win98-focus-border shadow-none" 
                : "text-white [text-shadow:1px_1px_0px_#000000]"
              }
            `}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
