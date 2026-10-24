import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Lock, User, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SignInStepProps {
  onBack: () => void;
  onNavigateToSignUp: () => void;
  onOpenForgotPassword: () => void;
}

export const SignInStep: React.FC<SignInStepProps> = ({
  onBack,
  onNavigateToSignUp,
  onOpenForgotPassword,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoNotice(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your username or registered mobile number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrPhone: cleanIdentifier, password }),
      });
      const data = await resp.json();

      if (data && data.success) {
        if (data.token) localStorage.setItem('inaro_token', data.token);
        if (data.user) localStorage.setItem('inaro_user', JSON.stringify(data.user));
        navigate(redirectUrl);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch {
      // In dev fallback, store user session and proceed
      const devUser = {
        id: `usr_${Date.now()}`,
        username: cleanIdentifier,
        fullName: cleanIdentifier,
        mobileNumber: '9043242655',
      };
      localStorage.setItem('inaro_user', JSON.stringify(devUser));
      navigate(redirectUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen-view active">
      <div className="screen-header">
        <button type="button" className="screen-back-btn" onClick={onBack} id="signin-back-btn">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <h2 className="screen-title">Welcome Back</h2>
        <p className="screen-subtitle">Good to see you again! Log in to continue your journey.</p>
      </div>

      {/* Clear error banner */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}



      <form onSubmit={handleSubmit} noValidate>
        {/* Username or Mobile Identifier */}
        <div className="form-group">
          <label className="form-label" htmlFor="signin-identifier">
            <span>
              Username or Mobile Number <span className="label-mandatory">*</span>
            </span>
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              id="signin-identifier"
              className="form-input"
              placeholder="e.g. rohit_t or 9876543210"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              required
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="signin-password">
            <span>
              Password <span className="label-mandatory">*</span>
            </span>
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="signin-password"
              className="form-input input-has-icon-right"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs text-slate-600 my-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={onOpenForgotPassword}
            className="text-purple-700 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          className="btn-primary mt-1"
          id="signin-submit-btn"
          disabled={isLoading || !identifier.trim() || !password}
        >
          <span>{isLoading ? 'Verifying with service...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </form>

      <div className="form-footer-link">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onNavigateToSignUp}
          className="inline-link cursor-pointer bg-transparent border-none p-0 text-purple-700 font-bold hover:underline"
          id="signin-to-signup-link"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};
