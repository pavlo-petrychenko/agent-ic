import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type { ChannelIdInput, ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import { UsersRepository } from '@/modules/identity';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RefreshTelegramIdentityUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly telegram: TelegramChannelService,
    private readonly users: UsersRepository,
    private readonly clock: ClockService,
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
    const identity = await this.telegram.readIdentity(channel);
    const updated = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.updateIdentity(
        access.workspaceId,
        channelId,
        identity,
        this.clock.now(),
        access.userId,
      ),
    );
    if (updated === null) {
      throw new ChannelNotFoundError();
    }
    const updatedBy = await this.users.findById(access.userId);
    return toChannelView(updated, this.ids, {
      updatedByName: updatedBy?.name ?? null,
    });
  }
}
