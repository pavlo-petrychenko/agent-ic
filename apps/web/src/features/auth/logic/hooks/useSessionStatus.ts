import { useSyncExternalStore } from 'react';
import { getSessionClient } from '@/shared/api/clients/session.client';
import type { SessionStatus } from '@/shared/api/constants/session.constants';

export function useSessionStatus(): SessionStatus {
  const session = getSessionClient();
  return useSyncExternalStore(session.subscribe, session.getStatus);
}
