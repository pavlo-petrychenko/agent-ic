import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeConnectionNotFoundError } from '@/modules/knowledge/errors/knowledge-connection-not-found.error';
import {
  requireGoogleConfig,
  requireGooglePickerConfig,
} from '@/modules/knowledge/helpers/google-oauth.helpers';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { createGooglePickerSessionInputSchema } from '@/modules/knowledge/schemas/google-picker.schema';
import { GoogleConnectionTokenService } from '@/modules/knowledge/services/google-connection-token.service';
import type { GooglePickerSessionResult } from '@/modules/knowledge/typedefs/google-picker.typedefs';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreateGooglePickerSessionUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly tenants: TenantTransactionService,
    private readonly connections: ConnectionsRepository,
    private readonly tokens: GoogleConnectionTokenService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, connectionId: string): Promise<GooglePickerSessionResult> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const google = requireGoogleConfig(this.config.config.google);
    const picker = requireGooglePickerConfig(google.picker);
    const parsed = parseKnowledgeInput(createGooglePickerSessionInputSchema, { connectionId });
    const internalId = this.ids.fromPublic(IdPrefix.KnowledgeConnection, parsed.connectionId);
    const connection = await this.tenants.run(workspaceId, () =>
      this.connections.findById(workspaceId, internalId),
    );
    if (connection === null) {
      throw new KnowledgeConnectionNotFoundError();
    }
    const token = await this.tokens.accessToken(connection);
    const now = this.clock.now();
    await this.tenants.run(workspaceId, () =>
      this.connections.update(workspaceId, connection.id, { lastUsedAt: now }),
    );
    return {
      accessToken: token.accessToken,
      apiKey: picker.apiKey,
      appId: picker.appId,
      expiresAt: new Date(now.getTime() + token.expiresInSeconds * MILLISECONDS_PER_SECOND),
    };
  }
}
