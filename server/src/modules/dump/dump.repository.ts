import { prisma } from '../../config/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface DumpEntryRecord {
  id: string;
  userId: string;
  text: string;
  mood: number | null;
  createdAt: Date;
}

export interface UserDumpSpaceRecord {
  id: string;
  dumpSpaceName: string;
  lastDumpAt: Date | null;
}

export interface IDumpRepository {
  getSpaceName(userId: string): Promise<string>;
  updateSpaceName(userId: string, name: string): Promise<string>;
  createEntryWithTransaction(
    userId: string,
    encryptedText: string,
    mood?: number | null
  ): Promise<{ id: string; text: string; mood: number | null; createdAt: Date }>;
  getEntries(
    userId: string,
    limit: number,
    cursor?: { createdAt: Date; id: string }
  ): Promise<{
    entries: Array<{ id: string; text: string; mood: number | null; createdAt: Date }>;
    nextCursor: string | null;
  }>;
  deleteEntry(userId: string, entryId: string): Promise<boolean>;
  deleteAllEntriesWithTransaction(userId: string): Promise<void>;
}

/**
 * Prisma (PostgreSQL) Implementation of IDumpRepository
 */
export class PrismaDumpRepository implements IDumpRepository {
  async getSpaceName(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dumpSpaceName: true },
    });
    return user?.dumpSpaceName || 'My Dump';
  }

  async updateSpaceName(userId: string, name: string): Promise<string> {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { dumpSpaceName: name },
      create: {
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        fullName: 'Anonymous User',
        age: 18,
        mobileNumber: `+910000000000_${userId.slice(0, 6)}`,
        passwordHash: 'dummy_hash',
        dumpSpaceName: name,
      },
      select: { dumpSpaceName: true },
    });
    return user.dumpSpaceName;
  }

  async createEntryWithTransaction(
    userId: string,
    encryptedText: string,
    mood?: number | null
  ): Promise<{ id: string; text: string; mood: number | null; createdAt: Date }> {
    return prisma.$transaction(async (tx) => {
      // 1. Ensure user exists
      await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          fullName: 'Anonymous User',
          age: 18,
          mobileNumber: `+910000000000_${userId.slice(0, 6)}`,
          passwordHash: 'dummy_hash',
        },
      });

      // 2. Create dump entry
      const entry = await tx.dumpEntry.create({
        data: {
          id: uuidv4(),
          userId,
          text: encryptedText,
          mood: mood ?? null,
        },
        select: {
          id: true,
          text: true,
          mood: true,
          createdAt: true,
        },
      });

      // 3. Atomically update users.last_dump_at to the newly created entry's createdAt
      await tx.user.update({
        where: { id: userId },
        data: {
          lastDumpAt: entry.createdAt,
        },
      });

      return entry;
    });
  }

  async getEntries(
    userId: string,
    limit: number,
    cursor?: { createdAt: Date; id: string }
  ): Promise<{
    entries: Array<{ id: string; text: string; mood: number | null; createdAt: Date }>;
    nextCursor: string | null;
  }> {
    // Fetch limit + 1 to know if there's a next page
    const take = limit + 1;

    const whereClause: any = { userId };
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

    const items = await prisma.dumpEntry.findMany({
      where: whereClause,
      take,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        text: true,
        mood: true,
        createdAt: true,
      },
    });

    const hasNext = items.length > limit;
    const entries = hasNext ? items.slice(0, limit) : items;

    let nextCursor: string | null = null;
    if (hasNext && entries.length > 0) {
      const last = entries[entries.length - 1];
      // Format cursor as base64 string of createdAt:id
      nextCursor = Buffer.from(`${last.createdAt.toISOString()}:${last.id}`).toString('base64');
    }

    return { entries, nextCursor };
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    const existing = await prisma.dumpEntry.findFirst({
      where: {
        id: entryId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.dumpEntry.delete({
      where: { id: entryId },
    });

    // NOTE: Spec explicitly requires: "Deleting an entry must NOT modify last_dump_at"
    return true;
  }

  async deleteAllEntriesWithTransaction(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all dump entries belonging to the user
      await tx.dumpEntry.deleteMany({
        where: { userId },
      });

      // 2. Set users.last_dump_at = NULL
      await tx.user.updateMany({
        where: { id: userId },
        data: { lastDumpAt: null },
      });
    });
  }
}

/**
 * High-performance In-Memory Implementation of IDumpRepository
 * Guarantees atomic transaction semantics, cursor pagination, and user isolation
 * for offline dev, unit tests, and CI pipelines.
 */
export class InMemoryDumpRepository implements IDumpRepository {
  private users = new Map<string, { dumpSpaceName: string; lastDumpAt: Date | null }>();
  private entries: DumpEntryRecord[] = [];

  // Helper to inspect user state in tests
  getUser(userId: string) {
    return this.users.get(userId) || { dumpSpaceName: 'My Dump', lastDumpAt: null };
  }

  // Helper to inspect raw encrypted entries in tests
  getRawEntries() {
    return [...this.entries];
  }

  clear() {
    this.users.clear();
    this.entries = [];
  }

  async getSpaceName(userId: string): Promise<string> {
    const user = this.users.get(userId);
    return user?.dumpSpaceName || 'My Dump';
  }

  async updateSpaceName(userId: string, name: string): Promise<string> {
    const existing = this.users.get(userId) || { dumpSpaceName: 'My Dump', lastDumpAt: null };
    this.users.set(userId, { ...existing, dumpSpaceName: name });
    return name;
  }

  async createEntryWithTransaction(
    userId: string,
    encryptedText: string,
    mood?: number | null
  ): Promise<{ id: string; text: string; mood: number | null; createdAt: Date }> {
    const createdAt = new Date();
    const entry: DumpEntryRecord = {
      id: uuidv4(),
      userId,
      text: encryptedText,
      mood: mood ?? null,
      createdAt,
    };

    // Transaction: add entry and update user's lastDumpAt
    this.entries.push(entry);

    const user = this.users.get(userId) || { dumpSpaceName: 'My Dump', lastDumpAt: null };
    this.users.set(userId, {
      ...user,
      lastDumpAt: createdAt,
    });

    return {
      id: entry.id,
      text: entry.text,
      mood: entry.mood,
      createdAt: entry.createdAt,
    };
  }

  async getEntries(
    userId: string,
    limit: number,
    cursor?: { createdAt: Date; id: string }
  ): Promise<{
    entries: Array<{ id: string; text: string; mood: number | null; createdAt: Date }>;
    nextCursor: string | null;
  }> {
    // 1. Filter by userId
    let userEntries = this.entries.filter((e) => e.userId === userId);

    // 2. Sort newest first (createdAt DESC, id DESC)
    userEntries.sort((a, b) => {
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id.localeCompare(a.id);
    });

    // 3. Apply cursor filter if provided
    if (cursor) {
      const cursorTime = cursor.createdAt.getTime();
      userEntries = userEntries.filter((e) => {
        const itemTime = e.createdAt.getTime();
        if (itemTime < cursorTime) return true;
        if (itemTime === cursorTime && e.id < cursor.id) return true;
        return false;
      });
    }

    // 4. Paginate
    const hasNext = userEntries.length > limit;
    const pageItems = hasNext ? userEntries.slice(0, limit) : userEntries;

    let nextCursor: string | null = null;
    if (hasNext && pageItems.length > 0) {
      const last = pageItems[pageItems.length - 1];
      nextCursor = Buffer.from(`${last.createdAt.toISOString()}:${last.id}`).toString('base64');
    }

    return {
      entries: pageItems.map((e) => ({
        id: e.id,
        text: e.text,
        mood: e.mood,
        createdAt: e.createdAt,
      })),
      nextCursor,
    };
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    const index = this.entries.findIndex((e) => e.id === entryId && e.userId === userId);
    if (index === -1) {
      return false;
    }

    this.entries.splice(index, 1);
    // Explicit spec requirement: Deleting an entry does NOT touch last_dump_at!
    return true;
  }

  async deleteAllEntriesWithTransaction(userId: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.userId !== userId);
    const user = this.users.get(userId) || { dumpSpaceName: 'My Dump', lastDumpAt: null };
    this.users.set(userId, {
      ...user,
      lastDumpAt: null,
    });
  }
}
