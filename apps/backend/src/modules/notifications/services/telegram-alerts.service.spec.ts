import { IdPrefix, Locale } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from '@/modules/identity';
import { telegramAlertTakeOverRequestedEvent } from '@/modules/notifications/events/telegram-alert-take-over-requested.event';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { TelegramLinkRepository } from '@/modules/notifications/repositories/telegram-link.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { TelegramAlertsService } from '@/modules/notifications/services/telegram-alerts.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import type { IdService } from '@/platform/ids/services/id.service';
import { FakeTelegramGateway } from '@/platform/telegram/gateways/telegram.fake';
import { systemCtx } from '@test/support/fixtures/identity.fixture';

const CALLBACK = {
  updateId: '1',
  message: null,
  callbackQuery: {
    id: 'callback-1',
    chatId: '42',
    telegramMessageId: '7',
    senderId: '900',
    senderName: 'Lera',
    data: 'to:ws_public:cnv_public',
  },
};

describe('TelegramAlertsService', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const findTelegramLinkByChat = vi.fn<NotificationSettingsRepository['findTelegramLinkByChat']>();
  const findUser = vi.fn<UsersRepository['findById']>();
  const emit = vi.fn<DomainEventsService['emit']>();
  const telegram = new FakeTelegramGateway();
  let service: TelegramAlertsService;

  beforeEach(() => {
    run.mockReset();
    findTelegramLinkByChat.mockReset();
    findUser.mockReset();
    emit.mockReset();
    telegram.answerCallbackQueryCalls.length = 0;
    run.mockImplementation((_workspaceId, work) => work());
    findTelegramLinkByChat.mockResolvedValue({
      workspaceId: 'workspace-1',
      channelId: 'channel-1',
      settingsId: 'settings-1',
      userId: 'user-1',
      chatId: '42',
      linkCodeExpiresAt: null,
    });
    findUser.mockResolvedValue({
      id: 'user-1',
      locale: Locale.En,
    } as unknown as Awaited<ReturnType<UsersRepository['findById']>>);
    emit.mockResolvedValue(undefined);
    service = new TelegramAlertsService(
      { run } as unknown as TenantTransactionService,
      {} as unknown as NotificationSettingsService,
      { findTelegramLinkByChat } as unknown as NotificationSettingsRepository,
      { findById: findUser } as unknown as UsersRepository,
      {} as unknown as TelegramLinkRepository,
      {} as unknown as SecureTokenService,
      {
        config: { telegram: { alertsBotToken: 'alerts-token' } },
      } as unknown as ConfigService,
      { now: () => new Date('2026-11-07T21:00:00.000Z') } as unknown as ClockService,
      {
        tryFromPublic: (prefix: string) =>
          prefix === IdPrefix.Workspace ? 'workspace-1' : 'conversation-1',
      } as unknown as IdService,
      { emit } as unknown as DomainEventsService,
      telegram,
    );
  });

  const ctx = (): UseCaseCtx => systemCtx();

  it('requests a takeover for the linked chat and answers the callback', async () => {
    await service.handleUpdate(ctx(), CALLBACK);

    expect(findTelegramLinkByChat).toHaveBeenCalledWith('workspace-1', '42');
    expect(emit).toHaveBeenCalledWith(
      { ...ctx(), workspaceId: 'workspace-1' },
      telegramAlertTakeOverRequestedEvent,
      {
        userId: 'user-1',
        conversationPublicId: 'cnv_public',
        chatId: '42',
        messageId: '7',
      },
    );
    expect(telegram.answerCallbackQueryCalls).toEqual([
      {
        token: 'alerts-token',
        callbackQueryId: 'callback-1',
        text: 'Taking over…',
        showAlert: false,
      },
    ]);
  });

  it('answers in the linked user locale', async () => {
    findUser.mockResolvedValue({
      id: 'user-1',
      locale: Locale.Uk,
    } as unknown as Awaited<ReturnType<UsersRepository['findById']>>);

    await service.handleUpdate(ctx(), CALLBACK);

    expect(telegram.answerCallbackQueryCalls[0]?.text).toBe('Беру чат…');
  });

  it('rejects a malformed callback without an event', async () => {
    await service.handleUpdate(ctx(), {
      ...CALLBACK,
      callbackQuery: { ...CALLBACK.callbackQuery, data: 'bad' },
    });

    expect(findTelegramLinkByChat).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(telegram.answerCallbackQueryCalls[0]?.text).toBe('This button is no longer active.');
  });

  it('rejects a chat that is not linked to the workspace', async () => {
    findTelegramLinkByChat.mockResolvedValue(null);

    await service.handleUpdate(ctx(), CALLBACK);

    expect(emit).not.toHaveBeenCalled();
    expect(telegram.answerCallbackQueryCalls[0]?.text).toBe('This button is no longer active.');
  });
});
