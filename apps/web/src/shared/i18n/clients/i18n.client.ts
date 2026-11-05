import { DEFAULT_LOCALE } from '@agent-ic/contracts';
import type { Locale } from '@agent-ic/contracts';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { DurationUnit } from '@/shared/forms/constants/duration.constants';
import { formatDuration } from '@/shared/forms/helpers/duration.helpers';
import { I18nFormat } from '@/shared/i18n/constants/format.constants';
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
  instance.services.formatter?.add(I18nFormat.Minutes, (value: unknown, lng) =>
    typeof value === 'number'
      ? formatDuration(value, DurationUnit.Minute, lng ?? DEFAULT_LOCALE)
      : String(value),
  );
  return instance;
}
