import React from "react";

export type IconType = "folder" | "computer" | "network" | "recycle";

export const PixelIcon: React.FC<{ type: IconType; size?: number }> = ({ type, size = 32 }) => {
  switch (type) {
    case "computer":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ shapeRendering: "crispEdges" }}>
          {/* CRT Monitor Outer Box */}
          <rect x="4" y="4" width="24" height="18" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
          {/* Screen area with inner shadow */}
          <rect x="7" y="7" width="18" height="12" fill="#000" />
          <rect x="8" y="8" width="16" height="10" fill="#000080" />
          {/* Bevel detail */}
          <rect x="5" y="5" width="22" height="1" fill="#fff" />
          <rect x="5" y="5" width="1" height="16" fill="#fff" />
          {/* Power Button */}
          <rect x="23" y="20" width="2" height="1" fill="#00ff00" />
          {/* Stand */}
          <rect x="10" y="22" width="12" height="3" fill="#808080" stroke="#000" strokeWidth="1"/>
          <rect x="6" y="25" width="20" height="4" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
        </svg>
      );
    case "network":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          {/* Two computers connected */}
          <rect x="2" y="16" width="12" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
          <rect x="18" y="6" width="12" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
          <path d="M14 21H18V11H22" stroke="#000" strokeWidth="1" fill="none"/>
        </svg>
      );
    case "recycle":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          {/* Recycle bin bucket */}
          <path d="M8 8V26L12 30H20L24 26V8H8Z" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
          <rect x="6" y="4" width="20" height="4" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
          {/* Paper scraps */}
          <rect x="12" y="12" width="8" height="8" fill="#fff" stroke="#808080" strokeWidth="1"/>
        </svg>
      );
    case "folder":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="6" width="12" height="4" fill="#DBA400" stroke="#000" strokeWidth="1"/>
          <rect x="2" y="10" width="28" height="18" fill="#FFC800" stroke="#000" strokeWidth="1"/>
          <line x1="2" y1="10" x2="14" y2="10" stroke="#DBA400" strokeWidth="1"/>
        </svg>
      );
  }
};
