import { ThemeToggle } from '../components/ThemeToggle';

export function SettingsPage() {
  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="muted page-lead">
        App preferences and options for your library on this device.
      </p>

      <section className="mt-lg" aria-labelledby="settings-appearance-heading">
        <h2 id="settings-appearance-heading" className="section-title">
          Appearance
        </h2>
        <div className="settings-appearance-row">
          <span className="settings-appearance-row__label">Theme</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-lg" aria-labelledby="settings-data-heading">
        <h2 id="settings-data-heading" className="section-title">
          Library data
        </h2>
        <p className="muted settings-data-lead">
          Cloud backup to an external destination and full import or export of your local
          library (IndexedDB) are planned. Until then, your collection stays in this browser
          only.
        </p>
        <div className="stack settings-data-actions">
          <button type="button" className="btn btn--secondary" disabled>
            Back up library…
          </button>
          <button type="button" className="btn btn--secondary" disabled>
            Export or import data…
          </button>
        </div>
      </section>
    </div>
  );
}
