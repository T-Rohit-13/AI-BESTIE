# INARO — Master API Contracts & Specifications

This document defines formal request and response schemas, validation rules, error formats, and module ownership for all REST and WebSocket interfaces across the INARO application.

---

## 1. Global Standards & Error Format

All API responses return JSON and follow standard HTTP status codes.

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The personal mobile number must be a valid 10-digit number.",
    "details": [
      { "field": "mobileNumber", "issue": "Invalid format" }
    ]
  },
  "timestamp": "2026-10-23T22:45:00Z"
}
```

---

## 2. Authentication & User Management (Owner: Member 1)

### 2.1 Register User
- **Method / Endpoint**: `POST /api/v1/auth/register`
- **Purpose**: Creates an inactive account and triggers mobile OTP.
- **Request Body**:
```json
{
  "username": "rohit_t",
  "fullName": "Rohit T",
  "age": 22,
  "mobileNumber": "9876543210",
  "password": "SecurePassword123!",
  "trustedContact": {
    "name": "Sarah",
    "mobileNumber": "9876543211",
    "consentGiven": true
  }
}
```
- **Validation Rules**:
  - `username`: Alphanumeric, 3-20 characters.
  - `age`: Integer between 13 and 120.
  - `mobileNumber`: 10-digit string.
  - `trustedContact`: Optional. If omitted, frontend routes user to the verified counselling helpline pathway.
- **Security & Authorization Rules**:
  - The password is validated on the backend and hashed using Argon2id prior to database insertion.
  - OTP code is generated as a secure 6-digit numeric value, hashed (SHA-256) before storage in `OtpVerification`, and assigned a strict 5-minute TTL (`expiresAt`).
  - Maximum 3 verification attempts permitted before the code is locked and invalidated.
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_101",
    "mobileNumber": "9876543210",
    "otpSent": true,
    "otpExpiresInSeconds": 300
  }
}
```

### 2.2 Verify Mobile OTP
- **Method / Endpoint**: `POST /api/v1/auth/verify-otp`
- **Request Body**:
```json
{
  "mobileNumber": "9876543210",
  "otpCode": "482910",
  "purpose": "REGISTER"
}
```
- **Security & Lifecycle Rules**:
  - Backend verifies matching hash, checks `expiresAt > NOW()`, `attempts < 3`, and `isConsumed == false`.
  - Increments `attempts` counter on invalid match; locks code upon 3 failed attempts.
  - Upon successful match, marks `isConsumed = true` (single-use enforcement) and activates user account.
  - Issues an HTTP-only secure JWT session cookie. The client frontend never decides whether an OTP is valid.
- **Response (`200 OK`)**: Sets HTTP-only secure JWT cookie.

### 2.3 User Login
- **Method / Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "username": "rohit_t",
  "password": "SecurePassword123!"
}
```
- **Security & Authorization Rules**:
  - Backend retrieves user by username, verifies password using Argon2id verify, and checks `isMobileVerified == true`.
  - Issues signed JWT access and refresh tokens embedding current `tokenVersion`.
- **Response (`200 OK`)**: Returns user profile and sets access token cookie.

### 2.4 Forgot Password — Request OTP (Anti-Enumeration)
- **Method / Endpoint**: `POST /api/v1/auth/forgot-password`
- **Purpose**: Initiates password reset for a registered username or mobile number.
- **Request Body**:
```json
{
  "identifier": "rohit_t"
}
```
- **Security Rule (Anti-Account Enumeration)**:
  - The server **always returns HTTP 200 OK** with an identical generic message, whether the account exists or not. This prevents attackers from enumerating registered usernames or numbers.
  - If the account exists, the server generates a 6-digit OTP, stores its SHA-256 hash with a 5-minute TTL, and dispatches the code via the configured OTP provider.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "If an account matching that identifier exists, a verification code has been sent to the registered mobile number."
}
```

### 2.5 Forgot Password — Verify Reset OTP
- **Method / Endpoint**: `POST /api/v1/auth/verify-reset-otp`
- **Request Body**:
```json
{
  "identifier": "rohit_t",
  "otpCode": "482910"
}
```
- **Security & Authorization Rules**:
  - Validates `otpCode` against stored hash, enforcing 5-minute expiry, max 3 attempts, and single-use (`isConsumed == false`).
  - Marks OTP record `isConsumed = true`.
  - Generates a cryptographically secure random reset token (e.g. 32 bytes hex), stores its SHA-256 hash in `OtpVerification.resetTokenHash` with a strict 10-minute TTL (`resetTokenExpiresAt`), and returns the unhashed reset token to the client.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "resetToken": "rst_982bfe8301ac234e8f192837465abcde",
    "expiresInSeconds": 600
  }
}
```

### 2.6 Forgot Password — Complete Password Reset
- **Method / Endpoint**: `POST /api/v1/auth/reset-password`
- **Request Body**:
```json
{
  "resetToken": "rst_982bfe8301ac234e8f192837465abcde",
  "newPassword": "NewSecurePassword123!"
}
```
- **Security & Session Invalidation Rules**:
  - Backend hashes incoming `resetToken` and looks up unconsumed record where `resetTokenExpiresAt > NOW()`.
  - Validates new password complexity (minimum 8 chars, mixed case, number, symbol).
  - Hashes new password with Argon2id and updates `User.passwordHash`.
  - Increments `User.tokenVersion` to **immediately invalidate all active JWT sessions and refresh tokens** across all user devices.
  - Deletes or consumes the reset token so it cannot be reused.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Password has been successfully updated. All active sessions have been invalidated. Please log in with your new password."
}
```

---

## 3. Stable Emotion Analysis Contract (Owner: Members 2 & 3 Joint Scope $\to$ Consumed by Owner Avatar)

Produced by the Vocal Tone Inference Service and conversational sentiment analysis, consumed directly by the AI Avatar rendering engine.

### 3.1 Infer Emotion from Audio
- **Method / Endpoint**: `POST /api/v1/ml/infer-vocal-emotion`
- **Content-Type**: `multipart/form-data` (Binary audio WAV/WebM)
- **Response (`200 OK`)**:
```json
{
  "interaction_id": "int_98a7c2f1",
  "timestamp": "2026-10-23T22:45:00Z",
  "inferred_emotion": {
    "label": "concerned",
    "confidence": 0.88,
    "intensity": 0.75,
    "source": "vocal_tone_model",
    "model_version": "vocal-aer-cnn-v1.2.0"
  },
  "conversational_sentiment": {
    "label": "sad",
    "score": -0.65
  },
  "avatar_visual_hints": {
    "recommended_expression": "concerned",
    "audio_duration_ms": 3400
  },
  "safety_assessment": {
    "requires_intervention": false,
    "severity_level": "GREEN",
    "matched_triggers": []
  }
}
```
- **Safety Severity Values**:
  - `severity_level` must strictly be one of uppercase: `"GREEN" | "AMBER" | "RED"`.
- **Avatar Facial Expression Mapping**:
  - `recommended_expression` must be one of: `["happy", "sad", "calm", "concerned", "surprised", "neutral"]`.
  - **Graceful Fallback**: If confidence < 0.60, model unavailable, or request times out (>500ms), the frontend avatar defaults smoothly to `"calm"`.

---

## 4. Interactive Mode & Character Management (Owner: Members 2 & 3 Joint Scope)

### 4.1 Create Character
- **Method / Endpoint**: `POST /api/v1/characters`
- **Request Body**:
```json
{
  "name": "Maya",
  "avatarStyle": "zen",
  "systemPrompt": "You are Maya, a gentle, reflective listener who provides calm perspectives and never judges.",
  "toneDescription": "Calm, thoughtful, supportive"
}
```

### 4.2 Send Message & Stream Response
- **Method / Endpoint**: `POST /api/v1/chat/characters/:characterId/messages`
- **Request Body**:
```json
{
  "conversationId": "conv_401",
  "textContent": "I've been feeling overwhelmed with work recently.",
  "language": "en"
}
```
- **Response (`200 OK` or Server-Sent Events stream)**:
```json
{
  "success": true,
  "data": {
    "userMessageId": "msg_001",
    "aiResponse": {
      "messageId": "msg_002",
      "textContent": "It sounds like you're carrying a heavy load right now. Do you want to unpack what feels most pressing?",
      "audioUrl": "/api/v1/voice/synthesize/msg_002.wav",
      "emotionRecommendation": "concerned",
      "safetyStatus": "GREEN"
    }
  }
}
```

### 4.3 Clear Conversation History
- **Method / Endpoint**: `DELETE /api/v1/chat/conversations/:conversationId`
- **Purpose**: Immediately purges full message history and summaries for that character upon user request under database transaction locks.

---

## 5. Seven-Day Rolling Safety Evaluation Contract (Owner: Members 2 & 3 Joint Scope)

### 5.1 Get Rolling Safety Assessment
- **Method / Endpoint**: `GET /api/v1/safety/rolling-seven-day`
- **Evaluation Rules & Missing Data Handling**:
  - The evaluator inspects records in `DailyMoodLog` for the preceding 7 calendar days (`[CURRENT_DATE - 6 days, CURRENT_DATE]`).
  - **Missing Daily Records**: When a user misses logging on a date, **no row exists in the database**.
  - **Missing days are strictly ignored**: They are never imputed as negative mood, never counted toward the flagged numerator, and never treated as evidence of depression.
  - Tiers:
    - **Fewer than 4 flagged days (0–3 days)**: `"STANDARD_SUPPORT"`.
    - **Exactly 4 flagged days**: `"MODERATE_SUPPORT"`.
    - **More than 4 flagged days (5–7 days)**: `"ELEVATED_SUPPORT"`.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "window_start": "2026-10-17",
    "window_end": "2026-10-23",
    "total_days_evaluated": 7,
    "days_with_logs": 5,
    "missing_log_days": 2,
    "flagged_days_count": 4,
    "evaluation_tier": "MODERATE_SUPPORT",
    "action_recommended": "DISPLAY_SUPPORTIVE_REFLECTION",
    "suggested_actions": [
      "PROMPT_DUMP_MODE",
      "OFFER_TRUSTED_CONTACT_OUTREACH",
      "SHOW_HELPLINE_OVERLAY"
    ],
    "disclaimer": "This reflection evaluates recent recorded check-ins and is not a medical or psychiatric diagnosis."
  }
}
```

---

## 6. Dump Mode & Daily Trackers (Owner: Member 4)

### 6.1 Create Dump Entry
- **Method / Endpoint**: `POST /api/v1/dump/entries`
- **Request Body**:
```json
{
  "title": "Thoughts before sleep",
  "content": "Just needed to get this out of my head...",
  "moodTag": "exhausted"
}
```
- **Guaranteed Behavior**: Stored strictly as private text. **No AI analysis, critique, or automated response is generated.**

### 6.2 Log Daily Mood & Sleep
- **Method / Endpoint**: `POST /api/v1/tracker/daily-log`
- **Request Body**:
```json
{
  "date": "2026-10-23",
  "moodRating": 4,
  "sleepDurationHours": 7.5
}
```
- **Missing Data Rule**: Days without mood/sleep logs have **no row created**. The system does not backfill missing days or interpret gaps as mental health decline.

---

## 7. Shared Helpline Directory (Owner: Member 4 / All)

### 7.1 Get Verified Helplines
- **Method / Endpoint**: `GET /api/v1/helplines?category=GOVERNMENT&language=Tamil`
- **Verification Rule**: New helpline entries are `isVerified: false` by default. Only numbers with verified documentation approved by administrators can be marked `isVerified: true`.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "help_01",
      "category": "GOVERNMENT",
      "serviceName": "Tele-MANAS (Mental Health Helpline)",
      "phoneNumber": "14416",
      "description": "24/7 toll-free mental health support service by Ministry of Health & Family Welfare.",
      "operatingHours": "24/7",
      "languages": ["Tamil", "English", "Hindi"],
      "region": "National",
      "isVerified": false,
      "dialerUri": "tel:14416"
    },
    {
      "id": "help_02",
      "category": "CRISIS_COUNSELLING",
      "serviceName": "KIRAN Helpline",
      "phoneNumber": "1800-599-0019",
      "description": "Dedicated toll-free mental health rehabilitation helpline.",
      "operatingHours": "24/7",
      "languages": ["Tamil", "English", "Hindi"],
      "region": "National",
      "isVerified": false,
      "dialerUri": "tel:18005990019"
    }
  ]
}
```
- **Dialer Rule**: Frontend triggers `window.location.href = dialerUri`. Never automatically initiates calls without explicit user action.
- **Evidence Requirement**: Phone numbers in development seed data are public reference examples that must be officially verified and documented before marking `isVerified: true`.
