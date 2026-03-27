"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Win98Button } from "./Win98Button";

interface Win98DialogProps {
  title: string;
  icon?: "info" | "warning" | "error";
  message: string;
  onOk: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  width?: number;
}

export const Win98Dialog: React.FC<Win98DialogProps> = ({
  title,
  icon = "info",
  message,
  onOk,
  onCancel,
  okText = "OK",
  cancelText = "Cancel",
  showInput = false,
  inputValue = "",
  onInputChange,
  width = 320
}) => {
  const [isClosePressed, setIsClosePressed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRel({
      x: e.pageX - pos.x,
      y: e.pageY - pos.y
    });
    e.stopPropagation();
    e.preventDefault();
  };

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: e.pageX - rel.x,
      y: e.pageY - rel.y
    });
    e.stopPropagation();
    e.preventDefault();
  }, [dragging, rel]);

  const onMouseUp = React.useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    } else {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  const renderIcon = () => {
    switch (icon) {
      case "error":
        return (
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
             <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
               <circle cx="16" cy="16" r="14" fill="#ff0000" stroke="#000" strokeWidth="1"/>
               <path d="M10 10L22 22M22 10L10 22" stroke="#fff" strokeWidth="3"/>
             </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-yellow-400 stroke-black stroke-[1px]">
              <path d="M12 2L2 22h20L12 2z" />
              <text x="12" y="18" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold" style={{fontFamily: 'sans-serif'}}>!</text>
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
             <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
               <circle cx="16" cy="16" r="14" fill="#0000ff" stroke="#000" strokeWidth="1"/>
               <text x="16" y="22" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold" fontStyle="italic" style={{fontFamily: 'serif'}}>i</text>
             </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000000] pointer-events-none">
      <div 
        className="bg-[#c0c0c0] win98-raised p-[2px] flex flex-col pointer-events-auto shadow-lg"
        style={{ 
          width: width,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          position: "relative"
        }}
      >
        {/* Title Bar - Drag Handle */}
        <div 
          className="h-[18px] bg-[#000080] flex items-center justify-between px-[2px] mb-1 select-none cursor-default"
          onMouseDown={onMouseDown}
        >
          <span className="text-white font-bold text-[11px] truncate">{title}</span>
          <button 
            onMouseDown={(e) => { e.stopPropagation(); setIsClosePressed(true); }}
            onMouseUp={() => setIsClosePressed(false)}
            onMouseLeave={() => setIsClosePressed(false)}
            onClick={onOk}
            className={`w-[16px] h-[14px] bg-[#c0c0c0] flex items-center justify-center p-0 ${isClosePressed ? "win98-sunken" : "win98-raised"}`}
          >
            <div style={isClosePressed ? { transform: "translate(1px, 1px)" } : {}}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1.5L2 0.5L5 3.5L8 0.5L9 1.5L6 4.5L9 7.5L8 8.5L5 5.5L2 8.5L1 7.5L4 4.5L1 1.5Z" fill="black"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Content Area - 15px Padding as per Win98 standards */}
        <div className="p-[15px] pb-4 flex gap-[15px] items-start bg-[#c0c0c0]">
          {renderIcon()}
          <div className="flex-1">
            <p className="text-[11px] mb-[15px] leading-normal whitespace-pre-wrap">{message}</p>
            {showInput && (
              <div className="w-full">
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  className="w-full text-[11px] px-[4px] py-[3px] outline-none bg-white font-mono"
                  style={{
                    border: "1px solid #808080",
                    borderRightColor: "#dfdfdf",
                    borderBottomColor: "#dfdfdf",
                    boxShadow: "inset 1px 1px 0px 0px #000, 1px 1px 0px 0px #fff"
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onOk()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Buttons - Precise 14px gap for better design "feel" */}
        <div className="p-[15px] pt-0 flex justify-center gap-[14px]">
          <Win98Button onClick={onOk} className="min-w-[75px]">{okText}</Win98Button>
          {onCancel && (
            <Win98Button onClick={onCancel} className="min-w-[75px]">{cancelText}</Win98Button>
          )}
        </div>
      </div>
    </div>
  );
};
