import { ChannelKind, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { API_CHANNEL_PREVIOUS_KEY_TTL_MS } from '@/modules/channels/constants/api-channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { apiChannelSecretHint } from '@/modules/channels/helpers/api-channel-secret.helpers';
import { apiChannelEndpoint, toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type {
  ApiChannelSecretResult,
  ChannelIdInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RotateApiChannelKeyUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly configService: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ChannelIdInput): Promise<ApiChannelSecretResult> {
    const access = authorize(ctx, PermissionResource.Channels, PermissionAction.Edit);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, input.id);
    const channel = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.findById(access.workspaceId, channelId),
    );
    if (channel === null || channel.kind !== ChannelKind.Api) {
      throw new ChannelNotFoundError();
    }
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('secretKeyHash' in credentials)) {
      throw new ChannelNotFoundError();
    }

    const now = this.clock.now();
    const secret = this.secureTokens.generate();
    const updated = await this.tenantTransactions.run(access.workspaceId, () =>
      this.channels.updateCredentials(access.workspaceId, channelId, {
        status: channel.status,
        identity: channel.identity,
        credentialsSealed: this.channelTokens.sealCredentials({
          secretKeyHash: secret.hash,
          secretKeyHint: apiChannelSecretHint(secret.token),
          previousSecretKeyHash: credentials.secretKeyHash,
          previousKeyExpiresAt: new Date(
            now.getTime() + API_CHANNEL_PREVIOUS_KEY_TTL_MS,
          ).toISOString(),
        }),
        updatedAt: now,
        updatedByUserId: access.userId,
      }),
    );
    if (updated === null) {
      throw new ChannelNotFoundError();
    }

    return {
      channel: toChannelView(updated, this.ids, {
        tokenMasked: apiChannelSecretHint(secret.token),
        endpoint: apiChannelEndpoint(
          this.configService.config.publicUrl,
          this.ids.toPublic(IdPrefix.Channel, updated.id),
        ),
      }),
      secret: secret.token,
    };
  }
}
