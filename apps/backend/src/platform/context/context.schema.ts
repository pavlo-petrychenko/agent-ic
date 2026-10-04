import { z } from 'zod';
import { ACTOR_DISCRIMINATOR, ActorKind, SystemReason } from '@/platform/context/context.constants';
import type { Actor } from '@/platform/context/context.typedefs';

const identifier = z.string().min(1);

export const actorSchema: z.ZodType<Actor> = z.discriminatedUnion(ACTOR_DISCRIMINATOR, [
  z.object({ kind: z.literal(ActorKind.User), userId: identifier }),
  z.object({ kind: z.literal(ActorKind.ApiChannel), channelId: identifier }),
  z.object({ kind: z.literal(ActorKind.System), reason: z.enum(SystemReason) }),
  z.object({ kind: z.literal(ActorKind.Anonymous) }),
]);
