import { useTranslation } from 'react-i18next';
import { PROFILE_THEME_OPTIONS } from '@/features/settings/constants/profile.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { LOCALE_OPTIONS } from '@/features/settings/view/ProfileDetailsCard/ProfileDetailsCard.constants';
import type { ProfilePreferencesFieldsProps } from '@/features/settings/view/ProfileDetailsCard/ProfilePreferencesFields/ProfilePreferencesFields.typedefs';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { Field } from '@/shared/ui/inputs/Field';

export function ProfilePreferencesFields({
  locale,
  theme,
  onLocaleChange,
  onThemeChange,
}: ProfilePreferencesFieldsProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 md:grid-cols-2">
      <Field
        label={t('profile.details.language.title')}
        hint={t('profile.details.language.description')}
      >
        {() => (
          <SegmentedControl
            ariaLabel={t('profile.details.language.title')}
            size={SegmentedControlSize.Md}
            value={locale}
            onValueChange={onLocaleChange}
            options={LOCALE_OPTIONS.map((option) => ({
              value: option,
              label: tCommon(`locale.${option}`),
            }))}
          />
        )}
      </Field>
      <Field label={t('profile.details.theme.title')} hint={t('profile.details.theme.description')}>
        {() => (
          <SegmentedControl
            ariaLabel={t('profile.details.theme.title')}
            size={SegmentedControlSize.Md}
            value={theme}
            onValueChange={onThemeChange}
            options={PROFILE_THEME_OPTIONS.map((option) => ({
              value: option,
              label: t(`profile.details.theme.${option}`),
            }))}
          />
        )}
      </Field>
    </div>
  );
}
