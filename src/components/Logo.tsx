import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  onClick,
}) => {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.3 : 1;

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-start select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-1.5 transition-transform duration-200 group-hover:scale-[1.02]">
        {/* SVG Wordmark inspired directly by brand splash */}
        <svg
          width={180 * scale}
          height={58 * scale}
          viewBox="0 0 220 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
          aria-label="ADHdo! It's ADH-doable!"
        >
          {/* Sparkle top right */}
          <path
            d="M 188 12 Q 192 12 192 8 Q 192 12 196 12 Q 192 12 192 16 Q 192 12 188 12 Z"
            fill="#FFC978"
            className="animate-pulse"
          />
          <path
            d="M 198 22 Q 200 22 200 20 Q 200 22 202 22 Q 200 22 200 24 Q 200 22 198 22 Z"
            fill="#C7B5FF"
          />

          {/* Radiating playful sunburst rays around 'A' */}
          <path d="M 14 26 L 6 22" stroke="#FFC978" strokeWidth="3" strokeLinecap="round" />
          <path d="M 22 14 L 16 6" stroke="#FFC978" strokeWidth="3" strokeLinecap="round" />

          {/* Letter 'A' (Plum) */}
          <path
            d="M 28 58 L 44 18 C 45 15 49 15 50 18 L 66 58 C 67 61 64 63 61 62 L 54 60 C 52 59 51 57 50 55 L 48 48 L 38 48 L 35 55 C 34 57 33 59 30 60 L 25 61 C 23 61 22 59 28 58 Z"
            fill="#493568"
          />
          {/* Inner cutout for A */}
          <path
            d="M 43 32 L 47 23 L 51 32 Z"
            fill="#F7F1E8"
          />
          {/* Soft shine on A */}
          <ellipse cx="36" cy="24" rx="2.5" ry="5" transform="rotate(-20 36 24)" fill="rgba(255,255,255,0.25)" />

          {/* Letter 'D' (Plum) */}
          <path
            d="M 72 20 C 72 17 74 16 77 16 L 90 16 C 104 16 112 24 112 38 C 112 52 103 60 89 60 L 76 60 C 73 60 72 58 72 55 Z"
            fill="#493568"
          />
          {/* Inner hole of D */}
          <path
            d="M 82 25 L 88 25 C 97 25 102 30 102 38 C 102 46 97 51 88 51 L 82 51 Z"
            fill="#F7F1E8"
          />
          <ellipse cx="80" cy="22" rx="2" ry="4" transform="rotate(-15 80 22)" fill="rgba(255,255,255,0.25)" />

          {/* Letter 'H' (Plum) */}
          <path
            d="M 118 19 C 118 16 120 15 123 15 L 126 15 C 129 15 131 17 131 20 L 131 33 L 143 33 L 143 20 C 143 17 145 15 148 15 L 151 15 C 154 15 156 17 156 20 L 156 56 C 156 59 154 61 151 61 L 148 61 C 145 61 143 59 143 56 L 143 42 L 131 42 L 131 56 C 131 59 129 61 126 61 L 123 61 C 120 61 118 59 118 56 Z"
            fill="#493568"
          />

          {/* Letter 'd' (Lavender) */}
          <g transform="translate(142, 0)">
            <path
              d="M 33 14 C 33 11 35 10 38 10 L 40 10 C 43 10 44 12 44 15 L 44 55 C 44 58 42 60 39 60 L 37 60 C 34 60 33 58 33 56 L 33 52 C 30 56 25 59 18 59 C 7 59 1 50 1 38 C 1 26 8 18 19 18 C 25 18 30 21 33 25 Z"
              fill="#9D84EA"
            />
            {/* Inner bowl of d */}
            <circle cx="19" cy="39" r="10.5" fill="#F7F1E8" />
            <ellipse cx="37" cy="18" rx="2" ry="4" fill="rgba(255,255,255,0.3)" />
          </g>

          {/* Letter 'o' (Lavender) with joyful smile */}
          <g transform="translate(178, 16)">
            {/* Outer body of o */}
            <circle cx="21" cy="23" r="21" fill="#9D84EA" />
            {/* Inner bowl */}
            <circle cx="21" cy="23" r="11" fill="#F7F1E8" />
            {/* Smile curve inside the o! */}
            <path
              d="M 14 25 Q 21 32 28 25"
              stroke="#9D84EA"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Gloss highlight on o */}
            <ellipse cx="14" cy="11" rx="4" ry="2" transform="rotate(-30 14 11)" fill="rgba(255,255,255,0.35)" />
          </g>

          {/* Exclamation point '!' (Peach Gold) */}
          <g transform="translate(204, 12)">
            {/* Upper rod */}
            <path
              d="M 7 5 C 10 4 14 7 13 11 L 11 31 C 10 34 7 35 4 34 C 2 33 1 30 2 27 L 4 8 C 5 6 6 5 7 5 Z"
              fill="#FFC978"
            />
            {/* Dot */}
            <circle cx="7" cy="43" r="4.5" fill="#FFC978" />
            {/* Little shine on rod */}
            <ellipse cx="7" cy="12" rx="1.5" ry="3.5" fill="rgba(255,255,255,0.4)" />
          </g>
        </svg>
      </div>

      {showTagline && (
        <span
          className="text-xs sm:text-sm font-semibold tracking-wide text-[#493568] pl-2 sm:pl-3 -mt-0.5"
          style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
        >
          It's ADH-doable!
        </span>
      )}
    </div>
  );
};
