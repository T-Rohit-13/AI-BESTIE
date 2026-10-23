# TEAM_RULES — INARO Engineering Standards & Workflow

This document outlines operational rules, Git workflow, Pull Request protocols, and quality standards for all four team members and the Integration Lead working on INARO.

---

## 1. Golden Rules of Development

1. **`main` is Protected**: Never push directly to `main`. Every change enters through a reviewed, tested Pull Request.
2. **Strict Scope Isolation**: Work only within your assigned modules as defined in [TEAM_OWNERSHIP.md](TEAM_OWNERSHIP.md).
3. **Members 2 & 3 Joint Scope Coordination**: Submodule tasks between Member 2 and Member 3 must be agreed upon and confirmed with the Integration Lead before implementation.
4. **No Direct Secret Commits**: Never commit API keys, passwords, `.env` files, or production credentials. Use [.env.example](.env.example) for documentation.
5. **Contract-First Development**: Frontends and backends must strictly adhere to the contracts documented in [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).
6. **No Medical Claims in Code**: Code, UI labels, and comments must never refer to emotion predictions or tone analysis as "medical diagnoses" or "depression detection".

---

## 2. Git Branching Strategy

All team members branch off the latest `main`:

```bash
# Update local main
git checkout main
git pull origin main

# Create a scoped feature branch
git checkout -b <type>/<member-or-role>-<short-description>
```

### Branch Naming Convention

| Branch Type | Syntax | Examples |
| :--- | :--- | :--- |
| **Feature** | `feat/<member>-<topic>` | `feat/m1-otp-verification`, `feat/m2-gemini-streaming`, `feat/m3-vocal-emotion`, `feat/m4-dump-audio` |
| **Bug Fix** | `fix/<member>-<topic>` | `fix/m1-jwt-cookie-path`, `fix/m3-spectrogram-padding`, `fix/m4-notif-cron` |
| **Documentation** | `docs/<topic>` | `docs/update-api-contracts`, `docs/setup-guide` |
| **Lead / Architecture**| `owner/<topic>` | `owner/avatar-viseme-sync`, `owner/theme-tokens` |

---

## 3. Commit Message Standards

We follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

[optional body]
```

- **Allowed Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- **Scopes**: `auth`, `chat`, `voice`, `dump`, `tracker`, `avatar`, `helpline`, `db`, `infra`.
- **Examples**:
  - `feat(auth): implement pluggable console OTP provider and forgot-password flow`
  - `fix(voice): normalize sample rate to 16kHz before feature extraction`
  - `docs(api): document 7-day rolling safety rules and helpline fallback`

---

## 4. Pull Request Requirements & Review Process

Before opening a Pull Request:
1. Ensure your branch is rebased or merged with the latest `main`.
2. Verify that there are no uncommitted files or console errors.
3. Run linting and test checks locally.

### PR Checklist (Mandatory for PR Description)
- [ ] PR title follows conventional commits.
- [ ] Only changes within the member's assigned scope are included.
- [ ] All new endpoints/types conform to [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).
- [ ] No secrets or `.env` files are included.
- [ ] Database schema changes (if any) are accompanied by a clean Prisma migration and have been reviewed by affected module owners.
- [ ] Local tests have passed.

### Approval Rules
- **At least ONE peer review approval** is required from another team member.
- **FINAL APPROVAL from the Integration Lead (Owner)** is required for merging into `main`.
- Self-merging without approval is strictly prohibited.

---

## 5. Synchronizing with `main` and Resolving Conflicts

To prevent large merge conflicts:
- Synchronize your branch with `main` at least once daily:
  ```bash
  git fetch origin
  git merge origin/main
  ```
- If a merge conflict occurs:
  1. Inspect the conflicting lines carefully.
  2. If the conflict touches shared files (e.g. `schema.prisma` or `App.tsx`), coordinate directly with the co-author before resolving.
  3. Never use `--ours` or `--theirs` blindly.
  4. Test that the project builds cleanly after resolving conflicts.

---

## 6. Secrets & Security Policy

- Store all credentials in `.env` (which is git-ignored).
- If an API key or token is accidentally committed:
  1. Revoke the key immediately in the respective developer console.
  2. Inform the Integration Lead.
  3. Rebase the commit history to remove the secret before pushing.
