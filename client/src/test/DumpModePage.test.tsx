import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DumpModePage } from '../components/dump/DumpModePage';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  getDumpSpaceName: vi.fn(),
  updateDumpSpaceName: vi.fn(),
  createDumpEntry: vi.fn(),
  getDumpEntries: vi.fn(),
  deleteDumpEntry: vi.fn(),
  deleteAllDumpEntries: vi.fn(),
}));

describe('DumpModePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    (api.getDumpSpaceName as any).mockResolvedValue({ name: 'My Dump' });
    (api.getDumpEntries as any).mockResolvedValue({
      entries: [
        {
          id: 'test-dump-1',
          text: 'First test dump entry',
          mood: 4,
          created_at: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    });
  });

  it('renders header with editable space name', async () => {
    render(
      <MemoryRouter>
        <DumpModePage />
      </MemoryRouter>
    );

    // Initial space name visible
    expect(await screen.findByText('My Dump')).toBeInTheDocument();

    // Clicking name enters edit mode
    fireEvent.click(screen.getByText('My Dump'));
    const input = screen.getByLabelText('Edit dump space name') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Editing and saving calls updateDumpSpaceName
    (api.updateDumpSpaceName as any).mockResolvedValue({ name: 'Midnight Reflections' });
    fireEvent.change(input, { target: { value: 'Midnight Reflections' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.updateDumpSpaceName).toHaveBeenCalledWith('Midnight Reflections');
    });
  });

  it('renders textarea with speech-to-text button and mood picker', async () => {
    render(
      <MemoryRouter>
        <DumpModePage />
      </MemoryRouter>
    );

    // Free text textarea
    const textarea = screen.getByPlaceholderText('Let it out. This space is yours...');
    expect(textarea).toBeInTheDocument();

    // Voice button (in jsdom Web Speech API is undefined so fallback label is shown)
    const voiceBtn = screen.getByRole('button', {
      name: /Voice isn't supported|voice dictation/i,
    });
    expect(voiceBtn).toBeInTheDocument();

    // Mood buttons with accessible aria-labels
    expect(screen.getByLabelText('Happy')).toBeInTheDocument();
    expect(screen.getByLabelText('Okay')).toBeInTheDocument();
    expect(screen.getByLabelText('Neutral')).toBeInTheDocument();
    expect(screen.getByLabelText('Sad')).toBeInTheDocument();
    expect(screen.getByLabelText('Angry')).toBeInTheDocument();
    expect(screen.getByLabelText('Tired')).toBeInTheDocument();

    // Select mood
    const happyBtn = screen.getByLabelText('Happy');
    fireEvent.click(happyBtn);
    expect(happyBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('saves entry, clears input, resets mood, and shows subtle "Dump saved." confirmation with zero AI replies', async () => {
    (api.createDumpEntry as any).mockResolvedValue({
      id: 'new-entry-1',
      text: 'Today was overwhelming but writing this down helps.',
      mood: 3,
      created_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <DumpModePage />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText('Let it out. This space is yours...');
    fireEvent.change(textarea, {
      target: { value: 'Today was overwhelming but writing this down helps.' },
    });

    const neutralMood = screen.getByLabelText('Neutral');
    fireEvent.click(neutralMood);

    const releaseBtn = screen.getByRole('button', { name: /Release/i });
    fireEvent.click(releaseBtn);

    await waitFor(() => {
      expect(api.createDumpEntry).toHaveBeenCalledWith({
        text: 'Today was overwhelming but writing this down helps.',
        mood: 3,
      });
    });

    // Subtle confirmation
    expect(await screen.findByText('Dump saved.')).toBeInTheDocument();

    // Text area cleared
    expect(textarea).toHaveValue('');

    // Strictly NO AI responses, advice boxes, or motivational replies
    expect(screen.queryByTestId('ai-response')).not.toBeInTheDocument();
    expect(screen.queryByText(/Here's what you should do/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Companion says/i)).not.toBeInTheDocument();
  });

  it('renders past entries and allows deleting an entry', async () => {
    (api.deleteDumpEntry as any).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <DumpModePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('First test dump entry')).toBeInTheDocument();

    const deleteBtn = screen.getByLabelText('Delete entry');
    fireEvent.click(deleteBtn);

    // Modal pops up
    expect(screen.getByText('Delete this entry?')).toBeInTheDocument();
    const confirmDeleteBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(api.deleteDumpEntry).toHaveBeenCalledWith('test-dump-1');
    });

    expect(screen.queryByText('First test dump entry')).not.toBeInTheDocument();
  });
});
