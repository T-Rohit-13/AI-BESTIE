# INARO — AI Well-Being & Conversational Companion

INARO is an empathetic, privacy-centric AI companion designed to support emotional well-being through character-driven conversations, vocal tone emotion awareness, speech interactions in English and Tamil, private unguided journaling (Dump Mode), and verified crisis helpline pathways.

> [!NOTE]
> **Project Phase: Master Architecture & Scaffolding**
> This repository currently contains the approved architecture plans, shared API contracts, Prisma database schema, and project directory structure. Application package manifests (`package.json`), code entrypoints (`main.tsx`, `server.ts`, `app.py`), and runtime dependencies will be implemented in scoped feature branches upon approval of this foundation.

---

## Key Features

- **Interactive Mode**: Conversational AI companion powered by Google Gemini API with customizable characters and distinct personalities.
- **Dynamic AI Avatar**: Expressive SVG/Canvas avatar with autonomous blinking, smooth expression transitions, and speech-synchronized lip movement.
- **Vocal Tone Emotion Recognition**: Standalone machine learning pipeline that analyzes vocal prosody from audio input to guide visual avatar expressions.
- **Tamil Language Support (`தமிழ்`)**: Bilingual capabilities spanning speech recognition, conversational dialogue, and speech synthesis.
- **Dump Mode**: A secure, private space to write or speak thoughts freely without unsolicited advice or AI analysis.
- **Shared Crisis Helplines**: Single source of verified institutional mental health support numbers with click-to-call dialer access. New entries default to unverified until approved.
- **30-Day Retention & Rolling Memory**: Transparent conversational retention with automatic semantic summarization and user-controlled history purging.

---

## Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INARO FRONTEND (SPA)                            │
│  - React 18+ (Vite, TypeScript, Vanilla CSS Design Tokens)             │
│  - Owner Scope: Avatar Component (Canvas/SVG), Viseme Lip-Sync, Themes │
│  - Client Audio Recorder & Web Speech / MediaStream API                │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ REST / SSE                     │ Multipart Audio / REST
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        CORE BACKEND SERVICE          │  │     ML & AUDIO SERVICE       │
│  - Node.js (TypeScript, Fastify/Exp) │  │  - Python 3.10+ (FastAPI)    │
│  - Prisma ORM                        │  │  - PyTorch / Librosa / NumPy │
│  - Auth & OTP (Member 1)             │  │  - Vocal Emotion Inference   │
│  - Gemini API Client (Members 2 & 3) │  │  - Feature Extraction (MFCC) │
│  - Retention Worker (Members 2 & 3)  │  │  - Training & Eval Scripts   │
│  - Dump & Notif Engine (Member 4)    │  └──────────────▲───────────────┘
└───────────────────▲──────────────────┘                 │
                    │                                    │ Reads Weights
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│         POSTGRESQL DATABASE          │  │     LOCAL MODEL REGISTRY     │
│  - Users, Contacts, Helplines        │  │  - `models/checkpoints/`     │
│  - Characters, Chats, Summaries      │  │  - `dataset/processed/`      │
│  - Dump Entries, Mood/Sleep Logs     │  │  - Model metadata & metrics  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

- **Frontend**: React 18+, Vite, TypeScript, Vanilla CSS design tokens.
- **Core Backend**: Node.js, TypeScript, Express/Fastify, Prisma ORM, PostgreSQL.
- **ML & Voice Processing**: Python 3.10+, FastAPI, PyTorch, Librosa, Scikit-learn.
- **Conversational Intelligence**: Google Gemini API (model ID configured via `GEMINI_MODEL`, verified at deployment).
- **Authentication**: Argon2id password hashing, HTTP-only secure JWT cookies, pluggable OTP verification, session invalidation via `tokenVersion`.

---

## Documentation Index

- [TEAM_RULES.md](TEAM_RULES.md): Branch naming, pull request checklist, review requirements, secret handling.
- [TEAM_OWNERSHIP.md](TEAM_OWNERSHIP.md): Specific module assignments and file paths for all four team members and the Integration Lead.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): System components, data workflows, failure modes, and recovery patterns.
- [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md): Full schemas for Auth, Forgot-Password, Chat, Emotion Analysis, Dump Mode, and Helplines.
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md): PostgreSQL ER diagrams, table definitions, and 30-day retention policies.
- [docs/AI_AND_DATASET_PIPELINE.md](docs/AI_AND_DATASET_PIPELINE.md): Dataset preparation, vocal tone model training, evaluation, and Gemini integration boundary.
- [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md): Local developer setup and cross-service verification steps.
- [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md): Testing pyramid, safety interventions, and mock providers.

---

## Team Structure & Module Ownership

The repository is maintained by **five individuals** (Lead + 4 Team Members):

| Member | Focus Area | Key Deliverables |
| :--- | :--- | :--- |
| **Owner (Integration Lead)** | **AI Avatar & Dynamic Theme** | Avatar rendering engine, viseme lip-sync, mood theming, integration oversight |
| **Team Member 1** | **Auth, Identity & User Management** | User registration, login, pluggable OTP engine, forgot-password flow, user profiles |
| **Team Members 2 & 3** *(Joint)* | **Interactive AI & Voice Pipeline** | Character management, Gemini API chat integration, audio dataset pipeline, vocal tone model, STT/TTS |
| **Team Member 4** | **Dump Mode, Notifications & Helplines** | Private Dump Mode editor, daily mood/sleep trackers, inactivity notification worker, helpline directory |

---

## Target Development Workflow (Post-Scaffolding Implementation)

*The commands below represent the target execution steps once module feature branches introduce application manifests and entrypoints:*

```bash
# 1. Clone repository and switch to feature branch
git clone https://github.com/T-Rohit-13/AI-BESTIE.git
cd AI-BESTIE
git checkout -b feat/<your-name>-<module-name>

# 2. Configure environment
cp .env.example .env

# 3. Launch Core Backend (Port 5000) - upon server manifest implementation
cd server && npm install && npm run dev

# 4. Launch ML Microservice (Port 8000) - upon ML service manifest implementation
cd ../ml-service && pip install -r requirements.txt && uvicorn service.app:app --port 8000 --reload

# 5. Launch Frontend (Port 5173) - upon client manifest implementation
cd ../client && npm install && npm run dev
```

---

## Ethical Principles

1. **Non-Clinical Disclaimer**: INARO is an emotional well-being companion, not a licensed medical device or psychiatric diagnostic tool.
2. **Privacy First**: Dump Mode entries are strictly isolated from conversational context and are never analyzed by AI models.
3. **Safety Interventions**: Acute distress triggers immediate, direct pathways to verified national helplines and voluntary trusted contacts.
