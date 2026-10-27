import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramBotContentProps } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import { useTelegramBotContent } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/useTelegramBotContent';
import { lastUpdateLabel } from '@/features/channels/logic/helpers/lastUpdate.helpers';
import { LastUpdateKind } from '@/features/channels/typedefs/lastUpdate.typedefs';
import { DisconnectTelegramBotDialog } from '@/features/channels/view/DisconnectTelegramBotDialog';
import { ReplaceTelegramTokenDialog } from '@/features/channels/view/ReplaceTelegramTokenDialog';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';

export function TelegramBotContent({
  workspaceId,
  channel,
  agentOptions,
}: TelegramBotContentProps) {
  const botContent = useTelegramBotContent({ workspaceId, channel, agentOptions });

  const { t, i18n } = useTranslation(CHANNELS_NAMESPACE);

  const [now] = useState(() => new Date());

  const updated = lastUpdateLabel(channel.updatedAt, now, i18n.language);
  const author = channel.updatedByName ?? t('telegram.bot.connection.unknownUser');
  const lastUpdate =
    updated.kind === LastUpdateKind.Today
      ? t('telegram.bot.connection.lastUpdateToday', { time: updated.time, author })
      : t('telegram.bot.connection.lastUpdateDate', {
          date: updated.date,
          time: updated.time,
          author,
        });

  return (
    <>
      <TelegramBotDetails
        channelsLink={botContent.channelsLink}
        channel={channel}
        agentOptions={agentOptions}
        agentId={botContent.agentId}
        typing={botContent.typing}
        saving={botContent.saving}
        lastUpdate={lastUpdate}
        onAgentChange={botContent.onAgentChange}
        onTypingChange={botContent.onTypingChange}
        onReplaceToken={botContent.onReplaceToken}
        onDisconnect={botContent.onDisconnect}
        onSave={botContent.onSave}
      />
      {botContent.replaceOpen && (
        <ReplaceTelegramTokenDialog
          username={botContent.botUsername}
          token={botContent.replaceToken}
          tokenError={botContent.replaceTokenError}
          busy={botContent.replacing}
          error={botContent.replaceError}
          onTokenChange={botContent.onReplaceTokenChange}
          onOpenChange={botContent.onReplaceOpenChange}
          onCancel={botContent.onReplaceCancel}
          onConfirm={botContent.onReplaceConfirm}
        />
      )}
      {botContent.disconnectOpen && (
        <DisconnectTelegramBotDialog
          username={botContent.botUsername}
          agent={botContent.agentName}
          apiChannelName={null}
          busy={botContent.disconnecting}
          error={botContent.disconnectError}
          onOpenChange={botContent.onDisconnectOpenChange}
          onCancel={botContent.onDisconnectCancel}
          onConfirm={botContent.onDisconnectConfirm}
        />
      )}
    </>
  );
}
