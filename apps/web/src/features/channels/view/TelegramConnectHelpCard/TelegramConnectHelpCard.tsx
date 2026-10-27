import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { BulletList } from '@/shared/ui/display/BulletList';
import { Card, CardPad, CardTone } from '@/shared/ui/display/Card';

export function TelegramConnectHelpCard() {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Card title={t('telegram.howTo.title')} tone={CardTone.Panel} pad={CardPad.Lg}>
      <BulletList
        items={[
          t('telegram.howTo.stepOpen'),
          t('telegram.howTo.stepName'),
          t('telegram.howTo.stepCopy'),
        ]}
      />
    </Card>
  );
}
