import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AddSongPage } from './AddSongPage';

const mockAddSongFromParsed = vi.fn();

vi.mock('../db', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../db')>();
  return {
    ...mod,
    addSongFromParsed: (...args: unknown[]) => mockAddSongFromParsed(...args),
  };
});

function renderAddSong(initialEntry = '/add') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/add" element={<AddSongPage />} />
        <Route path="/song/:id" element={<div data-testid="song-detail">song</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AddSongPage', () => {
  beforeEach(() => {
    mockAddSongFromParsed.mockReset();
  });

  it('shows invalid URL error when link is not supported', async () => {
    const user = userEvent.setup();
    renderAddSong();
    await user.type(
      screen.getByRole('textbox', { name: /^track url$/i }),
      'https://example.com'
    );
    await user.click(screen.getByRole('button', { name: /^add song$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/doesn’t look like a supported/i);
    expect(mockAddSongFromParsed).not.toHaveBeenCalled();
  });

  it('saves a valid YouTube URL and navigates to song detail', async () => {
    mockAddSongFromParsed.mockResolvedValue({
      ok: true,
      duplicate: false,
      song: { id: 42 },
    });

    const user = userEvent.setup();
    renderAddSong();
    await user.type(
      screen.getByRole('textbox', { name: /^track url$/i }),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    await user.click(screen.getByRole('button', { name: /^add song$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('song-detail')).toBeInTheDocument();
    });
    expect(mockAddSongFromParsed).toHaveBeenCalled();
  });

  it('shows duplicate info when song already exists', async () => {
    mockAddSongFromParsed.mockResolvedValue({
      ok: true,
      duplicate: true,
      song: { id: 1 },
    });

    const user = userEvent.setup();
    renderAddSong();
    await user.type(
      screen.getByRole('textbox', { name: /^track url$/i }),
      'https://youtu.be/dQw4w9WgXcQ'
    );
    await user.click(screen.getByRole('button', { name: /^add song$/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/already in your library/i);
  });
});
