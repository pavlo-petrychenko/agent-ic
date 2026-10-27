import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDisconnectTelegram } from '@/features/channels/communication/hooks/useDisconnectTelegram';
import { useUpdateTelegram } from '@/features/channels/communication/hooks/useUpdateTelegram';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import type { TelegramBotContentProps } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import { lastUpdateLabel } from '@/features/channels/logic/helpers/lastUpdate.helpers';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { LastUpdateKind } from '@/features/channels/typedefs/lastUpdate.typedefs';
import { DisconnectTelegramBotDialog } from '@/features/channels/view/DisconnectTelegramBotDialog';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function TelegramBotContent({
  workspaceId,
  channel,
  agentOptions,
}: TelegramBotContentProps) {
  const { t, i18n } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const { disconnectTelegram, disconnecting } = useDisconnectTelegram();
  const { updateTelegram, saving } = useUpdateTelegram();
  const [agentId, setAgentId] = useState(channel.agentId ?? agentOptions[0]?.value ?? '');
  const [typing, setTyping] = useState(channel.showTyping);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
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

  const onSave = async () => {
    try {
      await updateTelegram({ id: channel.id, agentId, showTyping: typing });
      showToast({ message: t('telegram.bot.saved'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
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
        saving={saving}
        lastUpdate={lastUpdate}
        onAgentChange={setAgentId}
        onTypingChange={setTyping}
        onReplaceToken={() => undefined}
        onDisconnect={() => {
          setDisconnectError(null);
          setDisconnectOpen(true);
        }}
        onSave={() => void onSave()}
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
