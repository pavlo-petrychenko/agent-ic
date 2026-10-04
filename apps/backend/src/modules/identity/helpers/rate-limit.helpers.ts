import {
  RATE_LIMIT_SUBJECT_SEPARATOR,
  UNKNOWN_CLIENT_IP,
} from '@/modules/identity/constants/rate-limit.constants';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export const clientSubject = (ctx: UseCaseCtx): string => ctx.clientIp ?? UNKNOWN_CLIENT_IP;

export const loginSubject = (ctx: UseCaseCtx, email: string): string =>
  [email, clientSubject(ctx)].join(RATE_LIMIT_SUBJECT_SEPARATOR);
