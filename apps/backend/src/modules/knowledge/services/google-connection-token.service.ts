import { Injectable } from '@nestjs/common';
import { GOOGLE_OAUTH_DRIVE_SCOPE } from '@/modules/knowledge/constants/google-oauth.constants';
import { KnowledgeConnectionStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { requireGoogleConfig } from '@/modules/knowledge/helpers/google-oauth.helpers';
import { knowledgeFailure } from '@/modules/knowledge/helpers/knowledge-ingestion.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import type { Connection } from '@/modules/knowledge/typedefs/connection.typedefs';
import type { GoogleAccessToken } from '@/modules/knowledge/typedefs/google-oauth.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class GoogleConnectionTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly gateway: GoogleOAuthGateway,
    private readonly secrets: SecretBoxService,
    private readonly tenants: TenantTransactionService,
    private readonly connections: ConnectionsRepository,
  ) {}

  async accessToken(connection: Connection): Promise<GoogleAccessToken> {
    requireGoogleConfig(this.config.config.google);
    if (connection.status !== KnowledgeConnectionStatus.Active) {
      throw new GoogleReconnectRequiredError();
    }
    if (!(connection.scopes ?? []).includes(GOOGLE_OAUTH_DRIVE_SCOPE)) {
      const error = new GoogleReconnectRequiredError();
      await this.markRevoked(connection, error);
      throw error;
    }
    try {
      return await this.gateway.refreshAccessToken(
        this.secrets.open(connection.sealedRefreshToken),
      );
    } catch (error) {
      if (error instanceof GoogleReconnectRequiredError) {
        await this.markRevoked(connection, error);
      }
      throw error;
    }
  }

  private async markRevoked(
    connection: Connection,
    error: GoogleReconnectRequiredError,
  ): Promise<void> {
    const failure = knowledgeFailure(error);
    await this.tenants.run(connection.workspaceId, () =>
      this.connections.update(connection.workspaceId, connection.id, {
        status: KnowledgeConnectionStatus.Revoked,
        lastErrorCode: failure.code,
        lastErrorMessage: failure.message,
      }),
    );
  }
}
