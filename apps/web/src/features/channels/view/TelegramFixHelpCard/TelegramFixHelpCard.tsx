import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramFixHelpCardProps } from '@/features/channels/view/TelegramFixHelpCard/TelegramFixHelpCard.typedefs';
import { BulletList } from '@/shared/ui/display/BulletList';
import { Card, CardPad, CardTone } from '@/shared/ui/display/Card';

export function TelegramFixHelpCard({ username }: TelegramFixHelpCardProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Card title={t('telegram.bot.fix.title')} tone={CardTone.Panel} pad={CardPad.Lg}>
      <BulletList
        items={[
          t('telegram.bot.fix.stepOpen'),
          t('telegram.bot.fix.stepPick', { username }),
          t('telegram.bot.fix.stepPaste'),
        ]}
      />
    </Card>
  );
}
