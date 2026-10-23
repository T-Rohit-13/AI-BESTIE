## INARO Pull Request Checklist

### 1. General & Ownership
- [ ] PR title follows Conventional Commits format (e.g., `feat(auth): add OTP verification endpoint`).
- [ ] Changes are strictly confined to the author's assigned scope as defined in [TEAM_OWNERSHIP.md](../TEAM_OWNERSHIP.md).
- [ ] No secrets, private credentials, or `.env` files are included in this PR.

### 2. Contract & Schema Compliance
- [ ] All new/modified API endpoints strictly match [docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md).
- [ ] Database changes (if any) are accompanied by a clean Prisma migration and were reviewed by affected module owners and the Lead.
- [ ] Shared TypeScript interfaces in `client/src/types/` have been updated if API contracts changed.

### 3. Testing & Verification
- [ ] Local tests have been executed and passed.
- [ ] If changing AI/ML components: Emotion contract produces expected structure with uppercase `SafetySeverity` (`"GREEN" | "AMBER" | "RED"`).
- [ ] If changing Dump Mode: Verified that no automatic AI feedback or diagnostic scoring is generated.

### 4. Peer Review
- **Assigned Peer Reviewer**: @
- **Integration Lead Reviewer**: @T-Rohit-13
