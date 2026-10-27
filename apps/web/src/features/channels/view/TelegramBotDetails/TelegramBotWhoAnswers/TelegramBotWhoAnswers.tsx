import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { TelegramChannelStatus } from '@/features/channels/typedefs/telegram.typedefs';
import type { TelegramBotWhoAnswersProps } from '@/features/channels/view/TelegramBotDetails/TelegramBotWhoAnswers/TelegramBotWhoAnswers.typedefs';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader';
import { Field } from '@/shared/ui/inputs/Field';
import { Select } from '@/shared/ui/inputs/Select';
import { Switch } from '@/shared/ui/inputs/Switch';

export function TelegramBotWhoAnswers({
  channel,
  agentOptions,
  agentId,
  typing,
  onAgentChange,
  onTypingChange,
}: TelegramBotWhoAnswersProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const publishedVersion = channel.agentLiveVersionNumber;
  const broken = channel.status === TelegramChannelStatus.Broken;

  return (
    <Card pad={CardPad.Lg} gap={CardGap.Lg}>
      <CardHeader title={t('telegram.bot.whoAnswers.title')} />
      <Field
        label={t('telegram.bot.whoAnswers.agent')}
        hint={
          publishedVersion === null
            ? t('telegram.bot.whoAnswers.draftHint')
            : t('telegram.bot.whoAnswers.publishedHint', { version: publishedVersion })
        }
      >
        {(control) => (
          <Select
            {...control}
            value={agentId}
            options={agentOptions}
            onChange={(event) => onAgentChange(event.target.value)}
          />
        )}
      </Field>
      {!broken && (
        <Switch
          label={t('telegram.bot.whoAnswers.typing')}
          checked={typing}
          onCheckedChange={onTypingChange}
        />
      )}
    </Card>
  );
}
