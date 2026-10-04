import { DEFAULT_LOCALE } from '@agent-ic/contracts';
import type { Locale } from '@agent-ic/contracts';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { resources } from '@/shared/i18n/constants/resources.constants';

export function createI18n(locale: Locale): I18nInstance {
  const instance = createInstance();
  void instance.init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    ns: Object.values(Namespace),
    defaultNS: Namespace.Common,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
