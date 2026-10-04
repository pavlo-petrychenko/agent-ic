import { Injectable } from '@nestjs/common';

import { Authenticator } from './authenticator';
import { ActorKind } from './context.constants';
import { negotiateLocale, readBearerToken } from './context.helpers';
import type { Actor, TransportRequest } from './context.typedefs';
import { UseCaseCtx } from './use-case-ctx';

@Injectable()
export class UseCaseCtxFactory {
  constructor(private readonly authenticator: Authenticator) {}

  async create(request: TransportRequest): Promise<UseCaseCtx> {
    return new UseCaseCtx({
      actor: await this.resolveActor(request.authorization),
      workspaceId: null,
      traceId: request.traceId,
      locale: negotiateLocale(request.acceptLanguage),
    });
  }

  resolveActor(authorization: string | null): Promise<Actor> {
    const token = readBearerToken(authorization);
    if (token === null) {
      return Promise.resolve({ kind: ActorKind.Anonymous });
    }
    return this.authenticator.authenticate(token);
  }
}
