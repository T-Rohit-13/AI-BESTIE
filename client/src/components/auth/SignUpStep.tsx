import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export interface SignUpFormData {
  username: string;
  fullName: string;
  age: string;
  countryCode: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface SignUpStepProps {
  formData: SignUpFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>;
  onNext: () => void;
  onBack: () => void;
  onNavigateToSignIn: () => void;
}

export const SignUpStep: React.FC<SignUpStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  onNavigateToSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Validation rules
  const isUsernameValid = () => {
    const u = formData.username.trim();
    return u.length >= 3 && u.length <= 20 && /^[a-zA-Z0-9_]+$/.test(u);
  };

  const getUsernameError = () => {
    const u = formData.username.trim();
    if (!u) return 'Username is required';
    if (u.length < 3) return 'Username must be at least 3 characters';
    if (u.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Only letters, numbers, and underscores allowed';
    return null;
  };

  const isNameValid = () => formData.fullName.trim().length >= 2;

  const isAgeValid = () => {
    const a = parseInt(formData.age, 10);
    return !isNaN(a) && a >= 13 && a <= 120;
  };

  const getAgeError = () => {
    const a = parseInt(formData.age, 10);
    if (!formData.age) return 'Age is required';
    if (isNaN(a) || a < 13) return 'Must be 13 or older to join INARO';
    if (a > 120) return 'Please enter a valid age';
    return null;
  };

  const isPhoneValid = () => /^\d{10}$/.test(formData.mobileNumber.trim());

  // Password Strength Evaluation (0 to 4 score)
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const isPasswordValid = () => {
    return (
      formData.password.length >= 8 &&
      /[A-Z]/.test(formData.password) &&
      /[a-z]/.test(formData.password) &&
      /[0-9]/.test(formData.password)
    );
  };

  const isConfirmPasswordValid = () => {
    return formData.confirmPassword === formData.password && formData.confirmPassword.length > 0;
  };

  const [isLoading, setIsLoading] = useState(false);

  const canProceed =
    isUsernameValid() &&
    isNameValid() &&
    isAgeValid() &&
    isPhoneValid() &&
    isPasswordValid() &&
    isConfirmPasswordValid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      username: true,
      fullName: true,
      age: true,
      mobileNumber: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    // Auto-check terms if user clicked submit
    if (!formData.agreeTerms) {
      setFormData((prev) => ({ ...prev, agreeTerms: true }));
    }

    if (!canProceed) {
      if (!isUsernameValid()) setSubmitError('Please enter a valid username (at least 3 alphanumeric characters).');
      else if (!isNameValid()) setSubmitError('Please enter your full name.');
      else if (!isAgeValid()) setSubmitError('Age eligibility requirement: Must be 13 or older.');
      else if (!isPhoneValid()) setSubmitError('Please enter a valid 10-digit mobile number.');
      else if (!isPasswordValid()) setSubmitError('Password must be at least 8 characters with upper, lower, and number.');
      else if (!isConfirmPasswordValid()) setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitError(null);
    setIsLoading(true);

    try {
      const resp = await fetch('http://localhost:5000/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: formData.mobileNumber,
          countryCode: formData.countryCode,
          username: formData.username,
        }),
      });
      const data = await resp.json();
      if (data && data.code) {
        sessionStorage.setItem('inaro_dev_otp', data.code);
      }
    } catch {
      // In offline/mock mode, default dev code is 1234
      sessionStorage.setItem('inaro_dev_otp', '1234');
    } finally {
      setIsLoading(false);
      onNext();
    }
  };

  return (
    <div className="screen-view active">
      {/* Step Indicator Bar */}
      <div className="step-indicator-bar">
        <div className="step-pip active" />
        <div className="step-pip" />
        <div className="step-pip" />
      </div>

      <div className="screen-header">
        <button type="button" className="screen-back-btn" onClick={onBack} id="signup-back-btn">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <h2 className="screen-title">Create Your Account</h2>
        <p className="screen-subtitle">Join INARO in seconds to begin your personal wellness journey.</p>
      </div>

      {submitError && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* 2-Column Row 1: Username & Full Name */}
        <div className="form-row-2col">
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-username">
              <span>
                Username <span className="label-mandatory">*</span>
              </span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="signup-username"
                className={`form-input ${touched.username && getUsernameError() ? 'border-rose-400 bg-rose-50/20' : ''}`}
                placeholder="e.g. rohit_t"
                value={formData.username}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, username: e.target.value }));
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => handleBlur('username')}
                required
                autoComplete="username"
              />
            </div>
            <div className="validation-feedback">
              {touched.username && getUsernameError() ? (
                <span className="feedback-error">{getUsernameError()}</span>
              ) : formData.username.trim().length >= 3 && isUsernameValid() ? (
                <span className="feedback-success">✓ Username format valid</span>
              ) : null}
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              <span>
                Your Name <span className="label-mandatory">*</span>
              </span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="signup-name"
                className={`form-input ${touched.fullName && !isNameValid() ? 'border-rose-400 bg-rose-50/20' : ''}`}
                placeholder="e.g. Rohit"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => handleBlur('fullName')}
                required
                autoComplete="name"
              />
            </div>
            <div className="validation-feedback">
              {touched.fullName && !isNameValid() && (
                <span className="feedback-error">Please enter your name</span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Row 2: Age & Mobile Number */}
        <div className="form-row-2col">
          {/* Age */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-age">
              <span>
                Age <span className="label-mandatory">*</span>
              </span>
              <span className="label-helper">(13+)</span>
            </label>
            <div className="input-wrapper">
              <input
                type="number"
                id="signup-age"
                className={`form-input ${touched.age && getAgeError() ? 'border-rose-400 bg-rose-50/20' : ''}`}
                placeholder="e.g. 21"
                min="13"
                max="120"
                value={formData.age}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, age: e.target.value }));
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => handleBlur('age')}
                required
              />
            </div>
            <div className="validation-feedback">
              {touched.age && getAgeError() ? (
                <span className="feedback-error">{getAgeError()}</span>
              ) : null}
            </div>
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">
              <span>
                Mobile Number <span className="label-mandatory">*</span>
              </span>
            </label>
            <div className="phone-input-group">
              <select
                id="signup-country-code"
                className="country-select"
                aria-label="Country Code"
                value={formData.countryCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, countryCode: e.target.value }))}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+65">🇸🇬 +65</option>
              </select>
              <input
                type="tel"
                id="signup-phone"
                className={`form-input ${touched.mobileNumber && !isPhoneValid() ? 'border-rose-400 bg-rose-50/20' : ''}`}
                placeholder="10-digit number"
                maxLength={10}
                value={formData.mobileNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData((prev) => ({ ...prev, mobileNumber: cleaned }));
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => handleBlur('mobileNumber')}
                required
                autoComplete="tel-national"
              />
            </div>
            <div className="validation-feedback">
              {touched.mobileNumber && !isPhoneValid() && (
                <span className="feedback-error">10-digit mobile number required</span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Row 3: Password & Confirm Password */}
        <div className="form-row-2col">
          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              <span>
                Password <span className="label-mandatory">*</span>
              </span>
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="signup-password"
                className={`form-input input-has-icon-right ${
                  touched.password && !isPasswordValid() ? 'border-rose-400 bg-rose-50/20' : ''
                }`}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, password: e.target.value }));
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => handleBlur('password')}
                required
                autoComplete="new-password"
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

            {/* Password Strength Meter */}
            <div className="mt-1.5">
              <div className="flex gap-1 h-1 w-full bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className={`flex-1 transition-colors ${
                    passwordStrength >= 1 ? (passwordStrength === 1 ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-transparent'
                  }`}
                />
                <div
                  className={`flex-1 transition-colors ${
                    passwordStrength >= 2 ? (passwordStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                  }`}
                />
                <div
                  className={`flex-1 transition-colors ${
                    passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-transparent'
                  }`}
                />
                <div
                  className={`flex-1 transition-colors ${
                    passwordStrength >= 4 ? 'bg-emerald-600' : 'bg-transparent'
                  }`}
                />
              </div>
              <div className="validation-feedback flex justify-between text-[11px] text-slate-500 mt-1">
                <span>
                  {passwordStrength === 0 && 'Enter 8+ chars'}
                  {passwordStrength === 1 && 'Weak: Add uppercase & lowercase'}
                  {passwordStrength === 2 && 'Fair: Add numbers'}
                  {passwordStrength === 3 && 'Good: Add special characters'}
                  {passwordStrength === 4 && 'Strong password'}
                </span>
                <span>{formData.password.length}/8+</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm-password">
              <span>
                Confirm Password <span className="label-mandatory">*</span>
              </span>
            </label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="signup-confirm-password"
                className={`form-input input-has-icon-right ${
                  touched.confirmPassword && !isConfirmPasswordValid() ? 'border-rose-400 bg-rose-50/20' : ''
                }`}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => handleBlur('confirmPassword')}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
            <div className="validation-feedback">
              {touched.confirmPassword && !isConfirmPasswordValid() ? (
                <span className="feedback-error">Passwords must match</span>
              ) : formData.confirmPassword && isConfirmPasswordValid() ? (
                <span className="feedback-success">✓ Passwords match</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Compact Helper Banner */}
        <div className="helper-banner">
          <Lock className="w-4 h-4 helper-banner-icon shrink-0" />
          <div>We will prompt a 4-digit verification code to confirm your mobile identity.</div>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="mb-4">
          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              id="signup-terms"
              checked={formData.agreeTerms}
              onChange={(e) => setFormData((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              required
            />
            <span>
              I agree to the <span className="text-purple-700 font-semibold underline">Terms of Service</span> and{' '}
              <span className="text-purple-700 font-semibold underline">Privacy Policy</span>. I understand INARO provides peer
              well-being support, not clinical diagnosis.
            </span>
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          className="btn-primary"
          id="signup-continue-btn"
          disabled={isLoading}
        >
          <span>{isLoading ? 'Sending Verification SMS...' : 'Continue to Verification'}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </form>

      <div className="form-footer-link">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onNavigateToSignIn}
          className="inline-link cursor-pointer bg-transparent border-none p-0 text-purple-700 font-bold hover:underline"
          id="signup-to-signin-link"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
