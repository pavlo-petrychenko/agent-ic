import { DomainEventSubscription } from '@/platform/domain-events/domain-event.subscription';
import { QueueName } from '@/platform/queues/queue.constants';
import { ProbeJobName } from '@test/support/constants/async-jobs.constants';
import { probeSignedUpEvent } from '@test/support/jobs/probe-signed-up.job';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

export class WelcomeOnProbeSignedUp extends DomainEventSubscription<ProbeData> {
  readonly event = probeSignedUpEvent;
  readonly queue = QueueName.Notify;
  readonly name = ProbeJobName.Welcome;
}

export const welcomeOnProbeSignedUp = new WelcomeOnProbeSignedUp();
