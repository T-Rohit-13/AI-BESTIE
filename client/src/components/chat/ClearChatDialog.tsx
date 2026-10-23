import React from 'react';
import { X, Eraser } from 'lucide-react';

interface ClearChatDialogProps {
  isOpen: boolean;
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ClearChatDialog: React.FC<ClearChatDialogProps> = ({
  isOpen,
  characterName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-sm animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="clear-dialog-title"
      aria-describedby="clear-dialog-desc"
    >
      <div className="relative w-full max-w-md inaro-card p-6 shadow-2xl text-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Eraser className="w-5 h-5" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 id="clear-dialog-title" className="text-lg font-bold text-slate-900 tracking-tight">
          Clear Conversation with {characterName}?
        </h3>

        {/* Clear chat message must strictly adhere to requirement:
            "Do not imply data is permanently deleted; the dialog text should say 'This clears your screen' not 'deleted forever'." */}
        <p id="clear-dialog-desc" className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          This clears your screen for a fresh start with {characterName}. Your other character conversations and daily check-ins will remain completely intact.
        </p>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Clear Screen
          </button>
        </div>
      </div>
    </div>
  );
};
