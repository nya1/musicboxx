import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { bootstrapDb } from './db';
import { applyThemeToDocument, getStoredTheme } from './lib/theme';
import { App } from './App';
import './index.css';

applyThemeToDocument(getStoredTheme());

registerSW({ immediate: true });

bootstrapDb()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((e) => {
    console.error(e);
    document.getElementById('root')!.textContent = 'Could not start Musicboxx (storage blocked?).';
  });
