# INARO — Developer Setup & Cross-Module Integration Guide

This guide outlines prerequisites, the multi-service developer workflow, and cross-module integration verification procedures for INARO.

---

## 1. Prerequisites & Environment Setup

Each team member requires:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: v3.10 or higher
- **MongoDB**: v6.0 or higher (local `mongodb://localhost:27017` or MongoDB Atlas)
- **Git**: Configured with your GitHub handle

### 1.1 Clone & Checkout Feature Branch
```bash
git clone https://github.com/T-Rohit-13/AI-BESTIE.git
cd AI-BESTIE

# Create your assigned feature branch following TEAM_RULES.md
git checkout -b feature/m<N>-<feature-description>
```

### 1.2 Environment Configuration
Copy the master environment template:
```bash
cp .env.example .env
```
Ensure you set your local `MONGODB_URI`, `PORT=5000`, `JWT_SECRET`, and `GEMINI_API_KEY`. For local testing, keep `OTP_PROVIDER=console` so verification codes print directly to your terminal.

---

## 2. Service Execution & Startup

You can launch all services concurrently from the root directory or run them individually.

### Option A: Launch All Services (Root Orchestrator)
```bash
# 1. Install all dependencies across workspaces
npm run install:all

# 2. Run client and server concurrently
npm run dev
```

### Option B: Run Services Individually

#### 1. Core Backend (`server/`) — Express + Mongoose
```bash
cd server
npm install
npm run dev
# Server boots on http://localhost:5000
```
Verify health:
```bash
curl http://localhost:5000/health
```

#### 2. Frontend Client (`client/`) — React + Vite + Tailwind CSS
```bash
cd client
npm install
npm run dev
# Vite dev server boots on http://localhost:5173
```
Open `http://localhost:5173` to interact with the animated landing page.

#### 3. AI Emotion Microservice (`ai_pipeline/`) — FastAPI
```bash
cd ai_pipeline
pip install -r requirements.txt
python app.py
# FastAPI server boots on http://localhost:8000
```
Verify interactive docs:
`http://localhost:8000/docs`

---

## 3. End-to-End Integration Verification

1. **Auth & Identity Cycle (Member 4)**:
   - Register a new account via `POST http://localhost:5000/api/v1/auth/register`.
   - Check server terminal console for 6-digit OTP code (`OTP_PROVIDER=console`).
   - Submit OTP via `POST http://localhost:5000/api/v1/auth/verify-otp`.
2. **Acoustic Emotion Inference & Fallback (Member 3)**:
   - Send sample prosody features to `POST http://localhost:8000/api/v1/analyze-emotion`.
   - Verify `confidence_scores` sum to 1.0.
   - Test low confidence input to verify fallback to `'calm'` with `fallback_triggered: true`.
3. **Dialogue Interaction (Member 2)**:
   - Send chat message to `POST http://localhost:5000/api/v1/chat/message`.
   - Verify empathetic response generated via Google Gemini.
4. **Avatar Visualization (Member 1)**:
   - Open frontend at `http://localhost:5173`.
   - Check that the Avatar component correctly morphs facial blendshapes to the detected emotion.
5. **Dump Mode & Helplines (Member 5)**:
   - Create a test journal entry via `POST http://localhost:5000/api/v1/dump/entries`.
   - Query verified crisis helplines at `GET http://localhost:5000/api/v1/helplines`.
