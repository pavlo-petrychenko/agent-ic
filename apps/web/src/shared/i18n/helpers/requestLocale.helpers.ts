import type { i18n as I18nInstance } from 'i18next';
import { setRequestLocale } from '@/shared/api/helpers/requestContext.helpers';
import { isLocale } from '@/shared/i18n/helpers/locale.helpers';

type LocaleSource = Pick<I18nInstance, 'language' | 'on' | 'off'>;

export function bindRequestLocale(source: LocaleSource): () => void {
  const apply = (language: string): void => {
    if (isLocale(language)) {
      setRequestLocale(language);
    }
  };
  apply(source.language);
  source.on('languageChanged', apply);
  return () => source.off('languageChanged', apply);
}
