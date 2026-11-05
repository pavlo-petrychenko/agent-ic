import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { NodeType } from '@agent-ic/flow';
import type { TriggerScheduleNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationMode,
  ConversationNotFoundError,
  ConversationRunsService,
} from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import { RunTrigger, TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import { SCHEDULED_FOR_INPUT_KEY } from '@/modules/runs/constants/schedule-tick.constants';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { ScheduleNeedsCustomerMessageError } from '@/modules/runs/errors/schedule-needs-customer-message.error';
import { ScheduleRunBusyError } from '@/modules/runs/errors/schedule-run-busy.error';
import { ScheduleTriggerNotFoundError } from '@/modules/runs/errors/schedule-trigger-not-found.error';
import { scheduleConditionChecks } from '@/modules/runs/helpers/schedule-conditions.helpers';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import type {
  RunSimulatorScheduleInput,
  SimulatorScheduleRun,
} from '@/modules/runs/typedefs/simulator-schedule.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RunSimulatorScheduleUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly conversations: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
    private readonly lifecycle: RunLifecycleService,
    private readonly runs: RunsRepository,
    private readonly views: RunViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RunSimulatorScheduleInput): Promise<SimulatorScheduleRun> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.Edit,
    );
    const conversationId = this.ids.fromPublic(IdPrefix.Conversation, input.conversationId);
    return this.tenants.run(workspaceId, async () => {
      const conversation = await this.conversations.getConversation(workspaceId, conversationId);
      if (
        conversation.mode !== ConversationMode.Simulation ||
        conversation.endUserExternalId !== userId
      ) {
        throw new ConversationNotFoundError(input.conversationId);
      }
      const versionId = await this.simulationVersionId(workspaceId, conversation);
      const node = await this.scheduleNode(workspaceId, versionId, input.nodeId);
      if (conversation.lastCustomerMessageAt === null) {
        throw new ScheduleNeedsCustomerMessageError();
      }
      const now = this.clock.now();
      const started = await this.lifecycle.startTriggeredRun(ctx, {
        workspaceId,
        conversationId,
        versionId,
        trigger: RunTrigger.Schedule,
        triggerNodeId: node.id,
        triggerInput: { [SCHEDULED_FOR_INPUT_KEY]: now.toISOString() },
      });
      if (started.outcome !== TriggeredRunOutcome.Started) {
        throw new ScheduleRunBusyError();
      }
      const run = await this.runs.findById(workspaceId, started.run.id);
      if (run === null) {
        throw new RunNotFoundError(started.run.id);
      }
      return {
        run: this.views.runView(run),
        conditions: scheduleConditionChecks(conversation, node, now),
      };
    });
  }

  private async simulationVersionId(
    workspaceId: string,
    conversation: Conversation,
  ): Promise<string> {
    return (
      conversation.simulationVersionId ??
      (await this.agents.snapshotDraft(workspaceId, conversation.agentId)).id
    );
  }

  private async scheduleNode(
    workspaceId: string,
    versionId: string,
    nodeId: string,
  ): Promise<TriggerScheduleNode> {
    const { flow } = await this.agents.getVersion(workspaceId, versionId);
    const node = flow.nodes.find(
      (candidate): candidate is TriggerScheduleNode =>
        candidate.id === nodeId && candidate.type === NodeType.TriggerSchedule,
    );
    if (node === undefined) {
      throw new ScheduleTriggerNotFoundError(nodeId);
    }
    return node;
  }
}
