import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { InactivityTimersService } from '@/modules/runs/services/inactivity-timers.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import type { MessageRunInput } from '@/modules/runs/typedefs/message-run.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class MessageRunService {
  constructor(
    private readonly agents: AgentRuntimeReader,
    private readonly lifecycle: RunLifecycleService,
    private readonly inactivityTimers: InactivityTimersService,
  ) {}

  async start(ctx: UseCaseCtx, input: MessageRunInput): Promise<NewRun | null> {
    const { workspaceId, conversationId, agentId } = input;
    await this.inactivityTimers.disarm(workspaceId, conversationId);
    const versionId =
      input.versionId ?? (await this.agents.findAnsweringVersionId(workspaceId, agentId));
    if (versionId === null) {
      return null;
    }
    return this.lifecycle.startRun(ctx, {
      id: input.runId ?? undefined,
      workspaceId,
      conversationId,
      versionId,
      mode: input.mode,
      triggerMessageId: input.messageId,
    });
  }
}
