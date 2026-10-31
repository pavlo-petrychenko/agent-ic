import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import {
  CHANNEL_FIELD_REASON,
  ChannelField,
} from '@/modules/channels/constants/channel-input.constants';
import { ApiReplyMode } from '@/modules/channels/constants/channel.constants';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import type { updateChannelInputSchema } from '@/modules/channels/schemas/update-channel.schema';

export type ParsedUpdateChannelInput = z.output<typeof updateChannelInputSchema>;

const invalidField = (field: ChannelField): never => {
  throw new InvalidChannelInputError([
    {
      path: field,
      reason: CHANNEL_FIELD_REASON[field] ?? ErrorReason.InvalidRequest,
    },
  ]);
};

export const toTelegramChannelSettings = (
  data: ParsedUpdateChannelInput,
): { readonly showTyping: boolean } => {
  if (data.showTyping === null || data.showTyping === undefined) {
    return invalidField(ChannelField.ShowTyping);
  }
  if (data.replyMode !== null && data.replyMode !== undefined) {
    return invalidField(ChannelField.ReplyMode);
  }
  if (data.webhook !== null) {
    return invalidField(ChannelField.Webhook);
  }
  return { showTyping: data.showTyping };
};

export const toApiChannelSettings = (
  data: ParsedUpdateChannelInput,
): {
  readonly showTyping: boolean;
  readonly replyMode: ApiReplyMode;
  readonly webhook: string | null;
} => {
  if (data.showTyping === null || data.showTyping === undefined) {
    return invalidField(ChannelField.ShowTyping);
  }
  if (data.replyMode === null || data.replyMode === undefined) {
    return invalidField(ChannelField.ReplyMode);
  }
  if (data.replyMode === ApiReplyMode.Webhook && data.webhook === null) {
    return invalidField(ChannelField.Webhook);
  }
  return { showTyping: data.showTyping, replyMode: data.replyMode, webhook: data.webhook };
};
