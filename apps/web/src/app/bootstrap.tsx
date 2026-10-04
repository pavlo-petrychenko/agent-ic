import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createI18n } from '@/shared/i18n/i18n';
import { resolveInitialLocale } from '@/shared/i18n/i18n.helpers';
import { readStoredLocale } from '@/shared/i18n/localeStorage';
import { loadRuntimeConfig } from '@/shared/config/runtimeConfig';

import { App } from './App';
import { StartupFailure } from './StartupFailure';
import { ROOT_ELEMENT_ID, ROOT_ELEMENT_MISSING_MESSAGE } from './app.constants';

export async function bootstrap(): Promise<void> {
  const container = document.getElementById(ROOT_ELEMENT_ID);
  if (container === null) {
    throw new Error(ROOT_ELEMENT_MISSING_MESSAGE);
  }
  const root = createRoot(container);
  const i18n = createI18n(resolveInitialLocale(readStoredLocale(), navigator.languages));

  try {
    const config = await loadRuntimeConfig();
    root.render(
      <StrictMode>
        <App config={config} i18n={i18n} />
      </StrictMode>,
    );
  } catch (error) {
    root.render(<StartupFailure i18n={i18n} />);
    throw error;
  }
}
