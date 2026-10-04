import type { Locale } from '@agent-ic/contracts';
import type { SystemReason } from '@/platform/context/constants/actor.constants';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';

export interface UseCaseCtx {
  readonly actor: Actor;
  readonly initiatedBy: Actor | null;
  readonly workspaceId: string | null;
  readonly traceId: string;
  readonly locale: Locale;
}

export interface TransportRequest {
  readonly authorization: string | null;
  readonly acceptLanguage: string | null;
  readonly traceId: string;
}

export interface SystemCtxInit {
  readonly reason: SystemReason;
  readonly workspaceId: string | null;
  readonly traceId: string;
  readonly initiatedBy: Actor | null;
}
