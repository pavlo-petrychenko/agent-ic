import { Injectable } from '@nestjs/common';
import type { HandedBackPayload } from '@/modules/conversations';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { InactivityTimersService } from '@/modules/runs/services/inactivity-timers.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ArmInactivityOnHandBackUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly timers: InactivityTimersService,
  ) {}

  execute(ctx: UseCaseCtx, handedBack: HandedBackPayload): Promise<void> {
    const workspaceId = runWorkspaceOf(ctx);
    return this.tenants.run(workspaceId, () =>
      this.timers.armAfterHandBack(workspaceId, handedBack.conversationId),
    );
  }
}
