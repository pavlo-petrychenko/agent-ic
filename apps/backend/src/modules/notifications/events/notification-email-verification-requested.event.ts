import { z } from 'zod';
import { NotificationEventName } from '@/modules/notifications/constants/notification-event.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const notificationEmailVerificationRequestedEvent = defineDomainEvent({
  name: NotificationEventName.EmailVerificationRequested,
  schema: z.object({
    workspaceId: z.uuid(),
    userId: z.uuid(),
  }),
});

export type NotificationEmailVerificationInput = z.infer<
  typeof notificationEmailVerificationRequestedEvent.schema
>;
