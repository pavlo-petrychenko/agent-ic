import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDisconnectTelegram } from '@/features/channels/communication/hooks/useDisconnectTelegram';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import type { TelegramBotContentProps } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { DisconnectTelegramBotDialog } from '@/features/channels/view/DisconnectTelegramBotDialog';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function TelegramBotContent({
  workspaceId,
  channel,
  agentOptions,
}: TelegramBotContentProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { disconnectTelegram, disconnecting } = useDisconnectTelegram();
  const [agentId, setAgentId] = useState(channel.agentId ?? agentOptions[0]?.value ?? '');
  const [typing, setTyping] = useState(channel.showTyping);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const onDisconnect = async () => {
    setDisconnectError(null);
    try {
      await disconnectTelegram(channel.id);
      setDisconnectOpen(false);
      await navigate({ to: CHANNELS_PATH, params: { workspaceId } });
    } catch (error) {
      setDisconnectError(errorMessage(toAppError(error)));
    }
  };

  return (
    <>
      <TelegramBotDetails
        channelsLink={channelsHref(workspaceId)}
        channel={channel}
        agentOptions={agentOptions}
        agentId={agentId}
        typing={typing}
        onAgentChange={setAgentId}
        onTypingChange={setTyping}
        onReplaceToken={() => undefined}
        onDisconnect={() => {
          setDisconnectError(null);
          setDisconnectOpen(true);
        }}
        onSave={() => undefined}
      />
      {disconnectOpen && (
        <DisconnectTelegramBotDialog
          username={channel.displayName}
          agent={channel.agentName ?? t('telegram.bot.unknownAgent')}
          apiChannelName={null}
          busy={disconnecting}
          error={disconnectError}
          onOpenChange={(open) => {
            if (!open) {
              setDisconnectOpen(false);
            }
          }}
          onCancel={() => setDisconnectOpen(false)}
          onConfirm={() => void onDisconnect()}
        />
      )}
    </>
  );
}
