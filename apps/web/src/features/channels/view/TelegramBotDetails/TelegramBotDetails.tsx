import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { TelegramBotStatus } from '@/features/channels/typedefs/telegramBot.typedefs';
import { TelegramActivityCard } from '@/features/channels/view/TelegramActivityCard';
import { TelegramBotConnection } from '@/features/channels/view/TelegramBotDetails/TelegramBotConnection';
import type { TelegramBotDetailsProps } from '@/features/channels/view/TelegramBotDetails/TelegramBotDetails.typedefs';
import { TelegramBotWhoAnswers } from '@/features/channels/view/TelegramBotDetails/TelegramBotWhoAnswers';
import { TelegramConnectHelpCard } from '@/features/channels/view/TelegramConnectHelpCard';
import { TelegramFixHelpCard } from '@/features/channels/view/TelegramFixHelpCard';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';

export function TelegramBotDetails({
  channelsLink,
  bot,
  agentOptions,
  agentId,
  typing,
  onAgentChange,
  onTypingChange,
  onReplaceToken,
  onDisconnect,
  onSave,
}: TelegramBotDetailsProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const revoked = bot.status === TelegramBotStatus.Revoked;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={bot.username}
        subtitle={t('telegram.bot.subtitle', { agent: bot.agentName })}
        crumbs={
          <Breadcrumb
            ariaLabel={t('telegram.breadcrumb')}
            moreLabel={t('telegram.breadcrumbMore')}
            items={[
              { label: t('telegram.breadcrumbChannels'), to: channelsLink },
              { label: t('telegram.breadcrumbTelegram'), to: channelsLink },
            ]}
          />
        }
        actions={
          <>
            <Button variant={ButtonVariant.Danger} onClick={onDisconnect}>
              {t('telegram.bot.actions.disconnect')}
            </Button>
            <Button disabled={revoked} onClick={onSave}>
              {t('telegram.bot.actions.save')}
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 items-start gap-5 px-7 compact:grid-cols-[minmax(18rem,1fr)_minmax(15rem,20rem)]">
        <div className="flex flex-col gap-4">
          <TelegramBotConnection bot={bot} revoked={revoked} onReplaceToken={onReplaceToken} />
          <TelegramBotWhoAnswers
            bot={bot}
            agentOptions={agentOptions}
            agentId={agentId}
            typing={typing}
            revoked={revoked}
            onAgentChange={onAgentChange}
            onTypingChange={onTypingChange}
          />
        </div>
        <div className="flex flex-col gap-4">
          {revoked ? (
            <>
              <TelegramFixHelpCard username={bot.username} />
              <Callout tone={CalloutTone.Warn}>{t('telegram.bot.warning')}</Callout>
            </>
          ) : (
            <>
              <TelegramConnectHelpCard />
              {bot.stats !== null && <TelegramActivityCard stats={bot.stats} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
