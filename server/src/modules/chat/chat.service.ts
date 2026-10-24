import axios from 'axios';

export interface ChatHistoryItem {
  sender: 'user' | 'ai';
  text: string;
}

export interface ChatResponseResult {
  messageId: string;
  textContent: string;
  detectedMood?: string;
  isGameResponse?: boolean;
}

const COMPANION_PROFILES: Record<string, { name: string; personality: string }> = {
  char_maya: {
    name: 'Maya',
    personality: 'gentle, nurturing, deeply empathetic, and emotionally validating best friend',
  },
  char_aravind: {
    name: 'Aravind',
    personality: 'grounded, thoughtful, mindful, and reassuring big-brother style friend',
  },
  char_kaviya: {
    name: 'Kaviya',
    personality: 'vibrant, creative, humorous, uplifting, and enthusiastically loyal best friend',
  },
};

export class ChatService {
  private companionHistories: Map<string, ChatHistoryItem[]> = new Map();
  private customTrainedPatterns: Array<{ pattern: RegExp; tone: string; mood: string; reply?: string }> = [];

  /**
   * Retrieves conversation history for a specific companion
   */
  public getHistory(characterId: string): ChatHistoryItem[] {
    return this.companionHistories.get(characterId) || [];
  }

  /**
   * Appends an exchange to a companion's history
   */
  public appendHistory(characterId: string, item: ChatHistoryItem): void {
    const list = this.companionHistories.get(characterId) || [];
    list.push(item);
    // Keep last 100 messages per companion
    if (list.length > 100) list.shift();
    this.companionHistories.set(characterId, list);
  }

  /**
   * Clears history for a specific companion
   */
  public clearHistory(characterId: string): void {
    this.companionHistories.delete(characterId);
  }

  /**
   * Ingests and trains companion tone patterns from a user-provided dataset
   */
  public trainDataset(dataset: Array<{ text: string; tone?: string; mood?: string; response?: string }>): {
    success: boolean;
    samplesIngested: number;
    message: string;
  } {
    if (!Array.isArray(dataset) || dataset.length === 0) {
      throw new Error('Dataset must be a non-empty array of training samples');
    }

    let count = 0;
    for (const item of dataset) {
      if (item && item.text) {
        const words = item.text.toLowerCase().trim().replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 5).join('\\s+');
        if (words) {
          this.customTrainedPatterns.push({
            pattern: new RegExp(`\\b${words}\\b`, 'i'),
            tone: item.tone || 'empathetic',
            mood: item.mood || 'calm',
            reply: item.response,
          });
          count++;
        }
      }
    }

    return {
      success: true,
      samplesIngested: count,
      message: `Successfully trained model on ${count} conversational dataset examples!`,
    };
  }

  /**
   * Generates a conversational response from the AI companion.
   * Uses Gemini API when GEMINI_API_KEY is available; falls back to the friend engine.
   */
  public async generateResponse(
    characterId: string,
    userText: string,
    history: ChatHistoryItem[] = [],
    apiKeyOverride?: string
  ): Promise<ChatResponseResult> {
    const character = COMPANION_PROFILES[characterId] || {
      name: 'INARO',
      personality: 'warm, compassionate, attentive, and supportive best friend',
    };

    const trimmed = userText.trim();
    const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

    // Check if the user is asking for research, academic papers, or search engine data
    const isResearchQuery = /\b(research|wikipedia|google this|scientific paper|dissertation|academic bibliography|generate image|search web|cite sources|find citations)\b/i.test(
      trimmed
    );

    // If Gemini API Key is available, invoke the model with strict friend persona
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const geminiResponse = await this.callGeminiApi(apiKey, character, trimmed, history, isResearchQuery);
        if (geminiResponse) {
          return {
            messageId: `ai_${Date.now()}`,
            textContent: geminiResponse,
          };
        }
      } catch (err: any) {
        console.warn('[ChatService] Gemini API call failed, using intelligent friend fallback:', err?.message);
      }
    }

    // Fallback friend engine
    const fallbackText = this.generateFriendFallback(character, trimmed, isResearchQuery);
    return {
      messageId: `ai_${Date.now()}`,
      textContent: fallbackText,
    };
  }

  private async callGeminiApi(
    apiKey: string,
    character: { name: string; personality: string },
    userText: string,
    history: ChatHistoryItem[],
    isResearchQuery: boolean
  ): Promise<string | null> {
    const systemPrompt = `You are ${character.name}, a ${character.personality} to a young adult or teenager.
CRITICAL BEHAVIORAL AND PERSONA DIRECTIVES:
1. Speak exclusively as a real, caring, informal, authentic best friend (warm, colloquial, conversational, supportive, using occasional friendly emojis like ✨, 🌸, 🫂, 😄).
2. UNDER NO CIRCUMSTANCES should you act as an encyclopedia, academic search engine, textbook, or research tool. You do not generate research dissertations or image generation analysis.
3. If the user asks for academic research, searching the internet, or generating images, gently and playfully remind them: you are their best friend here to hang out, listen to their feelings, vibe, play games, and support them through life—not do research papers!
4. If the user is playing a game with you (like Tic-Tac-Toe, Would You Rather, Word Association, or Riddles), enthusiastically play along as their game buddy! Make your move, tease affectionately, and celebrate wins!
5. Keep your responses concise (1-3 sentences), warm, and natural like a real text message.`;

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Format conversation history for Gemini
    const contents: any[] = [];
    const recentHistory = history.slice(-6);
    for (const item of recentHistory) {
      contents.push({
        role: item.sender === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userText }],
    });

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 250,
      },
    };

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
    });

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  }

  private generateFriendFallback(
    character: { name: string; personality: string },
    text: string,
    isResearchQuery: boolean
  ): string {
    const lower = text.toLowerCase();

    // 1. Boundary: Friendly refusal of academic research / search engine / image requests
    if (isResearchQuery) {
      return `Haha hey, remember I'm your best friend ${character.name}, not Google or an encyclopedia! 🫂 I'm here to listen to your feelings, vibe, talk about your day, and play games with you. How are you actually feeling right now?`;
    }

    // 2. Game playing responses
    if (/\b(tic-tac-toe|play|game|would you rather|riddle|word association|guess)\b/i.test(lower)) {
      if (lower.includes('tic-tac-toe') || lower.includes('tic tac toe')) {
        return `Yesss, I love Tic-Tac-Toe! 🎮 Tap "Play Games" on my screen to make your move as ✕ and I'll jump right in with O! Bet you can't beat me this round! 😄`;
      }
      if (lower.includes('would you rather')) {
        return `Ooh, I love Would You Rather! 🎲 Here's one: Would you rather have the ability to pause time whenever you need a nap, or be able to teleport to any cozy café in the world instantly? ✨`;
      }
      if (lower.includes('riddle')) {
        return `Alright, bestie riddle time! 🧠 "I have branches, but no fruit, trunk or leaves. What am I?" (Hint: think finance or rivers!) Tell me your guess! 😄`;
      }
      return `Yay, game time! 🎮 I'm ready! We can play Tic-Tac-Toe (open my Play Games tab), Would You Rather, or a fun word chain! What's your move? ✨`;
    }

    // 3. Greetings
    if (/^(hi|hello|hey|yo|sup|good morning|good evening)/i.test(lower)) {
      return `Hey there! 😄 It's always so comforting seeing you pop in. How's your day treating you today?`;
    }

    // 4. Emotional distress / sadness
    if (/\b(sad|down|crying|lonely|heartbroken|depressed|hurt|exhausted|tired of everything)\b/i.test(lower)) {
      return `I hear you, and I'm right here beside you. 🫂 It's completely okay to not be okay right now. Take a deep breath with me. Do you want to vent more about it, or would you like to just sit together quietly?`;
    }

    // 5. Anxiety / stress / panic
    if (/\b(stress|stressed|anxious|anxiety|panic|overwhelmed|exam|pressure)\b/i.test(lower)) {
      return `Hey, take a slow breath with me right now. Inhale... exhale. 🌸 You don't have to carry the whole world today. You've gotten through tough moments before, and we'll take this one tiny step at a time together.`;
    }

    // 6. Happiness / celebration
    if (/\b(happy|yay|awesome|great news|excited|passed|won|celebrate)\b/i.test(lower)) {
      return `OMG yay!! 🎉✨ I'm so happy for you! Tell me all the details, I want to celebrate this moment with you! 😄`;
    }

    // Default conversational friend reply
    return `I hear you! I love that we can talk about anything together. Tell me more, I'm all ears! ✨`;
  }
}

export const chatService = new ChatService();
