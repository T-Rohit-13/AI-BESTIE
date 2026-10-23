# INARO — AI Architecture, Vocal ML Pipeline & Gemini Integration

This document defines the machine learning architecture, dataset development lifecycle, audio feature engineering, evaluation standards, and the explicit boundary between the custom vocal tone emotion model and the Gemini 1.5 conversational API.

> [!NOTE]
> **Team Scope Notice**: The entire AI and audio pipeline (Interactive Mode, Gemini dialogue orchestration, datasets, model training, STT/TTS, and vocal-tone emotion analysis) is under **joint ownership by Team Members 2 and 3**.

---

## 1. Clear Division of AI Responsibilities

To avoid architectural confusion and ensure modular reliability, AI operations are strictly partitioned across independent components:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              USER AUDIO                                │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       [Acoustic Feature Stream]           [Speech-to-Text (STT)]
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐         ┌────────────────────────┐
       │   CUSTOM VOCAL ML      │         │     TRANSCRIPTION      │
       │ (Members 2 & 3 Joint)  │         │    (Tamil / English)   │
       └────────────┬───────────┘         └────────────┬───────────┘
                    │                                  │
                    ▼                                  ▼
         Inferred Vocal Emotion               User Message Text
          (e.g., "concerned")                          │
                    │                                  ▼
                    │                     ┌────────────────────────┐
                    │                     │    GEMINI API          │
                    │                     │ (Members 2 & 3 Joint)  │
                    │                     └────────────┬───────────┘
                    │                                  │
                    ▼                                  ▼
         ┌─────────────────────┐              Empathic AI Response
         │    OWNER AVATAR     │                       │
         │  (Facial Emotion &  │◄──────────────────────┘
         │   Mouth Lip-Sync)   │
         └─────────────────────┘
```

1. **Vocal Tone Emotion Model (Members 2 & 3 Joint Scope)**: A dedicated neural network trained on audio datasets that classifies acoustic properties (pitch, prosody, spectral flux) into an emotion vector.
2. **Conversational Dialogue Model (Members 2 & 3 Joint Scope)**: Google Gemini API invoked on the core backend to generate empathetic text responses tailored to the character's personality.
3. **Speech-to-Text & Text-to-Speech (Members 2 & 3 Joint Scope)**: Audio transcription and voice synthesis pipelines with native Tamil (`ta-IN`) and English support.
4. **Safety & Triage Evaluator (Members 2 & 3 Joint Scope)**: Rule-based regex and prompt classification flagging emergency distress.
5. **Non-Clinical Guarantee**: Vocal-tone emotion inferences are used solely to animate the avatar and tune empathetic dialogue responses. **They must never be presented as medical diagnoses or psychiatric evaluations.**

---

## 2. Dataset Pipeline & Model Training Lifecycle

### 2.1 Dataset Ingestion & Schema Specification
The training pipeline accepts speech audio datasets (e.g., RAVDESS, CREMA-D, and curated Tamil speech datasets) placed into `ml-service/datasets/raw/`.

Every dataset must include a manifest file (`manifest.csv` or `data_spec.json`) conforming to this schema:
```csv
audio_filepath,speaker_id,gender,emotion_label,language,sample_rate
raw/sample_001.wav,spk_10,F,calm,ta,16000
raw/sample_002.wav,spk_10,F,concerned,ta,16000
raw/sample_003.wav,spk_11,M,happy,en,16000
```

### 2.2 Preprocessing & Feature Extraction
Executed via `ml-service/pipeline/02_preprocess_audio.py`:
1. **Audio Normalization**: Convert all audio to mono-channel, 16,000 Hz sample rate (16-bit PCM WAV).
2. **Silence Trimming**: Remove non-speech audio using energy-based voice activity detection (VAD).
3. **Feature Representations**:
   - 40 Mel-Frequency Cepstral Coefficients (MFCCs).
   - Mel-Spectrogram (128 mel bands).
   - Chroma and Spectral Contrast features.

### 2.3 Dataset Splits & Prevention of Data Leakage
- **Split Ratio**: 70% Training, 15% Validation, 15% Test.
- **Speaker Stratification**: The split is strictly stratified by `speaker_id` to guarantee that the model is evaluated on speakers it has never heard during training.

### 2.4 Model Architecture & Training Runs
- **Baseline Architecture**: 1D-CNN with Batch Normalization, Dropout (0.3), and dense classification head for 6 target emotions (`happy`, `sad`, `calm`, `concerned`, `surprised`, `neutral`).
- **Advanced Architecture**: Fine-tuned Wav2Vec2 audio representation with a classification projection layer.
- **Loss Function**: Categorical Cross-Entropy with class weights to compensate for imbalanced labels.
- **Evaluation Criteria**: Macro F1 Score $\ge 0.75$, Overall Test Accuracy $\ge 78\%$, Inference Latency $< 200\text{ms}$.

### 2.5 Model Registry & Versioning
Trained weights are serialized into ONNX format (`models/checkpoints/vocal_aer_vX.Y.onnx`) and registered in `models/registry.json`:
```json
{
  "active_version": "v1.2.0",
  "models": {
    "v1.2.0": {
      "checkpoint_path": "models/checkpoints/vocal_aer_v1.2.0.onnx",
      "macro_f1": 0.782,
      "test_accuracy": 0.814,
      "trained_date": "2026-10-23",
      "supported_classes": ["happy", "sad", "calm", "concerned", "surprised", "neutral"]
    }
  }
}
```

---

## 3. Gemini API Conversation Integration

### 3.1 Backend Orchestration & Boundary
- Invoked **strictly server-side** in `server/src/modules/chat/gemini.service.ts`.
- The user's private Gemini API key is loaded from `.env` via `process.env.GEMINI_API_KEY`.
- The frontend never makes direct HTTP requests to Google's API.
- **Model Selection & Verification Notice**: The proposed default model is `gemini-1.5-flash`. Model availability and regional tier must be verified in Google AI Studio at deployment time; if unavailable in the selected quota tier, configure `GEMINI_MODEL` in `.env` to the active stable endpoint (e.g. `gemini-1.5-flash-latest` or `gemini-2.0-flash-exp`).
- **Training Separation**: Gemini API does **not** train on or ingest team speech datasets. Team datasets are exclusively utilized by the local PyTorch vocal-tone model.

### 3.2 Dynamic Prompt Injection & Character Persona
```typescript
const systemInstruction = `
You are ${character.name}, an AI companion in the INARO application.
Your personality: ${character.systemPrompt}
Your tone: ${character.toneDescription}

Guidelines:
- Listen empathetically and validate feelings.
- Never provide medical or clinical psychiatric diagnoses.
- Respond in the language used by the user. If the user writes in Tamil, reply in natural Tamil script.
- Keep responses conversational, comforting, and concise (under 3 sentences).
`;
```

### 3.3 Handling Rate Limits & Failure Modes
- Retries with jittered exponential backoff for HTTP 429 / 503 errors.
- Fallback circuit breaker returning pre-configured empathetic support messages when the provider is unreachable.

---

## 4. Multilingual & Tamil (`தமிழ்`) Processing

1. **Speech-to-Text (STT)**:
   - Configured for BCP-47 language tag `ta-IN`.
   - Audio chunks from the microphone are passed to the Tamil acoustic speech model or Web Speech API.
2. **LLM Generation**:
   - Gemini natively supports UTF-8 Tamil script. Responses preserve Tamil conversational idioms without awkward mechanical translations.
3. **Text-to-Speech (TTS)**:
   - AI responses in Tamil are routed to a Tamil neural speech synthesizer voice to ensure natural pronunciation.
