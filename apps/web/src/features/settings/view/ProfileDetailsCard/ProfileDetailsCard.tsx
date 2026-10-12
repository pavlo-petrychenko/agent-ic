import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfileDetailsCardProps } from '@/features/settings/view/ProfileDetailsCard/ProfileDetailsCard.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';

export function ProfileDetailsCard({ saving, onSave, children }: ProfileDetailsCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card>
      <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
        {t('profile.details.title')}
      </Heading>
      <form
        noValidate
        className="padding-right-3 flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        {children}
        <div>
          <Button type="submit" loading={saving}>
            {t('profile.details.action')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
