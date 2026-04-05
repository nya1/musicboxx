import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">Musicboxx</span>
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
          Library
        </NavLink>
        <NavLink
          to="/playlists"
          className={({ isActive }) => (isActive ? 'bottom-nav__link is-active' : 'bottom-nav__link')}
          aria-label="Playlists"
        >
          Playlists
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) => (isActive ? 'bottom-nav__link is-active' : 'bottom-nav__link')}
          aria-label="Add song from YouTube URL"
        >
          Add
        </NavLink>
      </nav>
    </div>
  );
}
