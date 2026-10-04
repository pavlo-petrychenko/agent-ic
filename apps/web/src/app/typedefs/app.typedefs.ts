import type { i18n as I18nInstance } from 'i18next';
import type { RuntimeConfig } from '@/shared/config/typedefs/runtimeConfig.typedefs';

export interface AppProps {
  config: RuntimeConfig;
  i18n: I18nInstance;
}
