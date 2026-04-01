"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface Win98WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  isActive: boolean;
  width?: number | string;
  height?: number | string;
}

export const Win98Window: React.FC<Win98WindowProps> = ({
  id,
  title,
  children,
  initialX = 100,
  initialY = 100,
  zIndex,
  onFocus,
  onClose,
  isActive,
  width = "auto",
  height = "auto"
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
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
      className={`absolute bg-[#c0c0c0] win98-raised p-[2px] z-index-${zIndex}`}
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: zIndex,
        width: width,
        height: height,
        minWidth: 200,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column"
      }}
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div 
        className={`h-[18px] window-header flex items-center justify-between px-[2px] cursor-default ${isActive ? "bg-[#000080]" : "bg-[#808080]"}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1 overflow-hidden">
          {/* Miniature folder icon or generic pixel icon */}
          <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="8" fill="#FFC800" stroke="#000" strokeWidth="1"/>
              <rect x="2" y="2" width="6" height="2" fill="#DBA400" stroke="#000" strokeWidth="1"/>
            </svg>
          </div>
          <span className="text-white font-bold text-[11px] truncate whitespace-nowrap overflow-hidden pr-2">
            {title}
          </span>
        </div>
        
        {/* Window Controls */}
        <div className="flex gap-[2px]">
          <WinChromeButton symbol="min" />
          <WinChromeButton symbol="max" />
          <WinChromeButton symbol="close" onClick={onClose} />
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto relative bg-[#c0c0c0] p-[2px]">
        {children}
      </div>
    </div>
  );
};

const WinChromeButton: React.FC<{ symbol: "min" | "max" | "close"; onClick?: (e: React.MouseEvent) => void }> = ({ symbol, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  const renderSymbol = () => {
    switch (symbol) {
      case "min":
        return (
          <svg width="6" height="2" style={{ shapeRendering: "crispEdges", marginTop: "8px" }}>
            <rect width="6" height="2" fill="black" />
          </svg>
        );
      case "max":
        return (
          <svg width="9" height="9" style={{ shapeRendering: "crispEdges" }}>
            <rect x="0" y="0" width="9" height="2" fill="black" />
            <rect x="0" y="2" width="1" height="7" fill="black" />
            <rect x="8" y="2" width="1" height="7" fill="black" />
            <rect x="1" y="8" width="7" height="1" fill="black" />
          </svg>
        );
      case "close":
        return (
          <svg width="8" height="7" style={{ shapeRendering: "crispEdges" }}>
            <path d="M0 0H2L3 1L4 2L5 1L6 0H8V1L7 2L5 4L7 6V7H6L4 5L2 7H0V6L1 5L3 3L1 1V0H0Z" fill="black" />
            <path d="M0 0h2l1 1h2l1-1h2v1L5 4l3 3H6L4 5 2 7H0V6l3-3L0 1V0z" fill="black" />
            {/* Direct pixel mapping for X */}
            <rect x="0" y="0" width="2" height="1" fill="black" />
            <rect x="6" y="0" width="2" height="1" fill="black" />
            <rect x="1" y="1" width="2" height="1" fill="black" />
            <rect x="5" y="1" width="2" height="1" fill="black" />
            <rect x="2" y="2" width="2" height="1" fill="black" />
            <rect x="4" y="2" width="2" height="1" fill="black" />
            <rect x="3" y="3" width="2" height="1" fill="black" />
            <rect x="2" y="4" width="2" height="1" fill="black" />
            <rect x="4" y="4" width="2" height="1" fill="black" />
            <rect x="1" y="5" width="2" height="1" fill="black" />
            <rect x="5" y="5" width="2" height="1" fill="black" />
            <rect x="0" y="6" width="2" height="1" fill="black" />
            <rect x="6" y="6" width="2" height="1" fill="black" />
          </svg>
        );
    }
  };

  return (
    <button
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      className={`
        w-[16px] h-[14px] bg-[#c0c0c0] flex items-center justify-center p-0
        ${isPressed ? "win98-sunken" : "win98-raised"}
      `}
    >
      <div style={isPressed ? { transform: "translate(1px, 1px)" } : {}}>
        {renderSymbol()}
      </div>
    </button>
  );
};
