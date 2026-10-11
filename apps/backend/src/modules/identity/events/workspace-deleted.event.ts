import { z } from 'zod';
import { IdentityEventName } from '@/modules/identity/constants/identity-event.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const workspaceDeletedEvent = defineDomainEvent({
  name: IdentityEventName.WorkspaceDeleted,
  schema: z.object({ workspaceId: z.uuid() }),
});
