import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { InMemoryDumpRepository } from '../src/modules/dump/dump.repository';
import { DumpService } from '../src/modules/dump/dump.service';

describe('INARO Dump Mode API Endpoints', () => {
  let repository: InMemoryDumpRepository;
  let service: DumpService;
  let app: any;

  const USER_A = 'user-uuid-1111-aaaa';
  const USER_B = 'user-uuid-2222-bbbb';

  beforeEach(() => {
    repository = new InMemoryDumpRepository();
    service = new DumpService(repository);
    app = createApp(service);
  });

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION
  // ---------------------------------------------------------------------------
  describe('Authentication Requirements', () => {
    it('returns 401 Unauthorized if req.user.id is missing', async () => {
      const res = await request(app).get('/dump/space-name');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Authentication required',
      });
    });

    it('returns 401 Unauthorized for POST without authentication', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .send({ text: 'Some private entry' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Authentication required',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. SPACE NAME
  // ---------------------------------------------------------------------------
  describe('Space Name Endpoints (GET & PUT /dump/space-name)', () => {
    it('gets the default space name "My Dump"', async () => {
      const res = await request(app)
        .get('/dump/space-name')
        .set('x-user-id', USER_A);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'My Dump' });
    });

    it('renames the space successfully and trims whitespace', async () => {
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', USER_A)
        .send({ name: '   My Safe Journal   ' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'My Safe Journal' });

      // Verify retrieval returns the updated name
      const getRes = await request(app)
        .get('/dump/space-name')
        .set('x-user-id', USER_A);

      expect(getRes.status).toBe(200);
      expect(getRes.body).toEqual({ name: 'My Safe Journal' });
    });

    it('rejects an empty name with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', USER_A)
        .send({ name: '    ' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Name must be between 1 and 40 characters',
      });
    });

    it('rejects a name longer than 40 characters with 400 Bad Request', async () => {
      const longName = 'A'.repeat(41);
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', USER_A)
        .send({ name: longName });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Name must be between 1 and 40 characters',
      });
    });

    it('ensures User A cannot affect User B space name (User Isolation)', async () => {
      // User A renames their space
      await request(app)
        .put('/dump/space-name')
        .set('x-user-id', USER_A)
        .send({ name: "User A's Sanctuary" });

      // User B retrieves their space
      const resB = await request(app)
        .get('/dump/space-name')
        .set('x-user-id', USER_B);

      expect(resB.status).toBe(200);
      expect(resB.body).toEqual({ name: 'My Dump' });
    });
  });

  // ---------------------------------------------------------------------------
  // 3. CREATE DUMP ENTRY
  // ---------------------------------------------------------------------------
  describe('Create Dump Entry (POST /dump/entries)', () => {
    it('creates a valid entry with mood and returns decrypted text with 201 Created', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({
          text: 'Today was honestly exhausting...',
          mood: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toBe('Today was honestly exhausting...');
      expect(res.body.mood).toBe(2);
      expect(res.body).toHaveProperty('created_at');
    });

    it('creates an entry without mood (optional mood)', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({
          text: 'Just writing freely without choosing a mood.',
        });

      expect(res.status).toBe(201);
      expect(res.body.text).toBe('Just writing freely without choosing a mood.');
      expect(res.body.mood).toBeNull();
    });

    it('rejects empty text with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: '    ' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Text must be between 1 and 10000 characters',
      });
    });

    it('rejects text over 10,000 characters with 400 Bad Request', async () => {
      const longText = 'x'.repeat(10001);
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: longText });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Text must be between 1 and 10000 characters',
      });
    });

    it('rejects invalid mood values (not 1 to 5) with 400 Bad Request', async () => {
      const resLow = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'Valid text', mood: 0 });

      expect(resLow.status).toBe(400);
      expect(resLow.body).toEqual({
        error: 'Mood must be an integer between 1 and 5',
      });

      const resHigh = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'Valid text', mood: 6 });

      expect(resHigh.status).toBe(400);
      expect(resHigh.body).toEqual({
        error: 'Mood must be an integer between 1 and 5',
      });

      const resDecimal = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'Valid text', mood: 3.5 });

      expect(resDecimal.status).toBe(400);
      expect(resDecimal.body).toEqual({
        error: 'Mood must be an integer between 1 and 5',
      });
    });

    it('verifies users.last_dump_at updates atomically to entry created_at', async () => {
      const beforeUser = repository.getUser(USER_A);
      expect(beforeUser.lastDumpAt).toBeNull();

      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'Testing last_dump_at timestamp update' });

      expect(res.status).toBe(201);
      const afterUser = repository.getUser(USER_A);
      expect(afterUser.lastDumpAt).not.toBeNull();
      expect(afterUser.lastDumpAt?.toISOString()).toBe(res.body.created_at);
    });

    it('stores text encrypted in the database at rest (AES-256-GCM)', async () => {
      const secretVent = 'My deepest private thought that should never leak.';

      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: secretVent });

      const rawRecords = repository.getRawEntries();
      expect(rawRecords.length).toBe(1);

      // Verify database stored value is encrypted and does not contain raw plaintext
      expect(rawRecords[0].text).not.toContain(secretVent);
      expect(rawRecords[0].text).toMatch(/^version:1:[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET DUMP ENTRIES
  // ---------------------------------------------------------------------------
  describe('Get Dump Entries (GET /dump/entries)', () => {
    it('retrieves user entries in newest first order', async () => {
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'First entry' });

      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'Second entry' });

      const res = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_A);

      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBe(2);
      expect(res.body.entries[0].text).toBe('Second entry');
      expect(res.body.entries[1].text).toBe('First entry');
    });

    it('enforces User A cannot retrieve User B entries (User Isolation)', async () => {
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: "User A's entry" });

      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_B)
        .send({ text: "User B's entry" });

      const resA = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_A);

      expect(resA.status).toBe(200);
      expect(resA.body.entries.length).toBe(1);
      expect(resA.body.entries[0].text).toBe("User A's entry");

      const resB = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_B);

      expect(resB.status).toBe(200);
      expect(resB.body.entries.length).toBe(1);
      expect(resB.body.entries[0].text).toBe("User B's entry");
    });

    it('supports cursor-based pagination with limit and nextCursor', async () => {
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/dump/entries')
          .set('x-user-id', USER_A)
          .send({ text: `Entry number ${i}` });
      }

      // Fetch page 1 (limit 2)
      const page1 = await request(app)
        .get('/dump/entries?limit=2')
        .set('x-user-id', USER_A);

      expect(page1.status).toBe(200);
      expect(page1.body.entries.length).toBe(2);
      expect(page1.body.nextCursor).not.toBeNull();

      // Fetch page 2 using nextCursor
      const page2 = await request(app)
        .get(`/dump/entries?limit=2&cursor=${encodeURIComponent(page1.body.nextCursor)}`)
        .set('x-user-id', USER_A);

      expect(page2.status).toBe(200);
      expect(page2.body.entries.length).toBe(2);
      expect(page2.body.entries[0].id).not.toBe(page1.body.entries[0].id);
      expect(page2.body.entries[0].id).not.toBe(page1.body.entries[1].id);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. DELETE ONE DUMP ENTRY
  // ---------------------------------------------------------------------------
  describe('Delete One Dump Entry (DELETE /dump/entries/:id)', () => {
    it('allows a user to delete their own entry and returns 204 No Content', async () => {
      const createRes = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'To be deleted' });

      const entryId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/dump/entries/${entryId}`)
        .set('x-user-id', USER_A);

      expect(deleteRes.status).toBe(204);

      // Verify entry is gone
      const getRes = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_A);

      expect(getRes.body.entries.length).toBe(0);
    });

    it('returns 404 when User A attempts to delete User B entry', async () => {
      const createRes = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_B)
        .send({ text: "User B's secret" });

      const entryId = createRes.body.id;

      // User A attempts to delete User B's entry
      const deleteRes = await request(app)
        .delete(`/dump/entries/${entryId}`)
        .set('x-user-id', USER_A);

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body).toEqual({ error: 'Entry not found' });

      // Verify User B's entry still exists
      const getResB = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_B);

      expect(getResB.body.entries.length).toBe(1);
    });

    it('ensures deleting an entry does NOT modify users.last_dump_at', async () => {
      const createRes = await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'Entry to check last_dump_at invariance' });

      const entryTimestamp = createRes.body.created_at;
      const entryId = createRes.body.id;

      expect(repository.getUser(USER_A).lastDumpAt?.toISOString()).toBe(entryTimestamp);

      // Delete the entry
      await request(app)
        .delete(`/dump/entries/${entryId}`)
        .set('x-user-id', USER_A);

      // Spec requirement: Deleting an entry must NOT modify last_dump_at
      expect(repository.getUser(USER_A).lastDumpAt?.toISOString()).toBe(entryTimestamp);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. DELETE ALL DUMP ENTRIES
  // ---------------------------------------------------------------------------
  describe('Delete All Dump Entries (DELETE /dump/entries)', () => {
    it('requires confirmation { "confirm": true } and rejects missing confirmation with 400', async () => {
      const resMissing = await request(app)
        .delete('/dump/entries')
        .set('x-user-id', USER_A)
        .send({});

      expect(resMissing.status).toBe(400);
      expect(resMissing.body).toEqual({ error: 'Confirmation is required' });

      const resFalse = await request(app)
        .delete('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ confirm: false });

      expect(resFalse.status).toBe(400);
      expect(resFalse.body).toEqual({ error: 'Confirmation is required' });
    });

    it('deletes all entries for the user, resets last_dump_at to NULL, and leaves other users unaffected', async () => {
      // User A has 2 entries
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'A1' });
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ text: 'A2' });

      // User B has 1 entry
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', USER_B)
        .send({ text: 'B1' });

      expect(repository.getUser(USER_A).lastDumpAt).not.toBeNull();
      expect(repository.getUser(USER_B).lastDumpAt).not.toBeNull();

      // User A deletes all entries
      const deleteRes = await request(app)
        .delete('/dump/entries')
        .set('x-user-id', USER_A)
        .send({ confirm: true });

      expect(deleteRes.status).toBe(204);

      // User A entries are 0 and last_dump_at is NULL
      const getResA = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_A);
      expect(getResA.body.entries.length).toBe(0);
      expect(repository.getUser(USER_A).lastDumpAt).toBeNull();

      // User B entries and timestamp remain intact
      const getResB = await request(app)
        .get('/dump/entries')
        .set('x-user-id', USER_B);
      expect(getResB.body.entries.length).toBe(1);
      expect(repository.getUser(USER_B).lastDumpAt).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 7. BASE ROUTE COMPATIBILITY (/api/v1/dump)
  // ---------------------------------------------------------------------------
  describe('Route Alias Compatibility (/api/v1/dump/*)', () => {
    it('supports endpoints under /api/v1/dump as well as /dump', async () => {
      const res = await request(app)
        .get('/api/v1/dump/space-name')
        .set('x-user-id', USER_A);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'My Dump' });
    });
  });
});
