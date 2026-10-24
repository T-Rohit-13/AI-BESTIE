# TEAM_RULES — INARO Engineering Standards & Workflow

This document outlines mandatory engineering protocols, Git branching strategies, Pull Request review policies, and security rules for all 5 team members working on INARO.

---

## 1. Core Engineering Commandments

1. **Zero Direct Pushes to `main`**: Direct commits and direct pushes to the `main` branch are strictly prohibited and blocked by repository branch protection. All code enters via reviewed Pull Requests.
2. **Mandatory PR Review by Member 1**: Every Pull Request requires explicit review and approval from **Member 1 (Owner & Integration Lead)** prior to merging. PRs altering cross-module boundaries also require approval from the affected module owner.
3. **Strict Feature Branch Naming (`feature/m<N>-<name>`)**: All development branches MUST follow the format `feature/m<N>-<short-description>`, where `<N>` corresponds to your member ID (1 through 5).
4. **Strict Scope Isolation**: Team members must write code only within their assigned directories as documented in [TEAM_OWNERSHIP.md](TEAM_OWNERSHIP.md).
5. **Rigorous `.env` Security Protocols**: Private API keys, MongoDB credentials, JWT secrets, and SMS tokens must **NEVER** be committed to version control. Always use `.env.example` as the canonical template.
6. **Contract-First Development**: Never break or modify an API endpoint without first updating [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) and securing Lead sign-off.
7. **No Medical Claims**: INARO is an empathetic emotional well-being companion, not a clinical diagnostic device. UI copy, code comments, and documentation must never claim to diagnose or cure mental disorders.

---

## 2. Git Branching Strategy

All team members must branch off the latest `main` branch:

```bash
# 1. Synchronize local main
git checkout main
git pull origin main

# 2. Create your assigned feature branch
git checkout -b feature/m<N>-<feature-description>
```

### Branch Naming Conventions

| Branch Pattern | Description | Examples |
| :--- | :--- | :--- |
| `feature/m1-<name>` | Member 1 (Avatar UI & Landing Page) | `feature/m1-avatar-viseme-sync`, `feature/m1-landing-brand-anim` |
| `feature/m2-<name>` | Member 2 (Interactive AI & Gemini) | `feature/m2-gemini-streaming`, `feature/m2-character-prompt-crud` |
| `feature/m3-<name>` | Member 3 (Vocal Tone & Audio Microservice) | `feature/m3-vocal-emotion-onnx`, `feature/m3-edge-tts-synthesis` |
| `feature/m4-<name>` | Member 4 (Auth, User Models & OTP) | `feature/m4-otp-rate-limiting`, `feature/m4-user-model-validation` |
| `feature/m5-<name>` | Member 5 (Dump Mode, Scheduler & Helpline) | `feature/m5-dump-audio-recorder`, `feature/m5-inactivity-reminder-cron` |
| `fix/m<N>-<name>` | Targeted bug fix | `fix/m4-jwt-cookie-samesite`, `fix/m3-audio-sampling-rate` |

---

## 3. Pull Request Review & Merge Protocol

1. **Self-Review**: Run local linting and tests before opening a PR:
   ```bash
   npm run lint
   ```
2. **PR Description**: Fill out the `.github/pull_request_template.md` detailing:
   - Associated Member ID & Scope
   - Summary of changes
   - Manual testing steps executed
   - Confirmation that no `.env` or secrets are included
3. **Required Approvals**:
   - **Member 1 (Owner)** approval is mandatory for all PRs.
   - For interfaces touching multiple modules, the secondary module owner's approval is also required.
4. **Merge Method**: Use **Squash and Merge** to keep the commit history linear and clean. Delete the feature branch immediately after merging.

---

## 4. Environment Variables & Security Protocols

- The root `.gitignore` excludes `.env`, `*.local`, and certificate files.
- If a new environment variable is introduced:
  1. Add the empty or mock placeholder to `.env.example` with a helpful description.
  2. Document which team member owns the credential.
  3. Notify the team in the engineering channel.
- If a secret is accidentally committed:
  - Immediately alert Member 1.
  - Invalidate and rotate the compromised credential in the respective cloud console (Twilio, Google AI Studio, MongoDB Atlas).
  - Rewrite git history using `git filter-repo` to scrub the leak.
