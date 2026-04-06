import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('button', { name: /^export or import data/i })).toBeDisabled();
  });

  it('shows Settings in primary navigation', () => {
    renderSettingsRoute('/');
    expect(screen.getByRole('link', { name: /^settings$/i })).toHaveAttribute('href', '/settings');
  });
});
