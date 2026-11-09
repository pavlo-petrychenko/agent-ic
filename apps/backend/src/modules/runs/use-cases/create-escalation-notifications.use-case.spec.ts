import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationMode } from '@/modules/conversations';
import type { Message, MessagesRepository } from '@/modules/conversations';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications';
import type {
  NotificationsRepository,
  NotificationRecipientsService,
} from '@/modules/notifications';
import type { RunEscalatedPayload } from '@/modules/runs/typedefs/run-event.typedefs';
import { CreateEscalationNotificationsUseCase } from '@/modules/runs/use-cases/create-escalation-notifications.use-case';
import type { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { systemCtx } from '@test/support/fixtures/identity.fixture';

const NOW = new Date('2026-11-06T12:00:00.000Z');

describe('CreateEscalationNotificationsUseCase', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<void>) => Promise<void>>();
  const recipientsFor = vi.fn<NotificationRecipientsService['recipientsFor']>();
  const insertIfAbsent = vi.fn<NotificationsRepository['insertIfAbsent']>();
  const insertDeliveryIfAbsent = vi.fn<NotificationsRepository['insertDeliveryIfAbsent']>();
  const findLatestCustomerMessage = vi.fn<MessagesRepository['findLatestCustomerMessage']>();
  const now = vi.fn<ClockService['now']>();
  const generate = vi.fn<IdService['generate']>();
  let service: CreateEscalationNotificationsUseCase;

  const payload = (mode: ConversationMode = ConversationMode.Live): RunEscalatedPayload => ({
    runId: 'run-1',
    runStepId: 'step-1',
    conversationId: 'conversation-1',
    agentId: 'agent-1',
    versionId: 'version-1',
    nodeId: 'node-1',
    mode,
  });

  beforeEach(() => {
    run.mockReset();
    recipientsFor.mockReset();
    insertIfAbsent.mockReset();
    insertDeliveryIfAbsent.mockReset();
    findLatestCustomerMessage.mockReset();
    now.mockReset();
    generate.mockReset();
    run.mockImplementation((_workspaceId, work) => work());
    now.mockReturnValue(NOW);
    let sequence = 0;
    generate.mockImplementation(() => {
      sequence += 1;
      return `generated-${sequence}`;
    });
    service = new CreateEscalationNotificationsUseCase(
      { run } as unknown as TenantTransactionService,
      { recipientsFor } as unknown as NotificationRecipientsService,
      { insertIfAbsent, insertDeliveryIfAbsent } as unknown as NotificationsRepository,
      { findLatestCustomerMessage } as unknown as MessagesRepository,
      { now } as unknown as ClockService,
      { generate } as unknown as IdService,
    );
  });

  it('creates one notification per recipient and one delivery per channel', async () => {
    recipientsFor.mockResolvedValue([
      {
        userId: 'user-1',
        channels: [NotificationChannel.Platform, NotificationChannel.Email],
      },
      { userId: 'user-2', channels: [NotificationChannel.Email] },
    ]);
    findLatestCustomerMessage.mockResolvedValue({ id: 'message-1' } as unknown as Message);
    insertIfAbsent.mockImplementation(
      async (notification) => `notification-${notification.userId}`,
    );

    await service.execute(workspaceSystemCtx('workspace-1'), payload());

    expect(run).toHaveBeenCalledWith('workspace-1', expect.any(Function));
    expect(recipientsFor).toHaveBeenCalledWith('workspace-1', 'version-1', 'node-1');
    expect(findLatestCustomerMessage).toHaveBeenCalledWith('workspace-1', 'conversation-1');
    expect(insertIfAbsent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 'user-1',
        runStepId: 'step-1',
        kind: NotificationKind.Escalation,
        lastCustomerMessageId: 'message-1',
      }),
    );
    expect(insertIfAbsent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'user-2',
        runStepId: 'step-1',
        kind: NotificationKind.Escalation,
        lastCustomerMessageId: 'message-1',
      }),
    );
    expect(insertDeliveryIfAbsent).toHaveBeenCalledTimes(3);
    expect(insertDeliveryIfAbsent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        notificationId: 'notification-user-1',
        channel: NotificationChannel.Platform,
        status: NotificationDeliveryStatus.Delivered,
        sentAt: NOW,
      }),
    );
    expect(insertDeliveryIfAbsent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        notificationId: 'notification-user-1',
        channel: NotificationChannel.Email,
        status: NotificationDeliveryStatus.Pending,
        sentAt: null,
      }),
    );
    expect(insertDeliveryIfAbsent).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        notificationId: 'notification-user-2',
        channel: NotificationChannel.Email,
        status: NotificationDeliveryStatus.Pending,
        sentAt: null,
      }),
    );
  });

  it('does nothing for a simulation handoff', async () => {
    await service.execute(workspaceSystemCtx('workspace-1'), payload(ConversationMode.Simulation));

    expect(run).not.toHaveBeenCalled();
    expect(recipientsFor).not.toHaveBeenCalled();
    expect(insertIfAbsent).not.toHaveBeenCalled();
  });

  it('does not read the last message when nobody should be notified', async () => {
    recipientsFor.mockResolvedValue([]);

    await service.execute(workspaceSystemCtx('workspace-1'), payload());

    expect(findLatestCustomerMessage).not.toHaveBeenCalled();
    expect(insertIfAbsent).not.toHaveBeenCalled();
  });

  it('refuses a system actor without a workspace', async () => {
    await expect(service.execute(systemCtx(), payload())).rejects.toBeInstanceOf(
      WorkspaceAccessDeniedError,
    );
  });
});
