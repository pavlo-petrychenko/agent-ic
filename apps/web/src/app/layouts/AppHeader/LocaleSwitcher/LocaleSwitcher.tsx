import { useTranslation } from 'react-i18next';
import { LOCALE_OPTIONS } from '@/app/layouts/AppHeader/LocaleSwitcher/LocaleSwitcher.constants';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/SegmentedControl';

export function LocaleSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <SegmentedControl
      ariaLabel={t('locale.label')}
      size={SegmentedControlSize.Sm}
      value={locale}
      onValueChange={setLocale}
      options={LOCALE_OPTIONS.map((option) => ({ value: option, label: t(`locale.${option}`) }))}
    />
  );
}
