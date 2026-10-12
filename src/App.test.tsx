import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Shortest towers, so the flyer doesn't crash in the first few ticks.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the game and initial score', () => {
    render(<App />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('starts paused with the settings shown', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('runs after Start and can be paused again', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('updates the pipe gap', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Pipe gap/), { target: { value: '8' } });
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('keeps at least one pipe color', () => {
    render(<App />);
    for (let i = 6; i > 1; i--) {
      fireEvent.click(screen.getByLabelText(`Remove pipe color ${i}`));
    }
    expect(screen.getByLabelText('Remove pipe color 1')).toBeDisabled();
  });
});
