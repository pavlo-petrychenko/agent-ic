import { describe, expect, it } from 'vitest';
import {
  defineDomainEvent,
  defineDomainEventSubscription,
  isDomainEventSubscription,
} from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { ProbeEventName, ProbeJobName } from '@test/support/constants/async-jobs.constants';
import { recordProbeJob } from '@test/support/jobs/record-probe.job';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';

describe('defineDomainEvent', () => {
  it('returns a frozen event with the given name and schema', () => {
    const event = defineDomainEvent({ name: ProbeEventName.SignedUp, schema: probeDataSchema });

    expect(event).toEqual({ name: ProbeEventName.SignedUp, schema: probeDataSchema });
    expect(Object.isFrozen(event)).toBe(true);
  });
});

describe('defineDomainEventSubscription', () => {
  it('takes the payload schema from the event', () => {
    const event = defineDomainEvent({ name: ProbeEventName.SignedUp, schema: probeDataSchema });

    const subscription = defineDomainEventSubscription({
      event,
      queue: QueueName.Notify,
      name: ProbeJobName.Welcome,
    });

    expect(subscription).toEqual({
      event,
      queue: QueueName.Notify,
      name: ProbeJobName.Welcome,
      schema: probeDataSchema,
    });
    expect(Object.isFrozen(subscription)).toBe(true);
  });
});

describe('isDomainEventSubscription', () => {
  it('accepts a subscription', () => {
    const subscription = defineDomainEventSubscription({
      event: defineDomainEvent({ name: ProbeEventName.SignedUp, schema: probeDataSchema }),
      queue: QueueName.Notify,
      name: ProbeJobName.Welcome,
    });

    expect(isDomainEventSubscription(subscription)).toBe(true);
  });

  it.each([undefined, null, recordProbeJob])('rejects %s', (value) => {
    expect(isDomainEventSubscription(value)).toBe(false);
  });
});
