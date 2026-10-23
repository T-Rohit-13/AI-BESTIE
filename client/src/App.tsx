import React from 'react';
import { DumpMode } from './components/dump/DumpMode';
import './styles/global.css';

export const App: React.FC = () => {
  return (
    <div className="inaro-app">
      {/* Top Navigation Bar matching reference image */}
      <nav className="inaro-navbar" aria-label="Main application bar">
        <div className="inaro-nav-content">
          {/* Left Brand: Gradient icon + INARO + MENTAL WELLNESS pill */}
          <div className="inaro-brand">
            <div className="inaro-logo-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="7" fill="url(#inaroLogoGrad)" />
                <path
                  d="M7 9C7 7.5 8.5 6.5 10.5 6.5C12.5 6.5 14 7.5 14 9C14 11.5 7 12 7 15.5C7 16.5 8 17.5 9.5 17.5H17"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="15.5" cy="11.5" r="1.5" fill="#ffffff" />
                <defs>
                  <linearGradient id="inaroLogoGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <span className="inaro-brand-title">INARO</span>

            <span className="inaro-wellness-pill">
              MENTAL WELLNESS
            </span>
          </div>

          {/* Right Status: 100% Confidential & Safe pill */}
          <div className="inaro-safe-pill" title="Everything in Dump Mode is private and unguided">
            <span className="inaro-safe-dot" aria-hidden="true" />
            <span>100% Confidential &amp; Safe</span>
          </div>
        </div>
      </nav>

      {/* Main Self-Contained Dump Mode Component */}
      <DumpMode />
    </div>
  );
};

export default App;
