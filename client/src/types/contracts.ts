/**
 * INARO — Shared TypeScript Contracts
 * Directly mirrors docs/API_CONTRACTS.md
 * Shared across Client components and Integration tests
 */

export type EmotionLabel = "happy" | "sad" | "calm" | "concerned" | "surprised" | "neutral";
export type SafetySeverity = "GREEN" | "AMBER" | "RED";
export type SafetyEvaluationTier = "STANDARD_SUPPORT" | "MODERATE_SUPPORT" | "ELEVATED_SUPPORT";

export interface InferredEmotion {
  label: EmotionLabel;
  confidence: number;
  intensity?: number;
  source: string;
  model_version?: string;
}

export interface ConversationalSentiment {
  label: string;
  score: number;
}

export interface AvatarVisualHints {
  recommended_expression: EmotionLabel;
  audio_duration_ms?: number;
  visemes_stream_url?: string;
}

export interface SafetyAssessment {
  requires_intervention: boolean;
  severity_level: SafetySeverity;
  matched_triggers: string[];
}

export interface EmotionAnalysisResponse {
  interaction_id: string;
  timestamp: string;
  inferred_emotion: InferredEmotion;
  conversational_sentiment: ConversationalSentiment;
  avatar_visual_hints: AvatarVisualHints;
  safety_assessment: SafetyAssessment;
}

export interface RollingSafetyAssessment {
  window_start: string;
  window_end: string;
  total_days_evaluated: number;
  days_with_logs: number;
  missing_log_days: number;
  flagged_days_count: number;
  evaluation_tier: SafetyEvaluationTier;
  action_recommended: string;
  suggested_actions: string[];
  disclaimer: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  age: number;
  mobileNumber: string;
  isMobileVerified: boolean;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface VerifyResetOtpRequest {
  identifier: string;
  otpCode: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface HelplineResourceItem {
  id: string;
  category: "GOVERNMENT" | "CRISIS_COUNSELLING" | "STUDENT_SUPPORT";
  serviceName: string;
  phoneNumber: string;
  description: string;
  operatingHours: string;
  languages: string[];
  region: string;
  isVerified: boolean;
  dialerUri: string;
}

export interface DumpEntry {
  id: string;
  text: string;
  mood?: number | null;
  created_at: string;
}

export interface DumpEntriesResponse {
  entries: DumpEntry[];
  nextCursor: string | null;
}

export interface DumpSpaceNameResponse {
  name: string;
}

export interface DumpEntryItem {
  id: string;
  title: string;
  content: string;
  moodTag?: string;
  createdAt: string;
  updatedAt: string;
}
