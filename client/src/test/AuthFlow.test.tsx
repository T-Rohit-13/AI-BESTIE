import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthPage } from '../components/auth/AuthPage';

describe('AuthFlow Components (Phase 1)', () => {
  it('renders landing hero view with Create Account and Sign In CTAs', () => {
    render(
      <MemoryRouter initialEntries={['/login?mode=landing']}>
        <AuthPage initialMode="landing" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Pause\. Breathe\. Bloom\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders Sign-Up form with validation for age eligibility and passwords', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthPage initialMode="signup" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Create Your Account/i })).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/e\.g\. rohit_t/i);
    const ageInput = screen.getByPlaceholderText(/e\.g\. 21/i);
    const phoneInput = screen.getByPlaceholderText(/10-digit number/i);
    const passwordInput = screen.getByPlaceholderText(/Min\. 8 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter password/i);

    // Test underage input (< 13)
    fireEvent.change(ageInput, { target: { value: '12' } });
    fireEvent.blur(ageInput);
    expect(await screen.findByText(/Must be 13 or older to join INARO/i)).toBeInTheDocument();

    // Test valid age
    fireEvent.change(ageInput, { target: { value: '20' } });
    expect(screen.queryByText(/Must be 13 or older to join INARO/i)).not.toBeInTheDocument();

    // Test password strength calculation
    fireEvent.change(passwordInput, { target: { value: 'Pass123!@' } });
    expect(screen.getByText(/Strong password/i)).toBeInTheDocument();

    // Test password mismatch
    fireEvent.change(confirmPasswordInput, { target: { value: 'Mismatch123!' } });
    fireEvent.blur(confirmPasswordInput);
    expect(await screen.findByText(/Passwords must match/i)).toBeInTheDocument();
  });

  it('renders Sign-In form with required fields and error states', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthPage initialMode="signin" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();

    const identifierInput = screen.getByPlaceholderText(/e\.g\. rohit_t or 9876543210/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    // Button should be disabled when fields are empty
    expect(submitBtn).toBeDisabled();

    // Fill fields and submit
    fireEvent.change(identifierInput, { target: { value: 'valid_user' } });
    fireEvent.change(passwordInput, { target: { value: 'MySecretPassword123' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    // Verify Phase 1 boundary notice appears
    expect(
      await screen.findByText(/Phase 1 Boundary Notice: Client form validated\./i)
    ).toBeInTheDocument();
  });

  it('opens and interacts with the forgot password modal', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthPage initialMode="signin" />
      </MemoryRouter>
    );

    const forgotBtn = screen.getByRole('button', { name: /Forgot Password\?/i });
    fireEvent.click(forgotBtn);

    expect(screen.getByRole('heading', { name: /Reset Your Password/i })).toBeInTheDocument();

    const forgotInput = screen.getByPlaceholderText(/Enter username or mobile to reset/i);
    fireEvent.change(forgotInput, { target: { value: 'user_recovery' } });

    const sendBtn = screen.getByRole('button', { name: /Send Reset Instructions/i });
    fireEvent.click(sendBtn);

    expect(await screen.findByText(/Instructions Dispatched/i)).toBeInTheDocument();
  });
});
