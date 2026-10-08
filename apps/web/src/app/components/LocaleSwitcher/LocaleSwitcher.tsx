import type { Locale } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { LOCALE_OPTIONS } from '@/app/components/LocaleSwitcher/LocaleSwitcher.constants';
import type { LocaleSwitcherProps } from '@/app/components/LocaleSwitcher/LocaleSwitcher.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { ToastTone, useToast } from '@/shared/ui/Toast';

export function LocaleSwitcher({ compact = false, onLocaleChange }: LocaleSwitcherProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const errorMessage = useErrorMessage();

  const change = async (next: Locale) => {
    setLocale(next);
    if (onLocaleChange === undefined) {
      return;
    }
    try {
      await onLocaleChange(next);
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  return (
    <SegmentedControl
      ariaLabel={t('locale.label')}
      size={SegmentedControlSize.Sm}
      value={locale}
      onValueChange={(next) => void change(next)}
      options={LOCALE_OPTIONS.map((option) => ({
        value: option,
        label: compact ? t(`locale.short.${option}`) : t(`locale.${option}`),
      }))}
    />
  );
}
