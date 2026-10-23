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

---

# INARO — Dump Mode Backend Notification System (Member 4)

The Notification System delivers **gentle, witty, playful push reminders** when a teenager or college student has not used their private Dump Mode for over 24 hours. It feels like a friendly tap on the shoulder from a supportive friend, with **zero clinical pressure, streak shaming, or guilt trips**.

---

## 1. Core Workflow & Eligibility Rules

The notification background scheduler runs periodically (default: every 1 hour) and evaluates user eligibility:

```text
Scheduled job starts
        ↓
Find eligible users:
  - notifications_enabled = true
  - push_token exists (at least one device)
  - last_dump_at IS NOT NULL (never-dumped users are excluded!)
  - current_time - last_dump_at > 24 hours
  - last_notified_at IS NULL OR current_time - last_notified_at > 24 hours
        ↓
Select rotated witty message (avoids last_dump_notification_message_id)
        ↓
Send push notification via provider
        ↓
If successful:
  Update last_notified_at = current_timestamp
  Update last_dump_notification_message_id = message.id
If failed:
  Do NOT update last_notified_at (preserves eligibility for next retry)
```

### Important Integration Rules
1. **Ownership Boundary**: The Dump Mode backend owns and writes `users.last_dump_at`. The notification system **reads** it and **never** modifies it.
2. **New Users Rule**: Users with `last_dump_at = NULL` have never used Dump Mode. The system **never** sends reminders to these users until they save their first dump.
3. **Frequency & Cooldown**: At most one notification every 24 hours per user.
4. **Strict Privacy**: The notification system **never** reads, inspects, or logs Dump Mode journal entries or mood logs.

---

## 2. Notification API Endpoints

Base Paths: `/notifications` or `/api/v1/notifications`

### 2.1 Update Dump Reminder Preferences
* **Method / Path**: `PUT /notifications/dump-reminders`
* **Authentication**: Required (`req.user.id`)
* **Request Body**:
  ```json
  {
    "enabled": true
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "enabled": true
  }
  ```

### 2.2 Get Dump Reminder Preferences
* **Method / Path**: `GET /notifications/dump-reminders`
* **Authentication**: Required (`req.user.id`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "enabled": true
  }
  ```

### 2.3 Register Push Device Token
* **Method / Path**: `PUT /notifications/push-token`
* **Authentication**: Required (`req.user.id`)
* **Request Body**:
  ```json
  {
    "token": "fcm_device_token_sample_string_12345",
    "platform": "web"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Push token registered successfully"
  }
  ```
* **Privacy Note**: Push tokens are always masked in logs (e.g. `fcm_...2345`).

### 2.4 Unregister Push Device Token
* **Method / Path**: `DELETE /notifications/push-token`
* **Authentication**: Required (`req.user.id`)
* **Request Body**:
  ```json
  {
    "token": "fcm_device_token_sample_string_12345"
  }
  ```

### 2.5 Trigger Notification Job (Manual / Testing / Cron)
* **Method / Path**: `POST /notifications/trigger-job`
* **Authentication**: Required (`req.user.id`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "jobStartedAt": "2026-10-24T01:45:00.000Z",
      "jobCompletedAt": "2026-10-24T01:45:00.045Z",
      "eligibleCount": 3,
      "successCount": 3,
      "failureCount": 0,
      "invalidTokensRemoved": 0,
      "durationMs": 45
    }
  }
  ```

---

## 3. Witty Message Pool & Non-Clinical Safety

The notification pool provides short, casual, supportive reminders:

| Message ID | Notification Text |
| :--- | :--- |
| `tabs-37` | `"Your brain has 37 tabs open. Wanna dump a few? 👀"` |
| `storage-space` | `"Got some thoughts taking up storage space?"` |
| `spill-space` | `"Okay, spill. We've got space. 👀"` |
| `today-episode` | `"Today's episode of 'What even happened today?' is waiting."` |
| `brain-storage` | `"Brain storage almost full. Time for a dump? 🧠"` |
| `thoughts-called` | `"Your thoughts called. They said they're waiting. 👀"` |
| `fine-talk` | `"Somewhere between 'I'm fine' and 'I need to talk about this'... Dump Mode exists."` |
| `mental-clutter` | `"Got a little mental clutter? We've got space."` |

### Rotation Logic
When a user qualifies for a reminder, `selectRotatedMessage(lastMessageId)` excludes the message previously sent to that user, preventing repetitive prompts.

### Non-Clinical Guarantee
Code and prompts **never** include guilt, missed streaks, medical diagnoses, clinical terminology, or psychiatric claims.

---

## 4. Push Notification Provider Abstraction

Delivery is cleanly abstracted behind `IPushNotificationProvider`:
- **`ConsolePushProvider`**: Default provider for local development. Formats notifications with masked tokens to stdout.
- **`MockPushProvider`**: In-memory provider for unit and integration testing.
- **`FcmPushProvider`**: Firebase Cloud Messaging provider for production push delivery.

### Expired / Invalid Tokens Handling
When the provider reports that a token has expired or is invalid (`invalidToken: true`), the repository automatically removes the token from `notification_devices` to avoid repeated failed delivery attempts.

---

## 5. Environment Variables

Configure in `.env`:

```env
# Push Provider ("console" | "mock" | "fcm")
PUSH_PROVIDER=console

# Firebase Cloud Messaging Credentials (when PUSH_PROVIDER=fcm)
FCM_PROJECT_ID=inaro-wellness
FCM_CLIENT_EMAIL=firebase-adminsdk@inaro-wellness.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Scheduler Configuration
ENABLE_NOTIFICATION_SCHEDULER=true
# Check interval in milliseconds (default: 3600000ms = 1 hour)
NOTIFICATION_SCHEDULER_INTERVAL_MS=3600000
```

---

## 6. Running the Scheduler Locally

1. **Integrated Server**: When running `npm run dev`, the server automatically initializes and starts `NotificationScheduler` (unless `ENABLE_NOTIFICATION_SCHEDULER=false`).
2. **Manual Invocations**: Trigger an immediate evaluation anytime via:
   ```bash
   curl -X POST http://localhost:5000/api/v1/notifications/trigger-job -H "x-user-id: <user-id>"
   ```

---

## 7. Running Tests

Run the full automated Vitest test suite covering all 47 Dump Mode and Notification test cases:

```bash
cd server
npm test
```

---

## 8. Frontend Notification Click Integration

When a push notification arrives, the payload contains:

```json
{
  "type": "dump_reminder",
  "route": "/dump"
}
```

The frontend service worker / notification handler should navigate the user directly to the `/dump` route:

```typescript
// Service Worker notificationclick handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/dump';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(route) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(route);
      }
    })
  );
});
```
