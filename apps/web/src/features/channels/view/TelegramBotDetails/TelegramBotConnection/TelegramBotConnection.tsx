import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { TELEGRAM_TOKEN_MASK } from '@/features/channels/constants/telegram.constants';
import { TelegramChannelStatus } from '@/features/channels/typedefs/telegram.typedefs';
import {
  TELEGRAM_CONNECTION_STATUS_KEY,
  TELEGRAM_CONNECTION_TONE,
} from '@/features/channels/view/TelegramBotDetails/TelegramBotConnection/TelegramBotConnection.constants';
import type { TelegramBotConnectionProps } from '@/features/channels/view/TelegramBotDetails/TelegramBotConnection/TelegramBotConnection.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';

export function TelegramBotConnection({
  channel,
  lastUpdate,
  onReplaceToken,
}: TelegramBotConnectionProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const connected = channel.status === TelegramChannelStatus.Connected;
  const broken = channel.status === TelegramChannelStatus.Broken;
  const botName = channel.firstName ?? channel.displayName;
  const webhookTone = connected ? BadgeTone.Ok : broken ? BadgeTone.Err : BadgeTone.Neutral;

  return (
    <Card pad={CardPad.Lg} gap={CardGap.Xl}>
      <CardHeader
        title={t('telegram.bot.connection.title')}
        right={
          <Badge tone={TELEGRAM_CONNECTION_TONE[channel.status]} dot>
            {t(TELEGRAM_CONNECTION_STATUS_KEY[channel.status])}
          </Badge>
        }
      />
      <Field
        label={t('telegram.bot.connection.tokenLabel')}
        hint={broken ? null : t('telegram.bot.connection.tokenHint')}
      >
        {(control) => (
          <div className="flex gap-2">
            <Input
              {...control}
              value={channel.tokenMasked ?? TELEGRAM_TOKEN_MASK}
              readOnly
              mono
              invalid={broken}
              className="min-w-0 flex-1"
            />
            <Button
              variant={broken ? ButtonVariant.Primary : ButtonVariant.Secondary}
              onClick={onReplaceToken}
            >
              {t('telegram.bot.connection.replaceToken')}
            </Button>
          </div>
        )}
      </Field>
      <KeyValue
        layout={KeyValueLayout.DefList}
        items={[
          {
            label: t('telegram.bot.connection.webhook'),
            value: (
              <Badge tone={webhookTone} dot>
                {connected
                  ? t('telegram.bot.connection.receiving')
                  : t('telegram.bot.connection.notReceiving')}
              </Badge>
            ),
          },
          {
            label: t('telegram.bot.connection.lastUpdate'),
            value: lastUpdate,
          },
          broken
            ? {
                label: t('telegram.bot.connection.alerted'),
                value: t('telegram.bot.connection.alertedValue'),
              }
            : {
                label: t('telegram.bot.connection.botName'),
                value: t('telegram.bot.connection.botNameValue', { name: botName }),
              },
        ]}
      />
    </Card>
  );
}
