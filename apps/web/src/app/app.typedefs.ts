import type { i18n as I18nInstance } from 'i18next';
import type { ReactNode } from 'react';
import type { RuntimeConfig } from '@/shared/config/runtimeConfig.typedefs';

export interface AppProps {
  config: RuntimeConfig;
  i18n: I18nInstance;
}

export interface AppProvidersProps extends AppProps {
  children: ReactNode;
}

export interface StartupFailureProps {
  i18n: I18nInstance;
}
