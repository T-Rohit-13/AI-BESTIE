import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Compass, CheckCircle2 } from 'lucide-react';

interface AuthSuccessStepProps {
  userName: string;
}

export const AuthSuccessStep: React.FC<AuthSuccessStepProps> = ({ userName }) => {
  const navigate = useNavigate();

  return (
    <div className="screen-view active text-center py-4">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-purple-500/25 animate-bounce">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 mb-3">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Verification & Setup Complete</span>
      </div>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Account Created!</h2>
      <p className="text-xs text-slate-600 max-w-xs mx-auto mb-4 leading-relaxed">
        Welcome to INARO, <strong className="text-purple-700 font-bold">{userName || 'Friend'}</strong>! Your personalized safe space is ready.
      </p>

      {/* Backend boundary explanation */}
      <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-2xl text-[11px] text-purple-900 max-w-sm mx-auto mb-6 text-left leading-relaxed">
        <strong>Phase 1 UI Complete:</strong> Registration workflow, age checks, password strength evaluation, and OTP input verification have been fully validated on the client. Real database persistence will be connected in Phase 2.
      </div>

      <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-primary"
          id="go-home-btn"
        >
          <Heart className="w-4 h-4 mr-1.5 text-pink-200" />
          <span>Meet Companions</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/support')}
          className="btn-glass text-xs py-2.5 text-slate-700 hover:text-purple-700"
          id="explore-features-btn"
        >
          <Compass className="w-3.5 h-3.5 mr-1" />
          <span>Explore Care & Helplines</span>
        </button>
      </div>
    </div>
  );
};
