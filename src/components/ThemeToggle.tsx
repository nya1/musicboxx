import { useEffect, useState } from 'react';
import {
  applyThemeToDocument,
  getStoredTheme,
  setStoredTheme,
  type ThemePreference,
} from '../lib/theme';

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>(() => getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(pref);
  }, [pref]);

  useEffect(() => {
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDocument('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [pref]);

  const cycle = () => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(pref) + 1) % order.length];
    setPref(next);
    setStoredTheme(next);
    applyThemeToDocument(next);
  };

  const label =
    pref === 'system' ? 'Theme: system' : pref === 'light' ? 'Theme: light' : 'Theme: dark';

  return (
    <button type="button" className="theme-toggle" onClick={cycle} aria-label={label} title={label}>
      {pref === 'system' ? '◐' : pref === 'light' ? '☀' : '☾'}
    </button>
  );
}
