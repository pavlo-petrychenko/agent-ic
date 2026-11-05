import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { CHANNEL_REPLACE_TOKEN_RATE_LIMIT } from '@/modules/channels/constants/channel-rate-limit.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { replaceTelegramTokenInputSchema } from '@/modules/channels/schemas/telegram.schema';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type {
  ChannelView,
  ReplaceTelegramTokenInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class ReplaceTelegramTokenUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly telegram: TelegramChannelService,
    private readonly connections: ChannelConnectionService,
    private readonly rateLimits: RateLimitService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ReplaceTelegramTokenInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const data = parseChannelInput(replaceTelegramTokenInputSchema, input);
    await this.rateLimits.enforce(CHANNEL_REPLACE_TOKEN_RATE_LIMIT, access.workspaceId);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, data.id);

    const channel = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.findById(access.workspaceId, channelId),
    );
    if (channel === null || channel.kind !== ChannelKind.Telegram) {
      throw new ChannelNotFoundError();
    }

    const bot = await this.telegram.readBot(data.token);
    if (bot.id !== channel.externalId) {
      throw new TelegramTokenInvalidError();
    }
    const credentials = this.telegram.createCredentials(data.token);
    await this.telegram.configureTransport({
      token: data.token,
      workspaceId: access.workspaceId,
      channelId,
      secret: credentials.webhookSecret,
    });
    return this.connections.replaceCredentials({
      workspaceId: access.workspaceId,
      channelId,
      identity: { username: bot.username, firstName: bot.firstName },
      credentialsSealed: credentials.sealed,
      updatedByUserId: access.userId,
    });
  }
}
