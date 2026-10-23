import React, { useState, useEffect } from 'react';
import { Character, CharacterFormData, PersonalityPreset } from '../../types/interactive';
import { X, Sparkles, User, MessageSquare } from 'lucide-react';

interface CharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CharacterFormData) => Promise<void>;
  initialCharacter?: Character | null;
}

const PRESET_OPTIONS: PersonalityPreset[] = [
  'Friendly companion',
  'Mature and understanding companion',
  'Gossip partner',
  'Funny and humorous',
  'Sarcastic',
  'Custom',
];

const PRESET_DESCRIPTIONS: Record<PersonalityPreset, string> = {
  'Friendly companion': 'Warm, approachable, and encouraging listener who is always ready to cheer you on.',
  'Mature and understanding companion': 'Grounded, patient, and wise perspective focused on mindful growth.',
  'Gossip partner': 'Spicy, engaging, and enthusiastic friend ready to react to every little daily twist.',
  'Funny and humorous': 'Loves puns, memes, lighthearted teasing, and keeping things breezy.',
  'Sarcastic': 'Dry wit, sassy one-liners, and playfully sarcastic banter with a heart of gold.',
  'Custom': 'Define your own unique persona, quirks, and conversational style.',
};

const MAX_CUSTOM_CHARS = 250;

export const CharacterFormModal: React.FC<CharacterFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCharacter,
}) => {
  const [name, setName] = useState<string>('');
  const [preset, setPreset] = useState<PersonalityPreset>('Friendly companion');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialCharacter) {
      setName(initialCharacter.name);
      setPreset(initialCharacter.personalityPreset);
      setCustomDescription(initialCharacter.personalityDescription || '');
    } else {
      setName('');
      setPreset('Friendly companion');
      setCustomDescription('');
    }
    setNameError(null);
    setDescError(null);
  }, [initialCharacter, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Please enter a character name.');
      valid = false;
    } else if (name.trim().length > 30) {
      setNameError('Name must be 30 characters or fewer.');
      valid = false;
    } else {
      setNameError(null);
    }

    if (preset === 'Custom') {
      if (!customDescription.trim()) {
        setDescError('Please provide a short description for your custom personality.');
        valid = false;
      } else if (customDescription.length > MAX_CUSTOM_CHARS) {
        setDescError(`Personality description cannot exceed ${MAX_CUSTOM_CHARS} characters.`);
        valid = false;
      } else {
        setDescError(null);
      }
    } else {
      setDescError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        personalityPreset: preset,
        personalityDescription: preset === 'Custom' ? customDescription.trim() : PRESET_DESCRIPTIONS[preset],
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialLetter = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-lg inaro-card p-6 sm:p-8 shadow-2xl text-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-md shadow-purple-500/20">
              {initialLetter}
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {initialCharacter ? 'Edit Character' : 'Create New Companion'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize their name and choose how they converse with you.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name Field */}
          <div>
            <label htmlFor="char-name-input" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              <User className="w-4 h-4 text-purple-600" />
              Companion Name
            </label>
            <input
              id="char-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Maya, Alex, Kaviya..."
              maxLength={30}
              className={`w-full px-4 py-2.5 bg-purple-50/40 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm font-medium ${
                nameError
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-purple-200/80 focus:border-purple-500 focus:ring-purple-200'
              }`}
              required
            />
            {nameError && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1" role="alert">
                <span>⚠️</span> {nameError}
              </p>
            )}
          </div>

          {/* Personality Preset Dropdown */}
          <div>
            <label htmlFor="personality-preset-select" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Personality Preset
            </label>
            <div className="relative">
              <select
                id="personality-preset-select"
                value={preset}
                onChange={(e) => {
                  setPreset(e.target.value as PersonalityPreset);
                  if (descError) setDescError(null);
                }}
                className="w-full px-4 py-2.5 bg-purple-50/40 rounded-xl border border-purple-200/80 text-slate-800 text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition appearance-none cursor-pointer"
              >
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white text-slate-800 py-1">
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            {preset !== 'Custom' && (
              <p className="text-xs text-slate-500 mt-2 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                {PRESET_DESCRIPTIONS[preset]}
              </p>
            )}
          </div>

          {/* Custom Personality Textarea */}
          {preset === 'Custom' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="custom-desc-input" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                  <MessageSquare className="w-4 h-4 text-pink-600" />
                  Custom Personality Description
                </label>
                <span className={`text-xs font-medium ${customDescription.length > MAX_CUSTOM_CHARS ? 'text-rose-500' : 'text-slate-400'}`}>
                  {customDescription.length} / {MAX_CUSTOM_CHARS}
                </span>
              </div>
              <textarea
                id="custom-desc-input"
                rows={3}
                value={customDescription}
                onChange={(e) => {
                  setCustomDescription(e.target.value);
                  if (descError) setDescError(null);
                }}
                placeholder="Describe how your companion should speak, their tone, hobbies, and style..."
                maxLength={MAX_CUSTOM_CHARS}
                className={`w-full px-4 py-2.5 bg-purple-50/40 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm font-medium ${
                  descError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-purple-200/80 focus:border-purple-500 focus:ring-purple-200'
                }`}
              />
              {descError && (
                <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1" role="alert">
                  <span>⚠️</span> {descError}
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : initialCharacter ? 'Update Companion' : 'Create Companion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
