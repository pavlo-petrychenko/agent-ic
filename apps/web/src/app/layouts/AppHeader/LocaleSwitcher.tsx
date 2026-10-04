import { Locale } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/shared/i18n/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';

const LOCALES: readonly Locale[] = Object.values(Locale);

export function LocaleSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <fieldset aria-label={t('locale.label')} className="flex gap-1">
      {LOCALES.map((option) => (
        <Button
          key={option}
          size={ButtonSize.Sm}
          variant={option === locale ? ButtonVariant.Secondary : ButtonVariant.Ghost}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          {t(`locale.${option}`)}
        </Button>
      ))}
    </fieldset>
  );
}
