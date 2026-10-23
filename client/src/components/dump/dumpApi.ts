/**
 * INARO — Dump Mode API Client Module (dumpApi)
 * Centralizes all Dump Mode operations.
 * 
 * Supports both real backend endpoints and an in-memory Mock Mode.
 * Controlled via environment variable: VITE_DUMP_MOCK
 */

import { DumpEntry } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Mock mode flag: active if VITE_DUMP_MOCK is 'true' or undefined in local preview
const isMockMode = (): boolean => {
  const envVal = import.meta.env.VITE_DUMP_MOCK;
  if (envVal === 'false') return false;
  return true; // Default to mock mode during frontend development
};

// --- In-Memory Mock Store ---
let mockSpaceName = "My Dump";

let mockEntries: DumpEntry[] = [
  {
    id: "mock-entry-1",
    text: "Had a long presentation in class today. My heart was racing the entire time, but I managed to finish it. Glad it's over now.",
    mood: "😴",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
  },
  {
    id: "mock-entry-2",
    text: "Felt like nobody was listening during the group project discussion. Just needed somewhere to put this down so I don't keep replaying it in my head all night.",
    mood: "😔",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() // yesterday
  }
];

// Helper for simulated network delay in mock mode
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const dumpApi = {
  /**
   * Check if mock mode is active
   */
  getIsMock(): boolean {
    return isMockMode();
  },

  /**
   * Get the current Dump space name
   */
  async getSpaceName(): Promise<string> {
    if (isMockMode()) {
      await delay(200);
      return mockSpaceName;
    }

    const res = await fetch(`${API_BASE_URL}/dump/space-name`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to load space name (${res.status})`);
    }

    const data = await res.json();
    return data.name || data.data?.name || "My Dump";
  },

  /**
   * Update the Dump space name
   * PUT /dump/space-name { name: string }
   */
  async updateSpaceName(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Space name cannot be empty");
    }

    if (isMockMode()) {
      await delay(350);
      mockSpaceName = trimmed;
      return mockSpaceName;
    }

    const res = await fetch(`${API_BASE_URL}/dump/space-name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: trimmed })
    });

    if (!res.ok) {
      throw new Error(`Failed to update space name (${res.status})`);
    }

    const data = await res.json();
    return data.name || data.data?.name || trimmed;
  },

  /**
   * Get all past dump entries (Newest -> Oldest)
   * GET /dump/entries
   */
  async getEntries(): Promise<DumpEntry[]> {
    if (isMockMode()) {
      await delay(300);
      // Return sorted newest first
      return [...mockEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const res = await fetch(`${API_BASE_URL}/dump/entries`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to load entries (${res.status})`);
    }

    const data = await res.json();
    const rawList = Array.isArray(data) ? data : data.data || [];
    
    // Normalize properties to ensure { id, text, mood, createdAt }
    return rawList.map((item: any) => ({
      id: item.id || `entry-${Date.now()}`,
      text: item.text || item.content || "",
      mood: item.mood || item.moodTag || undefined,
      createdAt: item.createdAt || new Date().toISOString()
    })).sort(
      (a: DumpEntry, b: DumpEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Create a new dump entry
   * POST /dump/entries { text, mood }
   */
  async createEntry(params: { text: string; mood?: string }): Promise<DumpEntry> {
    const trimmed = params.text.trim();
    if (!trimmed) {
      throw new Error("Entry text cannot be empty");
    }

    if (isMockMode()) {
      await delay(350);
      const newEntry: DumpEntry = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: trimmed,
        mood: params.mood,
        createdAt: new Date().toISOString()
      };
      mockEntries = [newEntry, ...mockEntries];
      return newEntry;
    }

    const res = await fetch(`${API_BASE_URL}/dump/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: trimmed,
        content: trimmed, // Backwards compatible with Prisma DumpEntry.content
        mood: params.mood,
        moodTag: params.mood
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to save dump entry (${res.status})`);
    }

    const data = await res.json();
    const result = data.data || data;
    return {
      id: result.id,
      text: result.text || result.content || trimmed,
      mood: result.mood || result.moodTag || params.mood,
      createdAt: result.createdAt || new Date().toISOString()
    };
  },

  /**
   * Delete a dump entry
   * DELETE /dump/entries/:id
   */
  async deleteEntry(id: string): Promise<void> {
    if (isMockMode()) {
      await delay(300);
      const prevLength = mockEntries.length;
      mockEntries = mockEntries.filter(e => e.id !== id);
      if (mockEntries.length === prevLength) {
        // Entry not found
      }
      return;
    }

    const res = await fetch(`${API_BASE_URL}/dump/entries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to delete entry (${res.status})`);
    }
  }
};
