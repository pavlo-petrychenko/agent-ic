import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { WorkspaceNameCardProps } from '@/features/settings/view/WorkspaceNameCard/WorkspaceNameCard.typedefs';
import { Card } from '@/shared/ui/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/Text';

export function WorkspaceNameCard({ onSubmit, children }: WorkspaceNameCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card>
      <div className="flex flex-col gap-0.5">
        <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
          {t('general.workspace.title')}
        </Heading>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('general.subtitle')}
        </Text>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
      </form>
    </Card>
  );
}
