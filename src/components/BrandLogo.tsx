import React, { useState } from 'react';
import logoImg from '../assets/images/mon_khon_logo_1790608761327.jpg';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 text-left cursor-pointer focus:outline-none"
    >
      <div
        className={`${sizeClasses} rounded-2xl overflow-hidden bg-white border border-[#F4C2D7] shadow-2xs shrink-0 flex items-center justify-center group-hover:scale-103 transition-transform`}
      >
        {!imgError ? (
          <img
            src={logoImg}
            alt="Logo Món Khôn"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <svg viewBox="0 0 120 120" className="w-full h-full p-1.5">
            <defs>
              <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F48FB1" />
                <stop offset="100%" stopColor="#EC407A" />
              </linearGradient>
            </defs>
            {/* Calendar */}
            <rect
              x="56"
              y="18"
              width="38"
              height="36"
              rx="7"
              transform="rotate(8 56 18)"
              fill="url(#pinkGrad)"
              opacity="0.85"
            />
            {/* Cute Bowl */}
            <path
              d="M24 54 C24 82, 84 82, 84 54 Z"
              fill="#FCE4EC"
              stroke="#EC407A"
              strokeWidth="3"
            />
            {/* Winking face */}
            <ellipse cx="45" cy="64" rx="2.5" ry="4" fill="#D81B60" />
            <path
              d="M52 67 Q55 70 58 67"
              stroke="#D81B60"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M66 61 L62 64 L66 67"
              stroke="#D81B60"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Coin */}
            <circle cx="80" cy="74" r="14" fill="url(#pinkGrad)" stroke="#FFF" strokeWidth="2" />
            <text
              x="80"
              y="79"
              textAnchor="middle"
              fill="#FFF"
              fontSize="14"
              fontWeight="bold"
            >
              $
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="min-w-0">
          <span className="block text-xl font-display font-bold tracking-tight text-[#D85A7F] group-hover:text-[#C24168] transition-colors leading-tight">
            Món Khôn
          </span>
          <span className="block text-[11px] font-medium text-[#5C7467] truncate">
            Ăn ngon · Khít ví tiền
          </span>
        </div>
      )}
    </button>
  );
};
