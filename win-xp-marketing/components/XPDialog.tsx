"use client";

import React from "react";

interface XPDialogProps {
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
}

export const XPDialog: React.FC<XPDialogProps> = ({
  title,
  icon = "info",
  message,
  onOk,
  onCancel,
  okText = "OK",
  cancelText = "Cancel",
  showInput = false,
  inputValue = "",
  onInputChange
}) => {
  const renderIcon = () => {
    switch (icon) {
      case "error":
        return (
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-sm">
            X
          </div>
        );
      case "warning":
        return (
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-yellow-400 stroke-black stroke-[1px]">
              <path d="M12 2L2 22h20L12 2z" />
              <text x="12" y="18" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">!</text>
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-serif italic text-xl border-2 border-white shadow-sm">
            i
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[1000000]">
      <div className="bg-[#ece9d8] border-[3px] border-[#0054e3] rounded-t-lg xp-window-shadow w-[300px] flex flex-col">
        {/* Title Bar */}
        <div className="xp-title-bar h-[25px] flex items-center px-2">
          <span className="text-white font-bold text-[11px] shadow-sm">{title}</span>
        </div>

        {/* Content Area */}
        <div className="p-4 flex gap-4 items-start">
          {renderIcon()}
          <div className="flex-1">
            <p className="text-[11px] mb-4 leading-normal">{message}</p>
            {showInput && (
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                className="xp-input w-full text-[11px]"
                onKeyDown={(e) => e.key === "Enter" && onOk()}
              />
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 flex justify-center gap-2">
          <button 
            onClick={onOk}
            className="xp-button min-w-[75px] text-[11px]"
          >
            {okText}
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="xp-button min-w-[75px] text-[11px]"
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
