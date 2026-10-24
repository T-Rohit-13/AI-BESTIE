import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, AlertCircle, RefreshCw } from 'lucide-react';

interface OtpVerifyStepProps {
  mobileNumber: string;
  countryCode: string;
  onVerified: () => void;
  onBack: () => void;
  signUpData?: any;
}

export const OtpVerifyStep: React.FC<OtpVerifyStepProps> = ({
  mobileNumber,
  countryCode,
  onVerified,
  onBack,
  signUpData,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown timer for resend
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const nextDigits = [...digits];

    if (!cleaned) {
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Grab the last digit entered
    nextDigits[index] = cleaned[cleaned.length - 1];
    setDigits(nextDigits);
    setErrorMessage(null);

    // Auto-advance to next input
    if (index < 3 && cleaned) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const nextDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);
    const focusIndex = Math.min(pasted.length, 3);
    inputRefs[focusIndex].current?.focus();
  };

  const isComplete = digits.every((d) => d.length === 1);
  const enteredCode = digits.join('');

  const submitOtp = async (codeToVerify: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const resp = await fetch('http://localhost:5000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobileNumber,
          otp: codeToVerify,
          signUpData,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || data.success === false) {
        throw new Error(data.error || 'Invalid verification code. Please check your SMS and try again.');
      }

      if (data.token) {
        localStorage.setItem('inaro_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('inaro_user', JSON.stringify(data.user));
      }

      onVerified();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code. Please check your SMS and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setErrorMessage('Please enter all 4 verification digits.');
      return;
    }
    submitOtp(enteredCode);
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage(null);
    setResendNotice(null);
    setDigits(['', '', '', '']);

    try {
      const resp = await fetch('http://localhost:5000/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, countryCode }),
      });
      const data = await resp.json();
      if (data.success) {
        setResendNotice('New verification code dispatched via SMS!');
      }
      setTimerSeconds(45);
    } catch {
      setResendNotice('Verification SMS requested.');
      setTimerSeconds(45);
    } finally {
      setIsResending(false);
      inputRefs[0].current?.focus();
    }
  };

  const formattedTarget = `${countryCode} ${mobileNumber ? mobileNumber.slice(0, 5) + ' ' + mobileNumber.slice(5) : '90432 42655'}`;

  return (
    <div className="screen-view active">
      {/* Step Indicator Bar */}
      <div className="step-indicator-bar">
        <div className="step-pip done" />
        <div className="step-pip active" />
        <div className="step-pip" />
      </div>

      <div className="screen-header text-center">
        <button type="button" className="screen-back-btn" onClick={onBack} id="verify-otp-back-btn">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-2 shadow-lg shadow-purple-500/25">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="screen-title text-center text-slate-900 font-extrabold text-2xl tracking-tight">Verify OTP</h2>
        <p className="screen-subtitle text-center text-xs text-slate-500 max-w-xs mx-auto">
          Enter the 4-digit code sent via SMS to <span className="font-semibold text-purple-700">{formattedTarget}</span>
        </p>
      </div>

      {/* Dispatched Notification Banner without exposing code */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 border border-purple-200/90 rounded-2xl flex items-center gap-2.5 shadow-xs">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs text-purple-950 font-medium leading-relaxed">
          A 4-digit verification code has been dispatched to <strong>{formattedTarget}</strong>. Please check your SMS and enter the code below.
        </span>
      </div>

      {resendNotice && (
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <span>✓ {resendNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleVerify}>
        {/* 4-digit PIN input fields - Perfect Square Geometry */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 my-5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-14 h-16 sm:w-16 sm:h-16 text-center text-3xl font-extrabold rounded-2xl border-2 transition-all duration-200 outline-none select-none ${
                digit
                  ? 'border-purple-600 bg-purple-50/90 text-purple-900 shadow-md shadow-purple-500/15 scale-105'
                  : 'border-purple-200/90 bg-white text-slate-800 hover:border-purple-400 focus:border-purple-600 focus:ring-4 focus:ring-purple-200/50'
              }`}
              aria-label={`Digit ${index + 1}`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Resend OTP Row */}
        <div className="text-center text-xs text-slate-600 mb-5">
          {timerSeconds > 0 ? (
            <span>Didn't receive SMS? Resend code in <strong className="text-purple-700 font-semibold">{timerSeconds}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-purple-700 font-bold hover:underline cursor-pointer bg-transparent border-none inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
              <span>Resend Verification SMS</span>
            </button>
          )}
        </div>

        {/* Submit Verification Button */}
        <button
          type="submit"
          className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all"
          id="verify-otp-continue-btn"
          disabled={!isComplete || isVerifying}
        >
          {isVerifying ? (
            <span>Verifying Code...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
