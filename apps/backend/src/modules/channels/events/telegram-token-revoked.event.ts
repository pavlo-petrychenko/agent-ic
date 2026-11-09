import { z } from 'zod';
import { ChannelEventName } from '@/modules/channels/constants/channel-event.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const telegramTokenRevokedEvent = defineDomainEvent({
  name: ChannelEventName.TelegramTokenRevoked,
  schema: z.object({
    workspaceId: z.uuid(),
    channelId: z.uuid(),
  }),
});

export type TelegramTokenRevokedInput = z.infer<typeof telegramTokenRevokedEvent.schema>;
