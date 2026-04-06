import { Library, ListMusic, Plus, Settings } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const navIcon = {
  size: 22,
  strokeWidth: 1.75,
  'aria-hidden': true as const,
};

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-logo" aria-label="Musicboxx — home">
          Musicboxx
        </Link>
        <ThemeToggle />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Primary">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'bottom-nav__link is-active' : 'bottom-nav__link')}
          aria-label="Library — all songs"
        >
          <Library {...navIcon} />
          <span className="bottom-nav__label">Library</span>
        </NavLink>
        <NavLink
          to="/playlists"
          className={({ isActive }) => (isActive ? 'bottom-nav__link is-active' : 'bottom-nav__link')}
          aria-label="Playlists"
        >
          <ListMusic {...navIcon} />
          <span className="bottom-nav__label">Playlists</span>
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) => (isActive ? 'bottom-nav__link is-active' : 'bottom-nav__link')}
          aria-label="Add song from YouTube, Spotify, or Apple Music link"
        >
          <Plus {...navIcon} />
          <span className="bottom-nav__label">Add</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? 'bottom-nav__link is-active' : 'bottom-nav__link')}
          aria-label="Settings"
        >
          <Settings {...navIcon} />
          <span className="bottom-nav__label">Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
