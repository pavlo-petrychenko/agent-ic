import { randomUUID } from 'node:crypto';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { channelFor, defineChannel } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesModule } from '@/platform/live-updates/live-updates.module';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

const messageSchema = z.object({ messageId: z.string() });

const conversationProbeChannel = defineChannel({
  name: 'test-conversation',
  schema: messageSchema,
});

class ProbeRollback extends Error {}

describe('LiveUpdatesService', () => {
  let testingModule: TestingModule;
  let liveUpdates: LiveUpdatesService;
  let txHost: TransactionHost<AppTransactionAdapter>;

  beforeAll(async () => {
    testingModule = await createPlatformTestingModule(TestRedisDatabase.LiveUpdates, [
      LiveUpdatesModule.forRole(Role.Api),
    ]);
    liveUpdates = testingModule.get(LiveUpdatesService);
    txHost = testingModule.get(TransactionHost);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('keys the channel by its name and segments', () => {
    expect(channelFor(conversationProbeChannel, 'cnv_1').key).toBe('topic:test-conversation:cnv_1');
  });

  it('delivers a published event to a subscriber of the same channel', async () => {
    const channel = channelFor(conversationProbeChannel, randomUUID());
    const events = await liveUpdates.subscribe(channel);

    await liveUpdates.publish(channel, { messageId: 'msg_1' });

    expect((await events.next()).value).toEqual({ messageId: 'msg_1' });
    await events.return?.();
  });

  it('does not deliver events of another channel', async () => {
    const channel = channelFor(conversationProbeChannel, randomUUID());
    const other = channelFor(conversationProbeChannel, randomUUID());
    const events = await liveUpdates.subscribe(channel);

    await liveUpdates.publish(other, { messageId: 'other' });
    await liveUpdates.publish(channel, { messageId: 'mine' });

    expect((await events.next()).value).toEqual({ messageId: 'mine' });
    await events.return?.();
  });

  it('publishes after the commit and drops events of a rolled-back transaction', async () => {
    const channel = channelFor(conversationProbeChannel, randomUUID());
    const events = await liveUpdates.subscribe(channel);

    await expect(
      txHost.withTransaction(async () => {
        await liveUpdates.publish(channel, { messageId: 'rolled-back' });
        throw new ProbeRollback();
      }),
    ).rejects.toThrow(ProbeRollback);
    await txHost.withTransaction(() => liveUpdates.publish(channel, { messageId: 'committed' }));

    expect((await events.next()).value).toEqual({ messageId: 'committed' });
    await events.return?.();
  });

  it('lets several subscribers share one channel', async () => {
    const channel = channelFor(conversationProbeChannel, randomUUID());
    const first = await liveUpdates.subscribe(channel);
    const second = await liveUpdates.subscribe(channel);

    await first.return?.();
    await liveUpdates.publish(channel, { messageId: 'shared' });

    expect((await second.next()).value).toEqual({ messageId: 'shared' });
    await second.return?.();
  });
});
