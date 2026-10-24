import fs from 'fs';
import path from 'path';

export interface ToneAnalysisResult {
  tone: string;
  mood: string;
  confidence: number;
  valence: number;
  arousal: number;
  avatarParameters: {
    brow: number;
    smile: number;
    eye: number;
    auraColor: string;
    expression: string;
  };
}

const AVATAR_CONFIGS: Record<string, any> = {
  calm: {
    brow: 0.0,
    smile: 0.25,
    eye: 0.35,
    auraColor: 'rgba(168, 85, 247, 0.25)',
    expression: 'calm',
    valence: 0.3,
    arousal: 0.2,
  },
  sad: {
    brow: -0.6,
    smile: -0.2,
    eye: 0.75,
    auraColor: 'rgba(96, 165, 250, 0.35)',
    expression: 'sad',
    valence: -0.7,
    arousal: 0.35,
  },
  angry: {
    brow: 0.5,
    smile: 0.1,
    eye: 0.85,
    auraColor: 'rgba(52, 211, 153, 0.35)',
    expression: 'angry',
    valence: -0.6,
    arousal: 0.85,
  },
  anxious: {
    brow: -0.3,
    smile: 0.0,
    eye: 0.9,
    auraColor: 'rgba(45, 212, 191, 0.35)',
    expression: 'anxious',
    valence: -0.5,
    arousal: 0.7,
  },
  happy: {
    brow: 0.1,
    smile: 0.7,
    eye: 0.8,
    auraColor: 'rgba(251, 146, 60, 0.35)',
    expression: 'happy',
    valence: 0.85,
    arousal: 0.75,
  },
  neutral: {
    brow: 0.0,
    smile: 0.2,
    eye: 0.65,
    auraColor: 'rgba(192, 132, 252, 0.2)',
    expression: 'neutral',
    valence: 0.0,
    arousal: 0.3,
  },
};

export class ToneAnalyzerEngine {
  private modelData: any = null;

  constructor() {
    this.loadCheckpoint();
  }

  private loadCheckpoint() {
    try {
      const checkpointPath = path.resolve(
        __dirname,
        '../../../../ml-service/models/checkpoints/tone_classifier.json'
      );
      if (fs.existsSync(checkpointPath)) {
        const raw = fs.readFileSync(checkpointPath, 'utf8');
        this.modelData = JSON.parse(raw);
      }
    } catch {
      // Fallback to lexical heuristics
    }
  }

  private tokenize(text: string): string[] {
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    return cleaned.split(/\s+/).filter((w) => w.length > 1);
  }

  analyze(text: string, audioFeatures?: { pitch?: number; rms?: number }): ToneAnalysisResult {
    if (!text || !text.trim()) {
      const cfg = AVATAR_CONFIGS.neutral;
      return {
        tone: 'neutral',
        mood: 'neutral',
        confidence: 1.0,
        valence: cfg.valence,
        arousal: cfg.arousal,
        avatarParameters: cfg,
      };
    }

    let topTone = 'neutral';
    let confidence = 0.5;

    if (this.modelData && this.modelData.classes) {
      const classes: string[] = this.modelData.classes;
      const priors: Record<string, number> = this.modelData.class_priors;
      const wordProbs: Record<string, Record<string, number>> = this.modelData.word_probs;
      const tokens = this.tokenize(text);

      const logScores: Record<string, number> = {};

      for (const c of classes) {
        let score = Math.log(priors[c] || 1e-5);
        for (const token of tokens) {
          if (wordProbs[c] && wordProbs[c][token]) {
            score += Math.log(wordProbs[c][token]);
          }
        }
        logScores[c] = score;
      }

      const maxLog = Math.max(...Object.values(logScores));
      const expScores: Record<string, number> = {};
      let sumExp = 0;

      for (const [c, score] of Object.entries(logScores)) {
        const exp = Math.exp(score - maxLog);
        expScores[c] = exp;
        sumExp += exp;
      }

      for (const [c, exp] of Object.entries(expScores)) {
        const prob = exp / sumExp;
        if (prob > confidence) {
          confidence = prob;
          topTone = c;
        }
      }
    } else {
      // Lexical fallback
      const lower = text.toLowerCase();
      if (/sad|cry|hurt|depressed|lonely|heavy|exhausted/.test(lower)) {
        topTone = 'sad';
        confidence = 0.9;
      } else if (/angry|mad|hate|furious|unfair/.test(lower)) {
        topTone = 'angry';
        confidence = 0.9;
      } else if (/scared|panic|nervous|anxious|stressed|terrified/.test(lower)) {
        topTone = 'anxious';
        confidence = 0.88;
      } else if (/happy|glad|joy|excited|yay|proud/.test(lower)) {
        topTone = 'happy';
        confidence = 0.92;
      } else if (/calm|peaceful|quiet|relaxed/.test(lower)) {
        topTone = 'calm';
        confidence = 0.85;
      }
    }

    // Acoustic adjustments if available
    if (audioFeatures) {
      const pitch = audioFeatures.pitch || 0;
      const rms = audioFeatures.rms || 0;
      if (rms > 0.35 && pitch > 240) {
        topTone = 'angry';
        confidence = Math.max(confidence, 0.88);
      } else if (pitch > 260 && rms < 0.25) {
        topTone = 'anxious';
        confidence = Math.max(confidence, 0.85);
      }
    }

    const config = AVATAR_CONFIGS[topTone] || AVATAR_CONFIGS.neutral;

    return {
      tone: topTone,
      mood: topTone,
      confidence: parseFloat(confidence.toFixed(2)),
      valence: config.valence,
      arousal: config.arousal,
      avatarParameters: {
        brow: config.brow,
        smile: config.smile,
        eye: config.eye,
        auraColor: config.auraColor,
        expression: config.expression,
      },
    };
  }
}

export const toneAnalyzerEngine = new ToneAnalyzerEngine();
