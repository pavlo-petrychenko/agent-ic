import { Injectable } from '@nestjs/common';
import { ConversationMode } from '@/modules/conversations';
import { NotificationKind } from '@/modules/notifications';
import { EscalationTimerKind } from '@/modules/runs/constants/escalation-reminder.constants';
import {
  escalationFallbackJobId,
  escalationReminderJobId,
} from '@/modules/runs/helpers/escalation-reminder.helpers';
import { deliverNotificationJob } from '@/modules/runs/jobs/deliver-notification.job';
import { fireEscalationTimerJob } from '@/modules/runs/jobs/fire-escalation-timer.job';
import { EscalationNotificationService } from '@/modules/runs/services/escalation-notification.service';
import type { RunEscalatedPayload } from '@/modules/runs/typedefs/run-event.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class CreateEscalationNotificationsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: EscalationNotificationService,
    private readonly jobs: JobsService,
  ) {}

  async execute(ctx: UseCaseCtx, payload: RunEscalatedPayload): Promise<void> {
    requireSystemActor(ctx);
    if (payload.mode !== ConversationMode.Live) {
      return;
    }
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const deliveries = await this.tenants.run(workspaceId, async () => {
      const created = await this.notifications.create(workspaceId, {
        runStepId: payload.runStepId,
        conversationId: payload.conversationId,
        versionId: payload.versionId,
        nodeId: payload.nodeId,
        kind: NotificationKind.Escalation,
      });
      await this.scheduleTimers(ctx, payload);
      return created;
    });
    for (const delivery of deliveries) {
      await this.jobs.enqueue(ctx, deliverNotificationJob, delivery);
    }
  }

  private async scheduleTimers(ctx: UseCaseCtx, payload: RunEscalatedPayload): Promise<void> {
    if (payload.reminderAfterMinutes !== null) {
      await this.jobs.enqueue(
        ctx,
        fireEscalationTimerJob,
        { runStepId: payload.runStepId, kind: EscalationTimerKind.Reminder },
        {
          jobId: escalationReminderJobId(payload.runStepId),
          delayMs: this.delayMs(payload.reminderAfterMinutes),
        },
      );
    }
    if (payload.fallbackAfterMinutes !== null) {
      await this.jobs.enqueue(
        ctx,
        fireEscalationTimerJob,
        { runStepId: payload.runStepId, kind: EscalationTimerKind.Fallback },
        {
          jobId: escalationFallbackJobId(payload.runStepId),
          delayMs: this.delayMs(payload.fallbackAfterMinutes),
        },
      );
    }
  }

  private delayMs(minutes: number): number {
    return minutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
  }
}
