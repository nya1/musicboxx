import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getStoredTheme,
  setStoredTheme,
  resolveEffectiveTheme,
  applyThemeToDocument,
} from './theme';

const STORAGE_KEY = 'musicboxx-theme';

describe('theme storage', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal(
      'localStorage',
      {
        getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
        setItem: (k: string, v: string) => {
          memory.set(k, v);
        },
        removeItem: (k: string) => {
          memory.delete(k);
        },
        clear: () => {
          memory.clear();
        },
        key: (i: number) => [...memory.keys()][i] ?? null,
        get length() {
          return memory.size;
        },
      } as Storage
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips preference', () => {
    setStoredTheme('dark');
    expect(getStoredTheme()).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('defaults to system when unset or invalid', () => {
    expect(getStoredTheme()).toBe('system');
    localStorage.setItem(STORAGE_KEY, 'nope');
    expect(getStoredTheme()).toBe('system');
  });
});

describe('resolveEffectiveTheme', () => {
  it('returns light or dark when fixed', () => {
    expect(resolveEffectiveTheme('light')).toBe('light');
    expect(resolveEffectiveTheme('dark')).toBe('dark');
  });

  it('follows prefers-color-scheme when system', () => {
    const prev = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    expect(resolveEffectiveTheme('system')).toBe('dark');
    window.matchMedia = prev;
  });
});

describe('applyThemeToDocument', () => {
  it('sets data-theme and data-theme-pref', () => {
    applyThemeToDocument('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themePref).toBe('dark');
  });
});
