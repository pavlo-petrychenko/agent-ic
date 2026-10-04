import { DEFAULT_LOCALE } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { readBearerToken } from '@/platform/context/helpers/bearer-token.helpers';
import { negotiateLocale } from '@/platform/context/helpers/locale.helpers';
import { AuthenticatorService } from '@/platform/context/services/authenticator.service';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';
import type {
  SystemCtxInit,
  TransportRequest,
  UseCaseCtx,
} from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class UseCaseCtxService {
  constructor(private readonly authenticator: AuthenticatorService) {}

  async create(request: TransportRequest): Promise<UseCaseCtx> {
    return {
      actor: await this.resolveActor(request.authorization),
      initiatedBy: null,
      workspaceId: null,
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
}
