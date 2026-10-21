import { z } from 'zod';
import { UsageEventName } from '@/modules/usage/constants/usage-event.constants';
import { UsageThreshold } from '@/modules/usage/constants/usage.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const usageThresholdReachedEvent = defineDomainEvent({
  name: UsageEventName.ThresholdReached,
  schema: z.object({ workspaceId: z.uuid(), threshold: z.enum(UsageThreshold) }),
});
