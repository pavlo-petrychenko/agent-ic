import { randomUUID } from 'node:crypto';

import type { TestingModule } from '@nestjs/testing';
import { TransactionHost } from '@nestjs-cls/transactional';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AppTransactionAdapter } from '@/platform/db/database.typedefs';
import { createPlatformTestingModule } from '@/platform/testing/database-testing.helpers';
import { TestRedisDatabase } from '@/platform/testing/test-infrastructure.constants';

import { PubSubModule } from './pubsub.module';
import { PubSubService } from './pubsub.service';
import { Topic } from './topic';

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
