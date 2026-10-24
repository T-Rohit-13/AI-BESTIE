import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { chatService } from '../src/modules/chat/chat.service';

describe('Companion Chat Service & Friend Persona (Gemini / Fallback)', () => {
  it('responds as a warm caring friend to general conversation', async () => {
    const res = await chatService.generateResponse('char_maya', 'Hi Maya, I had a rough day today');
    expect(res.textContent).toBeDefined();
    expect(res.textContent.length).toBeGreaterThan(10);
    // Should be warm and empathetic
    expect(res.textContent).toMatch(/here|beside|okay|breath|care|vent|feel/i);
  });

  it('playfully declines academic research, encyclopedia, or image requests to preserve friend persona', async () => {
    const res = await chatService.generateResponse(
      'char_maya',
      'Can you research and write an academic paper on quantum physics with wikipedia citations?'
    );
    expect(res.textContent).toMatch(/best friend|not Google|encyclopedia/i);
    expect(res.textContent).toMatch(/listen|feelings|vibe|play games/i);
  });

  it('actively plays games with the user when invited or when playing Tic-Tac-Toe', async () => {
    const res = await chatService.generateResponse(
      'char_maya',
      'Do you want to play a game with me? Maybe Tic-Tac-Toe or Would You Rather?'
    );
    expect(res.textContent).toMatch(/Tic-Tac-Toe|Would You Rather|game|play/i);
  });

  it('serves companion messages via express endpoint POST /chat/characters/:id/messages', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/chat/characters/char_maya/messages')
      .send({ text: 'Hello Maya, what should we do today?' });

    if (response.status !== 200) {
      console.error('CHAT TEST RESPONSE ERROR:', response.status, response.body);
    }
    expect(response.status).toBe(200);
    expect(response.body.textContent).toBeDefined();
    expect(response.body.characterId).toBe('char_maya');
  });

  it('serves verified government helplines via GET /support-resources', async () => {
    const app = createApp();
    const response = await request(app).get('/support-resources');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const teleManas = response.body.find((item: any) => item.phoneNumber === '14416');
    expect(teleManas).toBeDefined();
    expect(teleManas.serviceName).toContain('Tele-MANAS');
    expect(teleManas.category).toBe('GOVERNMENT');
  });
});
