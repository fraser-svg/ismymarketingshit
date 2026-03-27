"use client";

import React from "react";

interface WindowContentProps {
  id: string;
  onClose?: () => void;
}

export const WindowContent: React.FC<WindowContentProps> = ({ id, onClose }) => {
  const renderFolderIcon = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 14V50H60V18H32L28 14H4Z" fill="#F4D03F" stroke="#000" strokeWidth="1" />
      <path d="M5 15V49H59V19H32L28 15H5Z" fill="#F7DC6F" />
      <path d="M5 19H59V50H5V19Z" fill="#F9E79F" />
    </svg>
  );

  switch (id) {
    case "dont-open":
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 gap-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-full h-full fill-yellow-400 stroke-black stroke-[1px]">
                <path d="M12 2L2 22h20L12 2z" />
                <text x="12" y="18" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">!</text>
              </svg>
            </div>
            <span className="text-black text-[12px]">You were told not to open this.</span>
          </div>
          <button 
            onClick={onClose}
            className="xp-button px-8 py-1"
          >
            OK
          </button>
        </div>
      );
    case "how-we-think":
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-white">
          <h2 className="text-lg font-bold mb-2">How We Think</h2>
          <p className="text-[12px]">Coming Soon</p>
        </div>
      );
    case "contact":
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-white">
          <h2 className="text-lg font-bold mb-2">Contact</h2>
          <p className="text-[12px]">Coming Soon</p>
        </div>
      );
    case "brackets":
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-white">
          <h2 className="text-lg font-bold mb-2">Brackets</h2>
          <p className="text-[12px]">Coming Soon</p>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-white h-full">
          <p className="text-[12px]">No items in this folder.</p>
        </div>
      );
  }
};
