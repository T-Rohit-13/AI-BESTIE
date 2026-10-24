import { IDumpRepository, PrismaDumpRepository, InMemoryDumpRepository } from './dump.repository';
import { encryptDumpText, decryptDumpText } from '../../utils/encryption';

export interface DumpEntryDto {
  id: string;
  text: string;
  mood: number | null;
  created_at: string;
}

export class DumpService {
  private repository: IDumpRepository;

  constructor(repository?: IDumpRepository) {
    // If running in test or if repository injected, use provided repository
    if (repository) {
      this.repository = repository;
    } else if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      this.repository = new InMemoryDumpRepository();
    } else {
      this.repository = new PrismaDumpRepository();
    }
  }

  /**
   * Get the authenticated user's Dump Mode space name
   */
  async getSpaceName(userId: string): Promise<string> {
    if (!userId) {
      throw new Error('Authentication required');
    }
    return this.repository.getSpaceName(userId);
  }

  /**
   * Rename the authenticated user's Dump Mode space
   */
  async renameSpaceName(userId: string, name: string): Promise<string> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (typeof name !== 'string') {
      const err: any = new Error('Name must be between 1 and 40 characters');
      err.status = 400;
      throw err;
    }

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 40) {
      const err: any = new Error('Name must be between 1 and 40 characters');
      err.status = 400;
      throw err;
    }

    return this.repository.updateSpaceName(userId, trimmed);
  }

  /**
   * Create a new Dump Mode entry
   * Encrypts text with AES-256-GCM and updates users.last_dump_at in a single transaction.
   */
  async createEntry(
    userId: string,
    rawText: string,
    mood?: number | null
  ): Promise<DumpEntryDto> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (typeof rawText !== 'string') {
      const err: any = new Error('Text must be between 1 and 10000 characters');
      err.status = 400;
      throw err;
    }

    const trimmedText = rawText.trim();
    if (!trimmedText || trimmedText.length > 10000) {
      const err: any = new Error('Text must be between 1 and 10000 characters');
      err.status = 400;
      throw err;
    }

    // Mood validation: optional, but if supplied must be integer 1 to 5
    if (mood !== undefined && mood !== null) {
      if (typeof mood !== 'number' || !Number.isInteger(mood) || mood < 1 || mood > 5) {
        const err: any = new Error('Mood must be an integer between 1 and 5');
        err.status = 400;
        throw err;
      }
    }

    // 1. Encrypt text at rest with AES-256-GCM
    const encryptedText = encryptDumpText(trimmedText);

    // 2. Perform atomic transaction: insert entry + update users.last_dump_at = entry.createdAt
    const saved = await this.repository.createEntryWithTransaction(
      userId,
      encryptedText,
      mood ?? null
    );

    // 3. Return decrypted text only to the authenticated owner
    return {
      id: saved.id,
      text: trimmedText,
      mood: saved.mood,
      created_at: saved.createdAt.toISOString(),
    };
  }

  /**
   * Retrieve dump entries for the authenticated user with cursor-based pagination
   */
  async getEntries(
    userId: string,
    limitParam?: number,
    cursorParam?: string
  ): Promise<{ entries: DumpEntryDto[]; nextCursor: string | null }> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    // Default limit: 20, Max limit: 50
    let limit = 20;
    if (limitParam && typeof limitParam === 'number' && !isNaN(limitParam)) {
      limit = Math.min(Math.max(1, limitParam), 50);
    }

    // Parse cursor (base64 string of isoCreatedAt:id)
    let parsedCursor: { createdAt: Date; id: string } | undefined;
    if (cursorParam && typeof cursorParam === 'string') {
      try {
        const decoded = Buffer.from(cursorParam, 'base64').toString('utf8');
        const splitIndex = decoded.lastIndexOf(':');
        if (splitIndex > 0) {
          const isoDate = decoded.substring(0, splitIndex);
          const id = decoded.substring(splitIndex + 1);
          const date = new Date(isoDate);
          if (!isNaN(date.getTime()) && id) {
            parsedCursor = { createdAt: date, id };
          }
        }
      } catch {
        // Invalid cursor format: ignore or start from top
      }
    }

    const result = await this.repository.getEntries(userId, limit, parsedCursor);

    // Decrypt text for each entry
    const decryptedEntries: DumpEntryDto[] = result.entries.map((item) => {
      let decryptedText = '';
      try {
        decryptedText = decryptDumpText(item.text);
      } catch {
        // If decryption fails (e.g. unencrypted mock or corrupted tag)
        decryptedText = item.text;
      }

      return {
        id: item.id,
        text: decryptedText,
        mood: item.mood,
        created_at: item.createdAt.toISOString(),
      };
    });

    return {
      entries: decryptedEntries,
      nextCursor: result.nextCursor,
    };
  }

  /**
   * Delete one dump entry belonging to the authenticated user.
   * Does NOT modify last_dump_at.
   */
  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (!entryId || typeof entryId !== 'string') {
      return false;
    }

    return this.repository.deleteEntry(userId, entryId);
  }

  /**
   * Delete all dump entries belonging to the authenticated user.
   * Resets users.last_dump_at = NULL.
   */
  async deleteAllEntries(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    await this.repository.deleteAllEntriesWithTransaction(userId);
  }
}
