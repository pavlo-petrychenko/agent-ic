import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { API_CHANNEL_PREVIOUS_KEY_TTL_MS } from '@/modules/channels/constants/api-channel.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { apiChannelSecretHint } from '@/modules/channels/helpers/api-channel-secret.helpers';
import { RotateApiChannelKeyUseCase } from '@/modules/channels/use-cases/rotate-api-channel-key.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedApiChannel,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { ensureAgentRow } from '@test/support/helpers/parent-rows.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('RotateApiChannelKeyUseCase', () => {
  let testbed: ChannelsTestbed;
  let rotate: RotateApiChannelKeyUseCase;
  let secureTokens: SecureTokenService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    rotate = testbed.module.get(RotateApiChannelKeyUseCase);
    secureTokens = testbed.module.get(SecureTokenService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const target = (seeded: Awaited<ReturnType<typeof seedApiChannel>>) =>
    testbed.ids.toPublic(IdPrefix.Channel, seeded.channel.id);

  it('stores a new hash and keeps the old one for 24 hours', async () => {
    const seeded = await seedApiChannel(testbed);

    const result = await rotate.execute(seeded.ctx, { id: target(seeded) });

    expect(result.secret).not.toBe('');
    expect(result.channel.tokenMasked).toMatch(/^.{8}•+.{2}$/);
    expect(result.channel.tokenMasked).toBe(apiChannelSecretHint(result.secret));
    expect(result.channel.status).toBe(ChannelStatus.Connected);

    const stored = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.channels.findById(seeded.workspaceId, seeded.channel.id),
    );
    if (stored === null) {
      throw new Error('Expected a stored channel');
    }
    const credentials = testbed.channelTokens.openCredentials(stored.credentialsSealed);
    if (!('secretKeyHash' in credentials)) {
      throw new Error('Expected API credentials');
    }
    expect(credentials.secretKeyHash).not.toBe('old-secret-hash');
    expect(secureTokens.matches(result.secret, credentials.secretKeyHash)).toBe(true);
    expect(credentials.previousSecretKeyHash).toBe('old-secret-hash');
    expect(credentials.previousKeyExpiresAt).toBe(
      new Date(testbed.clock.now().getTime() + API_CHANNEL_PREVIOUS_KEY_TTL_MS).toISOString(),
    );
  });

  it('refuses a channel that is not an api channel', async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = testbed.ids.generate();
    await ensureAgentRow(testbed.module, workspace.workspaceId, agentId);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      agentId,
      status: ChannelStatus.Connected,
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );

    await expect(
      rotate.execute(workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner), {
        id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('refuses a channel from another workspace', async () => {
    const first = await seedApiChannel(testbed);
    const second = await seedApiChannel(testbed);

    await expect(rotate.execute(first.ctx, { id: target(second) })).rejects.toBeInstanceOf(
      ChannelNotFoundError,
    );
  });

  it('refuses an operator', async () => {
    const seeded = await seedApiChannel(testbed);

    await expect(
      rotate.execute(workspaceCtx(seeded.userId, seeded.workspaceId, WorkspaceRole.Operator), {
        id: target(seeded),
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
