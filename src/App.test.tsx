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

  describe('collisions', () => {
    // With Math.random mocked to 0, towers are 3 tall and 4 columns apart:
    // bottom tower at column 3 (rows 17-19), top tower at column 7 (rows 0-2).
    // The flyer starts at column 2, row 10, and falls a row per tick.
    const start = () => {
      const { container } = render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
      return container.firstChild as HTMLElement;
    };
    const tick = (count = 1) => act(() => vi.advanceTimersByTime(200 * count));
    const restartButton = () => screen.queryByRole('button', { name: 'Click to Restart' });

    it('passes a short tower without crashing', () => {
      start();
      tick(); // Bottom tower reaches the flyer's column; flyer is at row 11.
      expect(restartButton()).not.toBeInTheDocument();
    });

    it('crashes when falling into a bottom tower', () => {
      vi.mocked(Math.random).mockReturnValue(0.99); // Towers 9 tall: rows 11-19.
      start();
      tick(); // Flyer falls to row 11 as the tower arrives.
      expect(restartButton()).toBeInTheDocument();
    });

    it('crashes when flapping into a top tower', () => {
      const game = start();
      tick(5); // Top tower reaches the flyer's column; flyer is at row 15.
      expect(restartButton()).not.toBeInTheDocument();
      for (let i = 0; i < 6; i++) {
        fireEvent.click(game); // Up to row 3, just under the tower.
      }
      expect(restartButton()).not.toBeInTheDocument();
      fireEvent.click(game); // Into the tower.
      expect(restartButton()).toBeInTheDocument();
    });

    it('crashes when flapping above the top of the grid', () => {
      const game = start();
      for (let i = 0; i < 5; i++) {
        fireEvent.click(game); // Up to row 0.
      }
      expect(restartButton()).not.toBeInTheDocument();
      fireEvent.click(game);
      expect(restartButton()).toBeInTheDocument();
    });

    it('crashes when falling off the bottom of the grid', () => {
      render(<App />);
      // Widest gap: after the first short tower, nothing reaches the flyer's
      // column before it falls from row 10 past row 19.
      fireEvent.change(screen.getByLabelText(/Pipe gap/), { target: { value: '16' } });
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
      tick(9);
      expect(restartButton()).not.toBeInTheDocument();
      tick();
      expect(restartButton()).toBeInTheDocument();
    });
  });

  it('keeps at least one pipe color', () => {
    render(<App />);
    for (let i = 6; i > 1; i--) {
      fireEvent.click(screen.getByLabelText(`Remove pipe color ${i}`));
    }
    expect(screen.getByLabelText('Remove pipe color 1')).toBeDisabled();
  });
});
