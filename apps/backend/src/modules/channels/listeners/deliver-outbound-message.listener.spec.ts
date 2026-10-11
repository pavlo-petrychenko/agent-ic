import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MessageDelivery } from '@/modules/conversations';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import {
  PROBE_WAIT_INTERVAL_MS,
  PROBE_WAIT_TIMEOUT_MS,
} from '@test/support/constants/async-jobs.constants';
import {
  createChannelsWorkerTestbed,
  deliveryOf,
  queueAgentReply,
  seedChannelConversation,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const WAIT = { timeout: PROBE_WAIT_TIMEOUT_MS, interval: PROBE_WAIT_INTERVAL_MS };

describe('DeliverOutboundMessageListener', () => {
  let testbed: ChannelsTestbed;

  beforeAll(async () => {
    testbed = await createChannelsWorkerTestbed();
  });

  afterAll(async () => {
    await testbed.queues.get(QueueName.Outbound).obliterate({ force: true });
    await testbed.module.close();
  });

  it('delivers a recorded agent reply from the outbound queue', async () => {
    const conversation = await seedChannelConversation(testbed);

    const message = await queueAgentReply(testbed, conversation);

    await vi.waitFor(async () => {
      expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Delivered);
    }, WAIT);
    expect(testbed.simulated.transcript(conversation.id)).toHaveLength(1);
  });
});
