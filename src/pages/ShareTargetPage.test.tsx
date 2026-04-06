import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShareTargetPage } from './ShareTargetPage';

const mockAddSongFromParsed = vi.fn();

vi.mock('../db', () => ({
  addSongFromParsed: (...args: unknown[]) => mockAddSongFromParsed(...args),
}));

function renderShare(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/share" element={<ShareTargetPage />} />
        <Route path="/song/:id" element={<div data-testid="song-detail">ok</div>} />
        <Route path="/add" element={<div data-testid="add-page">add</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ShareTargetPage', () => {
  beforeEach(() => {
    mockAddSongFromParsed.mockReset();
  });

  it('shows error when share payload has no supported link', async () => {
    renderShare('/share?text=hello%20world');

    expect(await screen.findByRole('alert')).toHaveTextContent(/doesn’t look like a supported/i);
    expect(mockAddSongFromParsed).not.toHaveBeenCalled();
  });

  it('adds from url param and navigates to song', async () => {
    mockAddSongFromParsed.mockResolvedValue({
      ok: true,
      duplicate: false,
      song: { id: 7 },
    });

    const url = encodeURIComponent('https://youtu.be/dQw4w9WgXcQ');
    renderShare(`/share?url=${url}`);

    await waitFor(() => {
      expect(screen.getByTestId('song-detail')).toBeInTheDocument();
    });
    expect(mockAddSongFromParsed).toHaveBeenCalled();
  });

  it('navigates to Add song when a YouTube playlist is shared', async () => {
    const url = encodeURIComponent(
      'https://www.youtube.com/watch?v=abc12345678&list=PLplaylistIdHere'
    );
    renderShare(`/share?url=${url}`);

    await waitFor(() => {
      expect(screen.getByTestId('add-page')).toBeInTheDocument();
    });
    expect(mockAddSongFromParsed).not.toHaveBeenCalled();
  });

  it('shows duplicate message when song exists', async () => {
    mockAddSongFromParsed.mockResolvedValue({
      ok: true,
      duplicate: true,
      song: { id: 99 },
    });

    const url = encodeURIComponent('https://youtu.be/dQw4w9WgXcQ');
    renderShare(`/share?url=${url}`);

    expect(await screen.findByText(/already in your library/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open song/i })).toHaveAttribute('href', '/song/99');
  });
});
