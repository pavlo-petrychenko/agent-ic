import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { EarlyAccessCardProps } from '@/features/settings/view/EarlyAccessCard/EarlyAccessCard.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function EarlyAccessCard({ onAsk }: EarlyAccessCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
          {t('usage.earlyAccess.title')}
        </Text>
        <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
          {t('usage.earlyAccess.heading')}
        </Heading>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('usage.earlyAccess.description')}
        </Text>
      </div>
      <div>
        <Button variant={ButtonVariant.Secondary} onClick={onAsk}>
          {t('usage.earlyAccess.action')}
        </Button>
      </div>
    </Card>
  );
}
