import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { TelegramPollerRepository } from '@/modules/channels/repositories/telegram-poller.repository';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramTokenHealthService } from '@/modules/channels/services/telegram-token-health.service';
import type {
  TelegramPollerChannel,
  TelegramWebhookInfo,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { ConfigService } from '@/platform/config/services/config.service';

const WEBHOOK_INFO: TelegramWebhookInfo = {
  url: 'https://local.agent-ic.pavlop.dev/webhooks/telegram/ws/chn',
  pendingUpdateCount: 0,
  lastErrorAt: null,
  lastErrorMessage: null,
};

const channel = (id: string, sealed: string): TelegramPollerChannel => ({
  id,
  workspaceId: `ws-${id}`,
  credentialsSealed: sealed,
});

const listConnectedMock = () => vi.fn<() => Promise<TelegramPollerChannel[]>>();
const webhookInfoMock = () => vi.fn<(token: string) => Promise<TelegramWebhookInfo>>();
const markBrokenMock = () => vi.fn<(workspaceId: string, channelId: string) => Promise<boolean>>();

const configFor = (transport: TelegramTransport): ConfigService =>
  ({ config: { telegram: { transport } } }) as unknown as ConfigService;

describe('TelegramTokenHealthService', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const serviceFor = (
    transport: TelegramTransport,
    channels: TelegramPollerChannel[],
    telegram: Pick<TelegramGateway, 'getWebhookInfo'>,
    health: Pick<ChannelHealthService, 'markBroken'>,
    tokens: Pick<ChannelTokenService, 'openCredentials'> = {
      openCredentials: (sealed) => ({ botToken: sealed, webhookSecretHash: 'hash' }),
    },
  ) =>
    new TelegramTokenHealthService(
      configFor(transport),
      {
        listConnected: listConnectedMock().mockResolvedValue(channels),
      } as unknown as TelegramPollerRepository,
      tokens as unknown as ChannelTokenService,
      telegram as unknown as TelegramGateway,
      health as unknown as ChannelHealthService,
    );

  it('does nothing outside webhook mode', async () => {
    const listConnected = listConnectedMock();
    const service = new TelegramTokenHealthService(
      configFor(TelegramTransport.Polling),
      { listConnected } as unknown as TelegramPollerRepository,
      {} as ChannelTokenService,
      { getWebhookInfo: webhookInfoMock() } as unknown as TelegramGateway,
      { markBroken: markBrokenMock() } as unknown as ChannelHealthService,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 0, broken: 0 });
    expect(listConnected).not.toHaveBeenCalled();
  });

  it('leaves valid tokens connected', async () => {
    const telegram = { getWebhookInfo: webhookInfoMock().mockResolvedValue(WEBHOOK_INFO) };
    const health = { markBroken: markBrokenMock() };

    const service = serviceFor(
      TelegramTransport.Webhook,
      [channel('ch-1', 'good')],
      telegram,
      health,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 1, broken: 0 });
    expect(telegram.getWebhookInfo).toHaveBeenCalledWith('good');
    expect(health.markBroken).not.toHaveBeenCalled();
  });

  it.each([401, 404])('marks a channel broken on %i', async (status) => {
    const telegram = {
      getWebhookInfo: webhookInfoMock().mockRejectedValue(
        new TelegramApiError({ method: 'getWebhookInfo', status }),
      ),
    };
    const health = { markBroken: markBrokenMock().mockResolvedValue(true) };

    const service = serviceFor(
      TelegramTransport.Webhook,
      [channel('ch-1', 'bad')],
      telegram,
      health,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 1, broken: 1 });
    expect(health.markBroken).toHaveBeenCalledWith('ws-ch-1', 'ch-1');
  });

  it('keeps the channel connected on a retryable failure', async () => {
    const telegram = {
      getWebhookInfo: webhookInfoMock().mockRejectedValue(
        new TelegramApiError({ method: 'getWebhookInfo', status: 429 }),
      ),
    };
    const health = { markBroken: markBrokenMock() };

    const service = serviceFor(
      TelegramTransport.Webhook,
      [channel('ch-1', 'slow')],
      telegram,
      health,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 1, broken: 0 });
    expect(health.markBroken).not.toHaveBeenCalled();
  });

  it('checks every connected channel in batches', async () => {
    const telegram = {
      getWebhookInfo: webhookInfoMock().mockImplementation((token) =>
        token === 'bad'
          ? Promise.reject(new TelegramApiError({ method: 'getWebhookInfo', status: 401 }))
          : Promise.resolve(WEBHOOK_INFO),
      ),
    };
    const health = { markBroken: markBrokenMock().mockResolvedValue(true) };

    const service = serviceFor(
      TelegramTransport.Webhook,
      [channel('ch-1', 'good'), channel('ch-2', 'bad')],
      telegram,
      health,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 2, broken: 1 });
    expect(telegram.getWebhookInfo).toHaveBeenCalledTimes(2);
    expect(health.markBroken).toHaveBeenCalledWith('ws-ch-2', 'ch-2');
  });

  it('skips a sealed credential that is not a bot token', async () => {
    const telegram = { getWebhookInfo: webhookInfoMock() };
    const health = { markBroken: markBrokenMock() };
    const tokens = {
      openCredentials: () => ({ secretKeyHash: 'hash' }),
    };

    const service = serviceFor(
      TelegramTransport.Webhook,
      [channel('ch-1', 'api')],
      telegram,
      health,
      tokens,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 1, broken: 0 });
    expect(telegram.getWebhookInfo).not.toHaveBeenCalled();
  });

  it('does not count a channel that is already broken', async () => {
    const telegram = {
      getWebhookInfo: webhookInfoMock().mockRejectedValue(
        new TelegramApiError({ method: 'getWebhookInfo', status: 401 }),
      ),
    };
    const health = { markBroken: markBrokenMock().mockResolvedValue(false) };

    const service = serviceFor(
      TelegramTransport.Webhook,
      [channel('ch-1', 'bad')],
      telegram,
      health,
    );

    await expect(service.checkConnected()).resolves.toEqual({ checked: 1, broken: 0 });
  });
});
