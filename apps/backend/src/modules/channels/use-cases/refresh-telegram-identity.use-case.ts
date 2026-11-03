import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { ChannelHealthLogMessage } from '@/modules/channels/constants/channel-health.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type { TelegramChannelIdentity } from '@/modules/channels/typedefs/channel-identity.typedefs';
import type {
  ChannelIdInput,
  ChannelRecord,
  ChannelView,
} from '@/modules/channels/typedefs/channel.typedefs';
import { UsersRepository } from '@/modules/identity';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RefreshTelegramIdentityUseCase {
  private readonly logger = new Logger(RefreshTelegramIdentityUseCase.name);

  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly telegram: TelegramChannelService,
    private readonly health: ChannelHealthService,
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
    const identity = await this.readIdentity(channel, access.workspaceId, channelId);
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

  private async readIdentity(
    channel: Pick<ChannelRecord, 'externalId' | 'credentialsSealed'>,
    workspaceId: string,
    channelId: string,
  ): Promise<TelegramChannelIdentity> {
    try {
      return await this.telegram.readIdentity(channel);
    } catch (error) {
      if (error instanceof TelegramTokenInvalidError) {
        await this.health.markBroken(workspaceId, channelId).catch((markError: unknown) => {
          this.logger.error({
            msg: ChannelHealthLogMessage.MarkBrokenError,
            channelId,
            err: markError,
          });
        });
      }
      throw error;
    }
  }
}
