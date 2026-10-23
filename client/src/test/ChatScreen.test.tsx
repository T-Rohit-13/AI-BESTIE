import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChatScreen } from '../components/chat/ChatScreen';
import { CharactersProvider } from '../context/CharactersContext';
import { ChatProvider } from '../context/ChatContext';
import * as api from '../services/api';

vi.mock('../services/api');

describe('ChatScreen Component', () => {
  it('renders chat header, character details, back button, and initial greeting', async () => {
    vi.mocked(api.getCharacters).mockResolvedValue([
      {
        id: 'char_maya',
        name: 'Maya',
        personalityPreset: 'Friendly companion',
        avatarInitial: 'M',
        avatarColor: 'from-emerald-500 to-teal-600',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/chat/char_maya']}>
        <CharactersProvider>
          <ChatProvider>
            <Routes>
              <Route path="/chat/:characterId" element={<ChatScreen />} />
            </Routes>
          </ChatProvider>
        </CharactersProvider>
      </MemoryRouter>
    );

    // Verify character name in header
    expect(await screen.findByRole('heading', { name: 'Maya' })).toBeInTheDocument();
    expect(screen.getByText('Friendly companion')).toBeInTheDocument();

    // Verify back button and edit shortcut
    expect(screen.getByLabelText('Back to companions')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Maya')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat options menu')).toBeInTheDocument();

    // Verify message input and send button
    expect(screen.getByLabelText('Type message for Maya')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    expect(screen.getByLabelText('Record voice message')).toBeInTheDocument();

    // Verify initial friendly greeting is rendered
    expect(await screen.findByText(/Hi there! I'm Maya/i)).toBeInTheDocument();
  });

  it('sends a user text message on Enter key or Send button click', async () => {
    vi.mocked(api.getCharacters).mockResolvedValue([
      {
        id: 'char_maya',
        name: 'Maya',
        personalityPreset: 'Friendly companion',
        avatarInitial: 'M',
      },
    ]);

    vi.mocked(api.sendChatMessage).mockResolvedValue({
      messageId: 'ai_resp_1',
      textContent: 'I hear you. Tell me more.',
    });

    render(
      <MemoryRouter initialEntries={['/chat/char_maya']}>
        <CharactersProvider>
          <ChatProvider>
            <Routes>
              <Route path="/chat/:characterId" element={<ChatScreen />} />
            </Routes>
          </ChatProvider>
        </CharactersProvider>
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Maya' });

    const input = screen.getByLabelText('Type message for Maya');
    const sendButton = screen.getByLabelText('Send message');

    // Type and send
    fireEvent.change(input, { target: { value: 'Today was a peaceful day' } });
    fireEvent.click(sendButton);

    // Verify user message appears in document
    expect(await screen.findByText('Today was a peaceful day')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.sendChatMessage).toHaveBeenCalledWith('char_maya', 'Today was a peaceful day');
    });

    // Verify AI response arrives
    expect(await screen.findByText('I hear you. Tell me more.')).toBeInTheDocument();
  });
});
