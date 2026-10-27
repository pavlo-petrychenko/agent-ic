import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type { ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListChannelsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<ChannelView[]> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.View);
    return this.tenantTransactions.run(access.workspaceId, async () =>
      (await this.channels.list(access.workspaceId)).map((channel) =>
        toChannelView(channel, this.ids),
      ),
    );
  }
}
