import { createInstance, type i18n as I18nInstance } from 'i18next';
import { DEFAULT_LOCALE, type Locale, Namespace } from '@/shared/i18n/i18n.constants';
import { resources } from '@/shared/i18n/i18n.resources';

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
