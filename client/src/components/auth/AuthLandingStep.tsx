import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface AuthLandingStepProps {
  onNavigate: (step: 'signup' | 'signin') => void;
}

export const AuthLandingStep: React.FC<AuthLandingStepProps> = ({ onNavigate }) => {
  return (
    <div className="screen-view active">
      <div className="landing-hero">
        <div className="landing-tagline-badge">
          <span>🌱</span> MINDFUL DAILY WELLNESS
          <span className="sr-only">Pause. Breathe. Bloom.</span>
        </div>

        <h1 className="landing-headline">
          Your space. <br />
          <span className="gradient-text">Your pace.</span>
        </h1>

        <p className="landing-subtitle">
          A little space to talk, reflect, and be yourself. Join thousands of individuals caring for their minds.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate('signup')}
            id="landing-create-account-btn"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            type="button"
            className="btn-glass"
            onClick={() => onNavigate('signin')}
            id="landing-signin-btn"
          >
            <span>Sign In</span>
          </button>
        </div>

        <div className="landing-trust-row">
          <div className="landing-trust-item">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Ads</span>
          </div>
          <span>•</span>
          <div className="landing-trust-item">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>No Medical Claims</span>
          </div>
          <span>•</span>
          <div className="landing-trust-item">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
};
