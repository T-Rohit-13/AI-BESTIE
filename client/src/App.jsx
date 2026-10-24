// INARO — Root App Component
// Owns routing topology and global context providers.
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages will be implemented in scoped feature branches per TEAM_OWNERSHIP.md
const LandingPage     = React.lazy(() => import('./components/landing/LandingPage.jsx'));
const NotFound        = () => <div className="flex h-screen items-center justify-center text-brand-400 font-display text-2xl">404 — Page not found</div>;

export default function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white">Loading INARO…</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Auth, Interactive, Dump routes added in feature branches */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
