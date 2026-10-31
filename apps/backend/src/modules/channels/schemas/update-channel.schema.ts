import { z } from 'zod';
import { ChannelField } from '@/modules/channels/constants/channel-input.constants';
import { ApiReplyMode } from '@/modules/channels/constants/channel.constants';

const optionalWebhook = z
  .union([z.literal(''), z.url()])
  .nullish()
  .transform((value) => (value === '' || value === null || value === undefined ? null : value));

export const updateChannelInputSchema = z.object({
  [ChannelField.Id]: z.string().min(1),
  [ChannelField.AgentId]: z.string().min(1),
  [ChannelField.ShowTyping]: z.boolean().nullish(),
  [ChannelField.ReplyMode]: z.enum(ApiReplyMode).nullish(),
  [ChannelField.Webhook]: optionalWebhook,
});
