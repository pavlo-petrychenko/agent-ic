import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import type { MessageReceivedPayload } from '@/modules/conversations';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
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
  ) {}

  execute(ctx: UseCaseCtx, message: MessageReceivedPayload): Promise<NewRun | null> {
    const workspaceId = runWorkspaceOf(ctx);
    return this.tenants.run(workspaceId, async () => {
      const versionId =
        message.versionId ?? (await this.agents.getLiveVersion(workspaceId, message.agentId))?.id;
      if (versionId === undefined) {
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
