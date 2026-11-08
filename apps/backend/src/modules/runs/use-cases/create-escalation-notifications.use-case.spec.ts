import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationMode } from '@/modules/conversations';
import { NotificationChannel, NotificationKind } from '@/modules/notifications';
import { EscalationTimerKind } from '@/modules/runs/constants/escalation-reminder.constants';
import {
  escalationFallbackJobId,
  escalationReminderJobId,
} from '@/modules/runs/helpers/escalation-reminder.helpers';
import { deliverNotificationJob } from '@/modules/runs/jobs/deliver-notification.job';
import { fireEscalationTimerJob } from '@/modules/runs/jobs/fire-escalation-timer.job';
import { EscalationNotificationService } from '@/modules/runs/services/escalation-notification.service';
import type { RunEscalatedPayload } from '@/modules/runs/typedefs/run-event.typedefs';
import { CreateEscalationNotificationsUseCase } from '@/modules/runs/use-cases/create-escalation-notifications.use-case';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { JobsService } from '@/platform/queues/services/jobs.service';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { systemCtx } from '@test/support/fixtures/identity.fixture';

const MINUTE_MS = 60_000;

describe('CreateEscalationNotificationsUseCase', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const create = vi.fn<EscalationNotificationService['create']>();
  const enqueue = vi.fn<JobsService['enqueue']>();
  let service: CreateEscalationNotificationsUseCase;

  const payload = (mode: ConversationMode = ConversationMode.Live): RunEscalatedPayload => ({
    runId: 'run-1',
    runStepId: 'step-1',
    conversationId: 'conversation-1',
    agentId: 'agent-1',
    versionId: 'version-1',
    nodeId: 'node-1',
    mode,
    reminderAfterMinutes: 5,
    fallbackAfterMinutes: 30,
  });

  beforeEach(() => {
    run.mockReset();
    create.mockReset();
    enqueue.mockReset();
    run.mockImplementation((_workspaceId, work) => work());
    create.mockResolvedValue([
      { notificationId: 'notification-1', channel: NotificationChannel.Email },
    ]);
    enqueue.mockResolvedValue(undefined);
    service = new CreateEscalationNotificationsUseCase(
      { run } as unknown as TenantTransactionService,
      { create } as unknown as EscalationNotificationService,
      { enqueue } as unknown as JobsService,
    );
  });

  it('creates the alerts and schedules the reminder and fallback jobs', async () => {
    await service.execute(workspaceSystemCtx('workspace-1'), payload());

    expect(run).toHaveBeenCalledWith('workspace-1', expect.any(Function));
    expect(create).toHaveBeenCalledWith('workspace-1', {
      runStepId: 'step-1',
      conversationId: 'conversation-1',
      versionId: 'version-1',
      nodeId: 'node-1',
      kind: NotificationKind.Escalation,
    });
    expect(enqueue).toHaveBeenCalledWith(
      expect.anything(),
      fireEscalationTimerJob,
      { runStepId: 'step-1', kind: EscalationTimerKind.Reminder },
      { jobId: escalationReminderJobId('step-1'), delayMs: 5 * MINUTE_MS },
    );
    expect(enqueue).toHaveBeenCalledWith(
      expect.anything(),
      fireEscalationTimerJob,
      { runStepId: 'step-1', kind: EscalationTimerKind.Fallback },
      { jobId: escalationFallbackJobId('step-1'), delayMs: 30 * MINUTE_MS },
    );
    expect(enqueue).toHaveBeenCalledWith(expect.anything(), deliverNotificationJob, {
      notificationId: 'notification-1',
      channel: NotificationChannel.Email,
    });
  });

  it('schedules only the configured timer', async () => {
    await service.execute(workspaceSystemCtx('workspace-1'), {
      ...payload(),
      reminderAfterMinutes: null,
    });

    expect(enqueue).not.toHaveBeenCalledWith(
      expect.anything(),
      fireEscalationTimerJob,
      { runStepId: 'step-1', kind: EscalationTimerKind.Reminder },
      expect.anything(),
    );
    expect(enqueue).toHaveBeenCalledWith(
      expect.anything(),
      fireEscalationTimerJob,
      { runStepId: 'step-1', kind: EscalationTimerKind.Fallback },
      expect.anything(),
    );
  });

  it('does nothing for a simulation handoff', async () => {
    await service.execute(workspaceSystemCtx('workspace-1'), payload(ConversationMode.Simulation));

    expect(run).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('refuses a system actor without a workspace', async () => {
    await expect(service.execute(systemCtx(), payload())).rejects.toBeInstanceOf(
      WorkspaceAccessDeniedError,
    );
  });
});
