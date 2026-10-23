# INARO — Comprehensive Testing Strategy & Quality Assurance

This document defines testing methodologies, automated quality gates, contract verification suites, and safety test cases required across the INARO project.

---

## 1. Testing Pyramid & Tooling

| Level | Scope | Framework / Tool | Responsible Members |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Helper functions, validators, password hashing, token logic | Vitest (Client), Jest (Server), PyTest (ML Service) | All Members |
| **Contract Tests** | API endpoint schemas, request/response validation | Supertest + Zod schema validation | Member 1 (Auth), Members 2 & 3 (Chat/ML), Member 4 (Dump/Notif) |
| **ML Model Evaluation** | Audio accuracy, Macro F1, confusion matrices | PyTest, Scikit-learn, Torch | Members 2 & 3 (Joint Scope) |
| **Integration Tests** | Auth flow, Gemini dialog stream, Dump Mode isolation | Supertest, React Testing Library | Owner & All Members |
| **Safety & Crisis Gates** | Verification of immediate overlays & 7-day evaluations | Custom crisis test suite | Members 2 & 3 (Joint Scope) & Owner |

---

## 2. Critical Safety & Ethical Test Cases

### 2.1 Crisis Intervention Verification (Immediate Tier)
- **Test Objective**: Verify that when a user expresses acute distress, the application immediately serves the verified helpline resource overlay.
- **Assertion**:
  - `safety_assessment.requires_intervention === true`
  - `safety_assessment.severity_level === "RED"`
  - UI displays click-to-call buttons for verified crisis hotlines.
  - No moralizing, clinical, or dismissive text is returned by the AI.

### 2.2 Seven-Day Rolling Safety Rule Verification
- **Test Objective**: Verify that the rolling 7-day safety analyzer follows exact thresholds without diagnosing the user.
- **Missing Data Semantics**:
  - Missing days mean **no row exists** in `DailyMoodLog`.
  - The evaluator ignores missing days completely. Missing days are not imputed as negative mood, not counted toward the flagged days numerator, and not treated as indicators of distress.
- **Test Scenarios**:
  - **Scenario A (Fewer than 4 days)**: User has 2 low-mood days in past 7 days $\to$ `evaluation_tier` is `"STANDARD_SUPPORT"`, no elevated safety prompt is shown.
  - **Scenario B (Exactly 4 days)**: User has 4 low-mood days $\to$ `evaluation_tier` is `"MODERATE_SUPPORT"`, prompts supportive reflection.
  - **Scenario C (More than 4 days)**: User has 5–7 low-mood days $\to$ `evaluation_tier` is `"ELEVATED_SUPPORT"`, prompts helpline resource review and optional trusted-contact outreach.
  - **Scenario D (Missing Logs)**: User logged on 3 days (all low) and missed 4 days (no rows) $\to$ `flagged_days_count` is 3 (NOT 7), `evaluation_tier` remains `"STANDARD_SUPPORT"`.
  - **Scenario E (Non-Clinical Language)**: Assert that response payload and UI strings never contain words like "diagnosis", "depressed", or "disorder".

### 2.3 Forgot-Password Security Verification (Member 1)
- **Test Objective**: Verify that the forgot-password flow is secure and prevents account enumeration.
- **Test Scenarios**:
  - **Anti-Enumeration**: POST `/api/v1/auth/forgot-password` with an existing user vs non-existing user returns identical HTTP 200 status and generic message.
  - **OTP Expiry**: Submitting an OTP after 5 minutes returns HTTP 400 with `OTP_EXPIRED`.
  - **Attempt Limit**: Submitting 3 incorrect OTP attempts locks the OTP record and requires initiating a new request.
  - **Single-Use Reset Token**: After password reset, reusing the `resetToken` returns HTTP 401 Unauthorized.
  - **Session Invalidation**: Completing a password reset increments `User.tokenVersion`, invalidating previously issued JWT access tokens.

### 2.4 Dump Mode Data Isolation Verification (Member 4)
- **Test Objective**: Guarantee that Dump Mode entries remain private.
- **Assertion**:
  - `POST /api/v1/dump/entries` creates an entry with zero automated replies.
  - User A cannot access User B's dump entries (`GET /api/v1/dump/entries/:id` returns `404 Not Found` or `403 Forbidden`).
  - Dump entries are never passed into Gemini's context window.

---

## 3. Mock Providers for Local Development

To allow offline development and testing without third-party API dependencies:

1. **Mock OTP Provider (`ConsoleDevOtpProvider`)**:
   - Generates deterministic 6-digit OTP codes and outputs them to the server console log.
   - Bypasses external SMS gateway costs during unit and integration test runs.
2. **Mock Gemini Chat Provider (`MockGeminiProvider`)**:
   - Implements the `IChatProvider` interface.
   - Returns simulated conversational responses and emotion flags without consuming Gemini API tokens during CI test runs.
