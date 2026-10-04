import { useQuery } from '@apollo/client/react';

import { toAppError } from '@/shared/api/appError.helpers';

import { SERVER_STATUS_POLL_INTERVAL_MS } from './serverStatus.constants';
import { ServerStatusDocument } from './serverStatus.generated';
import { toServerStatus } from './serverStatus.helpers';
import type { UseServerStatusResult } from './serverStatus.typedefs';

export function useServerStatus(): UseServerStatusResult {
  const { data, loading, error, refetch } = useQuery(ServerStatusDocument, {
    pollInterval: SERVER_STATUS_POLL_INTERVAL_MS,
  });

  return {
    status: data === undefined ? null : toServerStatus(data),
    loading,
    error: error === undefined ? null : toAppError(error),
    retry: () => {
      refetch().catch(() => undefined);
    },
  };
}
