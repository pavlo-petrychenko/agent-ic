import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { CHANNEL_CONNECT_RATE_LIMIT } from '@/modules/channels/constants/channel-rate-limit.constants';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { connectTelegramInputSchema } from '@/modules/channels/schemas/telegram.schema';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import type {
  ChannelView,
  ConnectTelegramInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class ConnectTelegramChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly telegram: TelegramChannelService,
    private readonly connections: ChannelConnectionService,
    private readonly rateLimits: RateLimitService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ConnectTelegramInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const data = parseChannelInput(connectTelegramInputSchema, input);
    await this.rateLimits.enforce(CHANNEL_CONNECT_RATE_LIMIT, access.workspaceId);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, data.agentId);
    await this.tenantTransactions.run(access.workspaceId, () =>
      this.agents.getAgent(access.workspaceId, agentId),
    );
    const bot = await this.telegram.readBot(data.token);
    const credentials = this.telegram.createCredentials(data.token);
    const channelId = await this.connections.prepare({
      workspaceId: access.workspaceId,
      kind: ChannelKind.Telegram,
      agentId,
      externalId: bot.id,
      identity: { username: bot.username, firstName: bot.firstName },
      showTyping: data.showTyping,
      credentialsSealed: credentials.sealed,
      createdByUserId: access.userId,
      updatedByUserId: access.userId,
    });
    await this.telegram.configureTransport({
      token: data.token,
      workspaceId: access.workspaceId,
      channelId,
      secret: credentials.webhookSecret,
    });
    return this.connections.complete({
      workspaceId: access.workspaceId,
      channelId,
      updatedByUserId: access.userId,
    });
  }
}
