import { describe, expect, it } from 'vitest';
import { FakeTelegramGateway } from '@/modules/channels/gateways/telegram.fake';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const TOKEN = `700000003:${'C'.repeat(35)}`;

const serviceFor = (transport: TelegramTransport) => {
  const config = new ConfigService(
    loadAppConfig(
      { role: Role.Api, queues: [] },
      createTestEnv({ [EnvVar.TelegramTransport]: transport }),
    ),
  );
  const telegram = new FakeTelegramGateway();
  const ids = new IdService(new ManualClock(new Date()));
  const service = new TelegramChannelService(
    telegram,
    new ChannelTokenService(new SecretBoxService(config)),
    new SecureTokenService(),
    config,
    ids,
  );
  return { service, telegram, ids };
};

describe('TelegramChannelService', () => {
  it('registers a webhook when the transport is webhook', async () => {
    const { service, telegram, ids } = serviceFor(TelegramTransport.Webhook);

    await service.configureTransport({
      token: TOKEN,
      workspaceId: ids.generate(),
      channelId: ids.generate(),
      secret: 'webhook-secret',
    });

    expect(telegram.deleteWebhookCalls).toEqual([]);
    expect(telegram.setWebhookCalls).toHaveLength(1);
  });

  it('removes the webhook when the transport is polling', async () => {
    const { service, telegram, ids } = serviceFor(TelegramTransport.Polling);

    await service.configureTransport({
      token: TOKEN,
      workspaceId: ids.generate(),
      channelId: ids.generate(),
      secret: 'webhook-secret',
    });

    expect(telegram.deleteWebhookCalls).toEqual([TOKEN]);
    expect(telegram.setWebhookCalls).toEqual([]);
  });
});
