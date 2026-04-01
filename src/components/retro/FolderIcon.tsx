import React from "react";

export const FolderIcon: React.FC<{ size?: number }> = ({ size = 32 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      {/* Back/tab */}
      <rect x="2" y="6" width="12" height="4" fill="#DBA400" stroke="#000" strokeWidth="1"/>
      {/* Body */}
      <rect x="2" y="10" width="28" height="18" fill="#FFC800" stroke="#000" strokeWidth="1"/>
      {/* Separation line for realism */}
      <line x1="2" y1="10" x2="14" y2="10" stroke="#DBA400" strokeWidth="1"/>
    </svg>
  );
};
