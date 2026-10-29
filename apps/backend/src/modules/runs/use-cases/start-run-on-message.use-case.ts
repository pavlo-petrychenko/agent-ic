import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import type { MessageReceivedPayload } from '@/modules/conversations';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { InactivityTimersService } from '@/modules/runs/services/inactivity-timers.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class StartRunOnMessageUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly lifecycle: RunLifecycleService,
    private readonly inactivityTimers: InactivityTimersService,
  ) {}

  execute(ctx: UseCaseCtx, message: MessageReceivedPayload): Promise<NewRun | null> {
    const workspaceId = runWorkspaceOf(ctx);
    return this.tenants.run(workspaceId, async () => {
      await this.inactivityTimers.disarm(workspaceId, message.conversationId);
      const versionId =
        message.versionId ??
        (await this.agents.findAnsweringVersionId(workspaceId, message.agentId));
      if (versionId === null) {
        return null;
      }
      return this.lifecycle.startRun(ctx, {
        workspaceId,
        conversationId: message.conversationId,
        versionId,
        mode: message.mode,
        triggerMessageId: message.messageId,
      });
    });
  }
}
