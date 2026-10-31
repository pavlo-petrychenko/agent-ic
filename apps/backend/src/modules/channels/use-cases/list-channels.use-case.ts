import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { apiChannelEndpoint, toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type { ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListChannelsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly configService: ConfigService,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<ChannelView[]> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.View);
    return this.tenantTransactions.run(access.workspaceId, async () =>
      (await this.channels.list(access.workspaceId)).map((channel) =>
        toChannelView(channel, this.ids, {
          endpoint:
            channel.kind === ChannelKind.Api
              ? apiChannelEndpoint(
                  this.configService.config.publicUrl,
                  this.ids.toPublic(IdPrefix.Channel, channel.id),
                )
              : null,
        }),
      ),
    );
  }
}
