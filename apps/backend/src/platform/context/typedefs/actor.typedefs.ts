import type { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';

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
