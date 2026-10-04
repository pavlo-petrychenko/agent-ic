import { ActorKind } from '@/platform/context/constants/actor.constants';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import type { Actor, SystemActor, UserActor } from '@/platform/context/typedefs/actor.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export const getOriginator = (ctx: UseCaseCtx): Actor => ctx.initiatedBy ?? ctx.actor;

export const requireUserActor = (ctx: UseCaseCtx): UserActor => {
  if (ctx.actor.kind !== ActorKind.User) {
    throw new AuthenticationRequiredError();
  }
  return ctx.actor;
};

export const requireSystemActor = (ctx: UseCaseCtx): SystemActor => {
  if (ctx.actor.kind !== ActorKind.System) {
    throw new SystemActorRequiredError();
  }
  return ctx.actor;
};
