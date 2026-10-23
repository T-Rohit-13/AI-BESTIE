/**
 * Dump Mode Data Models & Types
 * Dedicated private space for unguided expression
 */

export interface DumpEntry {
  id: string;
  text: string;
  mood?: string;
  createdAt: string; // ISO string
}

export interface DumpSpaceData {
  name: string;
}

export interface MoodOption {
  emoji: string;
  label: string;
  ariaLabel: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { emoji: "😄", label: "Happy", ariaLabel: "Happy" },
  { emoji: "🙂", label: "Okay", ariaLabel: "Okay" },
  { emoji: "😐", label: "Neutral", ariaLabel: "Neutral" },
  { emoji: "😔", label: "Sad", ariaLabel: "Sad" },
  { emoji: "😡", label: "Angry", ariaLabel: "Angry" },
  { emoji: "😴", label: "Tired", ariaLabel: "Tired" }
];
