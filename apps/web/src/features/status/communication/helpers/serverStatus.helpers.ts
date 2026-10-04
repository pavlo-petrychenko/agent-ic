import type { ServerStatusQuery } from '@/features/status/communication/gql/query/serverStatus.generated';
import type { ServerStatus } from '@/features/status/typedefs/serverStatus.typedefs';

export const toServerStatus = ({ serverStatus }: ServerStatusQuery): ServerStatus => ({
  version: serverStatus.version,
  uptimeSeconds: serverStatus.uptimeSeconds,
});
