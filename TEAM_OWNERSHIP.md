# TEAM_OWNERSHIP — INARO Project Ownership & Boundary Matrix

This document defines the strict ownership boundaries for the four team members and the Integration Lead (Owner) working on the INARO repository.

---

## 1. Executive Ownership Summary

The INARO team consists of **five individuals**: the Project Owner / Integration Lead and **four Team Members**.

| Role / Identifier | Scope Definition | Primary Modules | Owned Repository Paths |
| :--- | :--- | :--- | :--- |
| **Owner / Lead** | **AI Avatar & Integration Lead** | AI Avatar rendering, facial expressions, viseme mouth-sync, dynamic mood-responsive UI theming, repository governance, CI/CD | `client/src/components/avatar/`<br>`client/src/styles/tokens.css`<br>`docs/`, `.github/`, Scaffolding |
| **Team Member 1** | **Authentication, Identity & User Management** | User registration, authentication, login, secure password hashing, pluggable OTP engine, forgot-password & reset flow, user profiles, trusted contacts | `server/src/modules/auth/`<br>`server/src/modules/user/`<br>`client/src/components/auth/`<br>`server/prisma/` (Auth & User entities) |
| **Team Members 2 & 3** *(Joint Ownership)* | **Interactive Mode, AI & Voice Pipeline** | **Jointly owned scope**: AI conversation generation, Gemini API integration, vocal-tone emotion analysis model, datasets/model training & evaluation, speech-to-text (STT), text-to-speech (TTS), 30-day conversation retention & summaries, safety monitoring | `server/src/modules/character/`<br>`server/src/modules/chat/`<br>`server/src/modules/retention/`<br>`server/src/modules/safety/`<br>`ml-service/`<br>`client/src/components/chat/`<br>`client/src/components/voice/` |
| **Team Member 4** | **Dump Mode, Notifications & Helplines** | Private Dump Mode (text & voice entries CRUD), Daily mood & sleep trackers, notification preferences & delivery engine (inactivity reminders), shared verified helpline directory | `server/src/modules/dump/`<br>`server/src/modules/tracker/`<br>`server/src/modules/notifications/`<br>`server/src/modules/helpline/`<br>`client/src/components/dump/`<br>`client/src/components/tracker/`<br>`client/src/components/helpline/` |

> [!IMPORTANT]
> **Joint Scope Policy for Members 2 and 3**:
> Interactive Mode, conversational AI, and the audio/ML pipeline are currently held under **joint ownership**. The precise submodule division between Member 2 and Member 3 (e.g. conversational dialogue orchestration vs. audio acoustic modeling) must be formally confirmed with the Integration Lead before implementation begins. Neither member may unilaterally modify shared AI contracts without mutual agreement and Lead approval.

---

## 2. Detailed Member Responsibilities & Boundaries

### Owner (Integration Lead & Avatar UI)
- **Primary Deliverables**:
  - AI Avatar rendering engine (Canvas/SVG) with smooth facial expression transitions (`happy`, `sad`, `calm`, `concerned`, `surprised`, `neutral`).
  - Natural, autonomous blinking loop and speech-synchronized viseme mouth animation.
  - Dynamic mood-responsive UI theming engine ([tokens.css](client/src/styles/tokens.css)) adapting interface hues smoothly to emotional context.
  - End-to-end integration contracts governance, pull request reviews, and final release readiness.
- **Boundaries**:
  - Consumes the standardized Emotion Analysis Response contract ([docs/API_CONTRACTS.md](docs/API_CONTRACTS.md)).
  - Does NOT implement internal business logic for Gemini prompts, authentication controllers, or Dump Mode storage.

### Team Member 1 (Auth, Identity & User Management)
- **Primary Deliverables**:
  - Sign-up and sign-in interfaces and backend handlers.
  - Registration fields: username, full name, age, personal mobile number, password, and optional trusted contact.
  - Backend validation for all credentials; the frontend never independently determines password or OTP validity.
  - Pluggable OTP engine (`ConsoleDevOtpProvider` for local dev; SMS provider interface for production) with 5-minute TTL and 3-attempt lockout.
  - **Complete Forgot-Password Flow**: Identifier submission, anti-enumeration generic responses, OTP verification, secure password reset with Argon2id, single-use `resetTokenHash`, and session revocation via `tokenVersion`.
  - Trusted contact preferences and verified counselling helpline fallback pathway when trusted contact is omitted.
  - Database schema custodianship for Auth and User models.
- **Boundaries**:
  - Does NOT alter conversational chat models or character definitions (owned by Members 2 & 3).
  - Does NOT handle Dump Mode entries or daily reflection logs (owned by Member 4).

### Team Members 2 & 3 (Interactive Mode, AI & Voice Pipeline — Joint Scope)
- **Primary Deliverables (Jointly Shared)**:
  - Multi-character system: user-configurable AI characters with distinct personalities and system prompts.
  - Gemini conversation engine: Server-side API integration, context packing, streaming responses, and bilingual support (English and Tamil `தமிழ்`).
  - Voice processing: Speech-to-Text (STT) and Text-to-Speech (TTS) integration with Tamil support.
  - Vocal Tone Emotion Analysis: Dataset ingestion, preprocessing, training/fine-tuning, evaluation metrics, and standalone inference serving.
  - Structured Emotion Contract generation: Producing the exact JSON contract consumed by the Owner's avatar module.
  - 30-Day conversation retention and rolling semantic summarization worker.
  - Safety assessment: Immediate safety triage for acute distress and rolling 7-day safety reflection rules.
- **Boundaries**:
  - Must deliver against the agreed contract in [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).
  - Must coordinate submodule allocation with the Lead before dividing code directories.

### Team Member 4 (Dump Mode, Notifications & Helplines)
- **Primary Deliverables**:
  - Private Dump Mode: Unguided journaling space supporting text and voice-to-text entries. Full entry management (create, view, rename, delete). **Zero automated AI advice or replies in Dump Mode**.
  - Daily mood (1-5) and sleep-duration tracking dials and trends interface.
  - Missing data rule: Days without logs have no row created in `DailyMoodLog` and are **never** interpreted as depressive episodes or distress.
  - Notification Subsystem: Separation of notification delivery infrastructure from policy rules. Friendly, supportive reminders dispatched when Dump Mode has been inactive for >24 hours, respecting user opt-in preferences.
  - Shared Helpline Directory: Verified government and crisis hotline database, categorization, and click-to-call (`tel:`) dialer launch without unauthorized automatic calling. New entries default to unverified (`isVerified: false`) until evidence is verified.
- **Boundaries**:
  - Does NOT route private Dump Mode entries into Gemini conversation context or training sets.
  - Does NOT modify core user authentication or OTP validation (owned by Member 1).

---

## 3. Shared Files Governance & Change Protocol

1. [server/prisma/schema.prisma](server/prisma/schema.prisma) (Database Schema):
   - **Primary Custodians**: Member 1 (Auth/User) and Member 4 (Dump/Helpline/Trackers); Members 2 & 3 (Chat/Characters).
   - **Protocol**: Any schema addition or migration requires coordination with all impacted members and sign-off from the Integration Lead.
2. [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) & Shared TypeScript Types ([client/src/types/contracts.ts](client/src/types/contracts.ts)):
   - **Protocol**: If an API contract is altered, the change must be submitted as a separate PR with approvals from both provider and consumer members.
3. [.env.example](.env.example):
   - **Protocol**: Any new environment variable must be documented with clear comments and committed to `.env.example`. Never commit actual secret keys.
4. [client/src/styles/tokens.css](client/src/styles/tokens.css) (Global Design Tokens):
   - **Primary Custodian**: Owner (Lead). Component-level styling lives in component folders; global theme variables require Owner review.
