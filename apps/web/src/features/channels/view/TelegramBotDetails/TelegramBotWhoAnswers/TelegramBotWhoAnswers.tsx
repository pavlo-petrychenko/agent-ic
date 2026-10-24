import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramBotWhoAnswersProps } from '@/features/channels/view/TelegramBotDetails/TelegramBotWhoAnswers/TelegramBotWhoAnswers.typedefs';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader';
import { Field } from '@/shared/ui/inputs/Field';
import { Select } from '@/shared/ui/inputs/Select';
import { Switch } from '@/shared/ui/inputs/Switch';

export function TelegramBotWhoAnswers({
  bot,
  agentOptions,
  agentId,
  typing,
  revoked,
  onAgentChange,
  onTypingChange,
}: TelegramBotWhoAnswersProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const version = bot.publishedVersion ?? 0;

  return (
    <Card pad={CardPad.Lg} gap={CardGap.Lg}>
      <CardHeader title={t('telegram.bot.whoAnswers.title')} />
      <Field
        label={t('telegram.bot.whoAnswers.agent')}
        hint={
          bot.agentIsDraft
            ? t('telegram.bot.whoAnswers.draftHint')
            : t('telegram.bot.whoAnswers.publishedHint', { version })
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
      {!revoked && (
        <Switch
          label={t('telegram.bot.whoAnswers.typing')}
          checked={typing}
          onCheckedChange={onTypingChange}
        />
      )}
    </Card>
  );
}
