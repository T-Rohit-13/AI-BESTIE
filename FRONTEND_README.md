# INARO Frontend — API Contracts & Integration Guide

This document specifies the exact REST API endpoints, HTTP methods, headers, request bodies, and response shapes expected by the **INARO Frontend** (`Interactive Mode`).

---

## 1. Global API Conventions

- **Base URL**: `/api/v1`
- **Authentication**: Sent via `Authorization: Bearer <JWT_ACCESS_TOKEN>` header and/or HTTP-only session cookie (`credentials: "include"`).
- **Session Expiry (401 Unauthorized)**: The frontend immediately catches HTTP 401 and safely redirects the user to `/login`.
- **Standard Error Format**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Sleep duration must be in 0.5 hour increments.",
      "details": [
        { "field": "sleepHours", "issue": "Invalid step interval" }
      ]
    },
    "timestamp": "2026-10-24T00:00:00Z"
  }
  ```

---

## 2. Daily Check-In Form (Isolated Well-Being State)

> [!NOTE]
> Mood is stored **strictly** in daily entry records and is never connected to character personality state.

### 2.1 Get Today's Daily Entry
- **Endpoint**: `GET /api/v1/daily-entries/today`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "entry_98a7c2f1",
      "date": "2026-10-24",
      "sleepHours": 7.5,
      "mood": "Normal",
      "createdAt": "2026-10-24T08:30:00Z",
      "updatedAt": "2026-10-24T08:30:00Z"
    }
  }
  ```
- **No Entry Found (`404 Not Found` or `200 OK` with `data: null`)**: Triggers the Daily Check-in Modal prompt.

### 2.2 Create Daily Entry
- **Endpoint**: `POST /api/v1/daily-entries`
- **Request Body**:
  ```json
  {
    "sleepHours": 7.5,
    "mood": "Happy"
  }
  ```
  - `sleepHours`: Number between `0` and `24`, step `0.5` (e.g. `6.0`, `6.5`, `7.0`).
  - `mood`: Enum string: `"Happy" | "Sad" | "Normal" | "Stressed" | "Anxious" | "Other"`.
- **Success Response (`201 Created` or `200 OK`)**: Returns created `DailyEntry`.

### 2.3 Update Today's Daily Entry (Edit Mode)
- **Endpoint**: `PUT /api/v1/daily-entries/today`
- **Request Body**: Same schema as POST.
- **Success Response (`200 OK`)**: Returns updated `DailyEntry`.

---

## 3. Character Management

### 3.1 List All Characters
- **Endpoint**: `GET /api/v1/characters`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "char_maya",
        "name": "Maya",
        "personalityPreset": "Friendly companion",
        "personalityDescription": "A warm, encouraging presence who listens patiently.",
        "avatarInitial": "M",
        "avatarColor": "from-emerald-500 to-teal-600",
        "createdAt": "2026-10-20T10:00:00Z"
      }
    ]
  }
  ```

### 3.2 Get Single Character
- **Endpoint**: `GET /api/v1/characters/:characterId`
- **Success Response (`200 OK`)**: Returns single `Character` object.

### 3.3 Create Character
- **Endpoint**: `POST /api/v1/characters`
- **Request Body**:
  ```json
  {
    "name": "Leo",
    "personalityPreset": "Funny and humorous",
    "personalityDescription": "Loves lighthearted banter and puns."
  }
  ```
  - `personalityPreset`: `"Friendly companion" | "Mature and understanding companion" | "Gossip partner" | "Funny and humorous" | "Sarcastic" | "Custom"`.
  - `personalityDescription`: Max 250 characters (required if preset is `"Custom"`).
- **Success Response (`201 Created`)**: Returns newly created `Character` with generated `id`.

### 3.4 Update Character
- **Endpoint**: `PUT /api/v1/characters/:characterId`
- **Request Body**: Partial fields (`name`, `personalityPreset`, `personalityDescription`).
- **Success Response (`200 OK`)**: Returns updated `Character`.

### 3.5 Delete Character
- **Endpoint**: `DELETE /api/v1/characters/:characterId`
- **Success Response (`200 OK` or `204 No Content`)**.

---

## 4. WhatsApp-Style Chat & Voice

### 4.1 Get Chat Messages for Character
- **Endpoint**: `GET /api/v1/chat/characters/:characterId/messages`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "msg_001",
        "characterId": "char_maya",
        "sender": "user",
        "text": "Hello Maya",
        "timestamp": "10:30 AM",
        "status": "sent"
      },
      {
        "id": "msg_002",
        "characterId": "char_maya",
        "sender": "ai",
        "text": "Hello! How can I support you today?",
        "timestamp": "10:30 AM",
        "status": "sent",
        "audioUrl": "/api/v1/voice/synthesize/msg_002.wav",
        "audioDuration": 2.5
      }
    ]
  }
  ```

### 4.2 Send Text Message
- **Endpoint**: `POST /api/v1/chat/characters/:characterId/messages`
- **Request Body**:
  ```json
  {
    "textContent": "I had a stressful morning at work.",
    "language": "en"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "messageId": "msg_003",
      "textContent": "I hear that work has felt heavy today. Would you like to unpack what happened?",
      "audioUrl": "/api/v1/voice/synthesize/msg_003.wav",
      "audioDuration": 3.4,
      "emotionRecommendation": "concerned",
      "safetyStatus": "GREEN"
    }
  }
  ```

### 4.3 Send Voice Message
- **Endpoint**: `POST /api/v1/chat/characters/:characterId/voice`
- **Content-Type**: `multipart/form-data`
  - `audio`: Binary audio file (`audio/webm`, `audio/ogg`, or `audio/wav`).
  - `language`: `"en"` or `"ta"`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "messageId": "msg_004",
      "textContent": "It sounds like you need a moment to breathe.",
      "transcript": "User spoke: I am feeling exhausted today.",
      "audioUrl": "/api/v1/voice/synthesize/msg_004.wav",
      "audioDuration": 4.1,
      "emotionRecommendation": "calm"
    }
  }
  ```

### 4.4 Clear Chat History
- **Endpoint**: `DELETE /api/v1/chat/characters/:characterId/messages`
- **Behavior**: Clears visible messages for `characterId`. Must never touch other character chats or daily tracker records.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Chat screen cleared successfully."
  }
  ```

---

## 5. Mental Health Support & Helplines

### 5.1 Get Verified Support Helplines
- **Endpoint**: `GET /api/v1/support-resources`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "help_01",
        "category": "GOVERNMENT",
        "serviceName": "Tele-MANAS",
        "phoneNumber": "14416",
        "description": "24/7 toll-free mental health support.",
        "operatingHours": "24/7",
        "languages": ["English", "Tamil", "Hindi"],
        "region": "National",
        "isVerified": true,
        "dialerUri": "tel:14416"
      }
    ]
  }
  ```

### 5.2 Get Support Status (7-Day Rolling Reflection)
- **Endpoint**: `GET /api/v1/support/status`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "level": "none",
      "evaluationTier": "STANDARD_SUPPORT",
      "flaggedDaysCount": 1,
      "totalDaysEvaluated": 7,
      "disclaimer": "This reflection evaluates recent recorded check-ins and is not a medical or psychiatric diagnosis."
    }
  }
  ```
  - Level values:
    - `"none"`: Standard view, no intrusive alerts.
    - `"four_days"`: Calm banner offering gentle advice ("You may find support helpful").
    - `"above_four_days"`: Prominent highlighted card with tap-to-call helpline buttons.

### 5.3 Trusted Contact Management
- `GET /api/v1/user/trusted-contact`: Returns current contact `{ name, phoneNumber, consentGiven }` or 404/null.
- `PUT /api/v1/user/trusted-contact`: Saves/updates `{ name, phoneNumber, consentGiven: true }`.
- `DELETE /api/v1/user/trusted-contact`: Removes the contact record.
