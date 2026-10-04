import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { ProbeJobName } from '@test/support/constants/async-jobs.constants';
import { probeSignedUpEvent } from '@test/support/jobs/probe-signed-up.job';

export const welcomeOnProbeSignedUp = defineDomainEventSubscription({
  event: probeSignedUpEvent,
  queue: QueueName.Notify,
  name: ProbeJobName.Welcome,
});
