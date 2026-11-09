import { z } from 'zod';
import { NotificationEventName } from '@/modules/notifications/constants/notification-event.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const telegramAlertTakeOverRequestedEvent = defineDomainEvent({
  name: NotificationEventName.TelegramAlertTakeOverRequested,
  schema: z.object({
    userId: z.uuid(),
    conversationPublicId: z.string().min(1),
    chatId: z.string().min(1),
    messageId: z.string().min(1).nullable(),
  }),
});

export type TelegramAlertTakeOverInput = z.infer<typeof telegramAlertTakeOverRequestedEvent.schema>;
