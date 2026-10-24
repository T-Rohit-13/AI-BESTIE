import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { CharactersList } from './components/chat/CharactersList';
import { ChatScreen } from './components/chat/ChatScreen';
import { SupportPage } from './components/helpline/SupportPage';
import { LoginPage } from './components/auth/LoginPage';
import { DumpModePage } from './components/dump/DumpModePage';
import { DailyCheckInModal } from './components/tracker/DailyCheckInModal';
import { Toast } from './components/common/Toast';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CharactersList />} />
          <Route path="/chat/:characterId" element={<ChatScreen />} />
          <Route path="/dump" element={<DumpModePage />} />
          <Route path="/let-it-out" element={<DumpModePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/login" element={<LoginPage initialMode="signin" />} />
          <Route path="/signup" element={<LoginPage initialMode="landing" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Daily Check-In Modal (Triggers on load if not recorded today) */}
      <DailyCheckInModal />

      {/* Confirmation Toasts */}
      <Toast />
    </div>
  );
};
