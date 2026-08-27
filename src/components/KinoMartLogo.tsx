import React from 'react';

interface KinoMartLogoProps {
  className?: string;
  size?: number;
}

export const KinoMartLogo: React.FC<KinoMartLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <div
      className={`bg-black rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-md overflow-hidden shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
      >
        {/* Top-Left stem of K (White) */}
        <polygon points="38,26 56,26 48,51 34,51" fill="#FFFFFF" />

        {/* Top-Right arm of K (White) */}
        <polygon points="53,49 80,27 66,27 45,45" fill="#FFFFFF" />

        {/* Bottom-Right leg of K (Lime Green) */}
        <polygon points="50,54 78,75 62,75 42,57" fill="#8CE010" />

        {/* Bottom-Left Shopping Cart Leg (Lime Green) */}
        {/* Cart Basket connected to center */}
        <polygon points="33,52 49,52 41,65 25,65" fill="#8CE010" />

        {/* Speed / Motion lines on left of cart */}
        <rect x="23" y="52" width="10" height="4" rx="2" fill="#8CE010" />
        <rect x="16" y="58" width="18" height="4" rx="2" fill="#8CE010" />
        <rect x="22" y="64" width="8" height="4" rx="2" fill="#8CE010" />

        {/* Cart Wheels */}
        <circle cx="30" cy="72" r="3.5" fill="#8CE010" />
        <circle cx="38" cy="72" r="3.5" fill="#8CE010" />
      </svg>
    </div>
  );
};
