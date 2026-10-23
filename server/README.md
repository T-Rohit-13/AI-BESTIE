# INARO — Dump Mode Backend API (Member 4)

Dump Mode is an unguided, strictly confidential journaling sanctuary for teenagers and college students within **INARO**. It allows users to write their feelings freely without fear of judgment, automated critiques, or AI advice.

---

## 1. Authentication & Security

All Dump Mode routes require authenticated requests.

Dump Mode uses an upstream authentication gate that attaches:
```javascript
req.user.id
```
- If `req.user.id` is missing or empty, the API returns **`401 Unauthorized`**:
  ```json
  {
    "error": "Authentication required"
  }
  ```
- **Privacy & Isolation Rule**: `user_id` is never accepted from the request body, URL, or query parameters. All queries are strictly scoped to `req.user.id`.
- User A can never view, mutate, or delete entries belonging to User B.

---

## 2. Encryption at Rest (AES-256-GCM)

All journal entry text is encrypted before being stored in PostgreSQL using **`AES-256-GCM`** authenticated encryption with a versioned header:

```text
v1:<12-byte-iv-hex>:<ciphertext-hex>:<16-byte-authTag-hex>
```

- **Environment Variable**: `DUMP_ENCRYPTION_KEY`
- Plaintext is decrypted only when returning entries to the authenticated owner.
- Decrypted text is never logged, never included in error messages, and never exposed to analytics or external AI models.

---

## 3. API Endpoints Reference

Base Paths: `/dump` or `/api/v1/dump`

### 3.1 Get Dump Space Name
* **Method / Path**: `GET /dump/space-name`
* **Success Response (`200 OK`)**:
  ```json
  {
    "name": "My Dump"
  }
  ```

---

### 3.2 Rename Dump Space
* **Method / Path**: `PUT /dump/space-name`
* **Rate Limited**: Yes
* **Request Body**:
  ```json
  {
    "name": "My Night Sanctuary"
  }
  ```
* **Validation**:
  - Trims leading/trailing whitespace.
  - Rejects empty strings or strings > 40 characters.
* **Success Response (`200 OK`)**:
  ```json
  {
    "name": "My Night Sanctuary"
  }
  ```
* **Error Response (`400 Bad Request`)**:
  ```json
  {
    "error": "Name must be between 1 and 40 characters"
  }
  ```

---

### 3.3 Create Dump Entry
* **Method / Path**: `POST /dump/entries`
* **Rate Limited**: Yes
* **Request Body**:
  ```json
  {
    "text": "Today was honestly exhausting...",
    "mood": 2
  }
  ```
* **Validation**:
  - `text`: Required, trimmed, between 1 and 10,000 characters.
  - `mood`: Optional integer from `1` (Very Low) to `5` (Great).
* **Transactional Guarantee**:
  Entry creation and the update to `users.last_dump_at` happen in a **single atomic database transaction**. `users.last_dump_at` is set to the new entry's `created_at` timestamp for the notification inactivity engine.
* **Success Response (`201 Created`)**:
  ```json
  {
    "id": "entry-uuid-1234",
    "text": "Today was honestly exhausting...",
    "mood": 2,
    "created_at": "2026-10-24T12:30:00.000Z"
  }
  ```
* **Error Responses (`400 Bad Request`)**:
  ```json
  {
    "error": "Text must be between 1 and 10000 characters"
  }
  ```
  ```json
  {
    "error": "Mood must be an integer between 1 and 5"
  }
  ```

---

### 3.4 Get Dump Entries (Cursor Pagination)
* **Method / Path**: `GET /dump/entries`
* **Query Parameters**:
  - `limit`: Optional integer, default `20`, maximum `50`.
  - `cursor`: Optional base64-encoded cursor `{ "createdAt": "...", "id": "..." }`.
* **Sorting**: `created_at DESC, id DESC`.
* **Success Response (`200 OK`)**:
  ```json
  {
    "entries": [
      {
        "id": "entry-uuid-1234",
        "text": "Today was honestly exhausting...",
        "mood": 2,
        "created_at": "2026-10-24T12:30:00.000Z"
      }
    ],
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTI0VDEyOjMwOjAwLjAwMFoiLCJpZCI6ImVudHJ5LXV1aWQtMTIzNCJ9"
  }
  ```
  *(When no more records exist, `nextCursor` is `null`)*.

---

### 3.5 Delete One Dump Entry
* **Method / Path**: `DELETE /dump/entries/:id`
* **Rate Limited**: Yes
* **Behavior**:
  - Enforces `WHERE id = :id AND user_id = req.user.id`.
  - If entry does not exist or belongs to another user, returns `404 Not Found` without revealing ownership.
  - **Important**: Deleting an entry does **not** modify `users.last_dump_at`.
* **Success Response (`204 No Content`)**
* **Error Response (`404 Not Found`)**:
  ```json
  {
    "error": "Entry not found"
  }
  ```

---

### 3.6 Delete All Dump Entries
* **Method / Path**: `DELETE /dump/entries`
* **Rate Limited**: Yes
* **Request Body**:
  ```json
  {
    "confirm": true
  }
  ```
* **Behavior**:
  - Atomically deletes only the authenticated user's entries.
  - Resets `users.last_dump_at = NULL`.
* **Success Response (`204 No Content`)**
* **Error Response (`400 Bad Request`)**:
  ```json
  {
    "error": "Confirmation is required"
  }
  ```

---

## 4. Environment Variables

Configure these in `server/.env` or root `.env`:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/inaro_db?schema=public` |
| `DUMP_ENCRYPTION_KEY` | 32-byte AES-256 key (hex, base64, or string) | `4f8a9b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeef` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:5173` |

---

## 5. Database Migrations

Apply the migration safely to any PostgreSQL database:

```bash
cd server
npx prisma migrate dev --name add_dump_mode
# Or generate client directly
npx prisma generate
```

SQL migration file is located at:
[`server/prisma/migrations/20261024_add_dump_mode/migration.sql`](file:///c:/Users/yogas/IAC/AI-BESTIE/server/prisma/migrations/20261024_add_dump_mode/migration.sql)

---

## 6. Running Tests

Execute the automated test suite covering all 24 security, transaction, encryption, and endpoint cases:

```bash
cd server
npm test
```

---

## 7. Frontend Integration

Frontend clients (such as [`client/src/components/dump/dumpApi.ts`](file:///c:/Users/yogas/IAC/AI-BESTIE/client/src/components/dump/dumpApi.ts)) connect with:
```typescript
const API_BASE = 'http://localhost:5000/api/v1'; // or /dump
// All calls must include authentication credentials (cookie/token)
```
Set `VITE_DUMP_MOCK=false` in `client/.env` to switch from mock mode to this live backend.
