import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { InMemoryDumpRepository } from '../dump.repository.js';
import { decryptDumpText } from '../../../utils/encryption.js';

describe('INARO — Dump Mode Backend Test Suite', () => {
  let memoryRepo: InMemoryDumpRepository;
  let app: any;

  const userA = 'user-uuid-1111-aaaa';
  const userB = 'user-uuid-2222-bbbb';

  beforeEach(() => {
    memoryRepo = new InMemoryDumpRepository();
    app = createApp(memoryRepo);
  });

  // =========================================================================
  // 1. Authentication Tests
  // =========================================================================
  describe('Authentication Gate', () => {
    it('returns 401 Unauthorized when req.user.id is missing', async () => {
      const res = await request(app).get('/dump/space-name');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('rejects unauthenticated requests to write endpoints', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .send({ text: 'Unauthorized thought' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });
  });

  // =========================================================================
  // 2. Space Name Tests
  // =========================================================================
  describe('Dump Space Name (/dump/space-name)', () => {
    it('returns default name "My Dump" when not previously set', async () => {
      const res = await request(app)
        .get('/dump/space-name')
        .set('x-user-id', userA);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'My Dump' });
    });

    it('renames space name successfully', async () => {
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', userA)
        .send({ name: 'Night Journal' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'Night Journal' });

      const getRes = await request(app)
        .get('/dump/space-name')
        .set('x-user-id', userA);
      expect(getRes.body).toEqual({ name: 'Night Journal' });
    });

    it('trims leading and trailing whitespace from space name', async () => {
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', userA)
        .send({ name: '   Calm Corner   ' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'Calm Corner' });
    });

    it('rejects empty space name with 400', async () => {
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', userA)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Name must be between 1 and 40 characters' });
    });

    it('rejects space names longer than 40 characters with 400', async () => {
      const res = await request(app)
        .put('/dump/space-name')
        .set('x-user-id', userA)
        .send({ name: 'A'.repeat(41) });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Name must be between 1 and 40 characters' });
    });

    it('guarantees User A cannot affect User B space name', async () => {
      await request(app)
        .put('/dump/space-name')
        .set('x-user-id', userA)
        .send({ name: "User A Space" });

      await request(app)
        .put('/dump/space-name')
        .set('x-user-id', userB)
        .send({ name: "User B Space" });

      const resA = await request(app).get('/dump/space-name').set('x-user-id', userA);
      const resB = await request(app).get('/dump/space-name').set('x-user-id', userB);

      expect(resA.body).toEqual({ name: "User A Space" });
      expect(resB.body).toEqual({ name: "User B Space" });
    });
  });

  // =========================================================================
  // 3. Create Entry Tests
  // =========================================================================
  describe('Create Dump Entry (POST /dump/entries)', () => {
    it('creates a valid entry with text and mood', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
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

    it('creates entry without mood (optional mood)', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({
          text: 'Just writing thoughts down.',
        });

      expect(res.status).toBe(201);
      expect(res.body.mood).toBeNull();
      expect(res.body.text).toBe('Just writing thoughts down.');
    });

    it('rejects empty text with 400', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({
          text: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Text must be between 1 and 10000 characters' });
    });

    it('rejects text over 10,000 characters with 400', async () => {
      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({
          text: 'X'.repeat(10001),
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Text must be between 1 and 10000 characters' });
    });

    it('rejects invalid mood values (< 1 or > 5 or non-integer) with 400', async () => {
      const resTooLow = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Good day', mood: 0 });
      expect(resTooLow.status).toBe(400);
      expect(resTooLow.body).toEqual({ error: 'Mood must be an integer between 1 and 5' });

      const resTooHigh = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Good day', mood: 6 });
      expect(resTooHigh.status).toBe(400);

      const resFloat = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Good day', mood: 3.5 });
      expect(resFloat.status).toBe(400);
    });

    it('verifies users.last_dump_at updates atomically on entry creation', async () => {
      const initialLastDump = await memoryRepo.getUserLastDumpAt(userA);
      expect(initialLastDump).toBeNull();

      const res = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Testing last_dump_at timestamp' });

      expect(res.status).toBe(201);
      const updatedLastDump = await memoryRepo.getUserLastDumpAt(userA);
      expect(updatedLastDump).not.toBeNull();
      expect(updatedLastDump?.toISOString()).toBe(res.body.created_at);
    });
  });

  // =========================================================================
  // 4. Get Entries & Cursor-based Pagination Tests
  // =========================================================================
  describe('Get Dump Entries (GET /dump/entries)', () => {
    it('returns user own entries sorted newest first', async () => {
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'First older entry' });

      await new Promise(r => setTimeout(r, 10));

      await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Second newer entry' });

      const res = await request(app)
        .get('/dump/entries')
        .set('x-user-id', userA);

      expect(res.status).toBe(200);
      expect(res.body.entries).toHaveLength(2);
      expect(res.body.entries[0].text).toBe('Second newer entry');
      expect(res.body.entries[1].text).toBe('First older entry');
    });

    it('guarantees User A cannot retrieve User B entries', async () => {
      await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Private thought of User A' });

      await request(app)
        .post('/dump/entries')
        .set('x-user-id', userB)
        .send({ text: 'Private thought of User B' });

      const resA = await request(app).get('/dump/entries').set('x-user-id', userA);
      const resB = await request(app).get('/dump/entries').set('x-user-id', userB);

      expect(resA.body.entries).toHaveLength(1);
      expect(resA.body.entries[0].text).toBe('Private thought of User A');

      expect(resB.body.entries).toHaveLength(1);
      expect(resB.body.entries[0].text).toBe('Private thought of User B');
    });

    it('supports cursor-based pagination and nextCursor', async () => {
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/dump/entries')
          .set('x-user-id', userA)
          .send({ text: `Entry ${i}` });
        await new Promise(r => setTimeout(r, 5));
      }

      // Fetch page 1 with limit 2
      const page1 = await request(app)
        .get('/dump/entries?limit=2')
        .set('x-user-id', userA);

      expect(page1.status).toBe(200);
      expect(page1.body.entries).toHaveLength(2);
      expect(page1.body.nextCursor).not.toBeNull();
      expect(page1.body.entries[0].text).toBe('Entry 5');
      expect(page1.body.entries[1].text).toBe('Entry 4');

      // Fetch page 2 using nextCursor
      const page2 = await request(app)
        .get(`/dump/entries?limit=2&cursor=${encodeURIComponent(page1.body.nextCursor)}`)
        .set('x-user-id', userA);

      expect(page2.status).toBe(200);
      expect(page2.body.entries).toHaveLength(2);
      expect(page2.body.nextCursor).not.toBeNull();
      expect(page2.body.entries[0].text).toBe('Entry 3');
      expect(page2.body.entries[1].text).toBe('Entry 2');

      // Fetch final page
      const page3 = await request(app)
        .get(`/dump/entries?limit=2&cursor=${encodeURIComponent(page2.body.nextCursor)}`)
        .set('x-user-id', userA);

      expect(page3.status).toBe(200);
      expect(page3.body.entries).toHaveLength(1);
      expect(page3.body.entries[0].text).toBe('Entry 1');
      expect(page3.body.nextCursor).toBeNull();
    });
  });

  // =========================================================================
  // 5. Delete One Entry Tests
  // =========================================================================
  describe('Delete One Entry (DELETE /dump/entries/:id)', () => {
    it('allows a user to delete their own entry with 204 No Content', async () => {
      const createRes = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'To be deleted' });

      const entryId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/dump/entries/${entryId}`)
        .set('x-user-id', userA);

      expect(deleteRes.status).toBe(204);

      // Verify it is gone
      const listRes = await request(app).get('/dump/entries').set('x-user-id', userA);
      expect(listRes.body.entries).toHaveLength(0);
    });

    it('prevents User A from deleting User B entry and returns 404 without leaking', async () => {
      const createResB = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userB)
        .send({ text: 'User B secret' });

      const entryIdB = createResB.body.id;

      // User A attempts to delete User B's entry
      const deleteRes = await request(app)
        .delete(`/dump/entries/${entryIdB}`)
        .set('x-user-id', userA);

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body).toEqual({ error: 'Entry not found' });

      // Verify User B's entry still exists
      const listResB = await request(app).get('/dump/entries').set('x-user-id', userB);
      expect(listResB.body.entries).toHaveLength(1);
    });

    it('returns 404 for non-existent entry ID', async () => {
      const res = await request(app)
        .delete('/dump/entries/non-existent-uuid')
        .set('x-user-id', userA);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Entry not found' });
    });

    it('does NOT modify last_dump_at when an entry is deleted', async () => {
      const createRes = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: 'Check timestamp retention' });

      const timestampBeforeDelete = await memoryRepo.getUserLastDumpAt(userA);
      expect(timestampBeforeDelete).not.toBeNull();

      // Delete the entry
      await request(app)
        .delete(`/dump/entries/${createRes.body.id}`)
        .set('x-user-id', userA);

      const timestampAfterDelete = await memoryRepo.getUserLastDumpAt(userA);
      expect(timestampAfterDelete).toEqual(timestampBeforeDelete);
    });
  });

  // =========================================================================
  // 6. Delete All Entries Tests
  // =========================================================================
  describe('Delete All Entries (DELETE /dump/entries)', () => {
    it('requires confirmation: { "confirm": true } and rejects with 400 if missing or false', async () => {
      const resMissing = await request(app)
        .delete('/dump/entries')
        .set('x-user-id', userA)
        .send({});
      expect(resMissing.status).toBe(400);
      expect(resMissing.body).toEqual({ error: 'Confirmation is required' });

      const resFalse = await request(app)
        .delete('/dump/entries')
        .set('x-user-id', userA)
        .send({ confirm: false });
      expect(resFalse.status).toBe(400);
      expect(resFalse.body).toEqual({ error: 'Confirmation is required' });
    });

    it('deletes only authenticated user entries and resets last_dump_at to null', async () => {
      // Create entries for User A and User B
      await request(app).post('/dump/entries').set('x-user-id', userA).send({ text: 'A1' });
      await request(app).post('/dump/entries').set('x-user-id', userA).send({ text: 'A2' });
      await request(app).post('/dump/entries').set('x-user-id', userB).send({ text: 'B1' });

      expect(await memoryRepo.getUserLastDumpAt(userA)).not.toBeNull();
      expect(await memoryRepo.getUserLastDumpAt(userB)).not.toBeNull();

      // User A deletes all entries
      const deleteRes = await request(app)
        .delete('/dump/entries')
        .set('x-user-id', userA)
        .send({ confirm: true });

      expect(deleteRes.status).toBe(204);

      // Verify User A has 0 entries and last_dump_at is null
      const listA = await request(app).get('/dump/entries').set('x-user-id', userA);
      expect(listA.body.entries).toHaveLength(0);
      expect(await memoryRepo.getUserLastDumpAt(userA)).toBeNull();

      // Verify User B is completely untouched
      const listB = await request(app).get('/dump/entries').set('x-user-id', userB);
      expect(listB.body.entries).toHaveLength(1);
      expect(listB.body.entries[0].text).toBe('B1');
      expect(await memoryRepo.getUserLastDumpAt(userB)).not.toBeNull();
    });
  });

  // =========================================================================
  // 7. Encryption at Rest Tests
  // =========================================================================
  describe('Encryption at Rest (AES-256-GCM)', () => {
    it('stores text encrypted in repository and decrypts only for authenticated owner', async () => {
      const plaintext = 'Extremely confidential teenage thought #4928';

      const createRes = await request(app)
        .post('/dump/entries')
        .set('x-user-id', userA)
        .send({ text: plaintext });

      expect(createRes.status).toBe(201);
      const entryId = createRes.body.id;

      // Inspect the raw storage record in the repository
      const rawRecords = await memoryRepo.getEntries(userA, { limit: 10 });
      const rawEntry = rawRecords.find(r => r.id === entryId);
      expect(rawEntry).toBeDefined();

      // The raw text must NOT contain the plaintext
      expect(rawEntry!.text).not.toBe(plaintext);
      expect(rawEntry!.text.startsWith('v1:')).toBe(true);

      // Verify it can be decrypted with the encryption utility
      const decrypted = decryptDumpText(rawEntry!.text);
      expect(decrypted).toBe(plaintext);

      // When fetched via API, the owner receives the decrypted text
      const listRes = await request(app).get('/dump/entries').set('x-user-id', userA);
      expect(listRes.body.entries[0].text).toBe(plaintext);

      // Another user (User B) cannot retrieve or access the text
      const listResB = await request(app).get('/dump/entries').set('x-user-id', userB);
      expect(listResB.body.entries).toHaveLength(0);
    });
  });
});
