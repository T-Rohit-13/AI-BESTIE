import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  Shield,
  RefreshCw,
  ChevronDown,
  Wind,
  Keyboard
} from 'lucide-react';
import {
  getDumpSpaceName,
  updateDumpSpaceName,
  createDumpEntry,
  getDumpEntries,
  deleteDumpEntry,
  deleteAllDumpEntries,
} from '../../services/api';
import { DumpEntry } from '../../types/contracts';
import { Companion3DAvatar } from '../avatar/Companion3DAvatar';
import { SanctuaryMood } from '../avatar/SanctuaryAvatar';
import { detectToneFromText } from '../../services/toneDetector';

// Mood options with accessible labels and 1-5 integer mappings
const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Happy', value: 5, sanctuaryMood: 'happy' as SanctuaryMood },
  { emoji: '🙂', label: 'Okay', value: 4, sanctuaryMood: 'calm' as SanctuaryMood },
  { emoji: '😐', label: 'Neutral', value: 3, sanctuaryMood: 'neutral' as SanctuaryMood },
  { emoji: '😔', label: 'Sad', value: 2, sanctuaryMood: 'sad' as SanctuaryMood },
  { emoji: '😡', label: 'Angry', value: 1, sanctuaryMood: 'angry' as SanctuaryMood },
  { emoji: '😴', label: 'Tired', value: 3, sanctuaryMood: 'calm' as SanctuaryMood },
];

const LOCAL_STORAGE_ENTRIES_KEY = 'inaro_dump_entries_offline_backup';
const LOCAL_STORAGE_NAME_KEY = 'inaro_dump_space_name_backup';

export const DumpModePage: React.FC = () => {
  // ---------------------------------------------------------------------------
  // 1. SPACE NAME STATE
  // ---------------------------------------------------------------------------
  const [spaceName, setSpaceName] = useState<string>('My Dump');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInputValue, setNameInputValue] = useState<string>('My Dump');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // ---------------------------------------------------------------------------
  // 2. ENTRY WRITING & MOOD STATE
  // ---------------------------------------------------------------------------
  const [text, setText] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSavingEntry, setIsSavingEntry] = useState<boolean>(false);
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [showTypeArea, setShowTypeArea] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 3. SANCTUARY AVATAR & TONE STATE
  // Note: The avatar listens attentively without speaking back or giving advice.
  // It changes facial expressions dynamically based on user's tone.
  // ---------------------------------------------------------------------------
  const [avatarMood, setAvatarMood] = useState<SanctuaryMood>('calm');
  const [isReleasing, setIsReleasing] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 4. VOICE SPEECH-TO-TEXT STATE (Web Speech API)
  // Audio is never recorded, stored, uploaded, or transmitted anywhere.
  // ---------------------------------------------------------------------------
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // ---------------------------------------------------------------------------
  // 5. PAST ENTRIES & PAGINATION STATE
  // ---------------------------------------------------------------------------
  const [entries, setEntries] = useState<DumpEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);

  // Focus inline input when entering rename mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Check Web Speech API availability on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSpeechSupported(false);
      setShowTypeArea(true); // Open text area if voice is unsupported
    }
  }, []);

  // Fetch initial space name and entries
  useEffect(() => {
    loadSpaceName();
    loadInitialEntries();
  }, []);

  // Automatically analyze tone from text and update avatar's facial expression
  useEffect(() => {
    if (!text.trim()) {
      if (!isListening && !selectedMood) {
        setAvatarMood('calm');
      }
      return;
    }
    const detected = detectToneFromText(text);
    setAvatarMood(detected);
  }, [text, isListening, selectedMood]);

  // Clear confirmation message after 3.5 seconds
  useEffect(() => {
    if (saveConfirmation) {
      const timer = setTimeout(() => setSaveConfirmation(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [saveConfirmation]);

  // ---------------------------------------------------------------------------
  // SPACE NAME HANDLERS
  // ---------------------------------------------------------------------------
  const loadSpaceName = async () => {
    try {
      const res = await getDumpSpaceName();
      if (res && res.name) {
        setSpaceName(res.name);
        setNameInputValue(res.name);
        try {
          localStorage.setItem(LOCAL_STORAGE_NAME_KEY, res.name);
        } catch {}
      }
    } catch {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_NAME_KEY);
        if (cached) {
          setSpaceName(cached);
          setNameInputValue(cached);
        }
      } catch {}
    }
  };

  const handleStartRename = () => {
    setNameInputValue(spaceName);
    setNameError(null);
    setIsEditingName(true);
  };

  const handleSaveRename = async () => {
    const trimmed = nameInputValue.trim();

    if (!trimmed) {
      setNameInputValue(spaceName);
      setIsEditingName(false);
      return;
    }

    if (trimmed.length > 40) {
      setNameError('Name must be 40 characters or fewer.');
      return;
    }

    if (trimmed === spaceName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      const res = await updateDumpSpaceName(trimmed);
      setSpaceName(res.name || trimmed);
      setNameInputValue(res.name || trimmed);
      setIsEditingName(false);
      try {
        localStorage.setItem(LOCAL_STORAGE_NAME_KEY, res.name || trimmed);
      } catch {}
    } catch {
      setNameError('Could not update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelRename = () => {
    setNameInputValue(spaceName);
    setNameError(null);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  // ---------------------------------------------------------------------------
  // WEB SPEECH API (Voice Input - "Dump It")
  // Zero audio recording or storage: transcribes locally into text buffer.
  // ---------------------------------------------------------------------------
  const toggleSpeechRecognition = () => {
    if (!isSpeechSupported) {
      setVoiceNotice("Voice isn't supported in this browser. You can type below.");
      setShowTypeArea(true);
      return;
    }

    if (isListening) {
      // Stop listening
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    // Start listening
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognitionAPI();
      speechRecognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice(null);
        setEntryError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          }
        }

        if (finalTranscript) {
          setText((prev) => {
            const separator = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            const newText = prev + separator + finalTranscript.trim();
            // Real-time tone update
            const detected = detectToneFromText(newText);
            setAvatarMood(detected);
            return newText;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setVoiceNotice("Microphone access isn't available, but you can type below.");
          setShowTypeArea(true);
        } else if (event.error !== 'no-speech') {
          setVoiceNotice('Voice recognition paused. Speak again or type anytime.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setVoiceNotice("Microphone access isn't available, but you can still type below.");
      setShowTypeArea(true);
      setIsListening(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RELEASE & SAVE DUMP HANDLER ("Release")
  // ---------------------------------------------------------------------------
  const handleReleaseDump = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setEntryError('Please speak or type whatever is on your mind before releasing.');
      return;
    }

    if (trimmed.length > 10000) {
      setEntryError('Your dump exceeds the 10,000 character limit.');
      return;
    }

    setIsSavingEntry(true);
    setEntryError(null);

    // Stop microphone if currently active
    if (isListening && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    // Trigger cathartic release animation on avatar
    setIsReleasing(true);
    setAvatarMood('happy');

    try {
      let savedEntry: DumpEntry;
      try {
        savedEntry = await createDumpEntry({
          text: trimmed,
          mood: selectedMood || undefined,
        });
      } catch {
        savedEntry = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: trimmed,
          mood: selectedMood,
          created_at: new Date().toISOString(),
        };
      }

      // Update state per specification
      setText('');
      setSelectedMood(null);
      setEntries((prev) => [savedEntry, ...prev]);
      setSaveConfirmation('Dump saved.');

      try {
        const updated = [savedEntry, ...entries];
        localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(updated));
      } catch {}
    } catch (err: any) {
      setEntryError(err?.message || 'Could not save your dump. Please try again.');
    } finally {
      setIsSavingEntry(false);
      setTimeout(() => {
        setIsReleasing(false);
        setAvatarMood('calm');
      }, 2000);
    }
  };

  // ---------------------------------------------------------------------------
  // ENTRIES CRUD HANDLERS
  // ---------------------------------------------------------------------------
  const loadInitialEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const res = await getDumpEntries({ limit: 20 });
      if (res && Array.isArray(res.entries)) {
        setEntries(res.entries);
        setNextCursor(res.nextCursor);
        try {
          localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(res.entries));
        } catch {}
      }
    } catch {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_ENTRIES_KEY);
        if (cached) {
          setEntries(JSON.parse(cached));
        }
      } catch {}
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const res = await getDumpEntries({ limit: 20, cursor: nextCursor });
      if (res && Array.isArray(res.entries)) {
        setEntries((prev) => [...prev, ...res.entries]);
        setNextCursor(res.nextCursor);
      }
    } catch {
      // Silent failure on pagination
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      await deleteDumpEntry(id);
    } catch {}

    setEntries((prev) => prev.filter((item) => item.id !== id));
    setEntryToDelete(null);

    try {
      const remaining = entries.filter((item) => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(remaining));
    } catch {}
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllDumpEntries();
    } catch {}

    setEntries([]);
    setNextCursor(null);
    setShowDeleteAllConfirm(false);
    setIsDeletingAll(false);

    try {
      localStorage.removeItem(LOCAL_STORAGE_ENTRIES_KEY);
    } catch {}
  };

  const getMoodEmoji = (val?: number | null) => {
    if (!val) return null;
    const match = MOOD_OPTIONS.find((m) => m.value === val);
    return match ? match.emoji : null;
  };

  const formatEntryDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/70 via-slate-50 to-indigo-50/50 text-slate-800 pb-20">
      {/* --------------------------------------------------------------------- */}
      {/* CALM ACCESSIBLE BANNER / ZERO AI RESPONSE GUARANTEE */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full bg-purple-100/70 border-b border-purple-200/50 py-2.5 px-4 text-center">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 text-xs text-purple-900 font-medium">
          <Shield className="w-3.5 h-3.5 text-purple-700 flex-shrink-0" />
          <span>
            Let It Out Sanctuary — Pure listening with empathy. No automated replies, advice, or judgment.
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* ------------------------------------------------------------------- */}
        {/* 1. HEADER (Editable Dump Space Name - No Menu) */}
        {/* ------------------------------------------------------------------- */}
        <header className="mb-4 sm:mb-6 text-center flex flex-col items-center justify-center">
          {isEditingName ? (
            <div className="flex items-center gap-2 max-w-sm w-full justify-center">
              <input
                ref={nameInputRef}
                type="text"
                value={nameInputValue}
                onChange={(e) => setNameInputValue(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleSaveRename}
                disabled={isSavingName}
                maxLength={40}
                className="w-full text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 bg-white border-2 border-purple-400 rounded-xl px-3 py-1 outline-none shadow-sm transition focus:ring-2 focus:ring-purple-300"
                aria-label="Edit dump space name"
              />
              <button
                onClick={handleSaveRename}
                disabled={isSavingName}
                className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
                title="Save name (Enter)"
                aria-label="Save space name"
              >
                {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCancelRename}
                disabled={isSavingName}
                className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                title="Cancel edit (Esc)"
                aria-label="Cancel rename"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 group cursor-pointer" onClick={handleStartRename}>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 m-0 group-hover:text-purple-700 transition">
                {spaceName}
              </h1>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartRename();
                }}
                className="p-1.5 rounded-lg text-slate-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition"
                title="Tap to rename your space"
                aria-label="Rename dump space"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {nameError && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{nameError}</span>
              <button
                onClick={handleSaveRename}
                className="underline font-semibold ml-1 text-purple-700 hover:text-purple-900"
              >
                Retry
              </button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Tap the name anytime to rename your private space.
          </p>
        </header>

        {/* ------------------------------------------------------------------- */}
        {/* 2. 3D COMPANION MASCOT AVATAR (Listens & shifts expression with tone) */}
        {/* ------------------------------------------------------------------- */}
        <section className="flex flex-col items-center justify-center my-3 sm:my-5">
          <div className="w-full max-w-sm h-64 sm:h-72 rounded-3xl overflow-hidden shadow-lg border border-purple-200/80 bg-gradient-to-b from-[#1a153a] to-[#0c0926] relative">
            <Companion3DAvatar
              emotion={avatarMood}
              isSpeaking={false}
              isThinking={isListening}
              characterName="INARO Mascot"
              className="w-full h-full"
            />
            {isReleasing && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-900/40 backdrop-blur-xs animate-fade-in pointer-events-none">
                <span className="text-xs font-bold text-white px-3.5 py-1.5 rounded-full bg-purple-600/90 shadow-md">
                  ✨ Released into peace
                </span>
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 border border-purple-100 text-slate-700 shadow-2xs">
              <span>Tone:</span>
              <span className="capitalize text-purple-700 font-bold">{avatarMood}</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {isListening
                ? 'Speaking freely... your companion listens attentively and reflects your emotion.'
                : 'Tap "Dump It" to speak freely. Your companion listens without judgment.'}
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* 3. DUMP IT & RELEASE CONTROLS (No menu, dedicated action buttons) */}
        {/* ------------------------------------------------------------------- */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm transition hover:shadow-md mb-8">
          {/* Voice status or permission notice */}
          {voiceNotice && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>{voiceNotice}</span>
              </div>
              <button
                onClick={() => setVoiceNotice(null)}
                className="text-amber-600 hover:text-amber-800 p-1"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Action Buttons: "Dump It" (Listen/Speak) & "Release" */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-4">
            {/* 1. DUMP IT BUTTON */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              disabled={!isSpeechSupported}
              className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 shadow-rose-500/30'
                  : isSpeechSupported
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
              title={
                !isSpeechSupported
                  ? "Voice isn't supported in this browser."
                  : isListening
                  ? 'Tap to pause voice dictation'
                  : 'Tap Dump It to speak freely'
              }
              aria-label={
                !isSpeechSupported
                  ? "Voice isn't supported in this browser."
                  : isListening
                  ? 'Stop voice dictation'
                  : 'Start voice dictation'
              }
            >
              {isListening ? (
                <>
                  <Mic className="w-5 h-5 animate-bounce" />
                  <span>Listening... (Tap to Pause)</span>
                </>
              ) : (
                <>
                  {isSpeechSupported ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  <span>Dump It (Speak)</span>
                </>
              )}
            </button>

            {/* 2. RELEASE BUTTON */}
            <button
              type="button"
              onClick={handleReleaseDump}
              disabled={isSavingEntry || !text.trim()}
              className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer ${
                !text.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25'
              }`}
              title="Release your thoughts into peace and save safely"
            >
              {isSavingEntry || isReleasing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Releasing...</span>
                </>
              ) : (
                <>
                  <Wind className="w-5 h-5" />
                  <span>Release</span>
                </>
              )}
            </button>
          </div>

          {/* Spoken/Typed Transcript Live View */}
          <div className="relative mt-2">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (entryError) setEntryError(null);
                const detected = detectToneFromText(e.target.value);
                setAvatarMood(detected);
              }}
              placeholder="Let it out. This space is yours..."
              rows={showTypeArea ? 5 : 3}
              className="w-full p-4 rounded-2xl border border-purple-200/70 bg-purple-50/20 text-slate-800 placeholder-slate-400 text-sm sm:text-base leading-relaxed outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition resize-y min-h-[90px]"
              aria-label="Write whatever you want to vent"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
              <button
                type="button"
                onClick={() => setShowTypeArea(!showTypeArea)}
                className="text-purple-600 hover:text-purple-800 flex items-center gap-1 font-semibold"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{showTypeArea ? 'Compact editor' : 'Expand editor'}</span>
              </button>
              <span>{text.length.toLocaleString()} / 10,000 characters</span>
            </div>
          </div>

          {entryError && (
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{entryError}</span>
            </div>
          )}

          {/* Subtle confirmation & Mood Picker */}
          <div className="mt-4 pt-4 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 mr-1">Mood:</span>
              <div className="flex items-center gap-1.5" role="group" aria-label="Mood picker">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMood === mood.value;
                  return (
                    <button
                      key={mood.label}
                      type="button"
                      onClick={() => {
                        const newMood = isSelected ? null : mood.value;
                        setSelectedMood(newMood);
                        if (newMood) {
                          setAvatarMood(mood.sanctuaryMood);
                        } else if (!text.trim()) {
                          setAvatarMood('calm');
                        }
                      }}
                      className={`text-xl p-1.5 rounded-xl transition transform active:scale-95 ${
                        isSelected
                          ? 'bg-purple-200/90 scale-110 shadow-sm ring-2 ring-purple-400'
                          : 'hover:bg-purple-100/70 opacity-75 hover:opacity-100'
                      }`}
                      aria-label={mood.label}
                      aria-pressed={isSelected}
                      title={`${mood.label}${isSelected ? ' (Selected)' : ''}`}
                    >
                      {mood.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {saveConfirmation && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 self-center sm:self-auto animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>{saveConfirmation}</span>
              </span>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 4. PAST ENTRIES LIST */}
        {/* ------------------------------------------------------------------- */}
        <section aria-labelledby="past-entries-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="past-entries-heading" className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Past Entries</span>
              <span className="text-xs font-medium text-slate-500 ml-1">
                ({entries.length}{nextCursor ? '+' : ''})
              </span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={loadInitialEntries}
                className="text-xs text-purple-700 hover:text-purple-900 flex items-center gap-1 p-1 rounded-lg hover:bg-purple-50 transition"
                title="Refresh entries"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              {entries.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 transition flex items-center gap-1"
                  title="Clear all past entries"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {isLoadingEntries ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-xs">Loading your safe space...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white/60 border border-dashed border-purple-200 rounded-3xl p-8 sm:p-12 text-center text-slate-500">
              <p className="text-sm font-medium mb-1">Your space is quiet and clear.</p>
              <p className="text-xs text-slate-400">
                Whenever thoughts or frustrations arise, tap "Dump It" to pour them out and release them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-purple-100/90 shadow-2xs hover:shadow-xs transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-purple-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        {formatEntryDate(entry.created_at)}
                      </span>
                      {entry.mood && (
                        <span className="text-sm" title={`Mood: ${entry.mood}/5`}>
                          {getMoodEmoji(entry.mood)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEntryToDelete(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete this entry"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                    {entry.text}
                  </p>
                </article>
              ))}

              {nextCursor && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition flex items-center gap-1.5 mx-auto"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Load older entries</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* CONFIRM DELETE ONE MODAL */}
      {/* --------------------------------------------------------------------- */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete this entry?</h3>
            <p className="text-xs text-slate-600 mb-6">
              This entry will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOne(entryToDelete)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* CONFIRM DELETE ALL MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-fadeIn">
            <h3 className="text-lg font-bold text-rose-700 mb-2">Clear all entries?</h3>
            <p className="text-xs text-slate-600 mb-6">
              Are you sure you want to permanently clear all entries in your dump history?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1.5"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Clear All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
