import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelDirectoryService } from '@/modules/channels/services/channel-directory.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetChannelNamesUseCase implements BatchUseCase<string, string | null> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly channels: ChannelDirectoryService,
  ) {}

  execute(ctx: UseCaseCtx, keys: readonly string[]): Promise<ReadonlyMap<string, string | null>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    return this.tenants.run(workspaceId, async () => {
      const summaries = await this.channels.findSummaries(workspaceId, keys);
      return new Map(keys.map((key) => [key, summaries.get(key)?.name ?? null]));
    });
  }
}
