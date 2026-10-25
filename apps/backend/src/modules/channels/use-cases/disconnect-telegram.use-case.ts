import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type { ChannelIdInput, ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DisconnectTelegramUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly telegram: TelegramChannelService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ChannelIdInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Delete);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, input.id);
    const channel = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.findById(access.workspaceId, channelId),
    );
    if (channel === null || channel.kind !== ChannelKind.Telegram) {
      throw new ChannelNotFoundError();
    }
    if (channel.status === ChannelStatus.Disconnected) {
      return toChannelView(channel, this.ids);
    }
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('botToken' in credentials)) {
      throw new ChannelNotFoundError();
    }
    try {
      await this.telegram.deleteWebhook(credentials.botToken);
    } catch (error) {
      if (!(error instanceof TelegramApiError) || (error.status !== 401 && error.status !== 404)) {
        throw error;
      }
    }
    const disconnected = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.updateStatus(
        access.workspaceId,
        channelId,
        ChannelStatus.Disconnected,
        this.clock.now(),
      ),
    );
    if (disconnected === null) {
      throw new ChannelNotFoundError();
    }
    return toChannelView(disconnected, this.ids);
  }
}
