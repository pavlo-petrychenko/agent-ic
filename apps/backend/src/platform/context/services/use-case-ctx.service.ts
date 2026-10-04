import { DEFAULT_LOCALE, IdPrefix } from '@agent-ic/contracts';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { NO_WORKSPACE } from '@/platform/context/constants/workspace-access.constants';
import { readBearerToken } from '@/platform/context/helpers/bearer-token.helpers';
import { negotiateLocale } from '@/platform/context/helpers/locale.helpers';
import { AuthenticatorService } from '@/platform/context/services/authenticator.service';
import { WorkspaceAccessService } from '@/platform/context/services/workspace-access.service';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';
import type {
  SystemCtxInit,
  TransportRequest,
  UseCaseCtx,
} from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { ResolvedWorkspace } from '@/platform/context/typedefs/workspace-access.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UseCaseCtxService {
  constructor(
    private readonly authenticator: AuthenticatorService,
    private readonly ids: IdService,
    @Optional()
    @Inject(WorkspaceAccessService)
    private readonly workspaceAccess?: WorkspaceAccessService,
  ) {}

  async create(request: TransportRequest): Promise<UseCaseCtx> {
    const actor = await this.resolveActor(request.authorization);
    return {
      actor,
      initiatedBy: null,
      ...(await this.resolveWorkspace(actor, request.workspaceId)),
      traceId: request.traceId,
      locale: negotiateLocale(request.acceptLanguage),
      clientIp: request.clientIp,
    };
  }

  system(init: SystemCtxInit): UseCaseCtx {
    return {
      actor: { kind: ActorKind.System, reason: init.reason },
      initiatedBy: init.initiatedBy,
      workspaceId: init.workspaceId,
      workspaceRole: null,
      traceId: init.traceId,
      locale: DEFAULT_LOCALE,
      clientIp: null,
    };
  }

  resolveActor(authorization: string | null): Promise<Actor> {
    const token = readBearerToken(authorization);
    if (token === null) {
      return Promise.resolve({ kind: ActorKind.Anonymous });
    }
    return this.authenticator.authenticate(token);
  }

  private async resolveWorkspace(
    actor: Actor,
    publicWorkspaceId: string | null,
  ): Promise<ResolvedWorkspace> {
    if (
      actor.kind !== ActorKind.User ||
      publicWorkspaceId === null ||
      this.workspaceAccess === undefined
    ) {
      return NO_WORKSPACE;
    }
    const workspaceId = this.ids.fromPublic(IdPrefix.Workspace, publicWorkspaceId);
    const workspaceRole = await this.workspaceAccess.resolveRole(actor.userId, workspaceId);
    return workspaceRole === null ? NO_WORKSPACE : { workspaceId, workspaceRole };
  }
}
