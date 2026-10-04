import type { ActorKind, Locale, SystemReason } from './context.constants';

export interface UserActor {
  readonly kind: ActorKind.User;
  readonly userId: string;
}

export interface ApiChannelActor {
  readonly kind: ActorKind.ApiChannel;
  readonly channelId: string;
}

export interface SystemActor {
  readonly kind: ActorKind.System;
  readonly reason: SystemReason;
}

export interface AnonymousActor {
  readonly kind: ActorKind.Anonymous;
}

export type Actor = UserActor | ApiChannelActor | SystemActor | AnonymousActor;

export interface UseCaseCtxInit {
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

export interface LanguagePreference {
  readonly language: string;
  readonly quality: number;
}

export interface SystemCtxInit {
  readonly reason: SystemReason;
  readonly workspaceId: string | null;
  readonly traceId: string;
  readonly initiatedBy: Actor | null;
}
