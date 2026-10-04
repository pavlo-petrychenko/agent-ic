import { useQuery } from '@apollo/client/react';
import { SERVER_STATUS_POLL_INTERVAL_MS } from '@/features/status/communication/serverStatus.constants';
import { ServerStatusDocument } from '@/features/status/communication/serverStatus.generated';
import { toServerStatus } from '@/features/status/communication/serverStatus.helpers';
import type { UseServerStatusResult } from '@/features/status/communication/serverStatus.typedefs';
import { toAppError } from '@/shared/api/appError.helpers';

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
