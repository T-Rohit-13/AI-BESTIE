# INARO — Master API Contracts & Specifications

This document defines the formal request and response schemas, validation rules, error formats, and module ownership for all REST, WebSocket, and microservice interfaces across the INARO application.

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
      { "field": "personalMobile", "issue": "Invalid format" }
    ]
  },
  "timestamp": "2026-10-24T05:30:00.000Z"
}
```

---

## 2. Standardized Emotion Analysis Contract (Member 3 ➔ Member 1 Avatar Controller)

This contract defines the standardized JSON payload produced by the **FastAPI Vocal Emotion Microservice (`ai_pipeline/app.py` - Member 3)** and consumed by the **Frontend Avatar Controller & Theme Engine (`client/src/components/avatar/` - Member 1)** as well as the **Gemini Conversation Engine (Member 2)**.

### 2.1 Analyze Acoustic Emotion Endpoint
- **Method / Endpoint**: `POST /api/v1/analyze-emotion` (or `/api/v1/analyze-audio-file`)
- **Protocol**: HTTP/REST or WebSocket streaming
- **Source**: AI Pipeline Microservice (Port 8000)
- **Consumer**: Express Backend (Port 5000) / React Avatar Controller (Port 5173)

#### Standardized Emotion Analysis Response Payload
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
  "fallback_reason": null,
  "avatar_triggers": {
    "expression": "calm",
    "viseme_intensity": 0.65,
    "eye_contact_rate": 0.85
  },
  "latency_ms": 38.5,
  "timestamp": "2026-10-24T05:30:15.120Z"
}
```

#### Field Specifications & Types

| Field | Type | Description | Range / Values |
| :--- | :--- | :--- | :--- |
| `success` | `boolean` | Indicates whether the inference succeeded. | `true`, `false` |
| `primary_emotion` | `string` | The detected dominant emotion, or `'calm'` if fallback triggered. | `'calm'`, `'happy'`, `'sad'`, `'anxious'`, `'angry'`, `'neutral'` |
| `confidence_scores` | `object` | Normalized softmax probabilities across all 6 emotional states (sum = 1.0). | Each key `0.000` to `1.000` |
| `arousal` | `float` | Acoustic energy / physiological activation indicator. | `0.0` (lethargic) to `1.0` (hyper-aroused) |
| `valence` | `float` | Positivity vs. negativity valence index. | `0.0` (highly distressed) to `1.0` (pleasurable) |
| `fallback_triggered` | `boolean` | Set to `true` when confidence is below threshold or input is noisy/corrupt. | `true`, `false` |
| `fallback_reason` | `string | null` | Human-readable explanation when fallback is activated. | e.g. `"Top confidence (0.42) below threshold (0.60)"` |
| `avatar_triggers.expression` | `string` | Target facial blendshape / SVG expression key for Avatar UI. | `'calm'`, `'happy'`, `'concerned'`, `'neutral'` |
| `avatar_triggers.viseme_intensity`| `float` | Lip-sync mouth openness multiplier. | `0.0` to `1.0` |
| `avatar_triggers.eye_contact_rate`| `float` | Autonomous pupil tracking and blink dampening factor. | `0.0` to `1.0` |
| `latency_ms` | `float` | End-to-end inference processing time in milliseconds. | Typically `< 100ms` |
| `timestamp` | `string` | ISO 8601 UTC timestamp of the inference event. | e.g. `"2026-10-24T05:30:15.120Z"` |

### 2.2 Fallback Triggers & Safety Rules ('calm')

1. **Low Confidence Fallback**:
   - If `max(confidence_scores.values()) < CONFIDENCE_THRESHOLD` (default: `0.60`):
     - The service sets `fallback_triggered: true`.
     - `primary_emotion` defaults unconditionally to `'calm'`.
     - `avatar_triggers.expression` is forced to `'calm'` to maintain a reassuring, stabilizing avatar demeanor.
2. **Degraded Audio / Packet Loss**:
   - If audio buffer is `< 1.0 KB`, contains clipping, or throws an unhandled decoding exception:
     - The service returns a 200 OK with `fallback_triggered: true` and baseline `'calm'` distribution:
       ```json
       {
         "primary_emotion": "calm",
         "confidence_scores": { "calm": 1.0, "happy": 0.0, "sad": 0.0, "anxious": 0.0, "angry": 0.0, "neutral": 0.0 },
         "fallback_triggered": true,
         "fallback_reason": "Audio stream below minimum length threshold. Reverted to safety baseline."
       }
       ```
3. **Frontend Avatar Controller Reaction**:
   - The Avatar UI smoothly interpolates current facial coordinates toward the `'calm'` resting pose over 350ms, preventing jarring visual glitches.

---

## 3. Authentication & User Management (Owner: Member 4)

### 3.1 Register User
- **Method / Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
```json
{
  "username": "rohit_t",
  "name": "Rohit T",
  "age": 22,
  "personalMobile": "9876543210",
  "password": "SecurePassword123!",
  "trustedPersonMobile": "9876543211",
  "location": {
    "state": "Tamil Nadu",
    "country": "India"
  }
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "User registered successfully. Verification OTP dispatched.",
  "data": {
    "userId": "6719dc6a9e144a1b8c2d43e1",
    "personalMobile": "9876543210",
    "isMobileVerified": false,
    "otpExpiresInSeconds": 300
  }
}
```

### 3.2 Verify Registration OTP
- **Method / Endpoint**: `POST /api/v1/auth/verify-otp`
- **Request Body**:
```json
{
  "mobile": "9876543210",
  "otp": "482910",
  "purpose": "REGISTRATION"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Mobile number verified successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6719dc6a9e144a1b8c2d43e1",
      "username": "rohit_t",
      "name": "Rohit T",
      "isMobileVerified": true
    }
  }
}
```

### 3.3 Forgot Password / Request Reset OTP
- **Method / Endpoint**: `POST /api/v1/auth/forgot-password`
- **Request Body**:
```json
{
  "identifier": "9876543210"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "If the account exists, an OTP has been dispatched to the registered mobile."
}
```

---

## 4. Interactive Mode & Character Personas (Owner: Member 2)

### 4.1 Send Dialogue Message
- **Method / Endpoint**: `POST /api/v1/chat/message`
- **Request Body**:
```json
{
  "characterId": "6719dc6a9e144a1b8c2d43f0",
  "text": "I feel overwhelmed with work lately.",
  "detectedEmotion": "anxious",
  "confidence": 0.78
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "reply": "It's completely okay to feel overwhelmed. Let's take a slow breath together. Would you like to break down what's feeling heavy right now?",
  "replyAudioUrl": "/api/v1/tts/stream?id=reply_49204.mp3",
  "avatarCue": "concerned",
  "timestamp": "2026-10-24T05:31:00.000Z"
}
```

---

## 5. Dump Mode, Trackers & Helplines (Owner: Member 5)

### 5.1 Create Dump Entry
- **Method / Endpoint**: `POST /api/v1/dump/entries`
- **Request Body**:
```json
{
  "entryType": "text",
  "content": "Just pouring out my frustration so my head feels lighter.",
  "sentimentTag": "reflective"
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "entryId": "6719dc6a9e144a1b8c2d4401",
  "createdAt": "2026-10-24T05:32:00.000Z"
}
```

### 5.2 Query Verified Helplines
- **Method / Endpoint**: `GET /api/v1/helplines?region=Tamil Nadu`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Tele-MANAS",
      "phone": "14416",
      "region": "India / All States",
      "category": "Mental Health Support",
      "operatingHours": "24/7",
      "isVerified": true
    },
    {
      "name": "Sneha Suicide Prevention Helpline",
      "phone": "044-24640050",
      "region": "Tamil Nadu",
      "category": "Crisis Helpline",
      "operatingHours": "24/7",
      "isVerified": true
    }
  ]
}
```
