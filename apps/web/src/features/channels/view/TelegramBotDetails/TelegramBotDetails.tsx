import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { TelegramChannelStatus } from '@/features/channels/typedefs/telegram.typedefs';
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
  channel,
  agentOptions,
  agentId,
  typing,
  saving,
  reconnecting,
  refreshing,
  lastUpdate,
  onAgentChange,
  onTypingChange,
  onReplaceToken,
  onDisconnect,
  onReconnect,
  onRefreshIdentity,
  onDelete,
  onSave,
}: TelegramBotDetailsProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const broken = channel.status === TelegramChannelStatus.Broken;
  const disconnected = channel.status === TelegramChannelStatus.Disconnected;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={channel.displayName}
        subtitle={t('telegram.bot.subtitle', {
          agent: channel.agentName ?? t('telegram.bot.unknownAgent'),
        })}
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
            {disconnected ? (
              <Button loading={reconnecting} onClick={onReconnect}>
                {t('telegram.bot.actions.connect')}
              </Button>
            ) : (
              <Button variant={ButtonVariant.Danger} onClick={onDisconnect}>
                {t('telegram.bot.actions.disconnect')}
              </Button>
            )}
            <Button disabled={broken || disconnected || saving} onClick={onSave}>
              {t('telegram.bot.actions.save')}
            </Button>
            {disconnected && (
              <Button variant={ButtonVariant.Danger} disabled={reconnecting} onClick={onDelete}>
                {t('telegram.bot.actions.delete')}
              </Button>
            )}
          </>
        }
      />
      <div className="grid grid-cols-1 items-start gap-5 px-7 compact:grid-cols-[minmax(18rem,1fr)_minmax(15rem,20rem)]">
        <div className="flex flex-col gap-4">
          <TelegramBotConnection
            channel={channel}
            lastUpdate={lastUpdate}
            refreshing={refreshing}
            onRefresh={onRefreshIdentity}
            onReplaceToken={onReplaceToken}
          />
          <TelegramBotWhoAnswers
            channel={channel}
            agentOptions={agentOptions}
            agentId={agentId}
            typing={typing}
            onAgentChange={onAgentChange}
            onTypingChange={onTypingChange}
          />
        </div>
        <div className="flex flex-col gap-4">
          {broken && (
            <>
              <TelegramFixHelpCard username={channel.displayName} />
              <Callout tone={CalloutTone.Warn}>{t('telegram.bot.warning')}</Callout>
            </>
          )}
          {disconnected && (
            <Callout tone={CalloutTone.Neutral}>
              {t('telegram.bot.connection.disconnectedHint')}
            </Callout>
          )}
          {!broken && !disconnected && (
            <>
              <TelegramConnectHelpCard />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
