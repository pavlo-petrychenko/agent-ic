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
  createdAt: NOW,
  updatedAt: NOW,
};

describe('DeliverNotificationUseCase', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const findNotification = vi.fn<NotificationsRepository['findById']>();
  const findDelivery = vi.fn<NotificationsRepository['findDelivery']>();
  const markDelivered = vi.fn<NotificationsRepository['markDeliveryDelivered']>();
  const markFailed = vi.fn<NotificationsRepository['markDeliveryFailed']>();
  const describeSettings = vi.fn<NotificationSettingsService['describe']>();
  const send = vi.fn<EmailGateway['send']>();
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
    findDelivery.mockReset();
    markDelivered.mockReset();
    markFailed.mockReset();
    describeSettings.mockReset();
    send.mockReset();
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
    findDelivery.mockResolvedValue(pendingDelivery);
    describeSettings.mockResolvedValue({
      platform: { enabled: true },
      email: { enabled: true, email: 'alerts@example.com', verifiedAt: null },
      telegram: { enabled: false, linked: false, username: null, linkedAt: null },
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
        findDelivery,
        markDeliveryDelivered: markDelivered,
        markDeliveryFailed: markFailed,
      } as unknown as NotificationsRepository,
      { describe: describeSettings } as unknown as NotificationSettingsService,
      { send } as unknown as EmailGateway,
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
      { config: { publicUrl: 'https://app.test' } } as unknown as ConfigService,
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
    expect(markDelivered).toHaveBeenCalledWith('workspace-1', 'delivery-1', NOW);
    expect(markFailed).not.toHaveBeenCalled();
  });

  it('does not send an already delivered notification', async () => {
    findDelivery.mockResolvedValue({
      ...pendingDelivery,
      status: NotificationDeliveryStatus.Delivered,
    });

    await execute();

    expect(send).not.toHaveBeenCalled();
    expect(markDelivered).not.toHaveBeenCalled();
  });

  it('fails the delivery without sending when email is disabled', async () => {
    describeSettings.mockResolvedValue({
      platform: { enabled: true },
      email: { enabled: false, email: null, verifiedAt: null },
      telegram: { enabled: false, linked: false, username: null, linkedAt: null },
    });

    await execute();

    expect(send).not.toHaveBeenCalled();
    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-1');
  });

  it('marks the delivery failed and rethrows when the provider fails', async () => {
    const error = new Error('smtp down');
    send.mockRejectedValue(error);

    await expect(execute()).rejects.toBe(error);

    expect(markFailed).toHaveBeenCalledWith('workspace-1', 'delivery-1');
    expect(markDelivered).not.toHaveBeenCalled();
  });
});
