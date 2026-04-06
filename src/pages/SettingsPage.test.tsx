import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SettingsPage } from './SettingsPage';

function renderSettingsRoute(initialEntry = '/settings') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('SettingsPage', () => {
  it('renders the Settings heading and sections', () => {
    renderSettingsRoute();
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^appearance$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^library data$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^back up library/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^export library/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^import library/i })).toBeEnabled();
  });

  it('shows Settings in primary navigation', () => {
    renderSettingsRoute('/');
    expect(screen.getByRole('link', { name: /^settings$/i })).toHaveAttribute('href', '/settings');
  });

  it('opens import confirmation when a valid JSON file is chosen', async () => {
    const user = userEvent.setup();
    renderSettingsRoute();

    const json = JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      songs: [],
      playlists: [
        {
          id: 'favorites',
          name: 'Favorites',
          isSystem: true,
          createdAt: 1,
          color: '#f97316',
        },
      ],
      playlistSongs: [],
      settings: [{ key: 'defaultPlaylistId', value: 'favorites' }],
    });

    const file = new File([json], 'backup.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByRole('dialog', { name: /replace library data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^replace library$/i })).toBeInTheDocument();
  });
});
