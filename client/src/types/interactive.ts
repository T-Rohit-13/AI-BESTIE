/**
 * INARO — Interactive Mode TypeScript Definitions
 * Adheres strictly to docs/API_CONTRACTS.md and TEAM_RULES.md
 */

import { EmotionLabel, HelplineResourceItem } from './contracts';

export type MoodType = 'Happy' | 'Sad' | 'Normal' | 'Stressed' | 'Anxious' | 'Other';

export interface DailyEntry {
  id?: string;
  date: string; // YYYY-MM-DD
  sleepHours: number; // 0 - 24, step 0.5
  mood: MoodType;
  createdAt?: string;
  updatedAt?: string;
}

export type PersonalityPreset =
  | 'Friendly companion'
  | 'Mature and understanding companion'
  | 'Gossip partner'
  | 'Funny and humorous'
  | 'Sarcastic'
  | 'Custom';

export interface Character {
  id: string;
  name: string;
  personalityPreset: PersonalityPreset;
  personalityDescription?: string;
  avatarInitial: string;
  avatarColor?: string;
  avatarStyle?: string;
  systemPrompt?: string;
  toneDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharacterFormData {
  name: string;
  personalityPreset: PersonalityPreset;
  personalityDescription?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  characterId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  audioUrl?: string;
  audioDuration?: number; // in seconds
  transcript?: string;
  status: MessageStatus;
  errorMessage?: string;
  emotion?: EmotionLabel;
}

export type SupportLevel = 'none' | 'four_days' | 'above_four_days';

export interface SupportStatusResponse {
  level: SupportLevel;
  evaluationTier?: 'STANDARD_SUPPORT' | 'MODERATE_SUPPORT' | 'ELEVATED_SUPPORT';
  message?: string;
  flaggedDaysCount?: number;
  totalDaysEvaluated?: number;
  disclaimer?: string;
}

export interface TrustedContact {
  id?: string;
  name: string;
  phoneNumber: string;
  consentGiven: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}
