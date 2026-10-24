# INARO — AI Architecture, Vocal ML Pipeline & Gemini Integration

This document defines the machine learning architecture, dataset development lifecycle, audio feature engineering, evaluation standards, and the explicit boundary between the custom vocal tone emotion microservice (Member 3) and the Gemini conversational API (Member 2).

---

## 1. Division of AI Responsibilities

AI operations are cleanly partitioned between **Member 2 (Dialogue Core)** and **Member 3 (Audio & Emotion Pipeline)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              USER AUDIO                                │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       [Acoustic Prosody Stream]           [Speech-to-Text (STT)]
                    │                         (Whisper / Web Speech)
                    ▼                                │
       ┌────────────────────────┐                    │
       │   AI EMOTION PIPELINE  │                    │
       │   (Member 3 - FastAPI) │                    │
       └────────────┬───────────┘                    │
                    │                                │
                    ▼                                ▼
         Inferred Vocal Emotion             User Message Text
          (e.g., "concerned")                        │
                    │                                ▼
                    │                     ┌────────────────────────┐
                    │                     │    GEMINI API CLIENT   │
                    │                     │  (Member 2 - Express)  │
                    │                     └────────────┬───────────┘
                    │                                  │
                    ▼                                  ▼
         ┌─────────────────────┐              Empathic AI Response
         │   MEMBER 1 AVATAR   │                       │
         │  (Facial Emotion &  │◄──────────────────────┘
         │   Viseme Lip-Sync)  │
         └─────────────────────┘
```

1. **Vocal Tone Emotion Model (Member 3 Scope)**: A dedicated Python microservice (`ai_pipeline/app.py`) classifying acoustic properties (pitch, energy RMS, jitter, shimmer, spectral flux) into a normalized emotion distribution.
2. **Conversational Dialogue Model (Member 2 Scope)**: Google Gemini API invoked on the Express backend (`server/src/services/geminiService.js`) to generate empathetic, character-aligned text responses.
3. **Speech-to-Text & Text-to-Speech (Member 3 Scope)**: Audio transcription (Whisper API & Web Speech API) and voice synthesis (Edge TTS) with native Tamil (`ta-IN`) and English support.
4. **Safety & Triage Evaluator (Member 2 Scope)**: Rule-based regex and prompt classification flagging emergency distress.
5. **Non-Clinical Guarantee**: Vocal-tone emotion inferences are used solely to animate the avatar and tune conversational empathy. **They must never be presented as medical diagnoses or psychiatric evaluations.**

---

## 2. Dataset Pipeline & Preprocessing (Member 3)

### 2.1 Approved Datasets
- **RAVDESS** (Ryerson Audio-Visual Database of Emotional Speech and Song): 1,440 speech files across 24 actors covering calm, happy, sad, angry, fearful, surprise, and disgust.
- **CREMA-D** (Crowd-sourced Emotional Multimodal Actors Dataset): 7,442 clips spanning diverse demographics.
- **Custom Bilingual Tamil/English Dataset**: 200 validated local conversational samples ensuring prosody models generalize accurately to South Asian English and colloquial Tamil pitch contours.

### 2.2 Feature Engineering
- **Sampling Rate**: Resampled to 16 kHz mono PCM WAV.
- **Extracted Acoustic Features**:
  - Mel-Frequency Cepstral Coefficients (MFCCs, 13-40 coefficients)
  - Fundamental Frequency ($F_0$ / Pitch Tracking via PYIN)
  - Root Mean Square (RMS) Energy
  - Zero-Crossing Rate (ZCR)
  - Spectral Centroid & Spectral Roll-off

---

## 3. Standardized Emotion Analysis Contract

The microservice exposes `POST /api/v1/analyze-emotion` returning:
```json
{
  "success": true,
  "primary_emotion": "calm",
  "confidence_scores": {
    "calm": 0.852,
    "happy": 0.081,
    "sad": 0.034,
    "anxious": 0.018,
    "angry": 0.008,
    "neutral": 0.007
  },
  "arousal": 0.28,
  "valence": 0.72,
  "fallback_triggered": false,
  "avatar_triggers": {
    "expression": "calm",
    "viseme_intensity": 0.65,
    "eye_contact_rate": 0.85
  },
  "latency_ms": 38.5,
  "timestamp": "2026-10-24T05:30:15.120Z"
}
```

### 3.1 Safety Fallback Policy ('calm')
Whenever maximum confidence $< 0.60$ or audio fails quality assertions, the service automatically flags `fallback_triggered: true` and defaults `primary_emotion` and `avatar_triggers.expression` to `'calm'`.
