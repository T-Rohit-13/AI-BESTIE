import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage } from '../types/interactive';
import * as api from '../services/api';

interface ChatContextType {
  getMessages: (characterId: string) => ChatMessage[];
  isResponding: (characterId: string) => boolean;
  sendMessage: (characterId: string, text: string, apiKey?: string) => Promise<void>;
  sendVoiceMessage: (characterId: string, audioBlob: Blob, durationSeconds: number) => Promise<void>;
  retryMessage: (characterId: string, messageId: string) => Promise<void>;
  clearScreen: (characterId: string) => Promise<void>;
  initCharacterChat: (characterId: string, characterName: string, preset: string) => void;
  addCompanionMessage: (characterId: string, text: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Initial greeting tailored to character personality without any persistent storage
const getInitialGreeting = (characterName: string, preset: string): string => {
  switch (preset) {
    case 'Friendly companion':
      return `Hi there! I'm ${characterName}. It's really good to see you today. What's on your mind?`;
    case 'Mature and understanding companion':
      return `Welcome. I'm ${characterName}. Take a deep breath — I'm here to listen whenever you're ready.`;
    case 'Funny and humorous':
      return `Hey hey! ${characterName} in the house. Ready to share what crazy things happened today?`;
    case 'Gossip partner':
      return `Spill the tea! What is the latest update? I want to hear everything!`;
    case 'Sarcastic':
      return `Oh wonderful, another human conversation. Just kidding, I'm ${characterName}. What's the crisis today?`;
    default:
      return `Hello! I'm ${characterName}. How has your day been treating you?`;
  }
};

const CHAT_STORAGE_PREFIX = 'inaro_companion_chat_history_';

const loadSavedMessages = (): Record<string, ChatMessage[]> => {
  if (typeof window === 'undefined') return {};
  const map: Record<string, ChatMessage[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CHAT_STORAGE_PREFIX)) {
        const charId = key.substring(CHAT_STORAGE_PREFIX.length);
        const data = localStorage.getItem(key);
        if (data) {
          map[charId] = JSON.parse(data);
        }
      }
    }
  } catch {}
  return map;
};

const saveMessagesForCharacter = (charId: string, msgs: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}${charId}`, JSON.stringify(msgs));
  } catch {}
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Chat state strictly keyed by characterId and persistent per companion
  const [messagesByCharacter, setMessagesByCharacter] = useState<Record<string, ChatMessage[]>>(() =>
    loadSavedMessages()
  );
  const [respondingByCharacter, setRespondingByCharacter] = useState<Record<string, boolean>>({});

  const getMessages = useCallback(
    (characterId: string): ChatMessage[] => {
      return messagesByCharacter[characterId] || [];
    },
    [messagesByCharacter]
  );

  const isResponding = useCallback(
    (characterId: string): boolean => {
      return !!respondingByCharacter[characterId];
    },
    [respondingByCharacter]
  );

  const initCharacterChat = useCallback(
    (characterId: string, characterName: string, preset: string) => {
      setMessagesByCharacter((prev) => {
        if (prev[characterId] && prev[characterId].length > 0) {
          return prev; // Already initialized with existing chat history
        }
        const initialAiMessage: ChatMessage = {
          id: `msg_init_${characterId}`,
          characterId,
          sender: 'ai',
          text: getInitialGreeting(characterName, preset),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        };
        const updated = [initialAiMessage];
        saveMessagesForCharacter(characterId, updated);
        return {
          ...prev,
          [characterId]: updated,
        };
      });
    },
    []
  );

  const sendMessage = async (characterId: string, text: string, apiKey?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsgId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      characterId,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    // Optimistically add user message
    setMessagesByCharacter((prev) => ({
      ...prev,
      [characterId]: [...(prev[characterId] || []), userMessage],
    }));

    setRespondingByCharacter((prev) => ({ ...prev, [characterId]: true }));

    try {
      const response = await api.sendChatMessage(characterId, trimmed, apiKey);

      // Mark user message as sent
      setMessagesByCharacter((prev) => ({
        ...prev,
        [characterId]: (prev[characterId] || []).map((m) =>
          m.id === userMsgId ? { ...m, status: 'sent' } : m
        ),
      }));

      // Append AI response
      const aiMessage: ChatMessage = {
        id: response.messageId || `ai_${Date.now()}`,
        characterId,
        sender: 'ai',
        text: response.textContent || "I hear you, and I'm right here with you.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUrl: response.audioUrl,
        audioDuration: response.audioDuration,
        status: 'sent',
      };

      setMessagesByCharacter((prev) => ({
        ...prev,
        [characterId]: [...(prev[characterId] || []), aiMessage],
      }));
    } catch {
      // Friendly best friend fallback when backend is unreachable
      const lower = trimmed.toLowerCase();
      let reply = "I hear you! I love that we can talk about anything together like best friends. Tell me more! ✨";
      if (/\b(research|wikipedia|google this|scientific paper|dissertation|academic bibliography|generate image|search web|cite sources)\b/i.test(lower)) {
        reply = "Haha hey, remember I'm your best friend, not Google or a research encyclopedia! 🫂 I'm here to listen to your feelings, vibe with you, talk about your day, and play games. How are you actually feeling right now?";
      } else if (/\b(tic-tac-toe|play|game|would you rather|riddle|word association)\b/i.test(lower)) {
        reply = "Yay, game time! 🎮 I'm ready! Open my Play Games tab to make your move in Tic-Tac-Toe, or ask me Would You Rather or a riddle! ✨";
      } else if (/\b(sad|down|crying|lonely|heartbroken|depressed|hurt|exhausted)\b/i.test(lower)) {
        reply = "I hear you, and I'm right here beside you. 🫂 It's completely okay to feel down. Do you want to vent more about it, or would you like to just sit together quietly? 🌸";
      } else if (/\b(stress|stressed|anxious|anxiety|panic|overwhelmed|exam)\b/i.test(lower)) {
        reply = "Hey, take a slow breath with me right now. Inhale... exhale. 🌸 You don't have to carry the whole world today. We'll take this one tiny step at a time together.";
      } else if (/^(hi|hello|hey|yo|sup)/i.test(lower)) {
        reply = "Hey there! 😄 It's always so comforting seeing you pop in. How's your day treating you today?";
      }

      setTimeout(() => {
        setMessagesByCharacter((prev) => {
          const list = prev[characterId] || [];
          const updated = list.map((m) => (m.id === userMsgId ? { ...m, status: 'sent' as const } : m));
          const aiMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            characterId,
            sender: 'ai',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          };
          const finalList = [...updated, aiMessage];
          try {
            localStorage.setItem(`${CHAT_STORAGE_PREFIX}${characterId}`, JSON.stringify(finalList));
          } catch {}
          return {
            ...prev,
            [characterId]: finalList,
          };
        });
        setRespondingByCharacter((prev) => ({ ...prev, [characterId]: false }));
      }, 700);
      return;
    } finally {
      setRespondingByCharacter((prev) => ({ ...prev, [characterId]: false }));
    }
  };

  const sendVoiceMessage = async (characterId: string, audioBlob: Blob, durationSeconds: number) => {
    const userMsgId = `voice_user_${Date.now()}`;
    const blobUrl = URL.createObjectURL(audioBlob);

    const userVoiceMessage: ChatMessage = {
      id: userMsgId,
      characterId,
      sender: 'user',
      text: 'Voice note',
      audioUrl: blobUrl,
      audioDuration: durationSeconds,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    setMessagesByCharacter((prev) => ({
      ...prev,
      [characterId]: [...(prev[characterId] || []), userVoiceMessage],
    }));

    setRespondingByCharacter((prev) => ({ ...prev, [characterId]: true }));

    try {
      const response = await api.sendVoiceMessage(characterId, audioBlob);

      // Update user voice message
      setMessagesByCharacter((prev) => ({
        ...prev,
        [characterId]: (prev[characterId] || []).map((m) =>
          m.id === userMsgId ? { ...m, status: 'sent' } : m
        ),
      }));

      // Append AI voice response
      const aiVoiceMessage: ChatMessage = {
        id: response.messageId || `ai_voice_${Date.now()}`,
        characterId,
        sender: 'ai',
        text: response.textContent || 'I listened to your voice message carefully.',
        transcript: response.transcript || response.textContent || 'I listened to your voice message carefully.',
        audioUrl: response.audioUrl,
        audioDuration: response.audioDuration || 3.5,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };

      setMessagesByCharacter((prev) => ({
        ...prev,
        [characterId]: [...(prev[characterId] || []), aiVoiceMessage],
      }));
    } catch {
      // Mock demonstration response for voice notes
      setTimeout(() => {
        setMessagesByCharacter((prev) => {
          const list = prev[characterId] || [];
          const updated = list.map((m) => (m.id === userMsgId ? { ...m, status: 'sent' as const } : m));
          const aiVoiceMessage: ChatMessage = {
            id: `ai_voice_${Date.now()}`,
            characterId,
            sender: 'ai',
            text: 'I hear the emotion in your voice. I am right here listening to you.',
            transcript: 'I hear the emotion in your voice. I am right here listening to you.',
            audioDuration: 3,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          };
          return {
            ...prev,
            [characterId]: [...updated, aiVoiceMessage],
          };
        });
        setRespondingByCharacter((prev) => ({ ...prev, [characterId]: false }));
      }, 1000);
      return;
    } finally {
      setRespondingByCharacter((prev) => ({ ...prev, [characterId]: false }));
    }
  };

  const retryMessage = async (characterId: string, messageId: string) => {
    const list = messagesByCharacter[characterId] || [];
    const target = list.find((m) => m.id === messageId);
    if (!target) return;

    // Reset status to sending
    setMessagesByCharacter((prev) => ({
      ...prev,
      [characterId]: (prev[characterId] || []).map((m) =>
        m.id === messageId ? { ...m, status: 'sending', errorMessage: undefined } : m
      ),
    }));

    if (target.audioUrl) {
      // Re-trigger voice note
      return;
    } else {
      await sendMessage(characterId, target.text);
    }
  };

  const clearScreen = async (characterId: string) => {
    try {
      await api.clearChatHistory(characterId);
    } catch {
      // Ignore API errors on clear
    }
    try {
      localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${characterId}`);
    } catch {}
    // Empties ONLY that chat's visible messages. Never touches other chats or daily entries.
    setMessagesByCharacter((prev) => ({
      ...prev,
      [characterId]: [],
    }));
  };

  // Sync any state changes to localStorage
  React.useEffect(() => {
    try {
      Object.entries(messagesByCharacter).forEach(([cId, msgs]) => {
        if (msgs && msgs.length > 0) {
          saveMessagesForCharacter(cId, msgs);
        }
      });
    } catch {}
  }, [messagesByCharacter]);

  const addCompanionMessage = useCallback((characterId: string, text: string) => {
    const aiMessage: ChatMessage = {
      id: `ai_game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      characterId,
      sender: 'ai',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessagesByCharacter((prev) => {
      const existing = prev[characterId] || [];
      const updated = [...existing, aiMessage];
      try {
        localStorage.setItem(`${CHAT_STORAGE_PREFIX}${characterId}`, JSON.stringify(updated));
      } catch {}
      return {
        ...prev,
        [characterId]: updated,
      };
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        getMessages,
        isResponding,
        sendMessage,
        sendVoiceMessage,
        retryMessage,
        clearScreen,
        initCharacterChat,
        addCompanionMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
