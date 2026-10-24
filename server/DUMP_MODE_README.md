# INARO — Dump Mode Backend Documentation

## 1. Feature Purpose & Philosophy

**Dump Mode** is a private, free-form, unguided journaling and expression sanctuary designed for teenagers and college students. 
- **Safe Space for Expression Only**: Users can vent about their day, thoughts, feelings, frustrations, or raw reflections.
- **Zero AI Feedback**: Unlike Interactive Mode, Dump Mode **never** provides advice, analysis, automated replies, motivational messages, or diagnostic evaluation.
- **Strict Privacy**: Entries are encrypted at rest using authenticated **AES-256-GCM** encryption and are only decrypted when viewed by the authenticated owner.
- **Notification Integration**: Every successful dump submission updates `users.last_dump_at` transactionally, allowing the separate notification worker to dispatch gentle inactivity reminders.

---

## 2. Authentication Requirement

All Dump Mode endpoints require authentication.
- Authentication is handled upstream by Team Member 1 (Auth middleware).
- The middleware attaches the authenticated user's ID to `req.user.id`.
- **Client Request Isolation**: Endpoints **never** accept `user_id` from the request body or URL parameters. Every query is strictly scoped to `req.user.id`.
- If `req.user.id` is missing: **`401 Unauthorized`**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

## 3. Environment Variables Configuration

Add the following to your `.env` file in the root or `server/` directory:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inaro_db?schema=public

# AES-256-GCM Encryption Key (Required for Dump Mode encryption at rest)
# Can be a 64-hex string (32 bytes) or a secure random 32+ character passphrase
DUMP_ENCRYPTION_KEY=inaro_secure_aes256_gcm_encryption_key_change_in_production_min_32_chars

# Server Port
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
```

---

## 4. API Endpoints Specification

Base Route: `/dump` (also available via `/api/v1/dump`)

| Method | Endpoint | Description | Rate Limited |
| :--- | :--- | :--- | :--- |
| **PUT** | `/dump/space-name` | Rename authenticated user's Dump space | Yes |
| **GET** | `/dump/space-name` | Get current Dump space name | No |
| **POST** | `/dump/entries` | Create encrypted entry & update `last_dump_at` | Yes |
| **GET** | `/dump/entries` | Get decrypted entries with cursor pagination | No |
| **DELETE** | `/dump/entries/:id` | Delete one entry (preserves `last_dump_at`) | Yes |
| **DELETE** | `/dump/entries` | Delete all entries (resets `last_dump_at` to `null`) | Yes |

---

### Endpoint 1: Rename Dump Space

- **Method**: `PUT`
- **Path**: `/dump/space-name`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "My Diary"
  }
  ```
- **Validation**:
  - Name is trimmed of leading and trailing whitespace.
  - Must be between 1 and 40 characters.
- **Success Response** (`200 OK`):
  ```json
  {
    "name": "My Diary"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Name must be between 1 and 40 characters"}`
  - `401 Unauthorized`: `{"error": "Authentication required"}`

---

### Endpoint 2: Get Dump Space Name

- **Method**: `GET`
- **Path**: `/dump/space-name`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (`200 OK`):
  ```json
  {
    "name": "My Dump"
  }
  ```
  *(Returns `"My Dump"` if no custom name has been set).*

---

### Endpoint 3: Create Dump Entry

- **Method**: `POST`
- **Path**: `/dump/entries`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "text": "Today was honestly exhausting and I felt overwhelmed by college assignments...",
    "mood": 2
  }
  ```
- **Validation**:
  - `text`: Required, string, trimmed length between 1 and 10,000 characters.
  - `mood`: Optional integer from 1 to 5:
    - `1` = Very Low
    - `2` = Low
    - `3` = Neutral
    - `4` = Good
    - `5` = Great
- **Database Transaction**:
  1. Plaintext `text` is encrypted using AES-256-GCM.
  2. In a single atomic transaction:
     - The encrypted entry is inserted into `dump_entries`.
     - The entry's `created_at` timestamp is written to `users.last_dump_at`.
  3. If any step fails, neither the entry nor the timestamp is persisted.
- **Success Response** (`201 Created`):
  ```json
  {
    "id": "c1f72960-9884-48f8-b397-bb1f5a54db68",
    "text": "Today was honestly exhausting and I felt overwhelmed by college assignments...",
    "mood": 2,
    "created_at": "2026-10-24T12:30:00.000Z"
  }
  ```

---

### Endpoint 4: Get Dump Entries

- **Method**: `GET`
- **Path**: `/dump/entries`
- **Query Parameters**:
  - `limit`: Integer, default `20`, maximum `50`.
  - `cursor`: Base64-encoded string representing `createdAt:id` for cursor-based pagination.
- **Sorting**: `created_at DESC`, `id DESC` (newest first).
- **Behavior**:
  - Decrypts each entry's `text` field prior to returning it to the authenticated owner.
  - Generates `nextCursor` if more items are available.
- **Success Response** (`200 OK`):
  ```json
  {
    "entries": [
      {
        "id": "c1f72960-9884-48f8-b397-bb1f5a54db68",
        "text": "Today was honestly exhausting...",
        "mood": 2,
        "created_at": "2026-10-24T12:30:00.000Z"
      }
    ],
    "nextCursor": "MjAyNi0xMC0yNFQxMjozMDowMC4wMDBaOmMxZjcyOTYwLTk4ODQtNDhmOC1iMzk3LWJiMWY1YTU0ZGI2OA=="
  }
  ```
  *(When no more entries exist, `entries: []` and `nextCursor: null` are returned).*

---

### Endpoint 5: Delete One Dump Entry

- **Method**: `DELETE`
- **Path**: `/dump/entries/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Security**: The query strictly enforces `WHERE id = :id AND user_id = req.user.id`.
- **Special Requirement**: Deleting an entry does **NOT** modify `users.last_dump_at`. Even if the latest entry is removed, `last_dump_at` remains intact so the Notification feature accurately reflects the user's last submission activity.
- **Success Response** (`204 No Content`): Empty body.
- **Error Response** (`404 Not Found`):
  ```json
  {
    "error": "Entry not found"
  }
  ```
  *(Returns 404 whether the entry does not exist or belongs to another user, preventing data enumeration).*

---

### Endpoint 6: Delete All Dump Entries

- **Method**: `DELETE`
- **Path**: `/dump/entries`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "confirm": true
  }
  ```
- **Validation**: Body must contain `"confirm": true`. Missing or false values return `400 Bad Request`.
- **Behavior**:
  1. Deletes all entries belonging to the authenticated user from `dump_entries`.
  2. Resets `users.last_dump_at` to `NULL`.
- **Success Response** (`204 No Content`): Empty body.

---

## 5. Security & Encryption Details

### Encryption at Rest (AES-256-GCM)
- Every entry's `text` is encrypted before being persisted to PostgreSQL.
- Ciphertext format:
  ```
  version:1:<hex-iv>:<hex-ciphertext>:<hex-authTag>
  ```
  - **IV**: 12-byte cryptographically secure random nonce (`crypto.randomBytes(12)`).
  - **AuthTag**: 16-byte authenticated tag ensuring tamper detection.
  - **Key**: Derived from `DUMP_ENCRYPTION_KEY` using SHA-256.
- Decryption happens exclusively in-memory when returning entries to the authenticated user.
- **Zero Logging Policy**: Plaintext dump text is never logged, never included in error responses, and never sent to external analytics or LLM models.

---

## 6. Database Migrations

Run database migrations via Prisma:

```powershell
cd server
npx prisma migrate dev --name add_dump_mode
```

Or execute the provided SQL migration directly in PostgreSQL:
`server/prisma/migrations/20261024_add_dump_mode/migration.sql`

```sql
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "dump_space_name" TEXT NOT NULL DEFAULT 'My Dump',
  ADD COLUMN IF NOT EXISTS "last_dump_at" TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS "dump_entries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "mood" INTEGER NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_dump_entries_mood" CHECK ("mood" IS NULL OR ("mood" >= 1 AND "mood" <= 5))
);

CREATE INDEX IF NOT EXISTS "dump_entries_user_id_idx" ON "dump_entries"("user_id");
CREATE INDEX IF NOT EXISTS "dump_entries_user_id_created_at_idx" ON "dump_entries"("user_id", "created_at" DESC, "id" DESC);
```

---

## 7. Running Tests

Run the complete test suite:

```powershell
cd server
npm test
```

The test suite covers:
- **Authentication**: 401 on missing `req.user.id`.
- **Space Name**: Default name, renaming, trimming, validation, user isolation.
- **Entry Creation**: Valid creation, optional mood, validation, transaction verification, AES-256-GCM encryption verification at rest.
- **Entry Retrieval**: Sorting (newest first), user isolation, cursor pagination.
- **Deletion**: Delete single (invariance of `last_dump_at`), 404 on other user's entry, delete all (reset `last_dump_at = NULL`).

---

## 8. Frontend Integration

The frontend client connects via `client/src/services/api.ts`:

```typescript
import {
  getDumpSpaceName,
  updateDumpSpaceName,
  createDumpEntry,
  getDumpEntries,
  deleteDumpEntry,
  deleteAllDumpEntries,
} from './services/api';

// 1. Fetch space name
const { name } = await getDumpSpaceName();

// 2. Rename space
await updateDumpSpaceName('My Private Space');

// 3. Save entry
const newEntry = await createDumpEntry({
  text: 'Vent content...',
  mood: 3,
});

// 4. Retrieve entries
const { entries, nextCursor } = await getDumpEntries({ limit: 20 });

// 5. Delete single entry
await deleteDumpEntry(entryId);

// 6. Delete all entries
await deleteAllDumpEntries();
```
