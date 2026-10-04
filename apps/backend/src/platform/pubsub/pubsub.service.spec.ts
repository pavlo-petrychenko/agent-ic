import { randomUUID } from 'node:crypto';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { PubSubModule } from '@/platform/pubsub/pubsub.module';
import { PubSubService } from '@/platform/pubsub/pubsub.service';
import { Topic } from '@/platform/pubsub/topic';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

const messageSchema = z.object({ messageId: z.string() });

type MessageEvent = z.infer<typeof messageSchema>;

class ConversationProbeTopic extends Topic<MessageEvent> {
  protected readonly name = 'test-conversation';
  readonly schema = messageSchema;
}

class ProbeRollback extends Error {}

describe('PubSubService', () => {
  let testingModule: TestingModule;
  let pubsub: PubSubService;
  let txHost: TransactionHost<AppTransactionAdapter>;

  beforeAll(async () => {
    testingModule = await createPlatformTestingModule(TestRedisDatabase.PubSub, [PubSubModule]);
    pubsub = testingModule.get(PubSubService);
    txHost = testingModule.get(TransactionHost);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('names the channel after the topic and its key', () => {
    expect(new ConversationProbeTopic('cnv_1').channel).toBe('topic:test-conversation:cnv_1');
  });

  it('delivers a published event to a subscriber of the same topic', async () => {
    const topic = new ConversationProbeTopic(randomUUID());
    const events = await pubsub.subscribe(topic);

    await pubsub.publish(topic, { messageId: 'msg_1' });

    expect((await events.next()).value).toEqual({ messageId: 'msg_1' });
    await events.return?.();
  });

  it('does not deliver events of another topic', async () => {
    const topic = new ConversationProbeTopic(randomUUID());
    const other = new ConversationProbeTopic(randomUUID());
    const events = await pubsub.subscribe(topic);

    await pubsub.publish(other, { messageId: 'other' });
    await pubsub.publish(topic, { messageId: 'mine' });

    expect((await events.next()).value).toEqual({ messageId: 'mine' });
    await events.return?.();
  });

  it('publishes after the commit and drops events of a rolled-back transaction', async () => {
    const topic = new ConversationProbeTopic(randomUUID());
    const events = await pubsub.subscribe(topic);

    await expect(
      txHost.withTransaction(async () => {
        await pubsub.publish(topic, { messageId: 'rolled-back' });
        throw new ProbeRollback();
      }),
    ).rejects.toThrow(ProbeRollback);
    await txHost.withTransaction(() => pubsub.publish(topic, { messageId: 'committed' }));

    expect((await events.next()).value).toEqual({ messageId: 'committed' });
    await events.return?.();
  });

  it('lets several subscribers share one topic', async () => {
    const topic = new ConversationProbeTopic(randomUUID());
    const first = await pubsub.subscribe(topic);
    const second = await pubsub.subscribe(topic);

    await first.return?.();
    await pubsub.publish(topic, { messageId: 'shared' });

    expect((await second.next()).value).toEqual({ messageId: 'shared' });
    await second.return?.();
  });
});
