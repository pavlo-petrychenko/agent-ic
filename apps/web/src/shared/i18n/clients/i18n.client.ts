import { createInstance, type i18n as I18nInstance } from 'i18next';
import { DEFAULT_LOCALE, type Locale } from '@/shared/i18n/constants/locale.constants';
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
