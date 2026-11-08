import { AgentExitKind, NodeType, NotifyChannel, RecipientsKind } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationHistoryService,
  ConversationMode,
  ConversationState,
  ConversationsRepository,
  MessagesRepository,
} from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import {
  NotificationChannel,
  NotificationKind,
  NotificationsRepository,
} from '@/modules/notifications';
import { EscalationTimerKind } from '@/modules/runs/constants/escalation-reminder.constants';
import { deliverNotificationJob } from '@/modules/runs/jobs/deliver-notification.job';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { EscalationNotificationService } from '@/modules/runs/services/escalation-notification.service';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import { FireEscalationTimerUseCase } from '@/modules/runs/use-cases/fire-escalation-timer.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { userCtx } from '@test/support/fixtures/identity.fixture';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const ESCALATED_AT = new Date(NOW.getTime() - 6 * 60_000);
const FALLBACK_DUE_AT = new Date(NOW.getTime() - 31 * 60_000);

const WORKSPACE_ID = 'workspace-1';
const CONVERSATION_ID = 'conversation-1';

const conversation = (overrides: Partial<Conversation> = {}): Conversation =>
  ({
    id: CONVERSATION_ID,
    workspaceId: WORKSPACE_ID,
    agentId: 'agent-1',
    mode: ConversationMode.Live,
    state: ConversationState.Waiting,
    lastEscalatedAt: ESCALATED_AT,
    ...overrides,
  }) as Conversation;

const run = (overrides: Partial<Run> = {}): Run =>
  ({
    id: 'run-1',
    workspaceId: WORKSPACE_ID,
    conversationId: CONVERSATION_ID,
    agentId: 'agent-1',
    versionId: 'version-1',
    mode: ConversationMode.Live,
    lastCoveredMessageId: 'message-1',
    ...overrides,
  }) as Run;

const step = (overrides: Partial<RunStep> = {}): RunStep =>
  ({
    id: 'step-1',
    workspaceId: WORKSPACE_ID,
    runId: 'run-1',
    nodeId: 'node-1',
    status: 'succeeded',
    input: { message: { text: 'Hello', attachments: [] } },
    output: { outcome: AgentExitKind.Handoff },
    error: null,
    ...overrides,
  }) as RunStep;

const flow = (fallbackMessage = 'Fallback {{message.text}}'): FlowDocument =>
  ({
    schemaVersion: 1,
    nodes: [{ id: 'node-1', type: NodeType.Agent }],
    edges: [],
    settings: {
      handoff: {
        notify: {
          recipients: { kind: RecipientsKind.Operators },
          channels: [NotifyChannel.InPlatform],
        },
        reminderAfterMinutes: 5,
        fallbackAfterMinutes: 30,
        fallbackMessage,
      },
      onUnhandledFailure: null,
      autoClose: null,
    },
  }) as unknown as FlowDocument;

describe('FireEscalationTimerUseCase', () => {
  const runTransaction =
    vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const findStep = vi.fn<RunStepsRepository['findById']>();
  const findRun = vi.fn<RunsRepository['findById']>();
  const findConversation = vi.fn<ConversationsRepository['findById']>();
  const getVersion = vi.fn<AgentRuntimeReader['getVersion']>();
  const forRun = vi.fn<ConversationHistoryService['forRun']>();
  const create = vi.fn<EscalationNotificationService['create']>();
  const existsForRunStepKind = vi.fn<NotificationsRepository['existsForRunStepKind']>();
  const send = vi.fn<RunMessagesService['send']>();
  const findByIdempotencyKey = vi.fn<MessagesRepository['findByIdempotencyKey']>();
  const enqueue = vi.fn<JobsService['enqueue']>();
  let service: FireEscalationTimerUseCase;

  const ctx = (): UseCaseCtx => workspaceSystemCtx(WORKSPACE_ID);

  beforeEach(() => {
    runTransaction.mockReset();
    findStep.mockReset();
    findRun.mockReset();
    findConversation.mockReset();
    getVersion.mockReset();
    forRun.mockReset();
    create.mockReset();
    existsForRunStepKind.mockReset();
    send.mockReset();
    findByIdempotencyKey.mockReset();
    enqueue.mockReset();

    runTransaction.mockImplementation((_workspaceId, work) => work());
    findStep.mockResolvedValue(step());
    findRun.mockResolvedValue(run());
    findConversation.mockResolvedValue(conversation());
    getVersion.mockResolvedValue({ flow: flow() } as unknown as Awaited<
      ReturnType<AgentRuntimeReader['getVersion']>
    >);
    forRun.mockResolvedValue([]);
    create.mockResolvedValue([
      { notificationId: 'notification-1', channel: NotificationChannel.Email },
    ]);
    existsForRunStepKind.mockResolvedValue(false);
    send.mockResolvedValue([]);
    findByIdempotencyKey.mockResolvedValue(null);
    enqueue.mockResolvedValue(undefined);

    service = new FireEscalationTimerUseCase(
      { run: runTransaction } as unknown as TenantTransactionService,
      { findById: findStep } as unknown as RunStepsRepository,
      { findById: findRun } as unknown as RunsRepository,
      { findById: findConversation } as unknown as ConversationsRepository,
      { getVersion } as unknown as AgentRuntimeReader,
      { forRun } as unknown as ConversationHistoryService,
      { create } as unknown as EscalationNotificationService,
      { existsForRunStepKind } as unknown as NotificationsRepository,
      { send } as unknown as RunMessagesService,
      { findByIdempotencyKey } as unknown as MessagesRepository,
      { enqueue } as unknown as JobsService,
      { now: () => NOW } as unknown as ClockService,
    );
  });

  it('creates reminder notifications at the reminder delay', async () => {
    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Reminder });

    expect(create).toHaveBeenCalledWith(WORKSPACE_ID, {
      runStepId: 'step-1',
      conversationId: CONVERSATION_ID,
      versionId: 'version-1',
      nodeId: 'node-1',
      kind: NotificationKind.Reminder,
    });
    expect(send).not.toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalledWith(expect.anything(), deliverNotificationJob, {
      notificationId: 'notification-1',
      channel: NotificationChannel.Email,
    });
  });

  it('does not remind when the fallback already went out', async () => {
    findByIdempotencyKey.mockResolvedValue({ id: 'message-1' } as never);

    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Reminder });

    expect(create).not.toHaveBeenCalled();
  });

  it('lets an overdue fallback win over a reminder', async () => {
    findConversation.mockResolvedValue(conversation({ lastEscalatedAt: FALLBACK_DUE_AT }));

    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Reminder });

    expect(create).not.toHaveBeenCalled();
  });

  it('still reminds when the fallback is due but has no text', async () => {
    findConversation.mockResolvedValue(conversation({ lastEscalatedAt: FALLBACK_DUE_AT }));
    getVersion.mockResolvedValue({ flow: flow('') } as unknown as Awaited<
      ReturnType<AgentRuntimeReader['getVersion']>
    >);

    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Reminder });

    expect(create).toHaveBeenCalled();
  });

  it('sends the rendered fallback message at the fallback delay', async () => {
    findConversation.mockResolvedValue(conversation({ lastEscalatedAt: FALLBACK_DUE_AT }));

    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Fallback });

    expect(send).toHaveBeenCalledWith(ctx(), run(), 'escalation-fallback:step-1', [
      'Fallback Hello',
    ]);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not send the fallback twice', async () => {
    findConversation.mockResolvedValue(conversation({ lastEscalatedAt: FALLBACK_DUE_AT }));
    findByIdempotencyKey.mockResolvedValue({ id: 'message-1' } as never);

    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Fallback });

    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('does nothing when the conversation is no longer waiting', async () => {
    findConversation.mockResolvedValue(conversation({ state: ConversationState.Handled }));

    await service.execute(ctx(), { runStepId: 'step-1', kind: EscalationTimerKind.Reminder });

    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('runs only as the system actor', async () => {
    await expect(
      service.execute(userCtx('user-1'), {
        runStepId: 'step-1',
        kind: EscalationTimerKind.Reminder,
      }),
    ).rejects.toBeInstanceOf(SystemActorRequiredError);
    expect(findStep).not.toHaveBeenCalled();
  });
});
