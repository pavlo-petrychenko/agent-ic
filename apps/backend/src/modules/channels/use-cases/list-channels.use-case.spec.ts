import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListChannelsUseCase } from '@/modules/channels/use-cases/list-channels.use-case';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('ListChannelsUseCase', () => {
  let testbed: ChannelsTestbed;
  let listChannels: ListChannelsUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    listChannels = testbed.module.get(ListChannelsUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lists only the channels of the workspace', async () => {
    const workspaceA = await seedChannelWorkspace(testbed);
    const workspaceB = await seedChannelWorkspace(testbed);
    const first = newChannel(testbed, workspaceA.workspaceId, {
      createdByUserId: workspaceA.userId,
    });
    const second = newChannel(testbed, workspaceA.workspaceId, {
      createdByUserId: workspaceA.userId,
    });
    const foreign = newChannel(testbed, workspaceB.workspaceId, {
      createdByUserId: workspaceB.userId,
    });
    await testbed.tenants.run(workspaceA.workspaceId, async () => {
      await testbed.channels.insertIfAbsent(first);
      await testbed.channels.insertIfAbsent(second);
    });
    await testbed.tenants.run(workspaceB.workspaceId, () =>
      testbed.channels.insertIfAbsent(foreign),
    );

    const views = await listChannels.execute(
      workspaceCtx(workspaceA.userId, workspaceA.workspaceId, WorkspaceRole.Owner),
    );

    expect(views.map((view) => view.id).sort()).toEqual(
      [
        testbed.ids.toPublic(IdPrefix.Channel, first.id),
        testbed.ids.toPublic(IdPrefix.Channel, second.id),
      ].sort(),
    );
    expect(views.map((view) => view.id)).not.toContain(
      testbed.ids.toPublic(IdPrefix.Channel, foreign.id),
    );
  });
});
