import { Locale } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { PROFILE_THEME_OPTIONS } from '@/features/settings/constants/profile.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfileDetailsCardProps } from '@/features/settings/view/ProfileDetailsCard/ProfileDetailsCard.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { Card } from '@/shared/ui/display/Card';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';

const LOCALE_OPTIONS: readonly Locale[] = Object.values(Locale);

export function ProfileDetailsCard({
  name,
  email,
  locale,
  theme,
  saving,
  onNameChange,
  onEmailChange,
  onLocaleChange,
  onThemeChange,
  onSave,
}: ProfileDetailsCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();

  return (
    <Card>
      <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
        {t('profile.details.title')}
      </Heading>
      <div className="padding-right-3">
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 md:grid-cols-2">
            <Field label={t('profile.details.name.title')}>
              {(control) => (
                <Input
                  {...control}
                  value={name}
                  placeholder={t('profile.details.name.placeholder')}
                  onChange={(event) => onNameChange(event.target.value)}
                />
              )}
            </Field>
            <Field
              label={t('profile.details.email.title')}
              hint={t('profile.details.email.description')}
            >
              {(control) => (
                <div className="flex items-center gap-2">
                  <Input
                    {...control}
                    className="min-w-72 max-w-full"
                    value={email}
                    style={{ width: `calc(${email.length}ch + var(--space-24))` }}
                    placeholder={t('profile.details.email.placeholder')}
                    readOnly
                  />
                  <Button type="button" variant={ButtonVariant.Secondary} onClick={onEmailChange}>
                    {t('profile.details.email.action')}
                  </Button>
                </div>
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <Field
              label={t('profile.details.theme.title')}
              hint={t('profile.details.theme.description')}
            >
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
          <div>
            <Button type="submit" loading={saving}>
              {t('profile.details.action')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
