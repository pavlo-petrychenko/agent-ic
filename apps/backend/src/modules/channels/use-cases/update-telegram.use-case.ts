import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { updateTelegramInputSchema } from '@/modules/channels/schemas/telegram.schema';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import type {
  ChannelView,
  UpdateTelegramChannelInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import { UsersRepository } from '@/modules/identity';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UpdateTelegramChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly channels: ChannelsRepository,
    private readonly connections: ChannelConnectionService,
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateTelegramChannelInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const data = parseChannelInput(updateTelegramInputSchema, input);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, data.id);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, data.agentId);

    await this.tenantTransactions.run(access.workspaceId, async () => {
      const channel = await this.channels.findById(access.workspaceId, channelId);
      if (channel === null || channel.kind !== ChannelKind.Telegram) {
        throw new ChannelNotFoundError();
      }
      await this.agents.getAgent(access.workspaceId, agentId);
    });

    const view = await this.connections.updateSettings({
      workspaceId: access.workspaceId,
      channelId,
      agentId,
      showTyping: data.showTyping,
      updatedByUserId: access.userId,
    });
    const updatedBy = await this.users.findById(access.userId);
    return { ...view, updatedByName: updatedBy?.name ?? null };
  }
}
