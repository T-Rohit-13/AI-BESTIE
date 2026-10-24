import React, { useState } from 'react';

// Floating glittering SVG stars around the screen
function FloatingStarField() {
  const stars = [
    { top: '10%', left: '12%', size: 16, delay: '0s', dur: '3.5s', color: '#A855F7' },
    { top: '18%', right: '14%', size: 22, delay: '0.7s', dur: '4.2s', color: '#8B5CF6' },
    { top: '35%', left: '6%', size: 14, delay: '1.2s', dur: '3.1s', color: '#38BDF8' },
    { top: '65%', right: '8%', size: 18, delay: '0.4s', dur: '3.8s', color: '#C084FC' },
    { top: '78%', left: '14%', size: 15, delay: '1.8s', dur: '3.3s', color: '#7C3AED' },
    { top: '82%', right: '16%', size: 20, delay: '1s', dur: '4.5s', color: '#60A5FA' },
    { top: '24%', left: '22%', size: 12, delay: '2.1s', dur: '2.9s', color: '#9333EA' },
    { top: '26%', right: '25%', size: 14, delay: '0.9s', dur: '3.6s', color: '#3B82F6' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {stars.map((s, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 24"
          className="absolute animate-pulse"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: s.delay,
            animationDuration: s.dur,
            filter: `drop-shadow(0 0 10px ${s.color})`,
          }}
        >
          <path
            d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
            fill={s.color}
          />
        </svg>
      ))}
    </div>
  );
}

// Bursting glitter sparkles hugging the title letters
function LetterSparkleBurst() {
  const sparkles = [
    { top: '-24px', left: '-12px', size: 28, color: '#38BDF8', delay: '0.05s' },
    { top: '-28px', right: '20%', size: 32, color: '#A855F7', delay: '0.2s' },
    { bottom: '-20px', left: '24%', size: 24, color: '#818CF8', delay: '0.35s' },
    { top: '-16px', right: '-12px', size: 30, color: '#C084FC', delay: '0.15s' },
    { bottom: '-22px', right: '18%', size: 26, color: '#7C3AED', delay: '0.3s' },
    { top: '35%', left: '-20px', size: 20, color: '#3B82F6', delay: '0.45s' },
    { top: '35%', right: '-20px', size: 22, color: '#9333EA', delay: '0.4s' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
      {sparkles.map((sp, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute animate-bounce"
          style={{
            top: sp.top,
            bottom: sp.bottom,
            left: sp.left,
            right: sp.right,
            width: `${sp.size}px`,
            height: `${sp.size}px`,
            animationDelay: sp.delay,
            animationDuration: '2.5s',
            filter: `drop-shadow(0 0 14px ${sp.color})`,
          }}
        >
          <path
            d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z"
            fill={sp.color}
          />
        </svg>
      ))}
    </div>
  );
}

export default function LandingPage({ onNext }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // The 5 Core Pillars arranged as columns next to next
  const featureColumns = [
    {
      id: 1,
      icon: '✨',
      title: 'Dump Mode',
      badge: 'Unfiltered',
      description: 'Pure unfiltered private venting with zero AI counter-advice or judgment.',
      borderAccent: 'hover:border-purple-400',
      glowAccent: 'hover:shadow-purple-500/20',
      iconBg: 'bg-purple-100 text-purple-700',
    },
    {
      id: 2,
      icon: '🤖',
      title: 'Interactive Mode',
      badge: 'Dual Voice',
      description: 'Customizable AI companions with dual STT/TTS voice intelligence and Tamil support.',
      borderAccent: 'hover:border-blue-400',
      glowAccent: 'hover:shadow-blue-500/20',
      iconBg: 'bg-blue-100 text-blue-700',
    },
    {
      id: 3,
      icon: '🎭',
      title: 'Mood Avatar',
      badge: 'Real-Time',
      description: 'Real-time dynamic expression avatar synced with live UI theme color shifts.',
      borderAccent: 'hover:border-fuchsia-400',
      glowAccent: 'hover:shadow-fuchsia-500/20',
      iconBg: 'bg-fuchsia-100 text-fuchsia-700',
    },
    {
      id: 4,
      icon: '🛡️',
      title: 'Crisis Safety',
      badge: 'Verified 24/7',
      description: 'Centralized verified helpline directory with 1-click native dialer access.',
      borderAccent: 'hover:border-rose-400',
      glowAccent: 'hover:shadow-rose-500/20',
      iconBg: 'bg-rose-100 text-rose-700',
    },
    {
      id: 5,
      icon: '🔒',
      title: 'Privacy Engine',
      badge: 'Zero-Knowledge',
      description: 'Secure server-side architecture with encrypted OTP and private transcript handling.',
      borderAccent: 'hover:border-indigo-400',
      glowAccent: 'hover:shadow-indigo-500/20',
      iconBg: 'bg-indigo-100 text-indigo-700',
    },
  ];

  const handleNextClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (typeof onNext === 'function') {
        onNext();
      } else {
        setIsTransitioning(false);
      }
    }, 450);
  };

  return (
    <div
      className={`relative min-h-screen w-full bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#EFF6FF] flex items-center justify-center p-4 sm:p-8 overflow-hidden transition-all duration-500 ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* ── Purple-Infused Ambient Light Aura ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Top-center deep electric purple glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full bg-gradient-to-b from-[#7C3AED]/25 via-[#8B5CF6]/18 to-transparent blur-[140px] animate-pulse" />
        {/* Right vibrant violet node */}
        <div className="absolute top-1/3 -right-32 w-[580px] h-[580px] rounded-full bg-[#A855F7]/20 blur-[130px] animate-float" />
        {/* Left sky-blue balancing aura */}
        <div className="absolute -bottom-32 -left-32 w-[580px] h-[580px] rounded-full bg-[#3B82F6]/18 blur-[130px] animate-float" style={{ animationDelay: '-3.5s' }} />
        {/* Subtle geometric dot grid with purple undertone */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(#7C3AED 1px, transparent 1px), radial-gradient(#3B82F6 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0, 18px 18px',
          }}
        />
      </div>

      <FloatingStarField />

      {/* ── Astra GPT-6 Glassmorphic Master Capsule ── */}
      <main className="relative z-10 w-full max-w-6xl bg-white/80 backdrop-blur-3xl border border-white/95 rounded-[36px] sm:rounded-[48px] p-6 sm:p-12 shadow-[0_30px_90px_-20px_rgba(124,58,237,0.22),0_0_0_1px_rgba(255,255,255,0.8)_inset] flex flex-col items-center text-center transition-all duration-500">
        
        {/* Iridescent Top Accent Glow Bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent rounded-full blur-[1px]" />

        {/* ── 1. The "INARO" Grand Entrance with Pop-Up & Sparkle Effect ── */}
        <div className="relative inline-block mt-1 mb-2">
          <LetterSparkleBurst />

          <h1
            className="font-display font-black tracking-tight select-none flex items-center justify-center gap-1 sm:gap-3"
            style={{ perspective: '800px' }}
          >
            {'INARO'.split('').map((char, index) => (
              <span
                key={index}
                className="inline-block text-7xl sm:text-8xl md:text-9xl font-black bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent drop-shadow-[0_15px_35px_rgba(124,58,237,0.32)] animate-pop-in"
                style={{
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: 'both',
                }}
              >
                {char}
              </span>
            ))}
          </h1>
        </div>

        {/* Subtitle Badge with Purple Aura */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-purple-200 shadow-[0_4px_16px_rgba(124,58,237,0.12)] backdrop-blur-md mb-4 animate-fade-up">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] animate-ping" />
          <span className="text-xs sm:text-sm font-bold tracking-wide bg-gradient-to-r from-blue-700 to-purple-800 bg-clip-text text-transparent">
            🫧 Where Feelings Find Comfort
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal mb-8 animate-fade-up"
          style={{ animationDelay: '200ms', animationFillMode: 'both' }}
        >
          A privacy-first mental well-being companion for emotional venting, AI conversations, and real-time mood-responsive care.
        </p>

        {/* ── 2. One-Line Horizontal Feature Ribbon (Column Next to Next) ── */}
        <section
          aria-label="Core Capabilities"
          className="w-full my-3 animate-fade-up"
          style={{ animationDelay: '350ms', animationFillMode: 'both' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
            {featureColumns.map((col, idx) => (
              <div
                key={col.id}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.08)] transition-all duration-300 text-left cursor-default ${
                  col.borderAccent
                } ${col.glowAccent} ${
                  hoveredCard === idx ? '-translate-y-1.5 shadow-xl bg-white ring-2 ring-purple-300/40' : ''
                }`}
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm ${col.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                      {col.icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-full">
                      {col.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base tracking-tight mb-1.5 group-hover:text-purple-700 transition-colors">
                    {col.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {col.description}
                  </p>
                </div>

                {/* Subtle Bottom Accent Indicator */}
                <div className="mt-4 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-semibold text-purple-600">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">Active</span>
                  <span className="text-slate-300 group-hover:text-purple-500 transition-colors">✦</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Astra-Style Glowing Next CTA Button ── */}
        <div
          className="mt-10 sm:mt-12 w-full flex flex-col items-center justify-center animate-fade-up"
          style={{ animationDelay: '500ms', animationFillMode: 'both' }}
        >
          <button
            onClick={handleNextClick}
            className="group relative inline-flex items-center justify-center gap-3 px-10 sm:px-14 py-4 sm:py-4.5 rounded-2xl font-display font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#3B82F6] via-[#6D28D9] to-[#7C3AED] shadow-[0_12px_40px_-5px_rgba(109,40,217,0.5),0_0_25px_rgba(124,58,237,0.35)] hover:shadow-[0_16px_50px_-5px_rgba(59,130,246,0.6),0_0_40px_rgba(139,92,246,0.55)] hover:-translate-y-1 active:scale-95 transition-all duration-300 overflow-hidden"
            aria-label="Proceed to INARO"
          >
            {/* Shimmer light sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <span className="tracking-wide text-white drop-shadow-sm">Next</span>

            {/* Subtle Right-Arrow Animation */}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-2 text-lg">
              →
            </span>
          </button>

          {/* Micro Confidentiality Assurance */}
          <div className="mt-6 text-[11px] font-medium text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>100% Confidential • End-to-End Encrypted • No Setup Required</span>
          </div>
        </div>

      </main>
    </div>
  );
}
