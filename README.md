# INARO — Empathetic AI Companion for Mental Well-Being

INARO is an empathetic, privacy-centric AI companion application designed to foster emotional well-being. It combines an expressive animated avatar, vocal-tone acoustic emotion sensing, character-driven conversations powered by Google Gemini, speech-to-text (Whisper / Web Speech API), natural voice responses (Edge TTS), private cathartic journaling (Dump Mode), daily mood/sleep tracking, and a verified crisis helpline directory.

---

## 🌟 System Architecture & Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
  - Animated landing page with staggered popping brand title (`INARO`), glassmorphic cards, floating ambient orbs, and light blue/purple aesthetic (`#0ea5e9` to `#8b5cf6`).
  - Procedural Canvas/SVG Avatar UI with smooth facial blendshapes (`calm`, `happy`, `concerned`, `neutral`), natural blinking intervals, and viseme lip-sync.
- **Backend**: Node.js + Express + Mongoose (MongoDB)
  - Modular REST API with structured controllers, route handlers, error middleware, and data validation.
  - Native MongoDB TTL indexes for 5-minute OTP lifecycle and 30-day conversational retention policies.
- **AI Pipeline Microservice**: Python + FastAPI
  - Acoustic vocal-tone emotion detection analyzing prosody (pitch, energy, speaking rate).
  - Standardized JSON emotion payload with confidence scores, arousal, valence, and safety fallback triggers (`'calm'`).
- **Conversational Intelligence**: Google Gemini API
  - Empathetic active listening, multi-character personas, bilingual dialogue (English & Tamil `தமிழ்`).
- **Audio & Speech**:
  - Speech-to-Text (STT): Whisper API & Web Speech API.
  - Text-to-Speech (TTS): Edge TTS voice synthesis with emotional pitch inflection.

---

## 📁 Repository Directory Structure

```text
INARO/
├── .env.example                       # Master environment variable template
├── .gitignore                          # Git ignore rules for node_modules, .env, etc.
├── package.json                        # Root workspace orchestrator
├── README.md                           # System overview & developer documentation
├── TEAM_RULES.md                       # Engineering workflow, branch policies & reviews
├── TEAM_OWNERSHIP.md                   # Explicit module boundaries for all 5 team members
├── docs/                               # Architectural and technical documentation
│   ├── ARCHITECTURE.md                 # System components & dataflow diagram
│   ├── API_CONTRACTS.md                # Standardized emotion contract & REST specs
│   ├── DATABASE_SCHEMA.md              # Mongoose data models, indexes & TTL rules
│   ├── AI_AND_DATASET_PIPELINE.md      # ML datasets, prosody extraction & training
│   ├── INTEGRATION_GUIDE.md            # Cross-service setup & local orchestration
│   └── TESTING_STRATEGY.md             # Unit, integration & emotion fallback testing
├── client/                             # React + Vite + Tailwind CSS frontend
│   ├── public/                         # Static assets and avatar svgs
│   ├── src/
│   │   ├── components/                 # Component modules
│   │   │   ├── landing/                # Animated landing page (Member 1)
│   │   │   ├── auth/                   # Authentication forms & modals (Member 4)
│   │   │   ├── interactive/            # Interactive chat stage (Member 2)
│   │   │   ├── avatar/                 # Canvas/SVG Avatar rendering engine (Member 1)
│   │   │   ├── dump/                   # Dump Mode cathartic journal (Member 5)
│   │   │   ├── helpline/               # Verified helpline directory (Member 5)
│   │   │   └── shared/                 # Shared UI elements & audio widgets
│   │   ├── context/                    # React Context providers (Auth, Theme)
│   │   ├── hooks/                      # Custom React hooks (useAudioRecorder, useAvatar)
│   │   ├── services/                   # Frontend API client connectors
│   │   ├── styles/                     # Global styles, Tailwind directives & tokens
│   │   └── types/                      # Type definitions & contract interfaces
│   ├── index.html                      # Vite HTML5 entry point
│   ├── package.json                    # Client dependencies & scripts
│   ├── tailwind.config.js              # Tailwind tokens & brand theme extensions
│   └── vite.config.js                  # Vite bundler configuration
├── server/                             # Node.js + Express + Mongoose backend
│   ├── package.json                    # Backend dependencies & scripts
│   └── src/
│       ├── config/                     # Database & environment configurations
│       ├── controllers/                # REST controller handlers
│       ├── middleware/                 # Auth guards, validators & error handler
│       ├── models/                     # Mongoose schemas (User, Otp, Character, etc.)
│       ├── routes/                     # Express route declarations
│       ├── services/                   # Business logic (Gemini, OTP, Helplines)
│       ├── utils/                      # Helper utilities (JWT, Argon2, responses)
│       └── server.js                   # Express application entry point
└── ai_pipeline/                        # FastAPI Python emotion detection microservice
    ├── datasets/                       # Acoustic training datasets & prosody features
    ├── models/                         # Checkpoints & ONNX model weights
    ├── scripts/                        # Feature extraction & evaluation scripts
    ├── app.py                          # FastAPI emotion analysis application
    └── requirements.txt                # Python dependencies
```

---

## 👥 Team Ownership Matrix (5 Members)

| Member | Primary Modules | Key Deliverables |
| :--- | :--- | :--- |
| **Member 1 (Owner)** | **Avatar UI & Landing Experience** | Animated landing page with popping title, glassmorphic cards, design tokens (`tokens.css`), Canvas/SVG Avatar engine, PR gatekeeper |
| **Member 2** | **Interactive AI Core & Characters** | Character persona management, Google Gemini API backend orchestration, 30-day retention worker |
| **Member 3** | **Vocal Tone & Audio Microservice** | FastAPI emotion detection microservice (`app.py`), Whisper STT, Edge TTS synthesis, model checkpoints |
| **Member 4** | **Authentication & Identity System** | User & OTP Mongoose models, Argon2id hashing, pluggable OTP engine, password reset flow, trusted contacts |
| **Member 5** | **Dump Mode, Scheduler & Helplines** | Private Dump Mode journal (text/audio), daily mood/sleep trackers, inactivity scheduler, verified helpline directory |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **Python**: v3.10+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas cluster

### 2. Environment Configuration
Copy the template and configure your local credentials:
```bash
cp .env.example .env
```
Ensure you provide:
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/inaro_db`
- `JWT_SECRET=your_jwt_secret_min_32_characters`
- `GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio`
- `AI_EMOTION_SERVICE_URL=http://localhost:8000`

### 3. Installation
Install all client and server dependencies:
```bash
npm run install:all
```
Install Python AI Pipeline dependencies:
```bash
pip install -r ai_pipeline/requirements.txt
```

### 4. Running the Development Environment
Run client and server concurrently:
```bash
npm run dev
```
Or run each service individually:
- **Frontend Client**: `npm run dev:client` (Runs on `http://localhost:5173`)
- **Backend API**: `npm run dev:server` (Runs on `http://localhost:5000`)
- **AI Emotion Microservice**: `npm run dev:ai` (Runs on `http://localhost:8000`)
