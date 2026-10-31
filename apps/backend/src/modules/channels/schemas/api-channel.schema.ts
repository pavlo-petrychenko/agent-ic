import { z } from 'zod';
import {
  API_CHANNEL_NAME_MAX_LENGTH,
  API_CHANNEL_WEBHOOK_REQUIRED_MESSAGE,
} from '@/modules/channels/constants/api-channel.constants';
import { ChannelField } from '@/modules/channels/constants/channel-input.constants';
import { ApiReplyMode } from '@/modules/channels/constants/channel.constants';

const apiReplyModeSchema = z.enum(ApiReplyMode);

const webhookSchema = z
  .union([z.literal(''), z.url()])
  .nullable()
  .default(null)
  .transform((value) => (value === '' ? null : value));

const apiChannelShape = {
  [ChannelField.Name]: z.string().trim().min(1).max(API_CHANNEL_NAME_MAX_LENGTH),
  [ChannelField.AgentId]: z.string().min(1),
  [ChannelField.ReplyMode]: apiReplyModeSchema,
  [ChannelField.Webhook]: webhookSchema,
};

const requireWebhookForWebhookMode = (
  value: { readonly replyMode: ApiReplyMode; readonly webhook: string | null },
  ctx: z.RefinementCtx,
): void => {
  if (value.replyMode === ApiReplyMode.Webhook && value.webhook === null) {
    ctx.addIssue({
      code: 'custom',
      path: [ChannelField.Webhook],
      message: API_CHANNEL_WEBHOOK_REQUIRED_MESSAGE,
    });
  }
};

export const createApiChannelInputSchema = z
  .object(apiChannelShape)
  .superRefine(requireWebhookForWebhookMode);
