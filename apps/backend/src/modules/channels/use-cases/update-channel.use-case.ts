import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { apiChannelEndpoint, toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { maskTelegramToken } from '@/modules/channels/helpers/telegram.helpers';
import {
  toApiChannelSettings,
  toTelegramChannelSettings,
} from '@/modules/channels/helpers/update-channel.helpers';
import type { ParsedUpdateChannelInput } from '@/modules/channels/helpers/update-channel.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { updateChannelInputSchema } from '@/modules/channels/schemas/update-channel.schema';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type {
  ChannelRecord,
  ChannelView,
  UpdateChannelInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import { UsersRepository } from '@/modules/identity';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { WorkspaceAccess } from '@/platform/context/typedefs/workspace-access.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UpdateChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly configService: ConfigService,
    private readonly clock: ClockService,
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateChannelInput): Promise<ChannelView> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const data = parseChannelInput(updateChannelInputSchema, input);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, data.id);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, data.agentId);

    return this.tenantTransactions.run(access.workspaceId, async () => {
      const channel = await this.channels.findById(access.workspaceId, channelId);
      if (channel === null) {
        throw new ChannelNotFoundError();
      }
      await this.agents.getAgent(access.workspaceId, agentId);

      const updated = await this.update(access, channel, data, agentId);
      const credentials = this.channelTokens.openCredentials(updated.credentialsSealed);
      const updatedBy = await this.users.findById(access.userId);
      return toChannelView(updated, this.ids, {
        tokenMasked:
          'botToken' in credentials
            ? maskTelegramToken(credentials.botToken)
            : 'secretKeyHint' in credentials
              ? credentials.secretKeyHint
              : null,
        updatedByName: updatedBy?.name ?? null,
        endpoint:
          updated.kind === ChannelKind.Api
            ? apiChannelEndpoint(
                this.configService.config.publicUrl,
                this.ids.toPublic(IdPrefix.Channel, updated.id),
              )
            : null,
      });
    });
  }

  private async update(
    access: WorkspaceAccess,
    channel: ChannelRecord,
    data: ParsedUpdateChannelInput,
    agentId: string,
  ): Promise<ChannelRecord> {
    if (channel.kind === ChannelKind.Telegram) {
      const settings = toTelegramChannelSettings(data);
      const updated = await this.channels.updateSettings(access.workspaceId, channel.id, {
        agentId,
        showTyping: settings.showTyping,
        updatedAt: this.clock.now(),
        updatedByUserId: access.userId,
      });
      if (updated === null) {
        throw new ChannelNotFoundError();
      }
      return updated;
    }

    if (!('name' in channel.identity)) {
      throw new ChannelNotFoundError();
    }
    const settings = toApiChannelSettings(data);
    const updated = await this.channels.updateSettings(access.workspaceId, channel.id, {
      agentId,
      showTyping: settings.showTyping,
      identity: {
        name: channel.identity.name,
        replyMode: settings.replyMode,
        webhook: settings.webhook,
      },
      updatedAt: this.clock.now(),
      updatedByUserId: access.userId,
    });
    if (updated === null) {
      throw new ChannelNotFoundError();
    }
    return updated;
  }
}
