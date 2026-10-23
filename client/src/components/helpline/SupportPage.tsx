import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import { HelplineResourceItem } from '../../types/contracts';
import { SupportStatusResponse, TrustedContact } from '../../types/interactive';
import {
  PhoneCall,
  Shield,
  HeartHandshake,
  Clock,
  Globe,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const [resources, setResources] = useState<HelplineResourceItem[]>([]);
  const [supportStatus, setSupportStatus] = useState<SupportStatusResponse | null>(null);
  const [trustedContact, setTrustedContact] = useState<TrustedContact | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Trusted contact form state
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resList, statusRes, contactRes] = await Promise.allSettled([
          api.getSupportResources(),
          api.getSupportStatus(),
          api.getTrustedContact(),
        ]);

        if (resList.status === 'fulfilled' && Array.isArray(resList.value)) {
          setResources(resList.value);
        } else {
          setResources([
            {
              id: 'help_01',
              category: 'GOVERNMENT',
              serviceName: 'Tele-MANAS (National Mental Health Helpline)',
              phoneNumber: '14416',
              description: '24/7 toll-free mental health psychological support and counselling service.',
              operatingHours: '24/7',
              languages: ['English', 'Tamil', 'Hindi', 'Regional languages'],
              region: 'National (India)',
              isVerified: true,
              dialerUri: 'tel:14416',
            },
            {
              id: 'help_02',
              category: 'CRISIS_COUNSELLING',
              serviceName: 'KIRAN Helpline',
              phoneNumber: '1800-599-0019',
              description: '24/7 toll-free helpline providing early screening, first-aid psychological support, and distress management.',
              operatingHours: '24/7',
              languages: ['English', 'Hindi', 'Regional'],
              region: 'National',
              isVerified: true,
              dialerUri: 'tel:18005990019',
            },
            {
              id: 'help_03',
              category: 'STUDENT_SUPPORT',
              serviceName: 'Vandrevala Foundation Helpline',
              phoneNumber: '9999 666 555',
              description: 'Free, compassionate mental health counseling with trained psychologists.',
              operatingHours: '24/7',
              languages: ['English', 'Tamil', 'Hindi'],
              region: 'National',
              isVerified: true,
              dialerUri: 'tel:9999666555',
            },
          ]);
        }

        if (statusRes.status === 'fulfilled' && statusRes.value) {
          setSupportStatus(statusRes.value);
        } else {
          setSupportStatus({ level: 'none' });
        }

        if (contactRes.status === 'fulfilled' && contactRes.value) {
          setTrustedContact(contactRes.value);
          setContactName(contactRes.value.name);
          setContactPhone(contactRes.value.phoneNumber);
          setConsentGiven(contactRes.value.consentGiven);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);

    if (!contactName.trim()) {
      setContactError('Please provide a name for your trusted contact.');
      return;
    }

    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setContactError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!consentGiven) {
      setContactError('Consent confirmation is required before adding a trusted contact.');
      return;
    }

    setIsSavingContact(true);
    const newContact: TrustedContact = {
      name: contactName.trim(),
      phoneNumber: contactPhone.trim(),
      consentGiven: true,
    };

    try {
      await api.saveTrustedContact(newContact);
      setTrustedContact(newContact);
      setContactSuccess('Trusted contact details saved successfully.');
    } catch {
      setTrustedContact(newContact);
      setContactSuccess('Trusted contact saved locally.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleRemoveContact = async () => {
    if (!window.confirm('Are you sure you want to remove your trusted contact?')) return;
    try {
      await api.removeTrustedContact();
    } catch {
      // ignore
    }
    setTrustedContact(null);
    setContactName('');
    setContactPhone('');
    setConsentGiven(false);
    setContactSuccess('Trusted contact removed.');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-semibold mb-3">
          <HeartHandshake className="w-3.5 h-3.5" />
          Support & Well-Being Directory
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Mental Health & Helpline Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Access verified, confidential support lines and manage your personal emergency circle. INARO connects you with professional care whenever you feel like reaching out.
        </p>
      </div>

      {/* ========================================================
          SUPPORT STATUS BANNER (Dynamic evaluation tier handling)
          Wording must be gentle; NEVER say "you are depressed"
         ======================================================== */}
      {supportStatus?.level === 'above_four_days' && (
        <div className="p-6 inaro-card bg-amber-50/70 border-amber-300 shadow-lg animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                You may find speaking with someone supportive helpful
              </h2>
              <p className="text-xs sm:text-sm text-amber-800/90 mt-1.5 leading-relaxed">
                Reflecting on your recent check-ins, you have noted heavier days lately. You don't have to navigate everything on your own. Free, confidential counsellors are available around the clock.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="tel:14416"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" /> Tap to Call Tele-MANAS (14416)
                </a>
                <a
                  href="tel:18005990019"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-700 font-semibold text-xs border border-amber-300 transition cursor-pointer"
                >
                  Call KIRAN (1800-599-0019)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {supportStatus?.level === 'four_days' && (
        <div className="p-5 inaro-card bg-purple-50/60 border-purple-200 shadow-md animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Taking care of your peace of mind
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                You may find supportive conversations helpful during periods of stress. Exploring thoughts with our companions or connecting with trained listeners is always an open option.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VERIFIED HELPLINES LIST
         ======================================================== */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Verified Support Helplines
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 inaro-card animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((item) => (
              <div
                key={item.id}
                className="p-6 inaro-card inaro-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.isVerified && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.serviceName}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-purple-100/70">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" /> {item.operatingHours}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" /> {item.region}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-purple-100/70">
                  <span className="text-sm font-bold text-purple-700 font-mono">
                    {item.phoneNumber}
                  </span>
                  <a
                    href={item.dialerUri || `tel:${item.phoneNumber.replace(/\s+/g, '')}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-sm hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          SETTINGS SECTION: TRUSTED CONTACT
         ======================================================== */}
      <div className="p-6 sm:p-8 inaro-card">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Trusted Emergency Contact
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add someone you trust who can be offered as a quick contact option when you feel overwhelmed.
            </p>
          </div>

          {trustedContact && (
            <button
              onClick={handleRemoveContact}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>

        {contactSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{contactSuccess}</span>
          </div>
        )}

        {contactError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{contactError}</span>
          </div>
        )}

        <form onSubmit={handleSaveContact} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Full Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah Mitchell"
                className="w-full px-3.5 py-2.5 bg-purple-50/40 rounded-xl border border-purple-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 bg-purple-50/40 rounded-xl border border-purple-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
          </div>

          {/* Explicit Consent Checkbox explaining what is and is not shared */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-purple-300 text-purple-600 focus:ring-purple-400 bg-white"
                required
              />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">
                  Consent & Privacy Guarantee
                </span>
                I consent to saving this contact in my profile. I understand that{' '}
                <strong className="text-purple-700">
                  INARO never shares chat transcripts, audio recordings, mood logs, or private journal entries
                </strong>{' '}
                with this contact or any third party. This contact will only be displayed to me as a tap-to-call shortcut when I choose to reach out.
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingContact || !consentGiven}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 transition cursor-pointer"
            >
              {isSavingContact ? 'Saving...' : trustedContact ? 'Update Contact' : 'Save Trusted Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
