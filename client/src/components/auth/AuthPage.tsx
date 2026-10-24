import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './auth-ui.css';
import { AuthShowcasePanel } from './AuthShowcasePanel';
import { AuthLandingStep } from './AuthLandingStep';
import { SignUpStep, SignUpFormData } from './SignUpStep';
import { OtpVerifyStep } from './OtpVerifyStep';
import { TrustedContactStep } from './TrustedContactStep';
import { AuthSuccessStep } from './AuthSuccessStep';
import { SignInStep } from './SignInStep';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export type AuthScreenStep = 'landing' | 'signup' | 'verify-otp' | 'trusted-setup' | 'success' | 'signin';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup' | 'landing';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get('mode') as 'signin' | 'signup' | 'landing' | null;

  const [step, setStep] = useState<AuthScreenStep>(() => {
    if (queryMode === 'signup' || queryMode === 'signin' || queryMode === 'landing') {
      return queryMode;
    }
    return initialMode;
  });

  useEffect(() => {
    if (queryMode && (queryMode === 'signup' || queryMode === 'signin' || queryMode === 'landing')) {
      setStep(queryMode);
    }
  }, [queryMode]);

  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    username: '',
    fullName: '',
    age: '',
    countryCode: '+91',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <div className="inaro-auth-scope">
      {/* Ambient Floating Glowing Aura Nodes */}
      <div className="ambient-scene" aria-hidden="true">
        <div className="aura-node aura-1" />
        <div className="aura-node aura-2" />
        <div className="aura-node aura-3" />
        <div className="aura-node aura-4" />
        <div className="ambient-grid" />
      </div>

      <div className="app-container">
        {/* Main Interactive Stage (Desktop Split-Screen) */}
        <main className="main-stage">
          {/* Left Panel: Companion Showcase Artwork, Mascot & Doodles */}
          <AuthShowcasePanel currentStep={step} />

          {/* Right Panel: Glassmorphic Multi-Step Form Card */}
          <section className="right-form-panel" aria-label="Account Access & Setup Forms">
            <div className="glass-form-card" id="auth-glass-card">
              {step === 'landing' && (
                <AuthLandingStep onNavigate={(target) => setStep(target)} />
              )}

              {step === 'signup' && (
                <SignUpStep
                  formData={signUpData}
                  setFormData={setSignUpData}
                  onNext={() => setStep('verify-otp')}
                  onBack={() => setStep('landing')}
                  onNavigateToSignIn={() => setStep('signin')}
                />
              )}

              {step === 'verify-otp' && (
                <OtpVerifyStep
                  mobileNumber={signUpData.mobileNumber}
                  countryCode={signUpData.countryCode}
                  onVerified={() => setStep('trusted-setup')}
                  onBack={() => setStep('signup')}
                />
              )}

              {step === 'trusted-setup' && (
                <TrustedContactStep
                  onComplete={() => setStep('success')}
                  onSkip={() => setStep('success')}
                  onBack={() => setStep('verify-otp')}
                />
              )}

              {step === 'success' && (
                <AuthSuccessStep userName={signUpData.fullName || signUpData.username} />
              )}

              {step === 'signin' && (
                <SignInStep
                  onBack={() => setStep('landing')}
                  onNavigateToSignUp={() => setStep('signup')}
                  onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
                />
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
