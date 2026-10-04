import { DomainEventDefinition } from '@/platform/domain-events/domain-event.definition';
import { ProbeEventName } from '@test/support/constants/async-jobs.constants';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

export class ProbeSignedUpEvent extends DomainEventDefinition<ProbeData> {
  readonly name = ProbeEventName.SignedUp;
  readonly schema = probeDataSchema;
}

export const probeSignedUpEvent = new ProbeSignedUpEvent();
