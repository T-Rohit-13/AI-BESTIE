import React, { useState, useEffect } from 'react';
import { useDailyEntry } from '../../context/DailyEntryContext';
import { MoodType } from '../../types/interactive';
import { Moon, Smile, X, Check, Sparkles } from 'lucide-react';

const MOOD_OPTIONS: Array<{ label: MoodType; emoji: string; color: string; desc: string }> = [
  { label: 'Happy', emoji: '😊', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', desc: 'Feeling upbeat and energized' },
  { label: 'Sad', emoji: '🌧️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100', desc: 'Feeling low or heavy' },
  { label: 'Normal', emoji: '🌿', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', desc: 'Even-keeled and steady' },
  { label: 'Stressed', emoji: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', desc: 'Feeling pressure or tension' },
  { label: 'Anxious', emoji: '🌀', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', desc: 'Restless thoughts or uneasy' },
  { label: 'Other', emoji: '✨', color: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100', desc: 'A mix of feelings' },
];

export const DailyCheckInModal: React.FC = () => {
  const { dailyEntry, isModalOpen, closeCheckInModal, saveCheckIn, hasSubmittedToday } = useDailyEntry();

  const [sleepHours, setSleepHours] = useState<string>('7.5');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>('Normal');
  const [sleepError, setSleepError] = useState<string | null>(null);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (dailyEntry) {
      setSleepHours(dailyEntry.sleepHours.toString());
      setSelectedMood(dailyEntry.mood);
    }
  }, [dailyEntry]);

  if (!isModalOpen) return null;

  const validate = (): boolean => {
    let isValid = true;

    // Validate sleep hours: numeric, 0-24, step 0.5
    const parsedSleep = parseFloat(sleepHours);
    if (isNaN(parsedSleep)) {
      setSleepError('Please enter a valid numeric value for sleep hours.');
      isValid = false;
    } else if (parsedSleep < 0 || parsedSleep > 24) {
      setSleepError('Sleep hours must be between 0 and 24 hours.');
      isValid = false;
    } else if (Math.round(parsedSleep * 2) !== parsedSleep * 2) {
      setSleepError('Sleep duration must be in increments of 0.5 hours (e.g. 7.0, 7.5).');
      isValid = false;
    } else {
      setSleepError(null);
    }

    // Validate mood
    if (!selectedMood) {
      setMoodError('Please select how you are feeling today.');
      isValid = false;
    } else {
      setMoodError(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const parsedSleep = parseFloat(sleepHours);
    await saveCheckIn(parsedSleep, selectedMood!);
    setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      <div className="relative w-full max-w-lg inaro-card p-6 sm:p-8 shadow-2xl text-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100/80 border border-purple-200 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="checkin-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {hasSubmittedToday ? 'Update Daily Check-In' : 'Daily Well-Being Check-In'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Take a brief moment to ground yourself before exploring conversations.
              </p>
            </div>
          </div>
          {hasSubmittedToday && (
            <button
              onClick={closeCheckInModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close check-in modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Sleep Hours Input */}
          <div>
            <label htmlFor="sleep-hours-input" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              <Moon className="w-4 h-4 text-purple-600" />
              Hours of Sleep Last Night (0 - 24, step 0.5)
            </label>
            <div className="relative">
              <input
                id="sleep-hours-input"
                name="sleepHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(e) => {
                  setSleepHours(e.target.value);
                  if (sleepError) setSleepError(null);
                }}
                className={`w-full px-4 py-2.5 bg-purple-50/40 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm font-medium ${
                  sleepError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-purple-200/80 focus:border-purple-500 focus:ring-purple-200'
                }`}
                placeholder="e.g. 7.5"
                aria-describedby={sleepError ? 'sleep-error' : undefined}
                required
              />
              <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">hours</span>
            </div>
            {sleepError && (
              <p id="sleep-error" className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1" role="alert">
                <span>⚠️</span> {sleepError}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Supports half-hour intervals (e.g. 6.5, 7.0, 8.5).
            </p>
          </div>

          {/* Mood Selectable Chips */}
          <div>
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              <Smile className="w-4 h-4 text-emerald-600" />
              How are you feeling overall today?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Daily mood selection">
              {MOOD_OPTIONS.map((item) => {
                const isSelected = selectedMood === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedMood(item.label);
                      if (moodError) setMoodError(null);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-300'
                        : `${item.color} border`
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.label}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
            {moodError && (
              <p id="mood-error" className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1" role="alert">
                <span>⚠️</span> {moodError}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : hasSubmittedToday ? (
                'Save Changes'
              ) : (
                'Continue to Interactive Mode'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
