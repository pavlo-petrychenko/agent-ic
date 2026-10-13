import type { Locale } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import {
  LOCALE_OPTIONS,
  PROFILE_THEME_OPTIONS,
} from '@/features/settings/constants/profile.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { useUpdateMyLocale } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { Field } from '@/shared/ui/inputs/Field';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ProfilePreferencesFields() {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { preference, setPreference } = useTheme();
  const updateMyLocale = useUpdateMyLocale();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const changeLocale = (next: Locale) => {
    setLocale(next);
    void updateMyLocale(next).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:grid-cols-2">
      <Field
        label={t('profile.details.language.title')}
        hint={t('profile.details.language.description')}
      >
        {() => (
          <SegmentedControl
            ariaLabel={t('profile.details.language.title')}
            size={SegmentedControlSize.Md}
            value={locale}
            onValueChange={changeLocale}
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
            value={preference}
            onValueChange={setPreference}
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
