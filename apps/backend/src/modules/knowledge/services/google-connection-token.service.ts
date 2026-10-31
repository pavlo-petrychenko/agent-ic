import { Injectable } from '@nestjs/common';
import { KnowledgeConnectionStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleOAuthFailedError } from '@/modules/knowledge/errors/google-oauth-failed.error';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { requireGoogleConfig } from '@/modules/knowledge/helpers/google-oauth.helpers';
import type { Connection } from '@/modules/knowledge/typedefs/connection.typedefs';
import type { GoogleAccessToken } from '@/modules/knowledge/typedefs/google-oauth.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class GoogleConnectionTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly gateway: GoogleOAuthGateway,
    private readonly secrets: SecretBoxService,
  ) {}

  async accessToken(connection: Connection): Promise<GoogleAccessToken> {
    requireGoogleConfig(this.config.config.google);
    if (connection.status !== KnowledgeConnectionStatus.Active) {
      throw new GoogleOAuthFailedError({ code: 'connection_inactive' });
    }
    return this.gateway.refreshAccessToken(this.secrets.open(connection.sealedRefreshToken));
  }
}
