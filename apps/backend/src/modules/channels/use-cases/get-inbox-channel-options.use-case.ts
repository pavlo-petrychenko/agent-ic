import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelDirectoryService } from '@/modules/channels/services/channel-directory.service';
import type { InboxFilterOptionView } from '@/modules/channels/typedefs/inbox-filter-option.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetInboxChannelOptionsUseCase implements BatchUseCase<
  string,
  InboxFilterOptionView | null
> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly channels: ChannelDirectoryService,
    private readonly ids: IdService,
  ) {}

  execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, InboxFilterOptionView | null>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    return this.tenants.run(workspaceId, async () => {
      const summaries = await this.channels.findSummaries(workspaceId, keys);
      return new Map(
        keys.map((key) => {
          const summary = summaries.get(key);
          return [
            key,
            summary === undefined
              ? null
              : { id: this.ids.toPublic(IdPrefix.Channel, key), name: summary.name },
          ];
        }),
      );
    });
  }
}
