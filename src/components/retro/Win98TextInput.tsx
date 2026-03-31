"use client";

import React from "react";

interface Win98TextInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
}

export const Win98TextInput: React.FC<Win98TextInputProps> = ({ 
  value, 
  onChange, 
  autoFocus 
}) => {
  return (
    <input
      type="text"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="retro-sunken bg-white px-2 py-1 w-full text-[11px] outline-none"
    />
  );
};
