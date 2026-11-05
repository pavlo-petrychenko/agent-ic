import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { googleOAuthStateEntry } from '@/modules/knowledge/constants/google-oauth-cache.constants';
import { GOOGLE_OAUTH_STATE_TTL_SECONDS } from '@/modules/knowledge/constants/google-oauth.constants';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import {
  googleCodeChallenge,
  requireGoogleConfig,
} from '@/modules/knowledge/helpers/google-oauth.helpers';
import type { StartGoogleConnectionResult } from '@/modules/knowledge/typedefs/google-oauth.typedefs';
import { CacheService } from '@/platform/cache/services/cache.service';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';

@Injectable()
export class StartGoogleConnectionUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly gateway: GoogleOAuthGateway,
    private readonly cache: CacheService,
    private readonly tokens: SecureTokenService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<StartGoogleConnectionResult> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    requireGoogleConfig(this.config.config.google);
    const state = this.tokens.generate().token;
    const codeVerifier = this.tokens.generate().token;
    await this.cache.set(googleOAuthStateEntry(state), {
      workspaceId,
      userId,
      codeVerifier,
    });
    return {
      authorizationUrl: this.gateway.authorizationUrl({
        state,
        codeChallenge: googleCodeChallenge(codeVerifier),
      }),
      expiresAt: new Date(
        this.clock.now().getTime() + GOOGLE_OAUTH_STATE_TTL_SECONDS * MILLISECONDS_PER_SECOND,
      ),
    };
  }
}
