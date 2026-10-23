# INARO — Developer Setup & Cross-Module Integration Guide

This guide outlines prerequisites, the target multi-service developer workflow, and cross-module integration verification procedures for INARO.

> [!IMPORTANT]
> **Scaffold vs. Runnable Application Phase Notice**:
> The repository is currently in the **Master Architecture and Scaffolding Phase**.
> The files present define contracts, schemas, and folder boundaries. Application manifests (`package.json`), entry points (`main.tsx`, `server.ts`, `app.py`), and operational dependencies are scheduled to be implemented during upcoming module feature branches once the owner approves this foundation.
> **The startup commands below represent the target operational workflow once package manifests and entrypoints are implemented.**

---

## 1. Prerequisites & Environment Setup

Each team member requires:
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v14 or higher (local installation or Docker container)
- **Git**: Configured with the member's GitHub handle

### 1.1 Clone & Checkout Feature Branch
```bash
git clone https://github.com/T-Rohit-13/AI-BESTIE.git
cd AI-BESTIE

# Create your assigned feature branch (see TEAM_RULES.md)
git checkout -b feat/<your-name>-<module-name>
```

### 1.2 Environment Configuration
Copy the master environment template:
```bash
cp .env.example .env
```
Open `.env` and configure your local PostgreSQL connection string and test keys. For local development, keep `OTP_PROVIDER=console` so verification codes appear in your backend terminal without needing SMS credentials.

---

## 2. Target Service Execution (Post-Implementation)

*Note: Execute these commands once package manifests and module code entrypoints are generated.*

### Step 1: Core Backend (`server/`)
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# Server starts on http://localhost:5000
```

### Step 2: ML & Audio Microservice (`ml-service/`)
```bash
cd ml-service
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn service.app:app --host 0.0.0.0 --port 8000 --reload
# ML Service starts on http://localhost:8000
```

### Step 3: Frontend Client (`client/`)
```bash
cd client
npm install
npm run dev
# Application UI opens on http://localhost:5173
```

---

## 3. Verifying Inter-Module Contracts

To verify that individual modules communicate correctly once endpoints are wired:

### Test 1: Verify Registration & Forgot-Password Flow (Member 1)
```bash
# 1. Request registration OTP
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"dev_user\",\"fullName\":\"Dev User\",\"age\":21,\"mobileNumber\":\"9999988888\",\"password\":\"Secret123!\"}"

# 2. Check backend terminal logs for the generated 6-digit OTP code, then verify:
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"mobileNumber\":\"9999988888\",\"otpCode\":\"<CODE_FROM_CONSOLE>\",\"purpose\":\"REGISTER\"}"

# 3. Test Forgot-Password Generic Anti-Enumeration Response:
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"dev_user\"}"
# Confirmed: Returns 200 OK whether user exists or not.
```

### Test 2: Verify Vocal Tone Inference & Avatar Contract (Members 2 & 3 Joint $\to$ Owner Lead)
```bash
# Submit a sample WAV audio file to the ML inference service:
curl -X POST http://localhost:8000/api/v1/ml/infer-vocal-emotion \
  -F "audio=@tests/fixtures/sample_calm.wav"
```
Verify that the output contains the required `avatar_visual_hints` and `inferred_emotion` properties defined in [docs/API_CONTRACTS.md](API_CONTRACTS.md).

### Test 3: Verify Gemini Dialogue Resiliency (Members 2 & 3 Joint Scope)
Ensure `server/src/modules/chat/` handles both normal Gemini responses and network timeout errors without unhandled promise rejections.

### Test 4: Verify Seven-Day Rolling Safety Evaluation (Members 2 & 3 Joint Scope)
```bash
curl -X GET http://localhost:5000/api/v1/safety/rolling-seven-day \
  -H "Cookie: token=<AUTH_COOKIE>"
```
Verify that missing days are ignored and not counted toward `flagged_days_count`.

### Test 5: Verify Dump Mode Isolation (Member 4)
```bash
curl -X POST http://localhost:5000/api/v1/dump/entries \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<AUTH_COOKIE>" \
  -d "{\"title\":\"Private Reflection\",\"content\":\"Testing isolation\"}"
```
Verify that response confirms entry creation with zero AI advice, and that no conversational message is created in `Message`.
