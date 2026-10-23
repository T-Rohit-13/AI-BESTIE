import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyCheckInModal } from '../components/tracker/DailyCheckInModal';
import { DailyEntryProvider } from '../context/DailyEntryContext';
import * as api from '../services/api';

vi.mock('../services/api');

describe('DailyCheckInModal Component', () => {
  it('validates sleep hours step of 0.5 and range 0-24', async () => {
    vi.mocked(api.getDailyEntryToday).mockResolvedValue(null);

    render(
      <DailyEntryProvider>
        <DailyCheckInModal />
      </DailyEntryProvider>
    );

    // Wait for modal to appear
    const title = await screen.findByText(/Daily Well-Being Check-In/i);
    expect(title).toBeInTheDocument();

    const sleepInput = screen.getByLabelText(/Hours of Sleep Last Night/i);
    const submitButton = screen.getByRole('button', { name: /Continue to Interactive Mode/i });

    // Test invalid negative sleep hours
    fireEvent.change(sleepInput, { target: { value: '-2' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText(/Sleep hours must be between 0 and 24 hours/i)).toBeInTheDocument();

    // Test invalid > 24 sleep hours
    fireEvent.change(sleepInput, { target: { value: '25' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText(/Sleep hours must be between 0 and 24 hours/i)).toBeInTheDocument();

    // Test invalid non-0.5 step (e.g. 7.3)
    fireEvent.change(sleepInput, { target: { value: '7.3' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText(/Sleep duration must be in increments of 0.5 hours/i)).toBeInTheDocument();

    // Test valid 0.5 step (e.g. 7.5)
    fireEvent.change(sleepInput, { target: { value: '7.5' } });
    expect(screen.queryByText(/Sleep duration must be in increments of 0.5 hours/i)).not.toBeInTheDocument();
  });

  it('allows selecting mood chips and submitting form', async () => {
    vi.mocked(api.getDailyEntryToday).mockResolvedValue(null);
    vi.mocked(api.createDailyEntry).mockResolvedValue({
      id: 'entry_123',
      date: '2026-10-24',
      sleepHours: 8.0,
      mood: 'Happy',
    });

    render(
      <DailyEntryProvider>
        <DailyCheckInModal />
      </DailyEntryProvider>
    );

    await screen.findByText(/Daily Well-Being Check-In/i);

    // Select Happy mood chip
    const happyChip = screen.getByRole('radio', { name: /Happy/i });
    fireEvent.click(happyChip);

    const sleepInput = screen.getByLabelText(/Hours of Sleep Last Night/i);
    fireEvent.change(sleepInput, { target: { value: '8.0' } });

    const submitButton = screen.getByRole('button', { name: /Continue to Interactive Mode/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.createDailyEntry).toHaveBeenCalledWith({
        sleepHours: 8.0,
        mood: 'Happy',
      });
    });
  });
});
