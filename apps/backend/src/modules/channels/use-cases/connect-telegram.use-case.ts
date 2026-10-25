import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { connectTelegramInputSchema } from '@/modules/channels/schemas/telegram-connect.schema';
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

@Injectable()
export class ConnectTelegramChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly telegram: TelegramChannelService,
    private readonly connections: ChannelConnectionService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ConnectTelegramInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const data = parseChannelInput(connectTelegramInputSchema, input);
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
      identity: { username: bot.username },
      showTyping: data.showTyping,
      credentialsSealed: credentials.sealed,
      createdByUserId: access.userId,
    });
    await this.telegram.registerWebhook({
      token: data.token,
      workspaceId: access.workspaceId,
      channelId,
      secret: credentials.webhookSecret,
    });
    return this.connections.complete({
      workspaceId: access.workspaceId,
      channelId,
    });
  }
}
