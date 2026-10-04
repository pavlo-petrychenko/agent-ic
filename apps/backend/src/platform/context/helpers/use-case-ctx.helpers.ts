import type { Actor } from '@/platform/context/typedefs/actor.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export const getOriginator = (ctx: UseCaseCtx): Actor => ctx.initiatedBy ?? ctx.actor;
