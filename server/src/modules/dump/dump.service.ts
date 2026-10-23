import { IDumpRepository, PrismaDumpRepository } from './dump.repository.js';
import { encryptDumpText, decryptDumpText } from '../../utils/encryption.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface PublicDumpEntry {
  id: string;
  text: string;
  mood: number | null;
  created_at: string;
}

export interface PaginatedDumpEntriesResponse {
  entries: PublicDumpEntry[];
  nextCursor: string | null;
}

export class DumpService {
  constructor(private repository: IDumpRepository = new PrismaDumpRepository()) {}

  async getSpaceName(userId: string): Promise<string> {
    const name = await this.repository.getSpaceName(userId);
    return name || 'My Dump';
  }

  async updateSpaceName(userId: string, name: string): Promise<string> {
    return await this.repository.updateSpaceName(userId, name);
  }

  async createEntry(
    userId: string,
    data: { text: string; mood: number | null }
  ): Promise<PublicDumpEntry> {
    // 1. Encrypt text at rest using AES-256-GCM
    const encryptedText = encryptDumpText(data.text);

    // 2. Persist in transaction and update last_dump_at
    const record = await this.repository.createEntry(userId, {
      encryptedText,
      mood: data.mood,
    });

    // 3. Return response with decrypted text
    return {
      id: record.id,
      text: data.text,
      mood: record.mood,
      created_at: record.createdAt.toISOString(),
    };
  }

  async getEntries(
    userId: string,
    params: { limit: number; cursor?: { createdAt: Date; id: string } }
  ): Promise<PaginatedDumpEntriesResponse> {
    const records = await this.repository.getEntries(userId, params);

    const hasMore = records.length > params.limit;
    const pageRecords = hasMore ? records.slice(0, params.limit) : records;

    const entries: PublicDumpEntry[] = pageRecords.map((rec) => {
      let decryptedText = '';
      try {
        decryptedText = decryptDumpText(rec.text);
      } catch {
        decryptedText = '[Encrypted entry]';
      }

      return {
        id: rec.id,
        text: decryptedText,
        mood: rec.mood,
        created_at: rec.createdAt.toISOString(),
      };
    });

    let nextCursor: string | null = null;
    if (hasMore && pageRecords.length > 0) {
      const lastItem = pageRecords[pageRecords.length - 1];
      const cursorPayload = {
        createdAt: lastItem.createdAt.toISOString(),
        id: lastItem.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorPayload), 'utf8').toString('base64');
    }

    return {
      entries,
      nextCursor,
    };
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const wasDeleted = await this.repository.deleteEntry(userId, entryId);
    if (!wasDeleted) {
      // Do not reveal whether an entry belonging to another user exists
      throw new AppError('Entry not found', 404);
    }
  }

  async deleteAllEntries(userId: string): Promise<void> {
    await this.repository.deleteAllEntries(userId);
  }

  // Repository exposure for tests to verify DB state & last_dump_at
  getRepository(): IDumpRepository {
    return this.repository;
  }
}
