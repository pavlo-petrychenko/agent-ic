import { DomainEventDefinition } from '@/platform/domain-events/domain-event.definition';
import { DomainEventSubscription } from '@/platform/domain-events/domain-event.subscription';
import { JobDefinition } from '@/platform/queues/job.definition';
import { QueueName } from '@/platform/queues/queue.constants';
import { ProbeEventName, ProbeJobName } from '@test/support/async-jobs.constants';
import { probeDataSchema } from '@test/support/async-jobs.schema';
import type { ProbeData } from '@test/support/async-jobs.typedefs';

export class RecordProbeJob extends JobDefinition<ProbeData> {
  readonly queue = QueueName.Notify;
  readonly name = ProbeJobName.Record;
  readonly schema = probeDataSchema;
}

export class RejectProbeJob extends JobDefinition<ProbeData> {
  readonly queue = QueueName.Notify;
  readonly name = ProbeJobName.Reject;
  readonly schema = probeDataSchema;
}

export class ProbeSignedUpEvent extends DomainEventDefinition<ProbeData> {
  readonly name = ProbeEventName.SignedUp;
  readonly schema = probeDataSchema;
}

export const probeSignedUpEvent = new ProbeSignedUpEvent();

export class WelcomeOnProbeSignedUp extends DomainEventSubscription<ProbeData> {
  readonly event = probeSignedUpEvent;
  readonly queue = QueueName.Notify;
  readonly name = ProbeJobName.Welcome;
}

export class AuditOnProbeSignedUp extends DomainEventSubscription<ProbeData> {
  readonly event = probeSignedUpEvent;
  readonly queue = QueueName.Notify;
  readonly name = ProbeJobName.Audit;
}

export const recordProbeJob = new RecordProbeJob();
export const rejectProbeJob = new RejectProbeJob();
export const welcomeOnProbeSignedUp = new WelcomeOnProbeSignedUp();
export const auditOnProbeSignedUp = new AuditOnProbeSignedUp();
