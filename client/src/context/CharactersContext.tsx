import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Character, CharacterFormData, PersonalityPreset } from '../types/interactive';
import * as api from '../services/api';

interface CharactersContextType {
  characters: Character[];
  isLoading: boolean;
  error: string | null;
  loadCharacters: () => Promise<void>;
  createCharacter: (data: CharacterFormData) => Promise<Character>;
  updateCharacter: (id: string, data: Partial<CharacterFormData>) => Promise<Character>;
  deleteCharacter: (id: string) => Promise<void>;
  getCharacterById: (id: string) => Character | undefined;
}

const CharactersContext = createContext<CharactersContextType | undefined>(undefined);

// Default seed companions to ensure rich experience right out of the box
const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char_maya',
    name: 'Maya',
    personalityPreset: 'Friendly companion',
    personalityDescription: 'A warm, encouraging presence who listens patiently and brings calm perspective to your day.',
    avatarInitial: 'M',
    avatarColor: 'from-emerald-500 to-teal-600',
    avatarStyle: 'zen',
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'char_aravind',
    name: 'Aravind',
    personalityPreset: 'Mature and understanding companion',
    personalityDescription: 'Thoughtful and grounded mentor who offers balanced reflections and steady emotional reassurance.',
    avatarInitial: 'A',
    avatarColor: 'from-sky-500 to-indigo-600',
    avatarStyle: 'calm',
    createdAt: '2026-10-21T10:00:00Z',
  },
  {
    id: 'char_kaviya',
    name: 'Kaviya',
    personalityPreset: 'Funny and humorous',
    personalityDescription: 'Loves lighthearted banter, witty puns, and finding humor in everyday moments to brighten your mood.',
    avatarInitial: 'K',
    avatarColor: 'from-amber-500 to-rose-500',
    avatarStyle: 'happy',
    createdAt: '2026-10-22T10:00:00Z',
  },
];

const PRESET_COLORS: Record<PersonalityPreset, string> = {
  'Friendly companion': 'from-emerald-500 to-teal-600',
  'Mature and understanding companion': 'from-sky-500 to-indigo-600',
  'Gossip partner': 'from-purple-500 to-pink-500',
  'Funny and humorous': 'from-amber-500 to-rose-500',
  'Sarcastic': 'from-cyan-500 to-blue-600',
  'Custom': 'from-violet-500 to-fuchsia-600',
};

export const CharactersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCharacters();
      if (Array.isArray(data) && data.length > 0) {
        setCharacters(data);
      } else {
        // Keep initial seed characters if backend returned empty array
        setCharacters(INITIAL_CHARACTERS);
      }
    } catch {
      // Backend not running yet; use default characters for seamless frontend experience
      setCharacters(INITIAL_CHARACTERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const createCharacter = async (data: CharacterFormData): Promise<Character> => {
    const initial = data.name.trim().charAt(0).toUpperCase() || 'C';
    const color = PRESET_COLORS[data.personalityPreset] || 'from-sky-500 to-indigo-600';

    try {
      const created = await api.createCharacter(data);
      setCharacters((prev) => [...prev, created]);
      return created;
    } catch {
      // Graceful fallback
      const newChar: Character = {
        id: `char_${Date.now()}`,
        name: data.name.trim(),
        personalityPreset: data.personalityPreset,
        personalityDescription: data.personalityDescription,
        avatarInitial: initial,
        avatarColor: color,
        createdAt: new Date().toISOString(),
      };
      setCharacters((prev) => [...prev, newChar]);
      return newChar;
    }
  };

  const updateCharacter = async (id: string, data: Partial<CharacterFormData>): Promise<Character> => {
    try {
      const updated = await api.updateCharacter(id, data);
      setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch {
      let updatedChar: Character | undefined;
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            updatedChar = {
              ...c,
              name: data.name ? data.name.trim() : c.name,
              personalityPreset: data.personalityPreset || c.personalityPreset,
              personalityDescription:
                data.personalityDescription !== undefined
                  ? data.personalityDescription
                  : c.personalityDescription,
              avatarInitial: data.name ? data.name.trim().charAt(0).toUpperCase() : c.avatarInitial,
              avatarColor: data.personalityPreset ? PRESET_COLORS[data.personalityPreset] : c.avatarColor,
              updatedAt: new Date().toISOString(),
            };
            return updatedChar;
          }
          return c;
        })
      );
      if (!updatedChar) throw new Error('Character not found');
      return updatedChar;
    }
  };

  const deleteCharacter = async (id: string): Promise<void> => {
    try {
      await api.deleteCharacter(id);
    } catch {
      // proceed with local removal
    }
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const getCharacterById = (id: string): Character | undefined => {
    return characters.find((c) => c.id === id);
  };

  return (
    <CharactersContext.Provider
      value={{
        characters,
        isLoading,
        error,
        loadCharacters,
        createCharacter,
        updateCharacter,
        deleteCharacter,
        getCharacterById,
      }}
    >
      {children}
    </CharactersContext.Provider>
  );
};

export const useCharacters = (): CharactersContextType => {
  const context = useContext(CharactersContext);
  if (!context) {
    throw new Error('useCharacters must be used within a CharactersProvider');
  }
  return context;
};
