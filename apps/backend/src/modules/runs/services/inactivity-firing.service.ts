import type { FlowDocument, TriggerInactivityNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationMode,
  ConversationRunsService,
  ConversationState,
  hasNeverEscalated,
} from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { RunTrigger, TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import {
  fireOffsetMinutes,
  inactivityTriggerOf,
  lastAgentMessageFailed,
  reachesChannel,
  silentMinutesSince,
  usesPlatformModel,
} from '@/modules/runs/helpers/inactivity-timer.helpers';
import { inactivityTriggerInput } from '@/modules/runs/helpers/inactivity-trigger.helpers';
import { InactivityTimersRepository } from '@/modules/runs/repositories/inactivity-timers.repository';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import type {
  InactivityCheck,
  InactivityFire,
  InactivityTimer,
} from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { LimitReachedError } from '@/platform/errors/errors/limit-reached.error';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';

@Injectable()
export class InactivityFiringService {
  constructor(
    private readonly timers: InactivityTimersRepository,
    private readonly conversations: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
    private readonly lifecycle: RunLifecycleService,
    private readonly usageLimits: UsageLimits,
  ) {}

  async fire(
    ctx: UseCaseCtx,
    timer: InactivityTimer,
    now: Date,
    simulatedVersionId: string | null = null,
  ): Promise<InactivityFire> {
    const conversation = await this.conversations.getConversation(
      timer.workspaceId,
      timer.conversationId,
    );
    const checked = await this.check(timer, conversation, simulatedVersionId);
    if ('outcome' in checked) {
      await this.timers.disarm(timer.workspaceId, timer.conversationId);
      return { outcome: checked.outcome, run: null };
    }
    const started = await this.lifecycle.startTriggeredRun(ctx, {
      workspaceId: timer.workspaceId,
      conversationId: timer.conversationId,
      versionId: checked.versionId,
      trigger: RunTrigger.Inactivity,
      triggerNodeId: checked.node.id,
      triggerInput: inactivityTriggerInput({
        attempt: timer.attempt + 1,
        silentMinutes: silentMinutesSince(timer.anchorAt, now),
      }),
    });
    return started.outcome === TriggeredRunOutcome.Started
      ? { outcome: InactivityFireOutcome.Started, run: started.run }
      : { outcome: InactivityFireOutcome.Busy, run: null };
  }

  private async check(
    timer: InactivityTimer,
    conversation: Conversation,
    simulatedVersionId: string | null,
  ): Promise<InactivityCheck> {
    if (conversation.state !== ConversationState.AgentActive) {
      return { outcome: InactivityFireOutcome.NotActive };
    }
    if ((conversation.lastCustomerMessageAt?.getTime() ?? 0) > timer.anchorAt.getTime()) {
      return { outcome: InactivityFireOutcome.CustomerWrote };
    }
    const versionId = simulatedVersionId ?? (await this.answeringVersionId(conversation));
    if (versionId === null) {
      return { outcome: InactivityFireOutcome.AgentUnavailable };
    }
    const { flow } = await this.agents.getVersion(conversation.workspaceId, versionId);
    const node = inactivityTriggerOf(flow);
    if (node === null) {
      return { outcome: InactivityFireOutcome.TriggerRemoved };
    }
    const refused = await this.refusal(timer, conversation, node, flow);
    return refused === null ? { versionId, node } : { outcome: refused };
  }

  private async refusal(
    timer: InactivityTimer,
    conversation: Conversation,
    node: TriggerInactivityNode,
    flow: FlowDocument,
  ): Promise<InactivityFireOutcome | null> {
    if (fireOffsetMinutes(node, timer.attempt) === null) {
      return InactivityFireOutcome.AttemptsUsed;
    }
    if (node.config.conditions.notEscalated && !hasNeverEscalated(conversation)) {
      return InactivityFireOutcome.Escalated;
    }
    if (!reachesChannel(node, conversation.channelKind)) {
      return InactivityFireOutcome.ChannelExcluded;
    }
    const latest = await this.conversations.latestMessage(
      conversation.workspaceId,
      conversation.id,
    );
    if (lastAgentMessageFailed(latest)) {
      return InactivityFireOutcome.Undeliverable;
    }
    return (await this.overLimit(conversation, flow)) ? InactivityFireOutcome.OverLimit : null;
  }

  private async overLimit(conversation: Conversation, flow: FlowDocument): Promise<boolean> {
    if (!usesPlatformModel(flow)) {
      return false;
    }
    try {
      await this.usageLimits.assertPlatformCallAllowed(conversation.workspaceId);
      return false;
    } catch (error) {
      if (error instanceof LimitReachedError) {
        return true;
      }
      throw error;
    }
  }

  private answeringVersionId(conversation: Conversation): Promise<string | null> {
    return conversation.mode === ConversationMode.Live
      ? this.agents.findAnsweringVersionId(conversation.workspaceId, conversation.agentId)
      : Promise.resolve(conversation.simulationVersionId);
  }
}
