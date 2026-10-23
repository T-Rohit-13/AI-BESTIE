import React from 'react';
import { useDailyEntry } from '../../context/DailyEntryContext';
import { CheckCircle2, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast } = useDailyEntry();

  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-emerald-200 text-slate-800 rounded-2xl shadow-xl shadow-purple-900/10 animate-bounce-subtle"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      <span className="text-xs sm:text-sm font-semibold text-slate-800">{toastMessage}</span>
      <button
        onClick={clearToast}
        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
