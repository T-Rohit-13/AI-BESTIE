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
      className="relative flex items-center justify-center cursor-pointer select-none py-2 group"
      title="Tap me to say hi!"
    >
      {/* Floating 3D Rings and Crystals */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white/90 shadow-md shadow-purple-200/50 -rotate-12 animate-float-slow pointer-events-none" />
      <div className="absolute -right-2 top-4 w-5 h-5 bg-gradient-to-br from-pink-300 to-purple-400 rounded-md rotate-45 shadow-sm opacity-80 animate-float-reverse pointer-events-none" />
      <div className="absolute left-4 top-2 w-4 h-4 bg-gradient-to-br from-purple-300 to-indigo-300 rounded-sm rotate-12 shadow-sm opacity-70 animate-float-slow pointer-events-none" />
      <div className="absolute right-6 bottom-4 w-6 h-6 bg-gradient-to-tr from-violet-300 to-fuchsia-300 rounded-md rotate-45 shadow-sm opacity-70 animate-float-slow pointer-events-none" />

      {/* Speech bubble: "Click me to interact!" */}
      <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] text-white text-[11px] font-medium rounded-xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform z-10">
        <span>Click me to interact!</span>
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#18181b] rotate-45 border-l border-b border-white/10" />
      </div>

      {/* Cute Character SVG Canvas */}
      <div className={`transition-transform duration-300 ${isHappy ? 'scale-110 -translate-y-2' : 'group-hover:scale-105'}`}>
        <svg
          width="170"
          height="160"
          viewBox="0 0 170 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl"
        >
          <defs>
            {/* Soft Ambient Body Shadow */}
            <radialGradient id="bodyGrad" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f8f6fe" />
              <stop offset="100%" stopColor="#e4daf9" />
            </radialGradient>
            {/* Belly highlight */}
            <radialGradient id="bellyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3eeff" />
            </radialGradient>
            {/* Blushing cheeks */}
            <radialGradient id="blushPink" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
            {/* Soft ground shadow */}
            <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="85" cy="148" rx="55" ry="10" fill="url(#groundShadow)" />

          {/* Little Feet */}
          <ellipse cx="68" cy="140" rx="14" ry="9" fill="url(#bodyGrad)" />
          <ellipse cx="102" cy="140" rx="14" ry="9" fill="url(#bodyGrad)" />

          {/* Little Hands/Arms */}
          <ellipse cx="44" cy="98" rx="10" ry="14" transform="rotate(25 44 98)" fill="url(#bodyGrad)" />
          <ellipse cx="126" cy="98" rx="10" ry="14" transform="rotate(-25 126 98)" fill="url(#bodyGrad)" />

          {/* Main Chubby Body */}
          <ellipse cx="85" cy="85" rx="46" ry="48" fill="url(#bodyGrad)" />

          {/* Little Ears / Antennae */}
          <path d="M 62 43 C 60 30, 68 25, 73 38 Z" fill="url(#bodyGrad)" />
          <path d="M 108 43 C 110 30, 102 25, 97 38 Z" fill="url(#bodyGrad)" />

          {/* Belly Curve */}
          <ellipse cx="85" cy="98" rx="32" ry="26" fill="url(#bellyGrad)" opacity="0.9" />

          {/* Blushing Cheeks */}
          <circle cx="58" cy="88" r="7" fill="url(#blushPink)" />
          <circle cx="112" cy="88" r="7" fill="url(#blushPink)" />

          {/* Eyes */}
          {isBlinking ? (
            <>
              {/* Closed smiling curved eyes */}
              <path d="M 64 78 Q 71 83 78 78" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 92 78 Q 99 83 106 78" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Cute round open eyes */}
              <ellipse cx="71" cy="78" rx="3.5" ry="5.5" fill="#18181b" />
              <ellipse cx="99" cy="78" rx="3.5" ry="5.5" fill="#18181b" />
              {/* Eye Catchlights */}
              <circle cx="72" cy="76" r="1.5" fill="#ffffff" />
              <circle cx="100" cy="76" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Eyebrows */}
          <path d="M 65 69 Q 71 67 76 70" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 94 70 Q 99 67 105 69" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Smiling Mouth */}
          {isHappy ? (
            <path d="M 80 88 Q 85 96 90 88" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="#f43f5e" />
          ) : (
            <path d="M 81 88 Q 85 93 89 88" stroke="#18181b" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </svg>
      </div>
    </div>
  );
};
