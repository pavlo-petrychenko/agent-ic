import { useState } from 'react';
import {
  DEFAULT_TELEGRAM_BOT,
  TELEGRAM_BOT_AGENT_OPTIONS,
  TELEGRAM_BOTS,
} from '@/features/channels/constants/telegramBot.constants';
import type { TelegramBotPageProps } from '@/features/channels/containers/TelegramBotPage/TelegramBotPage.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';

export function TelegramBotPage({ workspaceId, botId }: TelegramBotPageProps) {
  const bot = TELEGRAM_BOTS.find((item) => item.id === botId) ?? DEFAULT_TELEGRAM_BOT;
  const [agentId, setAgentId] = useState(bot.agentId);
  const [typing, setTyping] = useState(bot.typingIndicator);
  const noop = () => undefined;

  return (
    <TelegramBotDetails
      channelsLink={channelsHref(workspaceId)}
      bot={bot}
      agentOptions={TELEGRAM_BOT_AGENT_OPTIONS}
      agentId={agentId}
      typing={typing}
      onAgentChange={setAgentId}
      onTypingChange={setTyping}
      onReplaceToken={noop}
      onDisconnect={noop}
      onSave={noop}
    />
  );
}
