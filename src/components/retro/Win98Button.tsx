"use client";

import React, { useState, useCallback } from "react";

interface Win98ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const Win98Button: React.FC<Win98ButtonProps> = ({ 
  children, 
  onClick, 
  className = "", 
  disabled 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    if (disabled) return;
    setIsPressed(false);
  };

  const handleClick = useCallback(() => {
    if (disabled || !onClick) return;
    // Artificial 50-100ms mechanical delay
    setTimeout(() => {
      onClick();
    }, 75);
  }, [disabled, onClick]);

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative px-4 py-1 min-w-[75px] bg-[#c0c0c0] text-black text-[11px] select-none
        ${isPressed ? "retro-sunken" : "retro-raised"}
        ${disabled ? "opacity-50 grayscale" : ""}
        ${className}
      `}
    >
      <span style={isPressed ? { transform: "translate(1px, 1px)", display: "block" } : {}}>
        {children}
      </span>
    </button>
  );
};
