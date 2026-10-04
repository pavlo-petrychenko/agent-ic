import { redirect } from '@tanstack/react-router';
import {
  INTERNAL_PATH_PREFIX,
  LOGIN_PATH,
  PROTOCOL_RELATIVE_PREFIX,
} from '@/features/auth/constants/authRoute.constants';
import type { GuardLocation } from '@/features/auth/typedefs/authRoute.typedefs';
import { getSessionClient } from '@/shared/api/clients/session.client';
import { SessionStatus } from '@/shared/api/constants/session.constants';

export const toSafeRedirect = (target: string | null): string | null =>
  target !== null &&
  target.startsWith(INTERNAL_PATH_PREFIX) &&
  !target.startsWith(PROTOCOL_RELATIVE_PREFIX)
    ? target
    : null;

export const requireSession = (location: GuardLocation): void => {
  if (getSessionClient().getStatus() !== SessionStatus.Authenticated) {
    throw redirect({ to: LOGIN_PATH, search: { redirect: location.href } });
  }
};
