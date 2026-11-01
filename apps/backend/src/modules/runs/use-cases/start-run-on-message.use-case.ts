import { Injectable } from '@nestjs/common';
import type { MessageReceivedPayload } from '@/modules/conversations';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { MessageRunService } from '@/modules/runs/services/message-run.service';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class StartRunOnMessageUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly messageRuns: MessageRunService,
  ) {}

  execute(ctx: UseCaseCtx, message: MessageReceivedPayload): Promise<NewRun | null> {
    const workspaceId = runWorkspaceOf(ctx);
    return this.tenants.run(workspaceId, () =>
      this.messageRuns.start(ctx, {
        workspaceId,
        conversationId: message.conversationId,
        messageId: message.messageId,
        agentId: message.agentId,
        mode: message.mode,
        versionId: message.versionId ?? null,
        runId: message.runId ?? null,
      }),
    );
  }
}
