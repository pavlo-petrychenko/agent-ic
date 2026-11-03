import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { apiChannelEndpoint, toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { channelUpdaterId } from '@/modules/channels/helpers/channel.helpers';
import { maskTelegramToken } from '@/modules/channels/helpers/telegram.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { ChannelIdInput, ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import { UsersRepository } from '@/modules/identity';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly configService: ConfigService,
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx, input: ChannelIdInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.View);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, input.id);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const channel = await this.channels.findById(access.workspaceId, channelId);
      if (channel === null) {
        throw new ChannelNotFoundError();
      }
      const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
      const updatedBy = await this.users.findById(channelUpdaterId(channel));
      return toChannelView(channel, this.ids, {
        tokenMasked:
          'botToken' in credentials
            ? maskTelegramToken(credentials.botToken)
            : 'secretKeyHint' in credentials
              ? credentials.secretKeyHint
              : null,
        updatedByName: updatedBy?.name ?? null,
        endpoint: channel.kind === ChannelKind.Api ? this.endpoint(channel.id) : null,
      });
    });
  }

  private endpoint(channelId: string): string {
    return apiChannelEndpoint(
      this.configService.config.publicUrl,
      this.ids.toPublic(IdPrefix.Channel, channelId),
    );
  }
}
