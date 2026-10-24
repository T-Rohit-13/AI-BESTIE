import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 500);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setIdentifier('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer border-none"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white mb-3 shadow-md shadow-purple-500/20">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 id="forgot-password-title" className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
          Reset Your Password
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Enter your registered username or mobile number. If an account exists, a secure verification code will be dispatched.
        </p>

        {isSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instructions Dispatched</span>
            </div>
            <p className="leading-relaxed">
              If an account matching <strong>{identifier}</strong> exists in the database, instructions will be delivered.
            </p>
            <div className="text-[11px] text-emerald-700/80 pt-1 border-t border-emerald-200">
              Phase 1 note: Backend email/SMS delivery service is pending connection in Phase 2.
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-identifier" className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Mobile Number
              </label>
              <input
                type="text"
                id="forgot-identifier"
                required
                className="form-input text-xs"
                placeholder="Enter username or mobile to reset"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier.trim()}
              className="btn-primary"
            >
              <span>{isLoading ? 'Processing...' : 'Send Reset Instructions'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
