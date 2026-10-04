import { randomBytes, randomUUID } from 'node:crypto';
import { Locale } from '@agent-ic/contracts';
import type { SignUpInput } from '@/modules/identity/typedefs/account.typedefs';
import { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import {
  IPV4_OCTETS,
  IPV4_SEPARATOR,
  TEST_EMAIL_DOMAIN,
  TEST_PASSWORD,
  TEST_TRACE_ID,
  TEST_USER_NAME,
} from '@test/support/constants/identity-testing.constants';

export const uniqueEmail = (): string => `${randomUUID()}@${TEST_EMAIL_DOMAIN}`;

export const uniqueIp = (): string => `ip-${randomUUID()}`;

export const randomIpAddress = (): string =>
  Array.from(randomBytes(IPV4_OCTETS)).join(IPV4_SEPARATOR);

export const signUpInput = (overrides: Partial<SignUpInput> = {}): SignUpInput => ({
  name: TEST_USER_NAME,
  email: uniqueEmail(),
  password: TEST_PASSWORD,
  locale: Locale.En,
  ...overrides,
});

export const anonymousCtx = (clientIp: string = uniqueIp()): UseCaseCtx => ({
  actor: { kind: ActorKind.Anonymous },
  initiatedBy: null,
  workspaceId: null,
  traceId: TEST_TRACE_ID,
  locale: Locale.En,
  clientIp,
});

export const userCtx = (userId: string): UseCaseCtx => ({
  ...anonymousCtx(),
  actor: { kind: ActorKind.User, userId },
});

export const systemCtx = (): UseCaseCtx => ({
  ...anonymousCtx(),
  actor: { kind: ActorKind.System, reason: SystemReason.Job },
  clientIp: null,
});
