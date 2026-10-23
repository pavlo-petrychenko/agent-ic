import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramBotConnectionProps } from '@/features/channels/view/TelegramBotDetails/TelegramBotConnection/TelegramBotConnection.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';

export function TelegramBotConnection({
  bot,
  revoked,
  onReplaceToken,
}: TelegramBotConnectionProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Card pad={CardPad.Lg} gap={CardGap.Xl}>
      <CardHeader
        title={t('telegram.bot.connection.title')}
        right={
          <Badge tone={revoked ? BadgeTone.Err : BadgeTone.Ok} dot>
            {revoked
              ? t('telegram.bot.connection.revoked')
              : t('telegram.bot.connection.connected')}
          </Badge>
        }
      />
      <Field
        label={t('telegram.bot.connection.tokenLabel')}
        hint={revoked ? null : t('telegram.bot.connection.tokenHint')}
        error={
          revoked
            ? t('telegram.bot.connection.revokedNote', {
                date: bot.lastUpdateDate,
                time: bot.revokedTime ?? '',
              })
            : null
        }
      >
        {(control) => (
          <div className="flex gap-2">
            <Input {...control} value={bot.tokenMasked} readOnly mono className="min-w-0 flex-1" />
            <Button
              variant={revoked ? ButtonVariant.Primary : ButtonVariant.Secondary}
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
              <Badge tone={revoked ? BadgeTone.Err : BadgeTone.Ok} dot>
                {revoked
                  ? t('telegram.bot.connection.notReceiving')
                  : t('telegram.bot.connection.receiving')}
              </Badge>
            ),
          },
          {
            label: t('telegram.bot.connection.lastUpdate'),
            value: revoked
              ? t('telegram.bot.connection.lastUpdateDate', {
                  date: bot.lastUpdateDate,
                  time: bot.lastUpdateTime,
                  author: bot.lastUpdateAuthor,
                })
              : t('telegram.bot.connection.lastUpdateToday', {
                  time: bot.lastUpdateTime,
                  author: bot.lastUpdateAuthor,
                }),
          },
          revoked
            ? {
                label: t('telegram.bot.connection.alerted'),
                value: t('telegram.bot.connection.alertedValue'),
              }
            : {
                label: t('telegram.bot.connection.botName'),
                value: t('telegram.bot.connection.botNameValue', {
                  name: bot.botName ?? '',
                }),
              },
        ]}
      />
    </Card>
  );
}
