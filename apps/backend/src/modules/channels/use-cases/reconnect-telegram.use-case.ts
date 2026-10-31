import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { ChannelReconnectInProgressError } from '@/modules/channels/errors/channel-reconnect-in-progress.error';
import { toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type { ChannelIdInput, ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ReconnectTelegramUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly connections: ChannelConnectionService,
    private readonly telegram: TelegramChannelService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ChannelIdInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, input.id);
    const channel = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.findById(access.workspaceId, channelId),
    );
    if (channel === null || channel.kind !== ChannelKind.Telegram) {
      throw new ChannelNotFoundError();
    }
    if (channel.status === ChannelStatus.Connected) {
      return toChannelView(channel, this.ids);
    }
    const claimed = await this.connections.claimReconnect(
      access.workspaceId,
      channelId,
      access.userId,
    );
    if (claimed === null) {
      const current = await this.tenantTransactions.run(access.workspaceId, () =>
        this.channels.findById(access.workspaceId, channelId),
      );
      if (current !== null && current.status === ChannelStatus.Connected) {
        return toChannelView(current, this.ids);
      }
      throw new ChannelReconnectInProgressError();
    }
    try {
      const next = await this.telegram.prepareReconnect(claimed);
      await this.connections.storeReconnectCredentials({
        workspaceId: access.workspaceId,
        channelId,
        identity: next.identity,
        credentialsSealed: next.sealed,
        updatedByUserId: access.userId,
      });
      await this.telegram.configureTransport({
        token: next.token,
        workspaceId: access.workspaceId,
        channelId,
        secret: next.webhookSecret,
      });
      return await this.connections.completeReconnect(access.workspaceId, channelId, access.userId);
    } catch (error) {
      await this.connections.releaseReconnect(access.workspaceId, channelId, access.userId);
      throw error;
    }
  }
}
