/**
 * INARO — Centralized API Client Module
 *
 * Rules:
 * - All authenticated REST APIs under /api/v1
 * - Typed request & response functions
 * - Never place API keys in client code
 * - Attach auth token (Bearer) and send cookies (credentials: include)
 * - Automatic redirect to /login on HTTP 401
 * - Never log message contents to console
 */

import {
  Character,
  CharacterFormData,
  ChatMessage,
  DailyEntry,
  MoodType,
  SupportLevel,
  SupportStatusResponse,
  TrustedContact,
} from '../types/interactive';
import { HelplineResourceItem, DumpEntry, DumpEntriesResponse, DumpSpaceNameResponse } from '../types/contracts';

const API_BASE_URL = '/api/v1';

// In-memory token store (Never expose keys; do not persist sensitive tokens to localStorage)
let inMemoryAuthToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  inMemoryAuthToken = token;
};

export const getAuthToken = (): string | null => {
  return inMemoryAuthToken;
};

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: Array<{ field: string; issue: string }>;

  constructor(message: string, status: number, code?: string, details?: Array<{ field: string; issue: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Redirect on 401 without loops
const handleUnauthorized = () => {
  setAuthToken(null);
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Add JSON Content-Type unless payload is FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach authorization token if present
  const token = getAuthToken();
  if (token && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Support HTTP-only cookies
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      handleUnauthorized();
      throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
    }

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // Response was not JSON
      }

      const message = errorData?.error?.message || errorData?.message || `Request failed with status ${response.status}`;
      const code = errorData?.error?.code || errorData?.code;
      const details = errorData?.error?.details;

      throw new ApiError(message, response.status, code, details);
    }

    // Return null for 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    const json = await response.json();
    // Return json.data if backend follows { success: true, data: ... } standard, else json directly
    if (json && typeof json === 'object' && 'data' in json && (json.success === true || json.success === undefined)) {
      return json.data as T;
    }
    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'A network error occurred. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

// ==========================================
// 1. DAILY CHECK-IN API
// ==========================================

export async function getDailyEntryToday(): Promise<DailyEntry | null> {
  try {
    return await request<DailyEntry>('/daily-entries/today');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createDailyEntry(payload: { sleepHours: number; mood: MoodType }): Promise<DailyEntry> {
  return request<DailyEntry>('/daily-entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDailyEntry(payload: { sleepHours: number; mood: MoodType }): Promise<DailyEntry> {
  return request<DailyEntry>('/daily-entries/today', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 2. CHARACTER MANAGEMENT API
// ==========================================

export async function getCharacters(): Promise<Character[]> {
  return request<Character[]>('/characters');
}

export async function getCharacter(characterId: string): Promise<Character> {
  return request<Character>(`/characters/${characterId}`);
}

export async function createCharacter(payload: CharacterFormData): Promise<Character> {
  return request<Character>('/characters', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCharacter(characterId: string, payload: Partial<CharacterFormData>): Promise<Character> {
  return request<Character>(`/characters/${characterId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCharacter(characterId: string): Promise<void> {
  return request<void>(`/characters/${characterId}`, {
    method: 'DELETE',
  });
}

// ==========================================
// 3 & 4. CHAT & VOICE API
// ==========================================

export interface SendMessageResponse {
  messageId: string;
  textContent: string;
  audioUrl?: string;
  audioDuration?: number;
  transcript?: string;
  emotionRecommendation?: string;
  safetyStatus?: string;
}

export async function getChatMessages(characterId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/chat/characters/${characterId}/messages`);
}

export async function sendChatMessage(characterId: string, textContent: string): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(`/chat/characters/${characterId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      textContent,
      language: 'en',
    }),
  });
}

export async function sendVoiceMessage(characterId: string, audioBlob: Blob): Promise<SendMessageResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_message.webm');
  formData.append('language', 'en');

  return request<SendMessageResponse>(`/chat/characters/${characterId}/voice`, {
    method: 'POST',
    body: formData,
  });
}

export async function clearChatHistory(characterId: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/chat/characters/${characterId}/messages`, {
    method: 'DELETE',
  });
}

// ==========================================
// 6. MENTAL HEALTH SUPPORT & HELPLINES API
// ==========================================

export async function getSupportResources(): Promise<HelplineResourceItem[]> {
  return request<HelplineResourceItem[]>('/support-resources');
}

export async function getSupportStatus(): Promise<SupportStatusResponse> {
  return request<SupportStatusResponse>('/support/status');
}

export async function getTrustedContact(): Promise<TrustedContact | null> {
  try {
    return await request<TrustedContact>('/user/trusted-contact');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveTrustedContact(contact: TrustedContact): Promise<TrustedContact> {
  return request<TrustedContact>('/user/trusted-contact', {
    method: 'PUT',
    body: JSON.stringify(contact),
  });
}

export async function removeTrustedContact(): Promise<void> {
  return request<void>('/user/trusted-contact', {
    method: 'DELETE',
  });
}

// ==========================================
// 7. DUMP MODE API (Member 4)
// ==========================================

export async function getDumpSpaceName(): Promise<DumpSpaceNameResponse> {
  return request<DumpSpaceNameResponse>('/dump/space-name');
}

export async function updateDumpSpaceName(name: string): Promise<DumpSpaceNameResponse> {
  return request<DumpSpaceNameResponse>('/dump/space-name', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function createDumpEntry(payload: { text: string; mood?: number | null }): Promise<DumpEntry> {
  return request<DumpEntry>('/dump/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDumpEntries(params?: { limit?: number; cursor?: string }): Promise<DumpEntriesResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);
  const qStr = query.toString();
  return request<DumpEntriesResponse>(`/dump/entries${qStr ? `?${qStr}` : ''}`);
}

export async function deleteDumpEntry(id: string): Promise<void> {
  return request<void>(`/dump/entries/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteAllDumpEntries(): Promise<void> {
  return request<void>('/dump/entries', {
    method: 'DELETE',
    body: JSON.stringify({ confirm: true }),
  });
}

