# INARO — Master System Architecture

This document specifies the technical architecture, component interactions, runtime lifecycles, and reliability patterns for the INARO mental well-being companion application.

---

## 1. High-Level Architecture Overview

INARO is architected as a modular, contract-first web application consisting of three distinct execution layers:

1. **Frontend Client (SPA)**: Built with React 18, Vite, and Tailwind CSS. Houses Member 1's animated landing page with popping brand title, glassmorphic cards, light blue/purple scheme, dynamic AI Avatar rendering engine, and responsive UI theme tokens.
2. **Core Application Backend**: Built with Node.js, Express, and Mongoose (MongoDB). Coordinates identity, data access, Gemini conversation orchestration, 30-day retention policies, and the notification engine.
3. **AI Emotion Microservice**: Built with Python 3.10+ and FastAPI. Dedicated exclusively to vocal acoustic feature extraction, speech prosody classification, and serving the standardized emotion inference contract.
4. **Data & Storage Layer**: MongoDB managed via Mongoose ODM for document flexibility, native TTL indexes (for 5-minute OTP and 30-day chat retention), and fast geospatial/regional helpline queries.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INARO FRONTEND (SPA)                            │
│  - React 18 + Vite + Tailwind CSS (Light Blue / Purple Aesthetic)      │
│  - Member 1 (Owner): Animated Landing Page (Popping Brand Title),      │
│    Avatar UI (Canvas/SVG), Viseme Mouth-Sync, Emotion Design Tokens    │
│  - Client Audio Recorder & Web Speech / MediaStream API                │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ REST / JSON                    │ Multipart Audio / REST
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        CORE BACKEND SERVICE          │  │     AI EMOTION PIPELINE      │
│  - Node.js + Express + Mongoose      │  │  - Python 3.10+ (FastAPI)    │
│  - Member 4: Auth & OTP Engine       │  │  - Member 3: Vocal Prosody   │
│  - Member 2: Gemini API Orchestrator │  │    Acoustic Classifier       │
│  - Member 2: 30-Day Retention Worker │  │  - Whisper STT & Edge TTS    │
│  - Member 5: Dump & Helpline Engine  │  │  - Standardized JSON Payload │
└───────────────────▲──────────────────┘  └──────────────▲───────────────┘
                    │                                    │ Reads Weights
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│          MONGODB DATABASE            │  │     LOCAL MODEL REGISTRY     │
│  - Users, OTPs (5-min TTL)           │  │  - `ai_pipeline/models/`     │
│  - Characters, Conversations (30d)   │  │  - `ai_pipeline/datasets/`   │
│  - Dump Entries, Daily Mood/Sleep    │  │  - ONNX / Feature Checkpoints│
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 2. Subsystem Descriptions & Responsibilities

### 2.1 Member 1 (Owner & Integration Lead): Avatar UI & Animated Landing Page
- **Animated Landing Page**: Modern, responsive landing page with staggered popping brand title letters (`animate-pop-in`), glassmorphic feature cards, floating ambient orbs, and light blue/purple color tokens.
- **Avatar Rendering Engine**: Implemented using HTML5 Canvas or scalable SVG elements. Maintains smooth, interpolated facial state transitions between emotional states (`happy`, `sad`, `calm`, `concerned`, `neutral`).
- **Autonomous Blinking Loop**: Random interval timer (2-6 seconds) triggering natural eyelid closure and opening independently of conversation state.
- **Speech-Synchronized Lip-Sync**: Receives audio playback duration and viseme/amplitude markers to drive mouth opening and closing during AI voice response.
- **Mood-Responsive Theming**: Evaluates current interaction mood and shifts CSS custom properties with smooth transitions.
- **Safety Fallback**: If the AI emotion microservice is unreachable or confidence is low (< 0.60), the avatar gracefully reverts to the default `"calm"` expression.

### 2.2 Member 2: Interactive AI Core & Character Personas
- **Multi-Character System**: Manages character profiles (name, personality prompt, avatar visual style, voice ID).
- **Gemini Integration**: Uses Google's `@google/genai` SDK on the backend. Packages character system instructions, past conversation summaries, and the user's latest message into structured prompts.
- **Tamil Language Handling**: Directs Gemini to respond in natural Tamil script (`தமிழ்`) when the user communicates in Tamil, maintaining conversational nuances.
- **30-Day Conversation Retention**: Native MongoDB TTL index on `Conversation.retentionExpiresAt` purges raw message history after 30 days to honor user privacy, archiving rolled summaries.

### 2.3 Member 3: Vocal Tone Microservice & Audio Pipeline
- **FastAPI Emotion Microservice**: Standalone service (`ai_pipeline/app.py`) analyzing pitch, energy RMS, and speaking rate to output normalized emotion confidence vectors.
- **Confidence Scoring & Safety Fallback**: Enforces safe default fallback to `'calm'` whenever confidence is below 0.60 or audio is degraded.
- **Speech-to-Text (STT)**: Integration with Whisper API and Web Speech API.
- **Text-to-Speech (TTS)**: Integration with Edge TTS generating natural audio waveforms.

### 2.4 Member 4: Authentication, User DB Models & OTP
- **User Mongoose Schema**: Comprehensive user identity schema including age validation, personal mobile, trusted person contact, and password hash.
- **Pluggable OTP Verification**: 6-digit cryptographic OTP generation with 5-minute TTL index, 3-attempt lockout, and anti-enumeration forgot password flow.
- **Session Revocation**: `tokenVersion` increments on password reset to immediately invalidate active JWTs across devices.

### 2.5 Member 5: Dump Mode Journal, Scheduler & Helplines
- **Dump Mode**: Zero-advice cathartic journaling supporting unguided text entries and audio voice recordings.
- **Daily Mood & Sleep Tracker**: Daily wellness logs with uniqueness constraints per user per day.
- **Notification Scheduler**: Inactivity cron triggering gentle reminders.
- **Verified Helpline Directory**: Searchable directory of verified mental health helplines, with immediate regional fallback when user omits a trusted contact or signals distress.

---

## 3. Communication & Dataflow

1. **Voice Input Flow**: User speaks ➔ Frontend records audio chunk ➔ Sent to `ai_pipeline/app.py` ➔ Microservice extracts prosody features ➔ Standardized emotion payload returned to Frontend Avatar Controller (Member 1) & Express Backend (Member 2).
2. **Dialogue Generation Flow**: Frontend sends text + emotion tag to Express Backend ➔ Gemini generates empathetic response ➔ Response synthesized to audio via Edge TTS (Member 3) ➔ Returned to client with avatar expression cue.
3. **Emergency Support Flow**: If distress or acute crisis detected, application immediately displays verified helpline modal (Member 5) alongside optional trusted contact alert (Member 4).
