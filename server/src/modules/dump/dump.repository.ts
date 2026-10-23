import prisma from '../../config/prisma.js';

export interface DumpEntryRecord {
  id: string;
  userId: string;
  text: string; // Encrypted string
  mood: number | null;
  createdAt: Date;
}

export interface CreateDumpEntryParams {
  encryptedText: string;
  mood: number | null;
}

export interface GetEntriesParams {
  limit: number;
  cursor?: {
    createdAt: Date;
    id: string;
  };
}

export interface IDumpRepository {
  getSpaceName(userId: string): Promise<string>;
  updateSpaceName(userId: string, name: string): Promise<string>;
  createEntry(userId: string, params: CreateDumpEntryParams): Promise<DumpEntryRecord>;
  getEntries(userId: string, params: GetEntriesParams): Promise<DumpEntryRecord[]>;
  deleteEntry(userId: string, entryId: string): Promise<boolean>;
  deleteAllEntries(userId: string): Promise<number>;
  getUserLastDumpAt(userId: string): Promise<Date | null>;
}

/**
 * PostgreSQL / Prisma Implementation of Dump Repository
 * Strictly uses transactions for multi-step atomic operations.
 */
export class PrismaDumpRepository implements IDumpRepository {
  /**
   * Helper to ensure user record exists before referencing in tests/dev
   */
  private async ensureUser(userId: string, tx: any = prisma): Promise<void> {
    const existing = await tx.user.findUnique({ where: { id: userId } });
    if (!existing) {
      await tx.user.create({
        data: {
          id: userId,
          username: `user_${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) || 'anonymous'}`,
          fullName: 'Inaro User',
          age: 18,
          mobileNumber: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          passwordHash: 'dummy_hash_for_dump_mode',
        },
      });
    }
  }

  async getSpaceName(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dumpSpaceName: true },
    });

    return user?.dumpSpaceName || 'My Dump';
  }

  async updateSpaceName(userId: string, name: string): Promise<string> {
    await this.ensureUser(userId);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { dumpSpaceName: name },
      select: { dumpSpaceName: true },
    });

    return updated.dumpSpaceName;
  }

  async createEntry(userId: string, params: CreateDumpEntryParams): Promise<DumpEntryRecord> {
    // Atomically create entry and update users.last_dump_at in ONE TRANSACTION
    return await prisma.$transaction(async (tx) => {
      await this.ensureUser(userId, tx);

      const entry = await tx.dumpEntry.create({
        data: {
          userId,
          text: params.encryptedText,
          mood: params.mood,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { lastDumpAt: entry.createdAt },
      });

      return {
        id: entry.id,
        userId: entry.userId,
        text: entry.text,
        mood: entry.mood,
        createdAt: entry.createdAt,
      };
    });
  }

  async getEntries(userId: string, params: GetEntriesParams): Promise<DumpEntryRecord[]> {
    const { limit, cursor } = params;

    const whereClause: any = {
      userId,
    };

    if (cursor) {
      whereClause.OR = [
        {
          createdAt: {
            lt: cursor.createdAt,
          },
        },
        {
          createdAt: cursor.createdAt,
          id: {
            lt: cursor.id,
          },
        },
      ];
    }

    const records = await prisma.dumpEntry.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1, // Fetch +1 to determine if nextCursor exists
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      text: r.text,
      mood: r.mood,
      createdAt: r.createdAt,
    }));
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    // Strictly enforce WHERE id = requested_id AND user_id = req.user.id
    const deleteResult = await prisma.dumpEntry.deleteMany({
      where: {
        id: entryId,
        userId,
      },
    });

    // Does NOT modify last_dump_at
    return deleteResult.count > 0;
  }

  async deleteAllEntries(userId: string): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      const deleteResult = await tx.dumpEntry.deleteMany({
        where: { userId },
      });

      await tx.user.updateMany({
        where: { id: userId },
        data: { lastDumpAt: null },
      });

      return deleteResult.count;
    });
  }

  async getUserLastDumpAt(userId: string): Promise<Date | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastDumpAt: true },
    });
    return user?.lastDumpAt || null;
  }
}

/**
 * Fast, self-contained In-Memory Implementation
 * Guarantees automated test suite and mock runs can verify all transaction
 * and pagination logic even without a running local PostgreSQL instance.
 */
export class InMemoryDumpRepository implements IDumpRepository {
  private users = new Map<string, { dumpSpaceName: string; lastDumpAt: Date | null }>();
  private entries: DumpEntryRecord[] = [];

  private ensureUser(userId: string) {
    if (!this.users.has(userId)) {
      this.users.set(userId, { dumpSpaceName: 'My Dump', lastDumpAt: null });
    }
  }

  async getSpaceName(userId: string): Promise<string> {
    this.ensureUser(userId);
    return this.users.get(userId)?.dumpSpaceName || 'My Dump';
  }

  async updateSpaceName(userId: string, name: string): Promise<string> {
    this.ensureUser(userId);
    const user = this.users.get(userId)!;
    user.dumpSpaceName = name;
    return user.dumpSpaceName;
  }

  async createEntry(userId: string, params: CreateDumpEntryParams): Promise<DumpEntryRecord> {
    this.ensureUser(userId);
    const createdAt = new Date();
    const entry: DumpEntryRecord = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      text: params.encryptedText,
      mood: params.mood,
      createdAt,
    };

    this.entries.push(entry);

    // Atomically update user's lastDumpAt
    const user = this.users.get(userId)!;
    user.lastDumpAt = createdAt;

    return entry;
  }

  async getEntries(userId: string, params: GetEntriesParams): Promise<DumpEntryRecord[]> {
    const { limit, cursor } = params;

    // Filter by userId
    let userEntries = this.entries.filter((e) => e.userId === userId);

    // Sort newest first: created_at DESC, id DESC
    userEntries.sort((a, b) => {
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id.localeCompare(a.id);
    });

    if (cursor) {
      userEntries = userEntries.filter((e) => {
        if (e.createdAt.getTime() < cursor.createdAt.getTime()) return true;
        if (e.createdAt.getTime() === cursor.createdAt.getTime()) {
          return e.id.localeCompare(cursor.id) < 0;
        }
        return false;
      });
    }

    return userEntries.slice(0, limit + 1);
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    const index = this.entries.findIndex((e) => e.id === entryId && e.userId === userId);
    if (index === -1) {
      return false;
    }
    this.entries.splice(index, 1);
    // lastDumpAt must NOT be modified
    return true;
  }

  async deleteAllEntries(userId: string): Promise<number> {
    const initialCount = this.entries.length;
    this.entries = this.entries.filter((e) => e.userId !== userId);
    const deletedCount = initialCount - this.entries.length;

    this.ensureUser(userId);
    const user = this.users.get(userId)!;
    user.lastDumpAt = null;

    return deletedCount;
  }

  async getUserLastDumpAt(userId: string): Promise<Date | null> {
    this.ensureUser(userId);
    return this.users.get(userId)?.lastDumpAt || null;
  }

  // Clear in-memory state between tests
  clear(): void {
    this.users.clear();
    this.entries = [];
  }
}
