import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, AlertCircle, Info } from 'lucide-react';

interface OtpVerifyStepProps {
  mobileNumber: string;
  countryCode: string;
  onVerified: () => void;
  onBack: () => void;
}

export const OtpVerifyStep: React.FC<OtpVerifyStepProps> = ({
  mobileNumber,
  countryCode,
  onVerified,
  onBack,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    // Single digit entry
    nextDigits[index] = cleaned[cleaned.length - 1];
    setDigits(nextDigits);
    setErrorMessage(null);

    // Auto-advance
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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setErrorMessage('Please enter all 4 verification digits.');
      return;
    }
    setErrorMessage(null);
    onVerified();
  };

  const handleResend = () => {
    setDigits(['', '', '', '']);
    setTimerSeconds(45);
    setErrorMessage(null);
    inputRefs[0].current?.focus();
  };

  const formattedTarget = `${countryCode} ${mobileNumber ? mobileNumber.slice(0, 5) + ' ' + mobileNumber.slice(5) : '98765 43210'}`;

  return (
    <div className="screen-view active">
      {/* Step Indicator Bar */}
      <div className="step-indicator-bar">
        <div className="step-pip done" />
        <div className="step-pip active" />
        <div className="step-pip" />
      </div>

      <div className="screen-header">
        <button type="button" className="screen-back-btn" onClick={onBack} id="verify-otp-back-btn">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-2 shadow-md shadow-purple-500/20">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="screen-title text-center">Verify OTP</h2>
        <p className="screen-subtitle text-center">
          Enter the 4-digit code for <span className="font-semibold text-purple-700">{formattedTarget}</span>
        </p>
      </div>

      {/* Backend Boundary Notice */}
      <div className="mb-4 p-3 bg-indigo-50/90 border border-indigo-200/80 rounded-xl text-indigo-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Phase 1 Notice:</strong> Backend SMS services are pending integration. No real SMS was dispatched. Enter any 4 digits (e.g. <code>1234</code>) to validate the UI flow.
        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleVerify}>
        {/* 4-digit PIN input fields */}
        <div className="flex justify-center gap-3 my-6">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-13 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none ${
                digit
                  ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                  : 'border-purple-200 bg-white/80 text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-200'
              }`}
              aria-label={`Digit ${index + 1}`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Resend OTP Row */}
        <div className="text-center text-xs text-slate-600 mb-6">
          {timerSeconds > 0 ? (
            <span>Resend code in <strong className="text-purple-700 font-semibold">{timerSeconds}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-purple-700 font-bold hover:underline cursor-pointer bg-transparent border-none"
            >
              Resend OTP Code
            </button>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="verify-otp-continue-btn"
          disabled={!isComplete}
        >
          <span>Verify & Continue</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </form>
    </div>
  );
};
