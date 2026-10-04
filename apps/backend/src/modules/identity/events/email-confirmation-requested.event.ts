import { z } from 'zod';
import { IdentityEventName } from '@/modules/identity/constants/identity-event.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const emailConfirmationRequestedEvent = defineDomainEvent({
  name: IdentityEventName.EmailConfirmationRequested,
  schema: z.object({ userId: z.uuid() }),
});
