import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';
import { getOriginator } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

const USER: Actor = { kind: ActorKind.User, userId: 'user-1' };
const SYSTEM: Actor = { kind: ActorKind.System, reason: SystemReason.Job };

const ctxOf = (actor: Actor, initiatedBy: Actor | null): UseCaseCtx => ({
  actor,
  initiatedBy,
  workspaceId: null,
  workspaceRole: null,
  traceId: 'trace',
  locale: Locale.En,
  clientIp: null,
});

describe('getOriginator', () => {
  it('returns the actor when nobody else started the work', () => {
    expect(getOriginator(ctxOf(USER, null))).toBe(USER);
  });

  it('returns whoever started the work for a system actor', () => {
    expect(getOriginator(ctxOf(SYSTEM, USER))).toBe(USER);
  });
});
