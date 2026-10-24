import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, MapPin, Check, HeartHandshake } from 'lucide-react';

interface TrustedContactStepProps {
  onComplete: (data: { contactName: string; contactPhone: string }) => void;
  onSkip: () => void;
  onBack: () => void;
}

export const TrustedContactStep: React.FC<TrustedContactStepProps> = ({
  onComplete,
  onSkip,
  onBack,
}) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const handleRequestLocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationStatus('granted'),
        () => setLocationStatus('denied'),
        { timeout: 8000 }
      );
    } else {
      setLocationStatus('denied');
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ contactName: contactName.trim(), contactPhone: contactPhone.trim() });
  };

  return (
    <div className="screen-view active">
      {/* Step Indicator Bar */}
      <div className="step-indicator-bar">
        <div className="step-pip done" />
        <div className="step-pip done" />
        <div className="step-pip active" />
      </div>

      <div className="screen-header">
        <button type="button" className="screen-back-btn" onClick={onBack} id="trusted-setup-back-btn">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <h2 className="screen-title">Trusted Contact & Helpline</h2>
        <p className="screen-subtitle">Your emotional well-being network, kept completely in your control.</p>
      </div>

      <form onSubmit={handleFinish} className="space-y-4">
        {/* Trusted Person's Contact (Optional) */}
        <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <HeartHandshake className="w-4 h-4 text-purple-600" />
            <span>Trusted Person's Contact <span className="font-normal text-slate-500">(Optional)</span></span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Add a close friend or family member who can be contacted during wellness escalations.
          </p>

          <div className="space-y-2">
            <div>
              <label htmlFor="trusted-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                id="trusted-name"
                className="form-input text-xs"
                placeholder="e.g. Sarah / Mom / Roommate"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="trusted-phone" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                id="trusted-phone"
                className="form-input text-xs"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
          </div>
        </div>

        {/* Location Permission for Helpline Support */}
        <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>Regional Crisis Helplines</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2.5">
            Allows INARO to automatically present verified toll-free mental health helplines for your region.
          </p>

          <button
            type="button"
            onClick={handleRequestLocation}
            className="w-full flex items-center justify-between p-2.5 bg-white border border-purple-200 rounded-xl hover:border-purple-400 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📍</span>
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  {locationStatus === 'granted' ? 'Location Access Granted' : 'Detect Region'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {locationStatus === 'granted'
                    ? 'Browser location active for helpline directory'
                    : 'Click to grant browser location permission'}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                locationStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : locationStatus === 'denied'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              {locationStatus === 'granted' ? 'Granted' : locationStatus === 'denied' ? 'Declined' : 'Pending'}
            </span>
          </button>
        </div>

        {/* Privacy Guarantee Badge */}
        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Your safety matters:</strong> We connect you with verified counseling helplines based on your region. INARO never makes unauthorized calls or diagnoses.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <button type="submit" className="btn-primary" id="finish-setup-btn">
            <span>Complete Setup</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="btn-glass text-xs py-2 text-slate-600 hover:text-purple-700"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
};
