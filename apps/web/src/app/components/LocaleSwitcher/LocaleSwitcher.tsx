import { useTranslation } from 'react-i18next';
import { LOCALE_OPTIONS } from '@/app/components/LocaleSwitcher/LocaleSwitcher.constants';
import type { LocaleSwitcherProps } from '@/app/components/LocaleSwitcher/LocaleSwitcher.typedefs';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';

export function LocaleSwitcher({ compact = false }: LocaleSwitcherProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <SegmentedControl
      ariaLabel={t('locale.label')}
      size={SegmentedControlSize.Sm}
      value={locale}
      onValueChange={setLocale}
      options={LOCALE_OPTIONS.map((option) => ({
        value: option,
        label: compact ? t(`locale.short.${option}`) : t(`locale.${option}`),
      }))}
    />
  );
}
