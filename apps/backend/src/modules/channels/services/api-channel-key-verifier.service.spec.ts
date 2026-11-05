import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { InvalidApiChannelKeyError } from '@/modules/channels/errors/invalid-api-channel-key.error';
import { ApiChannelKeyVerifierService } from '@/modules/channels/services/api-channel-key-verifier.service';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import {
  createChannelsTestbed,
  seedApiChannel,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const TRACE_ID = 'api-ingress-trace';
const PREVIOUS_KEY_TTL_MS = 60_000;

describe('ApiChannelKeyVerifierService', () => {
  let testbed: ChannelsTestbed;
  let verifier: ApiChannelKeyVerifierService;
  let secureTokens: SecureTokenService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    verifier = testbed.module.get(ApiChannelKeyVerifierService);
    secureTokens = testbed.module.get(SecureTokenService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedWithKeys = async (
    options: {
      readonly previous?: boolean;
      readonly previousExpiresAt?: Date | null;
      readonly status?: ChannelStatus;
    } = {},
  ) => {
    const current = secureTokens.generate();
    const previous = options.previous === true ? secureTokens.generate() : null;
    const seeded = await seedApiChannel(testbed, {
      status: options.status ?? ChannelStatus.Connected,
      credentialsSealed: testbed.channelTokens.sealCredentials({
        secretKeyHash: current.hash,
        secretKeyHint: 'hint',
        previousSecretKeyHash: previous?.hash ?? null,
        previousKeyExpiresAt:
          previous === null
            ? null
            : (
                options.previousExpiresAt ??
                new Date(testbed.clock.now().getTime() + PREVIOUS_KEY_TTL_MS)
              ).toISOString(),
        webhookSigningSecret: 'webhook-secret',
      }),
    });
    return { ...seeded, current, previous };
  };

  const publicIdOf = (channelId: string): string =>
    testbed.ids.toPublic(IdPrefix.Channel, channelId);

  it('accepts the current key and builds an API channel context', async () => {
    const seeded = await seedWithKeys();

    const result = await verifier.verify({
      publicChannelId: publicIdOf(seeded.channel.id),
      authorization: `Bearer ${seeded.current.token}`,
      traceId: TRACE_ID,
      clientIp: '127.0.0.1',
    });

    expect(result.channel).toMatchObject({
      id: seeded.channel.id,
      workspaceId: seeded.workspaceId,
      agentId: seeded.agentId,
      status: ChannelStatus.Connected,
    });
    expect(result.ctx.actor).toEqual({
      kind: ActorKind.ApiChannel,
      channelId: seeded.channel.id,
    });
    expect(result.ctx.workspaceId).toBe(seeded.workspaceId);
    expect(result.ctx.workspaceRole).toBeNull();
    expect(result.ctx.traceId).toBe(TRACE_ID);
    expect(result.ctx.clientIp).toBe('127.0.0.1');
  });

  it('accepts the previous key before it expires', async () => {
    const seeded = await seedWithKeys({
      previous: true,
      previousExpiresAt: new Date(testbed.clock.now().getTime() + PREVIOUS_KEY_TTL_MS),
    });

    await expect(
      verifier.verify({
        publicChannelId: publicIdOf(seeded.channel.id),
        authorization: `Bearer ${seeded.previous?.token ?? ''}`,
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).resolves.toMatchObject({ channel: { id: seeded.channel.id } });
  });

  it('rejects the previous key after it expires', async () => {
    const seeded = await seedWithKeys({
      previous: true,
      previousExpiresAt: new Date(testbed.clock.now().getTime() - 1),
    });

    await expect(
      verifier.verify({
        publicChannelId: publicIdOf(seeded.channel.id),
        authorization: `Bearer ${seeded.previous?.token ?? ''}`,
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).rejects.toBeInstanceOf(InvalidApiChannelKeyError);
  });

  it('rejects a wrong key', async () => {
    const seeded = await seedWithKeys();
    const wrong = secureTokens.generate();

    await expect(
      verifier.verify({
        publicChannelId: publicIdOf(seeded.channel.id),
        authorization: `Bearer ${wrong.token}`,
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).rejects.toBeInstanceOf(InvalidApiChannelKeyError);
  });

  it('rejects a missing key', async () => {
    const seeded = await seedWithKeys();

    await expect(
      verifier.verify({
        publicChannelId: publicIdOf(seeded.channel.id),
        authorization: null,
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).rejects.toBeInstanceOf(InvalidApiChannelKeyError);
  });

  it('rejects a channel that is not connected', async () => {
    const seeded = await seedWithKeys({ status: ChannelStatus.Disconnected });

    await expect(
      verifier.verify({
        publicChannelId: publicIdOf(seeded.channel.id),
        authorization: `Bearer ${seeded.current.token}`,
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('rejects an unknown public channel id', async () => {
    await expect(
      verifier.verify({
        publicChannelId: publicIdOf(testbed.ids.generate()),
        authorization: 'Bearer anything',
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('rejects a malformed public channel id', async () => {
    await expect(
      verifier.verify({
        publicChannelId: 'not-a-channel-id',
        authorization: 'Bearer anything',
        traceId: TRACE_ID,
        clientIp: null,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });
});
