import { useTranslation } from 'react-i18next';
import { LOCALE_OPTIONS } from '@/app/layouts/AppHeader/LocaleSwitcher/LocaleSwitcher.constants';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';

export function LocaleSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <fieldset aria-label={t('locale.label')} className="flex gap-1">
      {LOCALE_OPTIONS.map((option) => (
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
