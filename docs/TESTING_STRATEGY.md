# INARO — Comprehensive Testing Strategy & Quality Assurance

This document defines testing methodologies, automated quality gates, contract verification suites, and safety test cases required across the INARO project.

---

## 1. Testing Pyramid & Tooling

| Level | Scope | Framework / Tool | Responsible Members |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Helper functions, validators, password hashing, token logic | Vitest (Client), Jest (Server), PyTest (AI Pipeline) | All Members |
| **Contract Tests** | API endpoint schemas, request/response validation | Supertest + Zod schema validation | Member 4 (Auth), Member 2 (Chat), Member 3 (Emotion), Member 5 (Dump) |
| **Emotion Fallback Suite** | Acoustic classification, low-confidence defaults to 'calm' | PyTest, FastAPI TestClient | Member 3 (Audio Pipeline) & Member 1 (Avatar UI) |
| **ML Model Evaluation** | Audio accuracy, Macro F1, confusion matrices | PyTest, Scikit-learn, Librosa | Member 3 (Vocal Tone Microservice) |
| **Integration Tests** | Auth cycle, Gemini dialogue stream, Dump Mode isolation | Supertest, React Testing Library | Member 1 (Lead) & All Members |
| **Safety & Crisis Gates** | Verification of crisis helpline triggers & non-clinical copy | Custom crisis test suite | Member 2 (AI Core), Member 5 (Helpline), Member 1 (Lead) |

---

## 2. Standardized Emotion Analysis & Fallback Testing (Member 3 & Member 1)

### 2.1 Confidence Threshold & Fallback Trigger Test
- **Test Objective**: Ensure that whenever acoustic emotion classification confidence drops below 0.60, the microservice gracefully reverts to `'calm'`.
- **Assertions**:
  ```python
  def test_low_confidence_triggers_calm_fallback(client):
      # Ambiguous / noisy acoustic features
      response = client.post("/api/v1/analyze-emotion", json={
          "pitch_mean": 120.0,
          "energy_rms": 0.005,
          "speech_rate": 1.5
      })
      data = response.json()
      assert response.status_code == 200
      assert data["success"] is True
      assert data["primary_emotion"] == "calm"
      assert data["fallback_triggered"] is True
      assert data["avatar_triggers"]["expression"] == "calm"
  ```

### 2.2 Corrupted Audio Recovery Test
- **Test Objective**: Submitting empty bytes, truncated audio files, or corrupted headers must never crash the service or return HTTP 500.
- **Assertions**:
  - Response returns HTTP 200 OK.
  - `fallback_triggered === true` with descriptive reason.
  - Avatar expression trigger defaults to `"calm"`.

---

## 3. Authentication & Security Testing (Member 4)

### 3.1 Forgot-Password Anti-Enumeration
- **Test Objective**: Verify that submitting an existing vs non-existing identifier returns identical responses to prevent user harvesting.
- **Assertions**:
  - `POST /api/v1/auth/forgot-password` with `"rohit_t"` returns `{ success: true, message: "..." }`.
  - `POST /api/v1/auth/forgot-password` with `"nonexistent_user"` returns identical `{ success: true, message: "..." }`.

### 3.2 OTP Rate Limiting & TTL Enforcement
- Submitting an OTP after 5 minutes returns `400 Bad Request` with `OTP_EXPIRED`.
- Exceeding 3 failed attempts invalidates the record and requires a new OTP request.
- Completing a password reset increments `tokenVersion` on the User document, immediately revoking active JWTs.

---

## 4. Dump Mode Data Privacy & Isolation (Member 5)

### 4.1 Strict Isolation Assertion
- Dump entries are never passed into Gemini's dialogue context window.
- User A cannot access User B's entries (`GET /api/v1/dump/entries/:id` returns `404 Not Found` or `403 Forbidden`).
- Raw dump entries are marked `isEncrypted: true`.

---

## 5. Non-Clinical Language Quality Gate

All user-facing copy, error messages, and documentation must pass automated regex checks:
- Must **NOT** contain: `diagnosis`, `diagnose`, `disorder`, `clinical treatment`, `cure`, or `depressed patient`.
- Must use supportive phrasing: `emotional well-being`, `check-in`, `reflection`, `space to unwind`.
