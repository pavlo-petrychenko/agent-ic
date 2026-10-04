import type { Locale } from './context.constants';
import type { Actor, UseCaseCtxInit } from './context.typedefs';

export class UseCaseCtx {
  readonly actor: Actor;
  readonly workspaceId: string | null;
  readonly traceId: string;
  readonly locale: Locale;

  constructor(init: UseCaseCtxInit) {
    this.actor = init.actor;
    this.workspaceId = init.workspaceId;
    this.traceId = init.traceId;
    this.locale = init.locale;
  }
}
