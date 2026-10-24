import React, { useState } from 'react';

interface CuteMascotProps {
  onInteract?: () => void;
}

export const CuteMascot: React.FC<CuteMascotProps> = ({ onInteract }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  const handleClick = () => {
    setIsHappy(true);
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 200);
    setTimeout(() => setIsHappy(false), 1200);
    if (onInteract) onInteract();
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer select-none py-1 group"
      title="INARO Empathetic AI Companion"
    >
      {/* Mascot Canvas */}
      <div
        className={`transition-all duration-300 ease-out ${
          isHappy ? 'scale-110 -translate-y-2' : 'group-hover:scale-105 group-hover:-translate-y-1'
        }`}
      >
        <svg
          width="260"
          height="220"
          viewBox="0 0 240 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            {/* 3D Pearlescent Body Radial Gradient */}
            <radialGradient id="mascotBody3D" cx="40%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#faf7ff" />
              <stop offset="78%" stopColor="#ece2fb" />
              <stop offset="100%" stopColor="#dbcdfb" />
            </radialGradient>

            {/* Belly Crescent Radial Gradient */}
            <radialGradient id="mascotBellyGrad" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#f7f3fe" />
              <stop offset="100%" stopColor="#ece3fc" />
            </radialGradient>

            {/* Feet and Limbs Gradient */}
            <linearGradient id="mascotLimbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f3edfd" />
              <stop offset="100%" stopColor="#ded0fb" />
            </linearGradient>

            {/* Horns Gradient */}
            <linearGradient id="mascotHornGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f4eeff" />
              <stop offset="100%" stopColor="#ded0fc" />
            </linearGradient>

            {/* Ground Shadow */}
            <radialGradient id="mascotGroundShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9065e0" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#bfa8f5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#bfa8f5" stopOpacity="0" />
            </radialGradient>

            {/* 3D Torus Ring Gradient */}
            <linearGradient id="torusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e9e1fc" />
              <stop offset="100%" stopColor="#cbbaf7" />
            </linearGradient>

            {/* Blush Gradient */}
            <radialGradient id="mascotBlushGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#f43f5e" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0.4" />
            </radialGradient>
          </defs>

          {/* ========================================================= */}
          {/* FLOATING 3D CHARMS & CRYSTALS (Matching Reference Picture) */}
          {/* ========================================================= */}

          {/* Top-Left Faceted Crystal Gem */}
          <g className="animate-float-slow" style={{ transformOrigin: '38px 55px' }}>
            <polygon points="38,42 48,50 38,58 28,50" fill="#ede9fe" />
            <polygon points="38,42 48,50 43,62 33,62" fill="#ddd6fe" />
            <polygon points="38,42 28,50 33,62" fill="#c4b5fd" />
            <polygon points="38,58 48,50 43,62 33,62" fill="#ffffff" opacity="0.6" />
          </g>

          {/* Floating Torus (Donut Ring) on Left Hand */}
          <g className="animate-float-reverse" style={{ transformOrigin: '48px 116px' }}>
            <ellipse
              cx="48"
              cy="116"
              rx="10"
              ry="16"
              fill="none"
              stroke="url(#torusGrad)"
              strokeWidth="5"
              transform="rotate(-18 48 116)"
              className="drop-shadow-sm"
            />
            {/* Top Rim Specular Glint */}
            <path
              d="M 44 102 A 10 16 0 0 1 52 104"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              transform="rotate(-18 48 116)"
            />
          </g>

          {/* Top-Right Faceted Gem (Pink/Lilac) */}
          <g className="animate-float-slow" style={{ transformOrigin: '190px 42px' }}>
            <polygon points="190,30 200,38 190,48 180,38" fill="#fbcfe8" />
            <polygon points="190,30 200,38 196,52 184,52" fill="#f472b6" opacity="0.85" />
            <polygon points="190,30 180,38 184,52" fill="#e9d5ff" />
            <polygon points="190,48 200,38 196,52 184,52" fill="#ffffff" opacity="0.7" />
          </g>

          {/* Mid-Right Purple Diamond Crystal */}
          <g className="animate-float-reverse" style={{ transformOrigin: '202px 90px' }}>
            <polygon points="202,78 212,90 202,102 192,90" fill="#a855f7" opacity="0.85" />
            <polygon points="202,78 212,90 202,102" fill="#c084fc" opacity="0.75" />
            <polygon points="202,78 192,90 202,86" fill="#e9d5ff" opacity="0.9" />
          </g>

          {/* ========================================================= */}
          {/* MASCOT BODY, LIMBS, AND SHADOWS                           */}
          {/* ========================================================= */}

          {/* Ground Contact Shadow */}
          <ellipse cx="120" cy="166" rx="58" ry="12" fill="url(#mascotGroundShadow)" />

          {/* Feet (Left & Right) */}
          <ellipse cx="100" cy="158" rx="17" ry="10" fill="url(#mascotLimbGrad)" />
          <ellipse cx="140" cy="158" rx="17" ry="10" fill="url(#mascotLimbGrad)" />

          {/* Arms / Little Hands */}
          {/* Left Arm (tilted slightly up toward the torus) */}
          <ellipse
            cx="76"
            cy="114"
            rx="11"
            ry="16"
            transform="rotate(22 76 114)"
            fill="url(#mascotLimbGrad)"
          />
          {/* Right Arm */}
          <ellipse
            cx="164"
            cy="114"
            rx="11"
            ry="16"
            transform="rotate(-22 164 114)"
            fill="url(#mascotLimbGrad)"
          />

          {/* Main Marshmallow Body Sphere */}
          <ellipse cx="120" cy="106" rx="52" ry="50" fill="url(#mascotBody3D)" />

          {/* Cute Horns / Soft Ears */}
          {/* Left Horn */}
          <path
            d="M 94 62 C 90 44, 94 36, 100 42 C 104 46, 107 55, 108 61 Z"
            fill="url(#mascotHornGrad)"
          />
          {/* Right Horn */}
          <path
            d="M 146 62 C 150 44, 146 36, 140 42 C 136 46, 133 55, 132 61 Z"
            fill="url(#mascotHornGrad)"
          />

          {/* Distinct White Belly Patch (from reference picture) */}
          <ellipse cx="120" cy="120" rx="38" ry="22" fill="url(#mascotBellyGrad)" />

          {/* ========================================================= */}
          {/* FACIAL EXPRESSIONS (EXACT MATCH TO REFERENCE PICTURE)      */}
          {/* ========================================================= */}

          {/* Pink Cheeks (Rhombus/Heart shape with rounded corners) */}
          <g fill="url(#mascotBlushGrad)">
            {/* Left Cheek */}
            <path
              d="M 86 102 Q 91 107 86 112 Q 81 107 86 102 Z"
              transform="scale(1.3) translate(-17, -26)"
              className="drop-shadow-sm"
            />
            {/* Right Cheek */}
            <path
              d="M 154 102 Q 159 107 154 112 Q 149 107 154 102 Z"
              transform="scale(1.3) translate(-37, -26)"
              className="drop-shadow-sm"
            />
          </g>

          {/* Eyebrows (Horizontal bold dark bars from reference picture) */}
          <rect
            x="91"
            y="76"
            width="17"
            height="4"
            rx="2"
            fill="#18181b"
            transform="rotate(-2 99.5 78)"
          />
          <rect
            x="132"
            y="76"
            width="17"
            height="4"
            rx="2"
            fill="#18181b"
            transform="rotate(2 140.5 78)"
          />

          {/* Eyes (Glossy Dark Round Eyes with Specular Sparkle from Reference) */}
          {isBlinking ? (
            <>
              {/* Happy Blinking Curved Eyes */}
              <path
                d="M 91 95 Q 98 102 105 95"
                stroke="#18181b"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 135 95 Q 142 102 149 95"
                stroke="#18181b"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              {/* Left Eye (Viewer's Left) */}
              <g>
                <ellipse cx="98" cy="94" rx="8" ry="8.5" fill="#18181b" />
                {/* Crisp Specular Catchlight Sparkle (Upper Right of Pupil) */}
                <circle cx="101.5" cy="91.5" r="3" fill="#ffffff" />
                <circle cx="95.5" cy="96.5" r="1.2" fill="#ffffff" opacity="0.6" />
              </g>

              {/* Right Eye (Viewer's Right) */}
              <g>
                <ellipse cx="142" cy="94" rx="8" ry="8.5" fill="#18181b" />
                {/* Crisp Specular Catchlight Sparkle (Upper Left of Pupil) */}
                <circle cx="138.5" cy="91.5" r="3" fill="#ffffff" />
                <circle cx="144.5" cy="96.5" r="1.2" fill="#ffffff" opacity="0.6" />
              </g>
            </>
          )}

          {/* Cute Smiling Mouth (Gentle curve from reference picture) */}
          {isHappy ? (
            <path
              d="M 113 103 Q 120 113 127 103 Z"
              fill="#f43f5e"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M 114 103 Q 120 109 126 103"
              stroke="#18181b"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

