import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { googleOAuthStateEntry } from '@/modules/knowledge/constants/google-oauth-cache.constants';
import {
  KnowledgeConnectionProvider,
  KnowledgeConnectionStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleOAuthFailedError } from '@/modules/knowledge/errors/google-oauth-failed.error';
import { GoogleOAuthStateInvalidError } from '@/modules/knowledge/errors/google-oauth-state-invalid.error';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { requireGoogleConfig } from '@/modules/knowledge/helpers/google-oauth.helpers';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { completeGoogleConnectionInputSchema } from '@/modules/knowledge/schemas/google-oauth.schema';
import { KnowledgeConnectionViewsService } from '@/modules/knowledge/services/knowledge-connection-views.service';
import type {
  CompleteGoogleConnectionInput,
  KnowledgeConnectionView,
} from '@/modules/knowledge/typedefs/connection.typedefs';
import { CacheService } from '@/platform/cache/services/cache.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class CompleteGoogleConnectionUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly tenants: TenantTransactionService,
    private readonly connections: ConnectionsRepository,
    private readonly gateway: GoogleOAuthGateway,
    private readonly cache: CacheService,
    private readonly ids: IdService,
    private readonly secrets: SecretBoxService,
    private readonly views: KnowledgeConnectionViewsService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: CompleteGoogleConnectionInput,
  ): Promise<KnowledgeConnectionView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    requireGoogleConfig(this.config.config.google);
    const parsed = parseKnowledgeInput(completeGoogleConnectionInputSchema, input);
    const pending = await this.cache.take(googleOAuthStateEntry(parsed.state));
    if (pending === null || pending.workspaceId !== workspaceId || pending.userId !== userId) {
      throw new GoogleOAuthStateInvalidError();
    }
    const tokens = await this.gateway.exchangeCode({
      code: parsed.code,
      codeVerifier: pending.codeVerifier,
    });
    const refreshToken = tokens.refreshToken;
    if (refreshToken === null) {
      throw GoogleOAuthFailedError.missingRefreshToken();
    }
    const account = await this.gateway.userInfo(tokens.accessToken);
    const connection = await this.tenants.run(workspaceId, () =>
      this.connections.upsert({
        id: this.ids.generate(),
        workspaceId,
        provider: KnowledgeConnectionProvider.GoogleDocs,
        accountEmail: account.email,
        accountSubject: account.subject,
        sealedRefreshToken: this.secrets.seal(refreshToken),
        scopes: [...tokens.scopes],
        status: KnowledgeConnectionStatus.Active,
        createdByUserId: userId,
      }),
    );
    return this.views.view(connection);
  }
}
