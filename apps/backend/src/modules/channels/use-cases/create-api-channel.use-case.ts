import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelAlreadyConnectedError } from '@/modules/channels/errors/channel-already-connected.error';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { apiChannelSecretHint } from '@/modules/channels/helpers/api-channel-secret.helpers';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { apiChannelEndpoint, toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { createApiChannelInputSchema } from '@/modules/channels/schemas/api-channel.schema';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type {
  ApiChannelSecretResult,
  CreateApiChannelInput,
  NewChannel,
} from '@/modules/channels/typedefs/channel.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreateApiChannelUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly configService: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateApiChannelInput): Promise<ApiChannelSecretResult> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const data = parseChannelInput(createApiChannelInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, data.agentId);
    await this.tenantTransactions.run(access.workspaceId, () =>
      this.agents.getAgent(access.workspaceId, agentId),
    );

    const secret = this.secureTokens.generate();
    const now = this.clock.now();
    const channelId = this.ids.generate();
    const channel: NewChannel = {
      id: channelId,
      workspaceId: access.workspaceId,
      kind: ChannelKind.Api,
      status: ChannelStatus.Connected,
      agentId,
      externalId: this.ids.generate(),
      identity: {
        name: data.name,
        replyMode: data.replyMode,
        webhook: data.webhook,
      },
      showTyping: false,
      credentialsSealed: this.channelTokens.sealCredentials({
        secretKeyHash: secret.hash,
        secretKeyHint: apiChannelSecretHint(secret.token),
        previousSecretKeyHash: null,
        previousKeyExpiresAt: null,
      }),
      createdByUserId: access.userId,
      updatedByUserId: access.userId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.tenantTransactions.run(access.workspaceId, async () => {
      if (!(await this.channels.insertIfAbsent(channel))) {
        throw new ChannelAlreadyConnectedError();
      }
      const stored = await this.channels.findById(access.workspaceId, channelId);
      if (stored === null) {
        throw new ChannelNotFoundError();
      }
      return stored;
    });

    return {
      channel: toChannelView(created, this.ids, {
        tokenMasked: apiChannelSecretHint(secret.token),
        endpoint: this.endpoint(channelId),
      }),
      secret: secret.token,
    };
  }

  private endpoint(channelId: string): string {
    return apiChannelEndpoint(
      this.configService.config.publicUrl,
      this.ids.toPublic(IdPrefix.Channel, channelId),
    );
  }
}
