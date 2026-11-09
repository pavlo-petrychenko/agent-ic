import { IdPrefix, Locale } from '@agent-ic/contracts';
import type { ChannelKind } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentsRepository } from '@/modules/agents';
import type { ConversationsRepository, Message, MessagesRepository } from '@/modules/conversations';
import type { UsersRepository, WorkspacesRepository } from '@/modules/identity';
import {
  EmailGateway,
  EmailTemplate,
  escalationEmailSubject,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
  NotificationsRepository,
  NotificationSettingsService,
} from '@/modules/notifications';
import type { NotificationDeliveryRecord, NotificationRecord } from '@/modules/notifications';
import type { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import type { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import { DeliverNotificationUseCase } from '@/modules/runs/use-cases/deliver-notification.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import { TelegramParseMode } from '@/platform/telegram/constants/telegram.constants';
import { TelegramApiError } from '@/platform/telegram/errors/telegram-api.error';
import { FakeTelegramGateway } from '@/platform/telegram/gateways/telegram.fake';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';

const NOW = new Date('2026-11-06T12:00:00.000Z');

const notification: NotificationRecord = {
  id: 'notification-1',
  workspaceId: 'workspace-1',
  userId: 'user-1',
  runStepId: 'step-1',
  kind: NotificationKind.Escalation,
  lastCustomerMessageId: 'message-1',
  createdAt: NOW,
};

const pendingDelivery: NotificationDeliveryRecord = {
  id: 'delivery-1',
  workspaceId: 'workspace-1',
  notificationId: 'notification-1',
  channel: NotificationChannel.Email,
  status: NotificationDeliveryStatus.Pending,
  sentAt: null,
  readAt: null,
  attempts: 0,
  nextAttemptAt: NOW,
  lockedUntil: null,
  lastError: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const pendingTelegramDelivery: NotificationDeliveryRecord = {
  ...pendingDelivery,
  id: 'delivery-2',
  channel: NotificationChannel.Telegram,
};

const claimedDelivery: NotificationDeliveryRecord = {
  ...pendingDelivery,
  attempts: 1,
  lockedUntil: new Date(NOW.getTime() + 60_000),
};

const claimedTelegramDelivery: NotificationDeliveryRecord = {
  ...pendingTelegramDelivery,
  attempts: 1,
  lockedUntil: new Date(NOW.getTime() + 60_000),
};

describe('DeliverNotificationUseCase', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const findNotification = vi.fn<NotificationsRepository['findById']>();
  const claimDelivery = vi.fn<NotificationsRepository['claimDelivery']>();
  const markDelivered = vi.fn<NotificationsRepository['markDeliveryDelivered']>();
  const markFailed = vi.fn<NotificationsRepository['markDeliveryFailed']>();
  const describeSettings = vi.fn<NotificationSettingsService['describe']>();
  const telegramChatId = vi.fn<NotificationSettingsService['telegramChatId']>();
  const send = vi.fn<EmailGateway['send']>();
  const telegram = new FakeTelegramGateway();
  const findUser = vi.fn<UsersRepository['findById']>();
  const findWorkspace = vi.fn<WorkspacesRepository['findById']>();
  const findAgent = vi.fn<AgentsRepository['findById']>();
  const findConversation = vi.fn<ConversationsRepository['findById']>();
  const findStep = vi.fn<RunStepsRepository['findById']>();
  const findRun = vi.fn<RunsRepository['findById']>();
  const findMessage = vi.fn<MessagesRepository['findById']>();
  const findLatestCustomerMessage = vi.fn<MessagesRepository['findLatestCustomerMessage']>();
  const now = vi.fn<ClockService['now']>();
  const toPublic = vi.fn<IdService['toPublic']>();
  let service: DeliverNotificationUseCase;

  beforeEach(() => {
    run.mockReset();
    findNotification.mockReset();
    claimDelivery.mockReset();
    markDelivered.mockReset();
    markFailed.mockReset();
    describeSettings.mockReset();
    telegramChatId.mockReset();
    send.mockReset();
    telegram.sendMessageCalls.length = 0;
    findUser.mockReset();
    findWorkspace.mockReset();
    findAgent.mockReset();
    findConversation.mockReset();
    findStep.mockReset();
    findRun.mockReset();
    findMessage.mockReset();
    findLatestCustomerMessage.mockReset();
    now.mockReset();
    toPublic.mockReset();
    run.mockImplementation((_workspaceId, work) => work());
    now.mockReturnValue(NOW);
    toPublic.mockImplementation((prefix) =>
      prefix === IdPrefix.Workspace ? 'ws_public' : 'cnv_public',
    );
    findNotification.mockResolvedValue(notification);
    claimDelivery.mockResolvedValue(claimedDelivery);
    telegramChatId.mockResolvedValue(null);
    describeSettings.mockResolvedValue({
      platform: { enabled: true },
      email: { enabled: true, email: 'alerts@example.com', verifiedAt: null },
      telegram: {
        enabled: false,
        linked: false,
        username: null,
        botUsername: null,
        linkedAt: null,
      },
    });
    findUser.mockResolvedValue({
      id: 'user-1',
      name: 'Demo Operator',
      email: 'operator@example.com',
      locale: Locale.En,
    } as unknown as Awaited<ReturnType<UsersRepository['findById']>>);
    findWorkspace.mockResolvedValue({
      workspaceId: 'ws_public',
      name: 'Demo salon',
      timeZone: 'Europe/Kyiv',
    } as unknown as Awaited<ReturnType<WorkspacesRepository['findById']>>);
    findAgent.mockResolvedValue({
      id: 'agent-1',
      name: 'Salon assistant',
    } as unknown as Awaited<ReturnType<AgentsRepository['findById']>>);
    findConversation.mockResolvedValue({
      id: 'conversation-1',
      endUserName: 'Marta S.',
      channelKind: 'telegram' as ChannelKind,
    } as unknown as Awaited<ReturnType<ConversationsRepository['findById']>>);
    findStep.mockResolvedValue({
      id: 'step-1',
      runId: 'run-1',
      output: { reason: 'The customer asked for a person.' },
      error: null,
    } as unknown as RunStep);
    findRun.mockResolvedValue({
      id: 'run-1',
      conversationId: 'conversation-1',
    } as unknown as Run);
    findMessage.mockResolvedValue({
      id: 'message-1',
      text: 'Can someone call me?',
    } as unknown as Message);
    markDelivered.mockResolvedValue(undefined);
    markFailed.mockResolvedValue(undefined);
    service = new DeliverNotificationUseCase(
      { run } as unknown as TenantTransactionService,
      {
        findById: findNotification,
        claimDelivery,
        markDeliveryDelivered: markDelivered,
        markDeliveryFailed: markFailed,
      } as unknown as NotificationsRepository,
      {
        describe: describeSettings,
        telegramChatId,
      } as unknown as NotificationSettingsService,
      { send } as unknown as EmailGateway,
      telegram,
      { findById: findUser } as unknown as UsersRepository,
      { findById: findWorkspace } as unknown as WorkspacesRepository,
      { findById: findAgent } as unknown as AgentsRepository,
      { findById: findConversation } as unknown as ConversationsRepository,
      { findById: findStep } as unknown as RunStepsRepository,
      { findById: findRun } as unknown as RunsRepository,
      {
        findById: findMessage,
        findLatestCustomerMessage,
      } as unknown as MessagesRepository,
      {
        config: {
          publicUrl: 'https://app.test',
          telegram: { alertsBotToken: 'alerts-token' },
        },
      } as unknown as ConfigService,
      { now } as unknown as ClockService,
      { toPublic } as unknown as IdService,
    );
  });

  const execute = (channel: NotificationChannel = NotificationChannel.Email) =>
    service.execute(workspaceSystemCtx('workspace-1'), {
      notificationId: 'notification-1',
      channel,
    });

  it('sends the escalation email and marks the delivery delivered', async () => {
    await execute();

    expect(send).toHaveBeenCalledWith({
      template: EmailTemplate.Escalation,
      to: 'alerts@example.com',
      subject: escalationEmailSubject(Locale.En, 'Marta S.'),
      html: expect.stringContaining('The customer asked for a person.'),
      text: expect.stringContaining('Can someone call me?'),
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://app.test/w/ws_public/inbox?conversation=cnv_public'),
      }),
    );
    expect(claimDelivery).toHaveBeenCalledWith(
      'workspace-1',
      'notification-1',
      NotificationChannel.Email,
      NOW,
      new Date(NOW.getTime() + 60_000),
    );
    expect(markDelivered).toHaveBeenCalledWith('workspace-1', 'delivery-1', NOW);
    expect(markFailed).not.toHaveBeenCalled();
  });

  it('does not send an already delivered or locked notification', async () => {
    claimDelivery.mockResolvedValue(null);

    await execute();

    expect(send).not.toHaveBeenCalled();
    expect(markDelivered).not.toHaveBeenCalled();
  });

  it('fails the delivery without sending when email is disabled', async () => {
    describeSettings.mockResolvedValue({
      platform: { enabled: true },
      email: { enabled: false, email: null, verifiedAt: null },
      telegram: {
        enabled: false,
        linked: false,
        username: null,
        botUsername: null,
        linkedAt: null,
      },
    });

    await execute();

    expect(send).not.toHaveBeenCalled();
    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-1', {
      nextAttemptAt: null,
      lastError: null,
    });
  });

  it('marks the delivery failed with the next retry when the provider fails', async () => {
    const error = new Error('smtp down');
    send.mockRejectedValue(error);

    await expect(execute()).rejects.toBe(error);

    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-1', {
      nextAttemptAt: new Date(NOW.getTime() + 30_000),
      lastError: 'smtp down',
    });
    expect(markDelivered).not.toHaveBeenCalled();
  });

  it('does not retry after the last attempt', async () => {
    claimDelivery.mockResolvedValue({ ...claimedDelivery, attempts: 5 });
    send.mockRejectedValue(new Error('smtp down'));

    await expect(execute()).rejects.toThrow('smtp down');

    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-1', {
      nextAttemptAt: null,
      lastError: 'smtp down',
    });
  });

  it('sends the escalation alert to the linked Telegram chat', async () => {
    claimDelivery.mockResolvedValue(claimedTelegramDelivery);
    telegramChatId.mockResolvedValue('42');

    await execute(NotificationChannel.Telegram);

    expect(telegram.sendMessageCalls).toHaveLength(1);
    expect(telegram.sendMessageCalls[0]).toEqual({
      token: 'alerts-token',
      chatId: '42',
      text: [
        '<b>Chat needs a person</b>',
        '',
        '<b>Marta S.</b> · Telegram · Salon assistant',
        '',
        '<i>“Can someone call me?”</i>',
        '',
        '<b>Reason:</b> The customer asked for a person.',
      ].join('\n'),
      parseMode: TelegramParseMode.Html,
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: 'Open in Inbox',
              url: 'https://app.test/w/ws_public/inbox?conversation=cnv_public',
            },
            { text: 'Take over', callback_data: 'to:ws_public:cnv_public' },
          ],
        ],
      },
    });
    expect(send).not.toHaveBeenCalled();
    expect(markDelivered).toHaveBeenCalledWith('workspace-1', 'delivery-2', NOW);
    expect(markFailed).not.toHaveBeenCalled();
  });

  it('fails the Telegram delivery without sending when the chat is not linked', async () => {
    claimDelivery.mockResolvedValue(claimedTelegramDelivery);
    telegramChatId.mockResolvedValue(null);

    await execute(NotificationChannel.Telegram);

    expect(telegram.sendMessageCalls).toHaveLength(0);
    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-2', {
      nextAttemptAt: null,
      lastError: null,
    });
    expect(markDelivered).not.toHaveBeenCalled();
  });

  it('marks the Telegram delivery failed and rethrows when the provider fails', async () => {
    const error = new Error('telegram down');
    claimDelivery.mockResolvedValue(claimedTelegramDelivery);
    telegramChatId.mockResolvedValue('42');
    telegram.failNext(error);

    await expect(execute(NotificationChannel.Telegram)).rejects.toBe(error);

    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-2', {
      nextAttemptAt: new Date(NOW.getTime() + 30_000),
      lastError: 'telegram down',
    });
    expect(markDelivered).not.toHaveBeenCalled();
  });

  it('honours the Telegram retry_after value', async () => {
    const error = new TelegramApiError({
      method: 'sendMessage',
      status: 429,
      errorCode: 429,
      retryAfterSeconds: 7,
    });
    claimDelivery.mockResolvedValue({
      ...claimedTelegramDelivery,
      attempts: 2,
    });
    telegramChatId.mockResolvedValue('42');
    telegram.failNext(error);

    await expect(execute(NotificationChannel.Telegram)).rejects.toBe(error);

    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-2', {
      nextAttemptAt: new Date(NOW.getTime() + 7_000),
      lastError: 'An upstream service failed.',
    });
  });
});
