import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DailyEntry, MoodType } from '../types/interactive';
import * as api from '../services/api';

interface DailyEntryContextType {
  dailyEntry: DailyEntry | null;
  isLoading: boolean;
  isModalOpen: boolean;
  toastMessage: string | null;
  openCheckInModal: () => void;
  closeCheckInModal: () => void;
  saveCheckIn: (sleepHours: number, mood: MoodType) => Promise<boolean>;
  clearToast: () => void;
  hasSubmittedToday: boolean;
}

const DailyEntryContext = createContext<DailyEntryContextType | undefined>(undefined);

const CHECKIN_LAST_ASKED_KEY = 'inaro_checkin_last_asked_date';
const CHECKIN_SUBMITTED_KEY = 'inaro_checkin_submitted_date';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// In-memory daily entry state strictly isolated from character personality state
export const DailyEntryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState<boolean>(false);

  const checkTodayEntry = useCallback(async () => {
    setIsLoading(true);
    const todayStr = getTodayDateString();

    let alreadyAskedToday = false;
    let alreadySubmittedToday = false;

    try {
      const lastAsked = localStorage.getItem(CHECKIN_LAST_ASKED_KEY);
      const lastSubmitted = localStorage.getItem(CHECKIN_SUBMITTED_KEY);
      alreadyAskedToday = lastAsked === todayStr;
      alreadySubmittedToday = lastSubmitted === todayStr;
    } catch {
      // LocalStorage not available or restricted in environment
    }

    try {
      const entry = await api.getDailyEntryToday();
      if (entry) {
        setDailyEntry(entry);
        setHasSubmittedToday(true);
        setIsModalOpen(false);
        try {
          localStorage.setItem(CHECKIN_SUBMITTED_KEY, todayStr);
          localStorage.setItem(CHECKIN_LAST_ASKED_KEY, todayStr);
        } catch {}
      } else {
        setDailyEntry(null);
        setHasSubmittedToday(alreadySubmittedToday);

        // ONLY prompt automatically once per day!
        if (alreadyAskedToday || alreadySubmittedToday) {
          setIsModalOpen(false);
        } else {
          setIsModalOpen(true);
          try {
            localStorage.setItem(CHECKIN_LAST_ASKED_KEY, todayStr);
          } catch {}
        }
      }
    } catch {
      // If network fails in demo mode, check if already prompted today
      setDailyEntry(null);
      setHasSubmittedToday(alreadySubmittedToday);

      if (alreadyAskedToday || alreadySubmittedToday) {
        setIsModalOpen(false);
      } else {
        setIsModalOpen(true);
        try {
          localStorage.setItem(CHECKIN_LAST_ASKED_KEY, todayStr);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkTodayEntry();
  }, [checkTodayEntry]);

  const openCheckInModal = () => setIsModalOpen(true);
  const closeCheckInModal = () => {
    setIsModalOpen(false);
    try {
      localStorage.setItem(CHECKIN_LAST_ASKED_KEY, getTodayDateString());
    } catch {}
  };
  const clearToast = () => setToastMessage(null);

  const saveCheckIn = async (sleepHours: number, mood: MoodType): Promise<boolean> => {
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      let savedEntry: DailyEntry;

      if (dailyEntry && (dailyEntry.id || hasSubmittedToday)) {
        // Allow editing via PUT (never create a duplicate entry)
        try {
          savedEntry = await api.updateDailyEntry({ sleepHours, mood });
        } catch {
          // Fallback if backend route not running
          savedEntry = {
            id: dailyEntry.id || 'entry_today',
            date: todayStr,
            sleepHours,
            mood,
            updatedAt: new Date().toISOString(),
          };
        }
        setToastMessage('Check-in updated successfully!');
      } else {
        // Submit with POST
        try {
          savedEntry = await api.createDailyEntry({ sleepHours, mood });
        } catch {
          // Fallback if backend route not running
          savedEntry = {
            id: 'entry_today',
            date: todayStr,
            sleepHours,
            mood,
            createdAt: new Date().toISOString(),
          };
        }
        setToastMessage('Daily check-in saved! Your reflection has been recorded.');
      }

      // Store mood only in daily-entry state. Never connect it to character personality state.
      setDailyEntry(savedEntry);
      setHasSubmittedToday(true);
      setIsModalOpen(false);
      try {
        localStorage.setItem(CHECKIN_SUBMITTED_KEY, todayStr);
        localStorage.setItem(CHECKIN_LAST_ASKED_KEY, todayStr);
      } catch {}

      // Auto clear toast after 4 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);

      return true;
    } catch (err) {
      setToastMessage('Could not save check-in. Please try again.');
      return false;
    }
  };

  return (
    <DailyEntryContext.Provider
      value={{
        dailyEntry,
        isLoading,
        isModalOpen,
        toastMessage,
        openCheckInModal,
        closeCheckInModal,
        saveCheckIn,
        clearToast,
        hasSubmittedToday,
      }}
    >
      {children}
    </DailyEntryContext.Provider>
  );
};

export const useDailyEntry = (): DailyEntryContextType => {
  const context = useContext(DailyEntryContext);
  if (!context) {
    throw new Error('useDailyEntry must be used within a DailyEntryProvider');
  }
  return context;
};
