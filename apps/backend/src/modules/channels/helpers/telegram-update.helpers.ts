import { ChannelKind } from '@agent-ic/contracts';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import type { TelegramMessage } from '@/modules/channels/typedefs/telegram.typedefs';
import { ConversationMode } from '@/modules/conversations';
import type { IncomingMessageInput } from '@/modules/conversations';

export const toIncomingMessageInput = (
  channel: Pick<ChannelRecord, 'id' | 'workspaceId' | 'agentId'>,
  message: TelegramMessage,
): IncomingMessageInput | null => {
  if (channel.agentId === null || message.text === null || message.text.trim() === '') {
    return null;
  }
  return {
    workspaceId: channel.workspaceId,
    agentId: channel.agentId,
    mode: ConversationMode.Live,
    channelKind: ChannelKind.Telegram,
    channelId: channel.id,
    endUserExternalId: message.chatId,
    endUserName: message.senderName,
    externalId: message.messageId,
    text: message.text,
    versionId: null,
  };
};
