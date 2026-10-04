import type { Locale } from './context.constants';
import type { Actor, UseCaseCtxInit } from './context.typedefs';

export class UseCaseCtx {
  readonly actor: Actor;
  readonly initiatedBy: Actor | null;
  readonly workspaceId: string | null;
  readonly traceId: string;
  readonly locale: Locale;

  constructor(init: UseCaseCtxInit) {
    this.actor = init.actor;
    this.initiatedBy = init.initiatedBy;
    this.workspaceId = init.workspaceId;
    this.traceId = init.traceId;
    this.locale = init.locale;
  }

  originator(): Actor {
    return this.initiatedBy ?? this.actor;
  }
}
