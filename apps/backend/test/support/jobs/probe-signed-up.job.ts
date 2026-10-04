import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';
import { ProbeEventName } from '@test/support/constants/async-jobs.constants';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';

export const probeSignedUpEvent = defineDomainEvent({
  name: ProbeEventName.SignedUp,
  schema: probeDataSchema,
});
