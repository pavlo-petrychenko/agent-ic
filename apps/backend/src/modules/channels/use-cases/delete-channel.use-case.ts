import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type { ChannelIdInput } from '@/modules/channels/typedefs/channel.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DeleteChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly telegram: TelegramChannelService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ChannelIdInput): Promise<boolean> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Delete);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, input.id);
    const channel = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.findById(access.workspaceId, channelId),
    );
    if (channel === null) {
      throw new ChannelNotFoundError();
    }
    if (channel.kind === ChannelKind.Telegram && channel.status !== ChannelStatus.Disconnected) {
      const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
      if ('botToken' in credentials) {
        await this.deleteWebhook(credentials.botToken);
      }
    }
    const deleted = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.delete(access.workspaceId, channelId),
    );
    if (!deleted) {
      throw new ChannelNotFoundError();
    }
    return true;
  }

  private async deleteWebhook(botToken: string): Promise<void> {
    try {
      await this.telegram.deleteWebhook(botToken);
    } catch (error) {
      if (!(error instanceof TelegramApiError) || (error.status !== 401 && error.status !== 404)) {
        throw error;
      }
    }
  }
}
