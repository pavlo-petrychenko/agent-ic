import { Locale as ApiLocale } from '@/shared/api/generated/schema.generated';
import { Locale } from '@contracts/index';

export const LOCALE_FROM_API: Readonly<Record<ApiLocale, Locale>> = {
  [ApiLocale.En]: Locale.En,
  [ApiLocale.Uk]: Locale.Uk,
};

export const LOCALE_TO_API: Readonly<Record<Locale, ApiLocale>> = {
  [Locale.En]: ApiLocale.En,
  [Locale.Uk]: ApiLocale.Uk,
};
