import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationHistoryService,
  ConversationMode,
  ConversationState,
  ConversationsRepository,
  MessagesRepository,
} from '@/modules/conversations';
import { NotificationKind, NotificationsRepository } from '@/modules/notifications';
import { EscalationTimerKind } from '@/modules/runs/constants/escalation-reminder.constants';
import {
  escalationFallbackNodeId,
  handoffOfStep,
  isEscalationReminderDue,
} from '@/modules/runs/helpers/escalation-reminder.helpers';
import {
  outboundMessageKey,
  renderStepText,
} from '@/modules/runs/helpers/outbound-message.helpers';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { deliverNotificationJob } from '@/modules/runs/jobs/deliver-notification.job';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { EscalationNotificationService } from '@/modules/runs/services/escalation-notification.service';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import type { FireEscalationTimerResult } from '@/modules/runs/typedefs/escalation-reminder.typedefs';
import type { FireEscalationTimerJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class FireEscalationTimerUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly steps: RunStepsRepository,
    private readonly runs: RunsRepository,
    private readonly conversations: ConversationsRepository,
    private readonly agents: AgentRuntimeReader,
    private readonly history: ConversationHistoryService,
    private readonly notifications: EscalationNotificationService,
    private readonly notificationRecords: NotificationsRepository,
    private readonly messages: RunMessagesService,
    private readonly messageRecords: MessagesRepository,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, data: FireEscalationTimerJobData): Promise<void> {
    const workspaceId = runWorkspaceOf(ctx);
    const fired = await this.tenants.run(workspaceId, () => this.fire(ctx, workspaceId, data));
    for (const delivery of fired.deliveries) {
      await this.jobs.enqueue(ctx, deliverNotificationJob, delivery);
    }
  }

  private async fire(
    ctx: UseCaseCtx,
    workspaceId: string,
    { runStepId, kind }: FireEscalationTimerJobData,
  ): Promise<FireEscalationTimerResult> {
    const step = await this.steps.findById(workspaceId, runStepId);
    if (step === null) {
      return this.empty();
    }
    const run = await this.runs.findById(workspaceId, step.runId);
    if (run === null || run.mode !== ConversationMode.Live) {
      return this.empty();
    }
    const conversation = await this.conversations.findById(workspaceId, run.conversationId);
    if (
      conversation === null ||
      conversation.state !== ConversationState.Waiting ||
      conversation.lastEscalatedAt === null
    ) {
      return this.empty();
    }
    const version = await this.agents.getVersion(workspaceId, run.versionId);
    const handoff = handoffOfStep(version.flow, step);
    if (handoff === null) {
      return this.empty();
    }
    const fallbackNodeId = escalationFallbackNodeId(step.id);
    const fallbackKey = outboundMessageKey(run.id, fallbackNodeId, 0);
    const fallbackSent =
      (await this.messageRecords.findByIdempotencyKey(workspaceId, fallbackKey)) !== null;
    return kind === EscalationTimerKind.Reminder
      ? this.remind(workspaceId, conversation.lastEscalatedAt, run, step, handoff, fallbackSent)
      : this.fallback(ctx, workspaceId, run, step, handoff, fallbackNodeId, fallbackSent);
  }

  private async remind(
    workspaceId: string,
    escalatedAt: Date,
    run: Run,
    step: RunStep,
    handoff: NonNullable<ReturnType<typeof handoffOfStep>>,
    fallbackSent: boolean,
  ): Promise<FireEscalationTimerResult> {
    if (handoff.reminderAfterMinutes === null || fallbackSent) {
      return this.empty();
    }
    if (
      handoff.fallbackAfterMinutes !== null &&
      isEscalationReminderDue(escalatedAt, handoff.fallbackAfterMinutes, this.clock.now()) &&
      (await this.fallbackMessage(workspaceId, run, step, handoff.fallbackTemplate)) !== null
    ) {
      return this.empty();
    }
    if (
      await this.notificationRecords.existsForRunStepKind(
        workspaceId,
        step.id,
        NotificationKind.Reminder,
      )
    ) {
      return this.empty();
    }
    return {
      deliveries: await this.notifications.create(workspaceId, {
        runStepId: step.id,
        conversationId: run.conversationId,
        versionId: run.versionId,
        nodeId: step.nodeId,
        kind: NotificationKind.Reminder,
      }),
    };
  }

  private async fallback(
    ctx: UseCaseCtx,
    workspaceId: string,
    run: Run,
    step: RunStep,
    handoff: NonNullable<ReturnType<typeof handoffOfStep>>,
    fallbackNodeId: string,
    fallbackSent: boolean,
  ): Promise<FireEscalationTimerResult> {
    if (handoff.fallbackAfterMinutes === null || fallbackSent) {
      return this.empty();
    }
    const fallback = await this.fallbackMessage(workspaceId, run, step, handoff.fallbackTemplate);
    if (fallback !== null) {
      await this.messages.send(ctx, run, fallbackNodeId, [fallback]);
    }
    return this.empty();
  }

  private async fallbackMessage(
    workspaceId: string,
    run: Run,
    step: RunStep,
    template: string,
  ): Promise<string | null> {
    const history = await this.history.forRun(
      workspaceId,
      run.conversationId,
      run.lastCoveredMessageId,
    );
    const variables = {
      ...step.input,
      history: history.map(({ author, text }) => ({ author, text })),
    };
    const message = renderStepText(template, variables).trim();
    return message === '' ? null : message;
  }

  private empty(): FireEscalationTimerResult {
    return { deliveries: [] };
  }
}
