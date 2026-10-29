import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { TriggerInactivityNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationClosedError,
  ConversationMode,
  ConversationNotFoundError,
  ConversationRunsService,
  ConversationState,
} from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { ConversationBusyError } from '@/modules/runs/errors/conversation-busy.error';
import { InactivityAttemptsUsedError } from '@/modules/runs/errors/inactivity-attempts-used.error';
import { NoInactivityTriggerError } from '@/modules/runs/errors/no-inactivity-trigger.error';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import {
  addMinutes,
  fireOffsetMinutes,
  inactivityTriggerOf,
} from '@/modules/runs/helpers/inactivity-timer.helpers';
import { simulatedSilenceRefusal } from '@/modules/runs/helpers/simulate-silence.helpers';
import { InactivityTimersRepository } from '@/modules/runs/repositories/inactivity-timers.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { InactivityFiringService } from '@/modules/runs/services/inactivity-firing.service';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import type { RunView, SimulateSilenceInput } from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SimulateSilenceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly conversations: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
    private readonly timers: InactivityTimersRepository,
    private readonly runs: RunsRepository,
    private readonly firing: InactivityFiringService,
    private readonly views: RunViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SimulateSilenceInput): Promise<RunView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.Edit,
    );
    return this.tenants.run(workspaceId, async () => {
      const conversation = await this.ownSimulation(workspaceId, userId, input.conversationId);
      if (conversation.activeRunId !== null) {
        throw new ConversationBusyError(input.conversationId);
      }
      const versionId =
        conversation.simulationVersionId ??
        (await this.agents.snapshotDraft(workspaceId, conversation.agentId)).id;
      const node = await this.triggerOf(workspaceId, versionId, input.conversationId);
      const timer = await this.timers.findByConversation(workspaceId, conversation.id);
      const offset = timer === null ? null : fireOffsetMinutes(node, timer.attempt);
      if (timer === null || offset === null) {
        throw new InactivityAttemptsUsedError(input.conversationId);
      }
      const fired = await this.firing.fire(
        ctx,
        timer,
        addMinutes(timer.anchorAt, offset),
        versionId,
      );
      if (fired.outcome !== InactivityFireOutcome.Started || fired.run === null) {
        throw simulatedSilenceRefusal(fired.outcome, input.conversationId);
      }
      const run = await this.runs.findById(workspaceId, fired.run.id);
      if (run === null) {
        throw new RunNotFoundError(fired.run.id);
      }
      return this.views.runView(run);
    });
  }

  private async ownSimulation(
    workspaceId: string,
    userId: string,
    publicId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversations.getConversation(
      workspaceId,
      this.ids.fromPublic(IdPrefix.Conversation, publicId),
    );
    if (
      conversation.mode !== ConversationMode.Simulation ||
      conversation.endUserExternalId !== userId
    ) {
      throw new ConversationNotFoundError(publicId);
    }
    if (conversation.state === ConversationState.Closed) {
      throw new ConversationClosedError(publicId);
    }
    return conversation;
  }

  private async triggerOf(
    workspaceId: string,
    versionId: string,
    publicId: string,
  ): Promise<TriggerInactivityNode> {
    const node = inactivityTriggerOf((await this.agents.getVersion(workspaceId, versionId)).flow);
    if (node === null) {
      throw new NoInactivityTriggerError(publicId);
    }
    return node;
  }
}
