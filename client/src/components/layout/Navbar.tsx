import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDailyEntry } from '../../context/DailyEntryContext';
import { HeartHandshake, Smile, MessageCircleHeart, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { openCheckInModal, dailyEntry, hasSubmittedToday } = useDailyEntry();

  const isInteractive = location.pathname === '/' || location.pathname.startsWith('/chat');
  const isSupport = location.pathname === '/support';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-purple-100/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo matching the attached image */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Custom rounded purple icon with white smiley arc */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 13 Q 12 18 16 13" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors">
              INARO
            </span>
          </Link>

          {/* "MENTAL WELLNESS" badge from the reference image */}
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-purple-700 bg-purple-100/80 border border-purple-200/60 uppercase">
            Mental Wellness
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Main Navigation">
          <Link
            to="/"
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              isInteractive
                ? 'bg-purple-100/90 text-purple-800 shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            Companions
          </Link>

          <a
            href="/companion-3d.html"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition"
            title="Open 3D Avatar Interactive Studio"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>3D Avatar</span>
          </a>

          <Link
            to="/support"
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              isSupport
                ? 'bg-purple-100/90 text-purple-800 shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Support & Care</span>
          </Link>
        </nav>

        {/* Right Section: Confidential pill + Daily Check-In */}
        <div className="flex items-center gap-2.5">
          {/* "100% Confidential & Safe" pill from the reference image */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Confidential & Safe</span>
          </div>

          <button
            onClick={openCheckInModal}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              hasSubmittedToday
                ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-transparent shadow-md shadow-indigo-500/20'
            }`}
            title="View or update your daily mood & sleep check-in"
          >
            <Smile className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasSubmittedToday ? `Mood: ${dailyEntry?.mood}` : 'Daily Check-In'}
            </span>
            <span className="sm:hidden">Check-In</span>
          </button>
        </div>
      </div>
    </header>
  );
};
