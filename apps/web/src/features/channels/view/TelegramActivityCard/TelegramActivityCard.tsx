import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramActivityCardProps } from '@/features/channels/view/TelegramActivityCard/TelegramActivityCard.typedefs';
import { Card, CardPad } from '@/shared/ui/display/Card';
import { Metric } from '@/shared/ui/display/Metric';

export function TelegramActivityCard({ stats }: TelegramActivityCardProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Card title={t('telegram.stats.title')} pad={CardPad.Lg}>
      <Metric
        items={[
          { label: t('telegram.stats.chats'), value: stats.chats },
          { label: t('telegram.stats.messages'), value: stats.messages },
          { label: t('telegram.stats.errors'), value: stats.errors },
        ]}
      />
    </Card>
  );
}
