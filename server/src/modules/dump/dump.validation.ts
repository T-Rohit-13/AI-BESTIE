import { AppError } from '../../middleware/errorHandler.js';

export interface ValidatedSpaceName {
  name: string;
}

export interface ValidatedCreateEntry {
  text: string;
  mood: number | null;
}

export interface ValidatedPaginationQuery {
  limit: number;
  cursor?: {
    createdAt: Date;
    id: string;
  };
}

export function validateSpaceName(body: any): ValidatedSpaceName {
  if (!body || typeof body !== 'object') {
    throw new AppError('Name must be between 1 and 40 characters', 400);
  }

  const rawName = body.name;
  if (typeof rawName !== 'string') {
    throw new AppError('Name must be between 1 and 40 characters', 400);
  }

  const trimmed = rawName.trim();
  if (trimmed.length < 1 || trimmed.length > 40) {
    throw new AppError('Name must be between 1 and 40 characters', 400);
  }

  return { name: trimmed };
}

export function validateCreateEntry(body: any): ValidatedCreateEntry {
  if (!body || typeof body !== 'object') {
    throw new AppError('Text must be between 1 and 10000 characters', 400);
  }

  const rawText = body.text;
  if (typeof rawText !== 'string') {
    throw new AppError('Text must be between 1 and 10000 characters', 400);
  }

  const trimmed = rawText.trim();
  if (trimmed.length < 1 || trimmed.length > 10000) {
    throw new AppError('Text must be between 1 and 10000 characters', 400);
  }

  let mood: number | null = null;
  if (body.mood !== undefined && body.mood !== null) {
    if (typeof body.mood !== 'number' || !Number.isInteger(body.mood) || body.mood < 1 || body.mood > 5) {
      throw new AppError('Mood must be an integer between 1 and 5', 400);
    }
    mood = body.mood;
  }

  return { text: trimmed, mood };
}

export function validatePaginationQuery(query: any): ValidatedPaginationQuery {
  let limit = 20;

  if (query.limit !== undefined) {
    const parsedLimit = Number(query.limit);
    if (isNaN(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new AppError('Limit must be a positive integer', 400);
    }
    limit = Math.min(parsedLimit, 50);
  }

  let cursor: { createdAt: Date; id: string } | undefined = undefined;

  if (query.cursor !== undefined && typeof query.cursor === 'string' && query.cursor.trim()) {
    try {
      const decodedStr = Buffer.from(query.cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(decodedStr);
      if (parsed && typeof parsed.createdAt === 'string' && typeof parsed.id === 'string') {
        const date = new Date(parsed.createdAt);
        if (!isNaN(date.getTime()) && parsed.id.trim()) {
          cursor = { createdAt: date, id: parsed.id.trim() };
        }
      }
    } catch {
      throw new AppError('Invalid pagination cursor format', 400);
    }

    if (!cursor) {
      throw new AppError('Invalid pagination cursor format', 400);
    }
  }

  return { limit, cursor };
}

export function validateDeleteAll(body: any): void {
  if (!body || typeof body !== 'object' || body.confirm !== true) {
    throw new AppError('Confirmation is required', 400);
  }
}
