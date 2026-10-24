import { SanctuaryMood } from '../components/avatar/SanctuaryAvatar';

/**
 * Real-Time Tone and Emotion Analyzer
 * Evaluates both live audio pitch/RMS energy and spoken lexical text
 * to determine user mood without storing audio or violating privacy.
 */

// Lexical keywords dictionary
const MOOD_KEYWORDS: Record<SanctuaryMood, RegExp[]> = {
  sad: [
    /\b(sad|cry|crying|tears|unhappy|lonely|hurt|heartbroken|grief|miss|hopeless|depressed|down|empty|heavy|exhausted|tired of everything)\b/i,
  ],
  angry: [
    /\b(angry|mad|furious|hate|pissed|rage|screaming|annoyed|frustrated|irritated|unfair|cheated|liar|idiot|stupid|done with this)\b/i,
  ],
  anxious: [
    /\b(anxious|scared|panic|panicking|nervous|afraid|terrified|stressed|stress|overwhelmed|pressure|shaking|can't breathe|worry|worried)\b/i,
  ],
  happy: [
    /\b(happy|glad|joy|excited|yay|great|awesome|wonderful|grateful|proud|smiling|love|relief|relieved|better now)\b/i,
  ],
  calm: [
    /\b(calm|peaceful|quiet|relaxed|breathing|settled|serene|tranquil|okay now|at ease)\b/i,
  ],
  neutral: [],
};

export function detectToneFromText(text: string): SanctuaryMood {
  if (!text || !text.trim()) {
    return 'neutral';
  }

  const lower = text.toLowerCase();

  // Score each mood
  const scores: Record<SanctuaryMood, number> = {
    sad: 0,
    angry: 0,
    anxious: 0,
    happy: 0,
    calm: 0,
    neutral: 0.1, // baseline
  };

  for (const [moodKey, patterns] of Object.entries(MOOD_KEYWORDS)) {
    const mood = moodKey as SanctuaryMood;
    for (const pat of patterns) {
      const matches = lower.match(pat);
      if (matches) {
        scores[mood] += matches.length * 2;
      }
    }
  }

  // Find mood with highest score
  let bestMood: SanctuaryMood = 'neutral';
  let maxScore = 0.5;

  for (const [mood, score] of Object.entries(scores) as [SanctuaryMood, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestMood = mood;
    }
  }

  return bestMood;
}

export function detectToneFromAcoustics(
  pitch: number, // in Hz
  volumeRms: number // 0 to 1
): SanctuaryMood {
  // High volume + high pitch variance -> agitated / angry
  if (volumeRms > 0.35 && pitch > 240) {
    return 'angry';
  }

  // High pitch + trembling -> anxious
  if (pitch > 260 && volumeRms < 0.25) {
    return 'anxious';
  }

  // Low pitch + low volume -> sad / down
  if (pitch > 0 && pitch < 140 && volumeRms < 0.15) {
    return 'sad';
  }

  // Moderate steady pitch + soft volume -> calm
  if (pitch > 140 && pitch < 210 && volumeRms < 0.18) {
    return 'calm';
  }

  return 'neutral';
}
