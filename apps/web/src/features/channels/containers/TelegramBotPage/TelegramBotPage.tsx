import { useState } from 'react';
import {
  API_CHANNEL_MOCKS,
  DEFAULT_TELEGRAM_BOT,
  TELEGRAM_BOT_AGENT_OPTIONS,
  TELEGRAM_BOTS,
} from '@/features/channels/constants/telegramBot.constants';
import type { TelegramBotPageProps } from '@/features/channels/containers/TelegramBotPage/TelegramBotPage.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { DisconnectTelegramBotDialog } from '@/features/channels/view/DisconnectTelegramBotDialog';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';

export function TelegramBotPage({ workspaceId, botId }: TelegramBotPageProps) {
  const bot = TELEGRAM_BOTS.find((item) => item.id === botId) ?? DEFAULT_TELEGRAM_BOT;
  const [agentId, setAgentId] = useState(bot.agentId);
  const [typing, setTyping] = useState(bot.typingIndicator);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const linkedApiChannel = API_CHANNEL_MOCKS.find((channel) => channel.agentName === bot.agentName);
  const noop = () => undefined;

  return (
    <>
      <TelegramBotDetails
        channelsLink={channelsHref(workspaceId)}
        bot={bot}
        agentOptions={TELEGRAM_BOT_AGENT_OPTIONS}
        agentId={agentId}
        typing={typing}
        onAgentChange={setAgentId}
        onTypingChange={setTyping}
        onReplaceToken={noop}
        onDisconnect={() => setDisconnectOpen(true)}
        onSave={noop}
      />
      {disconnectOpen && (
        <DisconnectTelegramBotDialog
          username={bot.username}
          agent={bot.agentName}
          apiChannelName={linkedApiChannel?.name ?? null}
          onOpenChange={(open) => {
            if (!open) {
              setDisconnectOpen(false);
            }
          }}
          onCancel={() => setDisconnectOpen(false)}
          onConfirm={() => setDisconnectOpen(false)}
        />
      )}
    </>
  );
}
