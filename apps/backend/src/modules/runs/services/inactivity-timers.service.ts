import type { TriggerInactivityNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationMode,
  ConversationRunsService,
  ConversationState,
} from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import { NO_INACTIVITY_ATTEMPTS } from '@/modules/runs/constants/inactivity.constants';
import { RunTrigger } from '@/modules/runs/constants/run.constants';
import {
  fireOffsetMinutes,
  inactivityAnchor,
  inactivityDueAt,
  inactivityTriggerOf,
} from '@/modules/runs/helpers/inactivity-timer.helpers';
import { inactivityTriggerInputOf } from '@/modules/runs/helpers/inactivity-trigger.helpers';
import { InactivityTimersRepository } from '@/modules/runs/repositories/inactivity-timers.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { InactivityTimerPlan } from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class InactivityTimersService {
  constructor(
    private readonly timers: InactivityTimersRepository,
    private readonly runs: RunsRepository,
    private readonly conversations: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async armAfterRun(run: Run): Promise<void> {
    const conversation = await this.activeConversation(run.workspaceId, run.conversationId);
    const versionId =
      run.mode === ConversationMode.Live
        ? await this.agents.findAnsweringVersionId(run.workspaceId, run.agentId)
        : run.versionId;
    const node = conversation === null ? null : await this.triggerOf(run.workspaceId, versionId);
    if (conversation === null || versionId === null || node === null) {
      await this.disarm(run.workspaceId, run.conversationId);
      return;
    }
    if (run.trigger !== RunTrigger.Inactivity) {
      await this.arm(conversation, {
        versionId,
        node,
        attempt: NO_INACTIVITY_ATTEMPTS,
        anchorAt: this.anchorOf(node, conversation),
      });
      return;
    }
    const timer = await this.timers.findByConversation(run.workspaceId, run.conversationId);
    if (timer !== null) {
      const { attempt } = inactivityTriggerInputOf(run.triggerInput);
      await this.arm(conversation, { versionId, node, attempt, anchorAt: timer.anchorAt });
    }
  }

  async armAfterHandBack(workspaceId: string, conversationId: string): Promise<void> {
    const conversation = await this.activeConversation(workspaceId, conversationId);
    const versionId = conversation === null ? null : await this.handBackVersionId(conversation);
    const node = await this.triggerOf(workspaceId, versionId);
    if (conversation === null || versionId === null || node === null) {
      await this.disarm(workspaceId, conversationId);
      return;
    }
    await this.arm(conversation, {
      versionId,
      node,
      attempt: NO_INACTIVITY_ATTEMPTS,
      anchorAt: this.anchorOf(node, conversation),
    });
  }

  disarm(workspaceId: string, conversationId: string): Promise<boolean> {
    return this.timers.disarm(workspaceId, conversationId);
  }

  private async arm(conversation: Conversation, plan: InactivityTimerPlan): Promise<void> {
    const offset = fireOffsetMinutes(plan.node, plan.attempt);
    if (offset === null) {
      await this.disarm(conversation.workspaceId, conversation.id);
      return;
    }
    await this.timers.arm({
      id: this.ids.generate(),
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      versionId: plan.versionId,
      nodeId: plan.node.id,
      anchorAt: plan.anchorAt,
      attempt: plan.attempt,
      dueAt: inactivityDueAt(conversation.mode, plan.anchorAt, offset),
    });
  }

  private async handBackVersionId(conversation: Conversation): Promise<string | null> {
    if (conversation.mode === ConversationMode.Live) {
      return this.agents.findAnsweringVersionId(conversation.workspaceId, conversation.agentId);
    }
    return (
      conversation.simulationVersionId ??
      (await this.runs.findLatestByConversation(conversation.workspaceId, conversation.id))
        ?.versionId ??
      null
    );
  }

  private anchorOf(node: TriggerInactivityNode, conversation: Conversation): Date {
    return inactivityAnchor(node, conversation, this.clock.now());
  }

  private async activeConversation(
    workspaceId: string,
    conversationId: string,
  ): Promise<Conversation | null> {
    const conversation = await this.conversations.getConversation(workspaceId, conversationId);
    return conversation.state === ConversationState.AgentActive ? conversation : null;
  }

  private async triggerOf(
    workspaceId: string,
    versionId: string | null,
  ): Promise<TriggerInactivityNode | null> {
    if (versionId === null) {
      return null;
    }
    return inactivityTriggerOf((await this.agents.getVersion(workspaceId, versionId)).flow);
  }
}
