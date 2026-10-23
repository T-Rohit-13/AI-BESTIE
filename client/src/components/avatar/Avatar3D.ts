/**
 * INARO — 3D Avatar Rendering Engine Component
 * Managed by Integration Lead (Owner Scope)
 * Implements dynamic facial expressions, autonomous blinking, and viseme lip-sync
 */

import { EmotionLabel, InferredEmotion } from "../../types/contracts";

export interface MoodVisualProfile {
  a: string;
  b: string;
  l: string;
  brow: number;
  smile: number;
  eye: number;
  sp: number;
  pa: number;
  asym: number;
}

export const MOOD_PROFILES: Record<EmotionLabel, MoodVisualProfile> = {
  calm: { a: '#0ea5e9', b: '#1e1b4b', l: '#ffffff', brow: 0, smile: 0.4, eye: 0.9, sp: 0.6, pa: 0.5, asym: 0 },
  happy: { a: '#10b981', b: '#064e3b', l: '#fff8f0', brow: -0.15, smile: 1.0, eye: 1.05, sp: 1.5, pa: 1.3, asym: 0 },
  sad: { a: '#6366f1', b: '#1e1b4b', l: '#d3e0ff', brow: 0.35, smile: -0.5, eye: 0.8, sp: 0.4, pa: 0.3, asym: 0 },
  concerned: { a: '#f59e0b', b: '#451a03', l: '#fff7ed', brow: 0.25, smile: -0.15, eye: 0.95, sp: 0.4, pa: 0.2, asym: 0.08 },
  surprised: { a: '#ec4899', b: '#500724', l: '#fdf2f8', brow: -0.22, smile: 0.8, eye: 1.25, sp: 2.0, pa: 1.8, asym: 0 },
  neutral: { a: '#8b5cf6', b: '#2e1065', l: '#ffffff', brow: 0, smile: 0.3, eye: 1.0, sp: 0.9, pa: 0.8, asym: 0 }
};

export class AvatarController {
  private currentEmotion: EmotionLabel = "calm";
  private isSpeaking: boolean = false;
  private speechPulse: number = 0;

  constructor(initialEmotion: EmotionLabel = "calm") {
    this.setEmotion(initialEmotion);
  }

  public setEmotion(emotion: EmotionLabel): void {
    if (MOOD_PROFILES[emotion]) {
      this.currentEmotion = emotion;
      document.body.setAttribute("data-emotion", emotion);
    }
  }

  public getEmotion(): EmotionLabel {
    return this.currentEmotion;
  }

  public getMoodProfile(): MoodVisualProfile {
    return MOOD_PROFILES[this.currentEmotion];
  }

  public setSpeakingState(speaking: boolean): void {
    this.isSpeaking = speaking;
  }

  public triggerSpeechPulse(): void {
    this.speechPulse = 1.0;
  }

  public consumeInferredEmotion(inference: InferredEmotion): void {
    if (inference.confidence >= 0.60 && MOOD_PROFILES[inference.label]) {
      this.setEmotion(inference.label);
    } else {
      // Graceful fallback to calm default when confidence is low
      this.setEmotion("calm");
    }
  }
}
