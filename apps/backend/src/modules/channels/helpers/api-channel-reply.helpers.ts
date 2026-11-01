import { IdPrefix } from '@agent-ic/contracts';
import { ApiChannelReplyStatus } from '@/modules/channels/constants/channel.constants';
import type {
  ApiChannelMessageResult,
  ApiChannelMessageResponse,
  ApiChannelReply,
  ApiChannelReplyMessage,
} from '@/modules/channels/typedefs/api-channel-ingress.typedefs';
import type { Message } from '@/modules/conversations';
import type { IdService } from '@/platform/ids/services/id.service';

export const apiChannelReplyMessage = (
  message: Message,
  ids: IdService,
): ApiChannelReplyMessage => ({
  id: ids.toPublic(IdPrefix.Message, message.id),
  text: message.text,
  quick_replies: message.quickReplies,
});

export const apiChannelReply = (
  status: ApiChannelReplyStatus,
  messages: readonly Message[],
  ids: IdService,
): ApiChannelReply => ({
  status,
  messages: messages.map((message) => apiChannelReplyMessage(message, ids)),
});

export const toApiChannelMessageResponse = (
  result: ApiChannelMessageResult,
): ApiChannelMessageResponse => {
  if (result.reply === null) {
    return { conversation_id: result.conversationId };
  }
  return {
    conversation_id: result.conversationId,
    messages: result.reply.messages,
    status: result.reply.status,
  };
};
