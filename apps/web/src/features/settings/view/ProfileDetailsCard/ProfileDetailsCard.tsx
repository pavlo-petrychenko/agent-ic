import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfileDetailsCardProps } from '@/features/settings/view/ProfileDetailsCard/ProfileDetailsCard.typedefs';
import { ProfileIdentityFields } from '@/features/settings/view/ProfileDetailsCard/ProfileIdentityFields';
import { ProfilePreferencesFields } from '@/features/settings/view/ProfileDetailsCard/ProfilePreferencesFields';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';

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
          <ProfileIdentityFields
            name={name}
            email={email}
            onNameChange={onNameChange}
            onEmailChange={onEmailChange}
          />
          <ProfilePreferencesFields
            locale={locale}
            theme={theme}
            onLocaleChange={onLocaleChange}
            onThemeChange={onThemeChange}
          />
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
