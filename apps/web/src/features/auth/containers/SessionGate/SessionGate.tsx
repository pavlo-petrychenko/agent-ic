import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import type { SessionGateProps } from '@/features/auth/containers/SessionGate/SessionGate.typedefs';
import { useSessionStatus } from '@/features/auth/logic/hooks/useSessionStatus';
import { SessionStatus } from '@/shared/api/constants/session.constants';

export function SessionGate({ children }: SessionGateProps) {
  const status = useSessionStatus();
  const router = useRouter();

  useEffect(() => {
    if (status === SessionStatus.Anonymous) {
      void router.navigate({
        to: LOGIN_PATH,
        search: { redirect: router.state.location.href },
      });
    }
  }, [status, router]);

  return status === SessionStatus.Authenticated ? children : null;
}
