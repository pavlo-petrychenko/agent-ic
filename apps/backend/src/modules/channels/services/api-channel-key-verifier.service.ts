import { Injectable } from '@nestjs/common';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { InvalidApiChannelKeyError } from '@/modules/channels/errors/invalid-api-channel-key.error';
import { ApiChannelIngressService } from '@/modules/channels/services/api-channel-ingress.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type {
  ApiChannelKeyVerificationInput,
  ApiChannelKeyVerificationResult,
} from '@/modules/channels/typedefs/api-channel-ingress.typedefs';
import type { ApiChannelCredentials } from '@/modules/channels/typedefs/channel-identity.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { readBearerToken } from '@/platform/context/helpers/bearer-token.helpers';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';

@Injectable()
export class ApiChannelKeyVerifierService {
  constructor(
    private readonly ingress: ApiChannelIngressService,
    private readonly channelTokens: ChannelTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly contexts: UseCaseCtxService,
    private readonly clock: ClockService,
  ) {}

  async verify(input: ApiChannelKeyVerificationInput): Promise<ApiChannelKeyVerificationResult> {
    const channel = await this.ingress.find(input.publicChannelId);
    if (channel === null || channel.status !== ChannelStatus.Connected) {
      throw new ChannelNotFoundError();
    }
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('secretKeyHash' in credentials)) {
      throw new ChannelNotFoundError();
    }
    const token = readBearerToken(input.authorization);
    if (token === null || !this.matches(token, credentials)) {
      throw new InvalidApiChannelKeyError();
    }
    return {
      channel,
      ctx: this.contexts.apiChannel({
        channelId: channel.id,
        workspaceId: channel.workspaceId,
        traceId: input.traceId,
        clientIp: input.clientIp,
      }),
    };
  }

  private matches(token: string, credentials: ApiChannelCredentials): boolean {
    if (this.secureTokens.matches(token, credentials.secretKeyHash)) {
      return true;
    }
    if (credentials.previousSecretKeyHash === null || credentials.previousKeyExpiresAt === null) {
      return false;
    }
    const expiresAt = Date.parse(credentials.previousKeyExpiresAt);
    if (Number.isNaN(expiresAt) || expiresAt <= this.clock.now().getTime()) {
      return false;
    }
    return this.secureTokens.matches(token, credentials.previousSecretKeyHash);
  }
}
