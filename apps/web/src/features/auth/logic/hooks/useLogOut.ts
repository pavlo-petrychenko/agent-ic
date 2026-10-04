import { useApolloClient } from '@apollo/client/react';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import type { UseLogOutResult } from '@/features/auth/typedefs/authRoute.typedefs';
import { getSessionClient } from '@/shared/api/clients/session.client';

export function useLogOut(): UseLogOutResult {
  const client = useApolloClient();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const logOut = useCallback(async () => {
    setLeaving(true);
    try {
      await getSessionClient().end();
    } finally {
      await client.clearStore();
      await navigate({ to: LOGIN_PATH, search: { redirect: null } });
    }
  }, [client, navigate]);

  return { logOut, leaving };
}
