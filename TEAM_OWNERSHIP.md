# TEAM_OWNERSHIP — INARO Project Ownership & Boundary Matrix

This document defines the strict module boundaries, file custodianship, and integration interfaces for all **5 team members** working on the INARO repository.

---

## 1. Executive Ownership Summary

| Member / Role | Scope Definition | Key Deliverables | Owned Repository Paths |
| :--- | :--- | :--- | :--- |
| **Member 1 (Owner & Integration Lead)** | **Avatar UI & Landing Experience** | Animated INARO landing page with popping brand title, glassmorphic cards, design tokens (`tokens.css`), Canvas/SVG Avatar rendering engine, viseme lip-sync, expression transitions, CI/CD & PR gatekeeper | `client/src/components/landing/`<br>`client/src/components/avatar/`<br>`client/src/styles/`<br>`docs/ARCHITECTURE.md`<br>Root orchestration (`package.json`, `.github/`) |
| **Member 2** | **Interactive AI Core & Character Personas** | Character persona management, multi-character prompts, Gemini API backend orchestration, streaming chat responses, context window compaction, 30-day retention worker | `server/src/controllers/character/`<br>`server/src/controllers/conversation/`<br>`server/src/models/Character.js`<br>`server/src/models/Conversation.js`<br>`client/src/components/interactive/` |
| **Member 3** | **Vocal Tone & Audio Processing Pipeline** | FastAPI vocal-tone emotion detection microservice, acoustic prosody classification, Speech-to-Text (Whisper / Web Speech API), Text-to-Speech (Edge TTS), audio datasets & model weights | `ai_pipeline/`<br>`client/src/components/shared/audio/`<br>`server/src/services/aiEmotionService.js` |
| **Member 4** | **Authentication & Identity System** | User Mongoose schema & models, password hashing with Argon2id, pluggable OTP verification engine, anti-enumeration forgot-password & reset flows, trusted emergency contacts | `server/src/controllers/auth/`<br>`server/src/models/User.js`<br>`server/src/models/Otp.js`<br>`server/src/routes/auth/`<br>`client/src/components/auth/` |
| **Member 5** | **Dump Mode, Scheduler & Helplines** | Private Dump Mode journal (text/audio entries), daily mood & sleep trackers, notification scheduler/inactivity reminders, verified counselling helpline directory & fallback router | `server/src/controllers/dump/`<br>`server/src/controllers/tracker/`<br>`server/src/controllers/helpline/`<br>`server/src/models/DumpEntry.js`<br>`server/src/models/DailyTracker.js`<br>`server/src/models/Helpline.js`<br>`client/src/components/dump/`<br>`client/src/components/helpline/` |

---

## 2. Detailed Member Responsibilities & Boundaries

### Member 1 (Owner & Integration Lead)
- **Primary Deliverables**:
  - **Animated Landing Page**: Modern, responsive landing page featuring the popping brand title animation (`animate-pop-in`), glassmorphic feature cards, floating ambient orbs, and light blue/purple aesthetic (`#0ea5e9` to `#8b5cf6`).
  - **Avatar UI**: Canvas/SVG procedural avatar supporting facial expressions (`calm`, `happy`, `concerned`, `neutral`), natural blinking intervals, and viseme mouth animation driven by vocal audio streams.
  - **Design System Tokens**: Master design tokens in [client/src/styles/tokens.css](client/src/styles/tokens.css) providing emotion-responsive palette shifts.
  - **Repository Governance**: PR reviews, release gating, branch protection verification, and cross-module integration integrity.
- **Boundaries**:
  - Consumes emotion analysis output from Member 3 via [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).
  - Does NOT alter conversational prompt logic (Member 2), audio ML weights (Member 3), auth controllers (Member 4), or journal storage (Member 5).

### Member 2 (Interactive AI Core & Character Personas)
- **Primary Deliverables**:
  - **Multi-Character System**: Custom characters with distinct emotional tones, empathetic backstories, and persona prompts.
  - **Google Gemini API Integration**: Secure server-side orchestrator handling chat sessions, prompt safety checks, and token-efficient history compaction.
  - **Context Retention**: 30-day conversational rolling memory and automated session summary generator.
  - **Interactive Chat Frontend**: Real-time dialogue interface interfacing with the Avatar component.
- **Boundaries**:
  - Relies on Member 4's auth middleware for user identity (`req.user.id`).
  - Receives vocal emotion tags from Member 3 to enrich dialogue context.

### Member 3 (Vocal Tone Microservice & Audio Pipeline)
- **Primary Deliverables**:
  - **FastAPI Emotion Microservice**: Standalone Python service (`ai_pipeline/app.py`) analyzing pitch, energy, and prosody to output normalized emotion confidence vectors.
  - **Safety Fallback**: Enforces fallback to `'calm'` whenever confidence drops below the 0.60 threshold.
  - **Speech-to-Text (STT)**: Integration with Whisper API and Web Speech API for seamless voice input.
  - **Text-to-Speech (TTS)**: Integration with Edge TTS generating natural audio waveforms with viseme cue timings.
  - **Datasets & Weights**: Custodianship of audio training datasets (`ai_pipeline/datasets/`) and ONNX model checkpoints (`ai_pipeline/models/`).
- **Boundaries**:
  - Strictly adheres to the JSON schema defined in [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).
  - Does NOT write directly to the primary MongoDB database; operates strictly as an inference microservice.

### Member 4 (Auth System, User DB Models & OTP)
- **Primary Deliverables**:
  - **User & OTP Mongoose Models**: Master schemas for user identity, hashed passwords, verification state, and TTL-indexed OTP codes.
  - **Registration & Login**: Secure endpoints with robust schema validation, anti-enumeration protections, and rate limiting.
  - **Pluggable OTP Engine**: Dev console OTP simulator and production SMS adapter.
  - **Password Reset Flow**: Secure tokenized reset cycle invalidating existing sessions via `tokenVersion`.
  - **Trusted Contacts**: Emergency contact schema and validation; triggers helpline fallback when omitted.
- **Boundaries**:
  - Does NOT build chat or journaling UI.
  - Exposes `authMiddleware` to protect Member 2 and Member 5 routes.

### Member 5 (Dump Mode Journal, Scheduler & Helplines)
- **Primary Deliverables**:
  - **Dump Mode Journal**: Private cathartic journal supporting quick text brain-dumps and audio voice notes.
  - **Daily Well-Being Trackers**: Daily mood rating (1-10) and sleep duration/quality tracking.
  - **Notification Scheduler**: Background task checking user inactivity and triggering gentle check-in reminders.
  - **Verified Helpline Directory**: Searchable directory of verified mental health crisis helplines, with immediate regional fallback when user omits a trusted contact or signals distress.
- **Boundaries**:
  - Relies on Member 4's user session for data isolation.
  - Does NOT perform acoustic emotion classification (Member 3).

---

## 3. Communication & Integration Protocol

1. **Contract Adherence**: Any change to API request/response payloads requires an update to [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) and unanimous approval from Member 1 and the affected member.
2. **Database Migration**: Schema additions in `server/src/models/` must be coordinated with Member 4 (Schema Lead) and reflected in [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md).
3. **Escalation**: Unresolved integration conflicts or cross-module boundary disputes are escalated to Member 1 (Project Owner) for definitive resolution.
