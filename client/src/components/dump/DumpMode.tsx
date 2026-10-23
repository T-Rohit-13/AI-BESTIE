import React, { useState, useEffect, useRef } from 'react';
import { DumpEntry, MOOD_OPTIONS } from './types';
import { dumpApi } from './dumpApi';
import './DumpMode.css';

// Type definitions for browser SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: any) => any) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

/**
 * Format timestamp into calm, human-friendly string (e.g. "Today · 9:42 PM")
 */
function formatEntryDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) {
      return `Today · ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday · ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr} · ${timeStr}`;
  } catch {
    return "Recently";
  }
}

export const DumpMode: React.FC = () => {
  // --- Header / Space Name State ---
  const [spaceName, setSpaceName] = useState<string>("My Dump");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleInputValue, setTitleInputValue] = useState<string>("My Dump");
  const [isSavingTitle, setIsSavingTitle] = useState<boolean>(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // --- Writing Area State ---
  const [dumpText, setDumpText] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const [isSavingDump, setIsSavingDump] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);


  // --- Voice Input (Web Speech API) State ---
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  // --- Past Entries State ---
  const [entries, setEntries] = useState<DumpEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

  // --- Delete Confirmation State ---
  const [entryToDelete, setEntryToDelete] = useState<DumpEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // =========================================================================
  // 1. Initial Load: Space Name & Past Entries
  // =========================================================================
  const loadInitialData = async () => {
    setIsLoadingEntries(true);
    setEntriesError(null);

    try {
      const [name, pastEntries] = await Promise.all([
        dumpApi.getSpaceName().catch(() => "My Dump"),
        dumpApi.getEntries()
      ]);
      setSpaceName(name);
      setTitleInputValue(name);
      setEntries(pastEntries);
    } catch {
      setEntriesError("We couldn't load your entries.");
    } finally {
      setIsLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // =========================================================================
  // 2. Web Speech API Initialization (Voice Input)
  // Privacy Guarantee: Only the transcribed text is captured in state.
  // Audio is NEVER recorded, stored, or sent to any server.
  // =========================================================================
  useEffect(() => {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechClass) {
      setIsSpeechSupported(false);
      return;
    }

    try {
      const recognizer = new SpeechClass();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      // Live transcript handling: append transcribed words directly into text area
      recognizer.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }

        if (finalTranscript) {
          setDumpText(prev => {
            const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + finalTranscript.trim();
          });
        }
      };

      recognizer.onerror = (err: any) => {
        if (err.error === 'not-allowed' || err.error === 'permission-denied') {
          setSpeechNotice("Microphone access isn't available, but you can still type your dump.");
        } else if (err.error !== 'no-speech') {
          setSpeechNotice("Voice recognition encountered an issue. You can continue typing.");
        }
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    } catch {
      setIsSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!isSpeechSupported) return;
    setSpeechNotice(null);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // =========================================================================
  // 3. Header Space Name Editing
  // =========================================================================
  const handleStartRename = () => {
    setTitleInputValue(spaceName);
    setIsEditingTitle(true);
    setTitleError(null);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
  };

  const handleSaveRename = async () => {
    const trimmed = titleInputValue.trim();
    setIsEditingTitle(false);

    // If empty or identical, keep previous
    if (!trimmed || trimmed === spaceName) {
      setTitleInputValue(spaceName);
      return;
    }

    setIsSavingTitle(true);
    setTitleError(null);

    try {
      const updated = await dumpApi.updateSpaceName(trimmed);
      setSpaceName(updated);
      setTitleInputValue(updated);
    } catch {
      setTitleInputValue(spaceName);
      setTitleError("Couldn't save space name.");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingTitle(false);
      setTitleInputValue(spaceName);
      setTitleError(null);
    }
  };

  // =========================================================================
  // 4. Mood Selection
  // =========================================================================
  const handleSelectMood = (emoji: string) => {
    // Tapping selected mood toggles it off
    setSelectedMood(prev => (prev === emoji ? undefined : emoji));
  };

  // =========================================================================
  // 5. Save Dump Entry
  // =========================================================================
  const handleSaveDump = async () => {
    const trimmed = dumpText.trim();
    if (!trimmed || isSavingDump) return;

    // Stop listening if speech recognition was still active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setIsSavingDump(true);
    setSaveError(null);

    try {
      const newEntry = await dumpApi.createEntry({
        text: trimmed,
        mood: selectedMood
      });

      // Clear editor inputs
      setDumpText("");
      setSelectedMood(undefined);

      // Prepend to past entries list (newest first)
      setEntries(prev => [newEntry, ...prev]);

      // Subtle confirmation notice (auto-dismiss)
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    } catch {
      setSaveError("Couldn't save your dump. Please try again.");
    } finally {
      setIsSavingDump(false);
    }
  };

  // =========================================================================
  // 6. Expand / Collapse Past Entry
  // =========================================================================
  const toggleExpandEntry = (id: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // =========================================================================
  // 7. Delete Entry Flow with Accessible Confirmation
  // =========================================================================
  const handlePromptDelete = (e: React.MouseEvent, entry: DumpEntry) => {
    e.stopPropagation(); // Avoid triggering expand/collapse
    setDeleteError(null);
    setEntryToDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await dumpApi.deleteEntry(entryToDelete.id);
      setEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch {
      setDeleteError("Couldn't delete this entry. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setEntryToDelete(null);
    setDeleteError(null);
  };

  return (
    <main className="dump-container" aria-label="Dump Mode Screen">
      {/* ---------------- 1. HEADER ---------------- */}
      <header className="dump-header">
        <div className="dump-header-top-row">
          <span className="dump-category-pill">✦ MINDFUL UNGUIDED SPACE</span>
          <span className="dump-handwritten-note">Better Days Ahead ♡</span>
        </div>

        <div className="dump-title-row">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              className="dump-title-input"
              value={titleInputValue}
              onChange={e => setTitleInputValue(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={handleTitleKeyDown}
              maxLength={40}
              aria-label="Dump space name input"
            />
          ) : (
            <button
              type="button"
              className="dump-title-button"
              onClick={handleStartRename}
              title="Click to rename your dump space"
              aria-label={`Dump space name: ${spaceName}. Tap to rename`}
            >
              <span>{spaceName}</span>
              <span className="dump-title-edit-icon" aria-hidden="true">✎</span>
            </button>
          )}

          {isSavingTitle && (
            <span className="dump-header-status" role="status">
              <span className="dump-spinner" /> Saving...
            </span>
          )}
        </div>

        <p className="dump-header-tagline">
          A private, non-clinical sanctuary built for your daily emotional peace. Express your thoughts freely without judgment.
        </p>

        {titleError && (
          <div className="calm-notice error" role="alert">
            <span>{titleError}</span>
            <button
              type="button"
              className="calm-notice-btn"
              onClick={handleStartRename}
            >
              Retry
            </button>
          </div>
        )}
      </header>

      {/* ---------------- 2. ENTRY BOX & VOICE INPUT ---------------- */}
      <section className="dump-editor-card" aria-label="Write a new dump">
        <div className="dump-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="dump-textarea"
            placeholder="What happened today?"
            value={dumpText}
            onChange={e => setDumpText(e.target.value)}
            rows={5}
            aria-label="What happened today? Let it out in your private dump space."
          />
        </div>

        {/* Voice Input Toolbar */}
        <div className="dump-voice-bar">
          <div className="dump-mic-group">
            <button
              type="button"
              className={`dump-mic-button ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceInput}
              disabled={!isSpeechSupported}
              aria-label={
                !isSpeechSupported
                  ? "Voice isn't supported in this browser."
                  : isListening
                  ? "Stop speech recognition"
                  : "Start speech recognition"
              }
              title={
                !isSpeechSupported
                  ? "Voice isn't supported in this browser."
                  : isListening
                  ? "Listening... Tap to stop"
                  : "Tap to speak your dump"
              }
            >
              🎤
            </button>

            {isListening && (
              <span className="dump-listening-indicator" aria-live="polite">
                <span className="dump-listening-dot" />
                Listening...
              </span>
            )}

            {!isSpeechSupported && (
              <span className="dump-voice-tooltip">
                Voice isn't supported in this browser.
              </span>
            )}
          </div>
        </div>

        {/* Friendly speech notice / permission warning */}
        {speechNotice && (
          <div className="calm-notice" role="alert">
            <span>{speechNotice}</span>
            <button
              type="button"
              className="calm-notice-btn"
              onClick={() => setSpeechNotice(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ---------------- 3 & 4. MOOD PICKER & SAVE BUTTON ---------------- */}
        <div className="dump-editor-footer">
          <div
            className="dump-mood-picker"
            role="group"
            aria-label="Select optional mood"
          >
            {MOOD_OPTIONS.map(mood => (
              <button
                key={mood.label}
                type="button"
                className={`dump-mood-btn ${selectedMood === mood.emoji ? 'selected' : ''}`}
                onClick={() => handleSelectMood(mood.emoji)}
                aria-label={mood.ariaLabel}
                aria-pressed={selectedMood === mood.emoji}
                title={mood.label}
              >
                {mood.emoji}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="dump-save-btn"
            onClick={handleSaveDump}
            disabled={!dumpText.trim() || isSavingDump}
            aria-label="Save Dump"
          >
            {isSavingDump ? (
              <>
                <span className="dump-spinner" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Dump"
            )}
          </button>
        </div>
      </section>

      {/* Subtle feedback messages */}
      {saveSuccessNotice && (
        <div className="calm-notice success" role="status" aria-live="polite">
          <span>Dump saved.</span>
        </div>
      )}

      {saveError && (
        <div className="calm-notice error" role="alert">
          <span>{saveError}</span>
          <button
            type="button"
            className="calm-notice-btn"
            onClick={handleSaveDump}
          >
            Retry
          </button>
        </div>
      )}

      {/* ---------------- 5. PAST ENTRIES ---------------- */}
      <section className="dump-entries-section" aria-label="Past Entries">
        <div className="dump-entries-header">
          <div className="dump-entries-title-group">
            <h2 className="dump-entries-title">Past Entries</h2>
            {!isLoadingEntries && entries.length > 0 && (
              <span className="dump-entries-count">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          <span className="dump-handwritten-note">You got this ♡</span>
        </div>


        {/* Loading State */}
        {isLoadingEntries && (
          <div className="dump-empty-state" role="status">
            <span className="dump-spinner" style={{ width: '2rem', height: '2rem' }} />
            <p className="dump-empty-text">Loading your entries...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingEntries && entriesError && (
          <div className="calm-notice error" role="alert">
            <span>{entriesError}</span>
            <button
              type="button"
              className="calm-notice-btn"
              onClick={loadInitialData}
            >
              Retry
            </button>
          </div>
        )}

        {/* ---------------- 7. EMPTY STATE ---------------- */}
        {!isLoadingEntries && !entriesError && entries.length === 0 && (
          <div className="dump-empty-state">
            <div className="dump-empty-icon" aria-hidden="true">🍃</div>
            <h3 className="dump-empty-title">Nothing here yet.</h3>
            <p className="dump-empty-text">
              Whatever's on your mind, this space is yours.
            </p>
          </div>
        )}

        {/* ---------------- Entry List ---------------- */}
        {!isLoadingEntries && entries.length > 0 && (
          <div className="dump-entry-list">
            {entries.map(entry => {
              const isExpanded = expandedEntryIds.has(entry.id);

              return (
                <article
                  key={entry.id}
                  className="dump-entry-card"
                  onClick={() => toggleExpandEntry(entry.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpandEntry(entry.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`Dump from ${formatEntryDate(entry.createdAt)}. Tap to ${isExpanded ? 'collapse' : 'expand'}.`}
                >
                  <div className="dump-entry-header">
                    <div className="dump-entry-meta">
                      <time dateTime={entry.createdAt}>
                        {formatEntryDate(entry.createdAt)}
                      </time>
                      {entry.mood && (
                        <span className="dump-entry-mood" aria-hidden="true">
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    <div className="dump-entry-actions">
                      <button
                        type="button"
                        className="dump-delete-btn"
                        onClick={e => handlePromptDelete(e, entry)}
                        aria-label="Delete this entry"
                        title="Delete this entry"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  <p className={`dump-entry-text ${isExpanded ? '' : 'truncated'}`}>
                    {entry.text}
                  </p>

                  <span className="dump-entry-expand-hint" aria-hidden="true">
                    {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- 6. DELETE CONFIRMATION MODAL ---------------- */}
      {entryToDelete && (
        <div
          className="dump-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={handleCancelDelete}
        >
          <div
            className="dump-modal-dialog"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape') handleCancelDelete();
            }}
          >
            <div className="dump-modal-header">
              <h3 id="delete-dialog-title">Delete this entry?</h3>
            </div>

            <div className="dump-modal-body">
              <p>This can't be undone.</p>
              {deleteError && (
                <div className="calm-notice error" style={{ marginTop: '0.75rem' }} role="alert">
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="dump-modal-actions">
              <button
                type="button"
                className="dump-btn-secondary"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="dump-btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="dump-spinner" /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DumpMode;

